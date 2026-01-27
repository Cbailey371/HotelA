import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@providers/prisma';
import { Notification, Maintenance } from '@prisma/client';
import { NotificationService } from '@modules/notification/notification.service';
import { format, addDays, addMonths, addYears } from 'date-fns';

@Injectable()
export class MaintenanceSchedulerService {
  private readonly logger = new Logger(MaintenanceSchedulerService.name);
  private readonly DEFAULT_ALERT_DAYS = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleMaintenanceScheduling() {
    this.logger.log('Running maintenance scheduling check...');

    try {
      const now = new Date();
      const dueMaintenances = await this.prisma.maintenance.findMany({
        where: {
          scheduledDate: {
            lte: now,
          },
          status: 'pending',
        },
        include: {
          asset: true,
          provider: true,
        },
      });

      this.logger.log(`Found ${dueMaintenances.length} due maintenance tasks`);

      for (const maintenance of dueMaintenances) {
        await this.processMaintenance(maintenance);
      }
    } catch (error) {
      this.logger.error('Error in maintenance scheduling:', error);
    }
  }

  private async processMaintenance(maintenance: Maintenance & { asset: any }) {
    try {
      this.logger.log(
        `Processing maintenance ${maintenance.id} for asset ${maintenance.assetId}`,
      );

      // 1. Create notification
      await this.createNotification({
        hotelId: maintenance.asset.hotelId,
        title: `Mantenimiento Programado: ${maintenance.asset.name}`,
        message: `El mantenimiento "${maintenance.maintenanceType}" para el activo "${maintenance.asset.name}" ha sido completado.`,
        maintenanceId: maintenance.id,
      });

      // 2. Create maintenance log
      const maintenanceLog = await this.prisma.maintenanceLog.create({
        data: {
          assetId: maintenance.assetId,
          maintenanceId: maintenance.id,
          maintenanceType: maintenance.maintenanceType,
          description:
            maintenance.description ||
            `Mantenimiento rutinario ${maintenance.maintenanceType}`,
          performedDate: new Date(),
          cost: maintenance.estimatedCost || 0,
          responsible: maintenance.responsible || 'Sistema Automatizado',
          result: 'completed',
          notes: 'Procesado automáticamente por el programador del sistema',
        },
      });

      // 3. Calculate next scheduled date based on frequency
      let nextScheduledDate: Date;

      switch (maintenance.frequency) {
        case 'daily':
          nextScheduledDate = addDays(new Date(), 1);
          break;
        case 'weekly':
          nextScheduledDate = addDays(new Date(), 7);
          break;
        case 'monthly':
          nextScheduledDate = addMonths(new Date(), 1);
          break;
        case 'quarterly':
          nextScheduledDate = addMonths(new Date(), 3);
          break;
        case 'yearly':
          nextScheduledDate = addYears(new Date(), 1);
          break;
        default:
          // For one-time maintenance, mark as completed
          await this.prisma.maintenance.update({
            where: { id: maintenance.id },
            data: { status: 'completed' },
          });
          return;
      }

      // 4. Update maintenance with next schedule
      await this.prisma.maintenance.update({
        where: { id: maintenance.id },
        data: {
          status: 'pending',
          scheduledDate: nextScheduledDate,
        },
      });

      this.logger.log(
        `Maintenance ${maintenance.id} processed successfully. Next scheduled for ${format(nextScheduledDate, 'yyyy-MM-dd')}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing maintenance ${maintenance.id}:`,
        error,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingMaintenance() {
    this.logger.log('Checking for upcoming maintenance with alerts...');

    try {
      const now = new Date();
      const pendingMaintenances = await this.prisma.maintenance.findMany({
        where: {
          scheduledDate: {
            gt: now,
          },
          status: 'pending',
        },
        include: {
          asset: true,
        },
      });

      this.logger.log(
        `Found ${pendingMaintenances.length} pending maintenance tasks`,
      );

      for (const maintenance of pendingMaintenances) {
        await this.processMaintenanceAlert(maintenance);
      }
    } catch (error) {
      this.logger.error(
        'Error checking upcoming maintenance with alerts:',
        error,
      );
    }
  }

  private async processMaintenanceAlert(
    maintenance: Maintenance & { asset: any },
  ) {
    const now = new Date();
    const timeDiff = maintenance?.scheduledDate?.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const alertThreshold =
      maintenance?.alertDaysBefore ?? this.DEFAULT_ALERT_DAYS;

    const shouldSendCustomAlert = daysRemaining === alertThreshold;
    const shouldSendOneDayAlert = daysRemaining === 1;

    if (shouldSendCustomAlert || shouldSendOneDayAlert) {
      const alertType = shouldSendOneDayAlert
        ? 'Alerta 1 día'
        : shouldSendCustomAlert
          ? 'Alerta personalizada'
          : 'Alerta automática';
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          maintenanceId: maintenance.id,
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60),
          },
        },
      });
      if (alreadyNotified) {
        this.logger.log(
          `Skipped notification: already sent ${alertType} for maintenance ${maintenance?.id} within the last hour`,
        );
        return;
      }
      await this.createNotification({
        hotelId: maintenance?.asset?.hotelId,
        title: `Mantenimiento próximo (${daysRemaining} día${daysRemaining === 1 ? '' : 's'})`,
        message: `${alertType}: El mantenimiento "${maintenance?.maintenanceType}" para el activo "${maintenance?.asset?.name}" está programado para ${format(maintenance?.scheduledDate, 'yyyy-MM-dd')}.`,
        maintenanceId: maintenance.id,
      });

      this.logger.log(
        `Created ${alertType} notification for maintenance ${maintenance?.id} (${daysRemaining} days remaining)`,
      );
    }
  }

  private async createNotification({
    hotelId,
    title,
    message,
    maintenanceId,
    sparePartId,
  }: {
    hotelId: string;
    title: string;
    message: string;
    maintenanceId?: string;
    sparePartId?: string;
  }): Promise<Notification> {
    return this.notificationService.create({
      hotelId,
      title,
      message,
      read: false,
      maintenanceId,
      sparePartId,
    });
  }
}

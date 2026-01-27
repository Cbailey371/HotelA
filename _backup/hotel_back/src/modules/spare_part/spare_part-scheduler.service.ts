import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@providers/prisma';
import { Notification, SparePart } from '@prisma/client';
import { NotificationService } from '@modules/notification/notification.service';

@Injectable()
export class SparePartSchedulerService {
  private readonly logger = new Logger(SparePartSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_12_HOURS)
  async checkUpcomingSparePart() {
    this.logger.log('Checking for upcoming spare part with alerts...');

    try {
      const pendingSpareParts = await this.prisma.sparePart.findMany({
        where: {
          availableQuantity: {
            lt: 5,
          },
        },
        include: {
          asset: true,
        },
      });

      this.logger.log(`Found ${pendingSpareParts.length} pending spare parts`);

      for (const sparePart of pendingSpareParts) {
        await this.processSparePartAlert(sparePart);
      }
    } catch (error) {
      this.logger.error(
        'Error checking upcoming spare part with alerts:',
        error,
      );
    }
  }

  private async processSparePartAlert(sparePart: SparePart & { asset: any }) {
    const quantity = sparePart.availableQuantity;
    let title = '';
    let message = '';

    if (quantity === 0) {
      title = `¡Repuesto agotado: ${sparePart.name}!`;
      message = `El repuesto "${sparePart.name}" del activo "${sparePart.asset?.name}" se ha agotado. Es necesario reabastecerlo.`;
    } else {
      title = `Repuesto bajo: ${sparePart.name}`;
      message = `Quedan solo ${quantity} unidades del repuesto "${sparePart.name}" para el activo "${sparePart.asset?.name}".`;
    }

    this.logger.log(
      `Created notification for spare part ${sparePart.id} (${quantity} available)`,
    );

    await this.createNotification(sparePart.asset.hotelId, title, message);
  }

  private async createNotification(
    hotelId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    return this.notificationService.create({
      hotelId,
      title,
      message,
      read: false,
    });
  }
}

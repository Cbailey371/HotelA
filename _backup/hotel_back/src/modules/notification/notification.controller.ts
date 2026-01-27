import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationEntity } from './entities/notification.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import { Prisma } from '@prisma/client';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiCreatedResponse({ type: NotificationEntity })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({
    name: 'where',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiOkBaseResponse({ dto: NotificationEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.NotificationWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.NotificationOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.notificationService.findAll(where, orderBy, page, perPage);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: NotificationEntity })
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: NotificationEntity })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiCreatedResponse({ type: NotificationEntity })
  remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}

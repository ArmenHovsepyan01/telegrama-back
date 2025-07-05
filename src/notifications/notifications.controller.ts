import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // @Post('send')
  // async sendNotification(@Body() body: { token: string; title: string; message: string }) {
  //   return this.notificationService.sendNotification(body.token, body.title, body.message);
  // }
}

import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { ChatsModule } from '../chats/chats.module';
import { CallsModule } from '../calls/calls.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => ChatsModule),
    forwardRef(() => CallsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationsModule)
  ],
  providers: [SocketGateway, SocketService],
  exports: [SocketService]
})
export class SocketModule {}

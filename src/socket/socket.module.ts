import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [forwardRef(() => ChatsModule)],
  providers: [SocketGateway, SocketService],
  exports: [SocketService]
})
export class SocketModule {}

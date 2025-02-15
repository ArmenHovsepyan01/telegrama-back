import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './chats.entity';
import { ChatMessage } from './chat-messages.entity';
import { SocketModule } from '../socket/socket.module';
import { User } from '../users/user.entity';
import { UserChat } from '../users/user_chats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMessage, User, UserChat]), SocketModule],
  providers: [ChatsService],
  controllers: [ChatsController],
  exports: [ChatsService]
})
export class ChatsModule {}

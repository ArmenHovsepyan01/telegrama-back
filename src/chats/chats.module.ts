import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { Chat } from './chats.entity';
import { ChatMessage } from './chat-messages.entity';
import { SocketModule } from '../socket/socket.module';
import { User } from '../users/user.entity';
import { UserChat } from '../users/user_chats.entity';
import { Call } from '../calls/call.entity';
import { OpenAIModule } from '../openai/openai.module';
import { AssistantChat } from '../openai/assistant-chats.entity';
import { Transcription } from '../transcriptions/transcriptions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      ChatMessage,
      User,
      UserChat,
      Call,
      AssistantChat,
      Transcription
    ]),
    SocketModule,
    OpenAIModule
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
  exports: [ChatsService]
})
export class ChatsModule {}

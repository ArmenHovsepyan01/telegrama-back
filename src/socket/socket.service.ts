import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class SocketService {
  private server: Server;
  private usersService: UsersService;
  @Inject(forwardRef(() => ChatsService))
  private chatsService: ChatsService;

  setServer(server: Server) {
    this.server = server;
  }

  private getInitializedServer(): Server {
    if (!this.server) {
      throw new Error('WebSocket server not initialized');
    }
    console.log('WebSocket operation executed');
    return this.server;
  }

  emitToAll(event: string, payload: any) {
    this.getInitializedServer().emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: any) {
    this.server?.to(room).emit(event, payload);
  }

  emitEvent(event: string, payload: any) {
    this.getInitializedServer().emit(event, payload);
  }

  async notifyUserIsTyping(chatId: string, userId: any) {
    try {
      const user = await this.usersService.findOne(userId);

      this.emitToRoom(chatId, 'typing', {
        message: `${user.name} is typing...`
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async createMessage(body: { chatId: string; message: string }, userId: number) {
    try {
      return await this.chatsService.createMessage({
        ...body,
        userId: userId,
        role: 'user'
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async createAIMessage(body: { chatId: string; callId: string; message: string; userId: number }) {
    try {
      const { callId, chatId, message, userId } = body;
      const stream = await this.chatsService.sendMessageToAI(callId, chatId, message);

      let newMessage;
      // @ts-ignore
      for await (const chunk of stream) {
        if (chunk) {
          const { event, data } = chunk;

          if (event === 'thread.run.step.delta') {
            continue;
          }

          if (event === 'thread.message.delta') {
            if (!newMessage) {
              newMessage = await this.chatsService.createMessage({
                chatId: chatId,
                role: 'assistant',
                message: '',
                userId
              });
            }

            const responseContent = data.delta.content;

            const content = responseContent[0];

            if (content) {
              const updatedMessage = newMessage.message + content.text.value;
              newMessage = await this.chatsService.updateMessage(newMessage.id, updatedMessage);
            }

            this.emitEvent('receiveAIMessage', { message: newMessage, inProgress: true });
          } else if (event === 'thread.run.completed') {
            console.log('run completed');
          } else if (event === 'thread.message.completed') {
            if (newMessage) {
              this.emitEvent('receiveAIMessage', { message: newMessage, inProgress: false });
            }
          }
        }
      }
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}

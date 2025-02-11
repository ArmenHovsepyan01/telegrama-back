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
        userId: userId
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}

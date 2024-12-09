import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;

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
    this.getInitializedServer().to(room).emit(event, payload);
  }

  emitEvent(event: string, payload: any) {
    this.getInitializedServer().emit(event, payload);
  }
}

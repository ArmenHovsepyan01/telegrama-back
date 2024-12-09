import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { SocketService } from './socket.service';

@WebSocketGateway()
export class SocketGateway implements OnModuleInit {
  @WebSocketServer()
  private server: Socket;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(private socketService: SocketService) {}

  onModuleInit(): void {
    this.server.on('connection', (socket) => {
      this.socketService.setServer(socket);
      this.logger.log(`Socket Initialized! ID: ${socket.id}`);
    });
  }

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() body: any) {
    console.log('message body', body);
    this.socketService.emitEvent('onMessage', {
      user: 'User',
      message: 'Worked!'
    });
  }
}

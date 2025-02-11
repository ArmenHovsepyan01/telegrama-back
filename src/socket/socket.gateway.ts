import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { SocketService } from './socket.service';
import { WsAuthGuard } from './socket.guard';
import { ChatsService } from '../chats/chats.service';

const onlineUsers = new Map<number, string>();

@WebSocketGateway({
  transports: ['websocket', 'polling'],
  origin: ['http://localhost:3000', 'http://192.168.1.53:3000'],
  credentials: true
})
@UseGuards(WsAuthGuard)
export class SocketGateway implements OnModuleInit {
  @WebSocketServer()
  private server: Socket;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private socketService: SocketService,
    private chatsService: ChatsService
  ) {}

  onModuleInit(): void {
    this.server.on('connection', (socket) => {
      this.socketService.setServer(socket);
      this.logger.log(`Socket Initialized! ID: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const userId = [...onlineUsers.entries()].find(([_, id]) => id === socket.id)?.[0];
        if (userId) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} is offline.`);

          this.server.emit('update-online-users', Array.from(onlineUsers.keys()));
          this.server.emit('callEnded');
        }
      });
    });
  }

  @SubscribeMessage('joinChat')
  onJoinChat(
    @MessageBody()
    body: {
      chatId: string;
      userId: number;
    },
    @ConnectedSocket() socket: Socket
  ) {
    const auth_token = socket.data;
    console.log('auth_token', auth_token);
    const { chatId, userId } = body;

    console.log(`User ${userId} joined chat room: ${chatId}`);
    this.logger.log(`Socket ${socket.id} joined chat room: ${chatId}`);

    socket.join(chatId);
  }

  @SubscribeMessage('typing')
  async onTyping(
    @MessageBody() body: { chatId: string; message: string; userId: number },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId, ...rest } = body;
    socket.broadcast.to(chatId).emit('typing', {
      ...rest
    });
  }

  @SubscribeMessage('stopTyping')
  async onStopTyping(
    @MessageBody() body: { chatId: string; userId: number },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId, ...rest } = body;
    socket.broadcast.to(chatId).emit('stopTyping', {
      ...rest
    });
  }

  @SubscribeMessage('user-online')
  onUserOnline(@MessageBody() body: { userId: number }, @ConnectedSocket() socket: Socket) {
    const { userId } = body;
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online.`);

    // Notify all clients about the updated online users
    this.server.emit('update-online-users', Array.from(onlineUsers.keys()));
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    body: {
      message: {
        message: string;
        id: string;
      };
      chatId: string;
    },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId } = body;

    const message = await this.socketService.createMessage(
      { chatId, message: body.message.message },
      socket.data.user.id
    );
    console.log(`User ${socket.data.user.id} is sending message.`, message);

    socket.to(chatId).emit('receiveMessage', message);
    socket.emit('messageAck', {
      message,
      id: body.message.id
    });
  }

  @SubscribeMessage('callUser')
  handleCallUser(
    @MessageBody()
    data: { userToCall: string; signalData: any; from: string; name: string },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Call initiated by ${data.from} to ${data.userToCall}`);
    client.to(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      name: data.name
    });
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(
    @MessageBody() data: { to: string; signal: any },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Call answered. Sending signal to: ${data.to}`);
    client.to(data.to).emit('callAccepted', data.signal);
  }

  // @SubscribeMessage('start-call')
  // handleStartCall(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetId: string }) {
  //   client.broadcast.to(payload.targetId).emit('incoming-call', { callerId: client.id });
  // }
  //
  // @SubscribeMessage('video-offer')
  // handleVideoOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
  //   console.log('Video offer:', payload);
  //   client.broadcast.to(payload.chatId).emit('video-offer', payload);
  // }
  //
  // @SubscribeMessage('video-answer')
  // handleVideoAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
  //   console.log('Video answer:', payload);
  //   client.broadcast.to(payload.chatId).emit('video-answer', payload);
  // }
  //
  // @SubscribeMessage('ice-candidate')
  // handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
  //   client.broadcast.to(payload.target).emit('ice-candidate', payload);
  // }
  //
  // @SubscribeMessage('call_join_room')
  // async joinRoom(@MessageBody() roomName: string, @ConnectedSocket() socket: Socket) {
  //   const room = this.server.in(roomName);
  //
  //   const roomSockets = await room.fetchSockets();
  //   const numberOfPeopleInRoom = roomSockets.length;
  //
  //   if (numberOfPeopleInRoom > 2) {
  //     room.emit('too_many_people');
  //     return;
  //   }
  //
  //   if (numberOfPeopleInRoom === 2) {
  //     room.emit('another_person_ready');
  //   }
  //
  //   socket.join(roomName);
  // }
  //
  // @SubscribeMessage('send_connection_offer')
  // async sendConnectionOffer(
  //   @MessageBody()
  //   {
  //     offer,
  //     roomName
  //   }: {
  //     offer: RTCSessionDescriptionInit;
  //     roomName: string;
  //   },
  //   @ConnectedSocket() socket: Socket
  // ) {
  //   console.log('roomName', roomName);
  //   console.log('offer', offer);
  //   console.log('socketid', socket.id);
  //   this.server.in(roomName).except(socket.id).emit('send_connection_offer', {
  //     offer,
  //     roomName
  //   });
  // }
  //
  // @SubscribeMessage('answer')
  // async answer(
  //   @MessageBody()
  //   {
  //     answer,
  //     roomName
  //   }: {
  //     answer: RTCSessionDescriptionInit;
  //     roomName: string;
  //   },
  //   @ConnectedSocket() socket: Socket
  // ) {
  //   this.server.in(roomName).except(socket.id).emit('answer', {
  //     answer,
  //     roomName
  //   });
  // }
  //
  // @SubscribeMessage('send_candidate')
  // async sendCandidate(
  //   @MessageBody()
  //   {
  //     candidate,
  //     roomName
  //   }: {
  //     candidate: unknown;
  //     roomName: string;
  //   },
  //   @ConnectedSocket() socket: Socket
  // ) {
  //   this.server.in(roomName).except(socket.id).emit('send_candidate', {
  //     candidate,
  //     roomName
  //   });
  // }
}

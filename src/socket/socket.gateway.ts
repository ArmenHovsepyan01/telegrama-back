import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { SocketService } from './socket.service';
import { WsAuthGuard } from './socket.guard';
import { ChatsService } from '../chats/chats.service';
import { CallsService } from '../calls/calls.service';
import { CallStatus } from '../calls/call.entity';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

const onlineUsers = new Map<number, string>();

@WebSocketGateway({
  transports: ['websocket', 'polling'],
  origin: [
    'https://localhost:3000/',
    'http://localhost:3000',
    'http://192.168.1.53:3000',
    'https://192.168.123.58:3000'
  ],
  credentials: true
})
@UseGuards(WsAuthGuard)
export class SocketGateway implements OnModuleInit {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private socketService: SocketService,
    private chatsService: ChatsService,
    private usersService: UsersService,
    private callService: CallsService
  ) {}

  onModuleInit(): void {
    this.server.on('connection', (socket: Socket) => {
      // @ts-ignore
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
    @MessageBody() body: { chatId: string; userId: number },
    @ConnectedSocket() socket: Socket
  ) {
    const auth_token = socket.data;
    console.log('auth_token', auth_token);
    const { chatId, userId } = body;

    console.log(`User ${userId} joined chat room: ${chatId}`);
    this.logger.log(`Socket ${socket.id} joined chat room: ${chatId}`);

    socket.join(chatId);
  }

  @SubscribeMessage('joinAIChat')
  onJoinAIChat(
    @MessageBody() body: { callId: string; userId: number },
    @ConnectedSocket() socket: Socket
  ) {
    const auth_token = socket.data;
    console.log('auth_token', auth_token);
    const { callId, userId } = body;

    socket.join(callId);

    console.log(`User ${userId} joined call room: ${callId}`);
    this.logger.log(`Socket ${socket.id} joined call room: ${callId}`);
  }

  @SubscribeMessage('typing')
  async onTyping(
    @MessageBody() body: { chatId: string; message: string; userId: number },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId, ...rest } = body;
    socket.broadcast.to(chatId).emit('typing', { ...rest });
  }

  @SubscribeMessage('stopTyping')
  async onStopTyping(
    @MessageBody() body: { chatId: string; userId: number },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId, ...rest } = body;
    socket.broadcast.to(chatId).emit('stopTyping', { ...rest });
  }

  @SubscribeMessage('user-online')
  onUserOnline(@MessageBody() body: { userId: number }, @ConnectedSocket() socket: Socket) {
    const { userId } = body;
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online.`);
    this.server.emit('update-online-users', Array.from(onlineUsers.keys()));
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @MessageBody()
    body: { message: { message: string; id: string }; chatId: string },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId } = body;
    const message = await this.socketService.createMessage(
      { chatId, message: body.message.message },
      socket.data.user.id
    );

    socket.to(chatId).emit('receiveMessage', message);
    socket.emit('messageAck', { message, id: body.message.id });
  }

  @SubscribeMessage('sendAIMessage')
  async onSendAIMessage(
    @MessageBody()
    body: { message: { message: string; id: string }; chatId: string; callId: string },
    @ConnectedSocket() socket: Socket
  ) {
    const { chatId, callId } = body;

    await this.socketService.createMessage(
      {
        chatId,
        message: body.message.message
      },
      socket.data.user.id
    );

    await this.socketService.createAIMessage({
      chatId,
      callId,
      message: body.message.message,
      userId: socket.data.user.id
    });
  }

  @SubscribeMessage('callUser')
  handleCallUser(
    @MessageBody() data: { userToCall: string; signalData: any; from: string; name: string },
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

  @SubscribeMessage('call-request')
  async handleCallRequest(
    @MessageBody() data: { chatId: string; callerId: number },
    @ConnectedSocket() client: Socket
  ) {
    const room = data.chatId;
    client.join(room);
    this.logger.log(`Client ${client.id} requested a call in room ${room}`);

    const roomClients = this.server.sockets.adapter.rooms.get(room);
    if (roomClients) {
      const otherClients = Array.from(roomClients).filter((id) => id !== client.id);
      if (otherClients.length > 0) {
        const targetId = otherClients[0];
        const call = await this.callService.createCall({
          chatId: data.chatId,
          callerId: data.callerId
        });

        const callData = { from: client.id, chatId: room, callId: call.id };

        const user = await this.usersService.findOne(data.callerId);

        if (user) {
          // @ts-expect-error
          callData.callerName = user.name;
        }

        this.server.to(targetId).emit('incoming-call', callData);
        this.server.to(client.id).emit('requested-call-id', { callId: call.id });
      }
    }
  }

  @SubscribeMessage('call-accepted')
  async handleCallAccepted(
    @MessageBody() data: { chatId: string; callId: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = data.chatId;
    client.join(room);
    this.logger.log(`Client ${client.id} accepted the call in room ${room}`);

    const roomClients = this.server.sockets.adapter.rooms.get(room);
    if (roomClients) {
      const otherClients = Array.from(roomClients).filter((id) => id !== client.id);
      if (otherClients.length > 0) {
        const callerId = otherClients[0];
        this.server.to(callerId).emit('call-accepted', { from: client.id, chatId: room });
        await this.callService.updateCallStatus(data.callId, CallStatus.STARTED);
      }
    }
  }

  @SubscribeMessage('call-declined')
  async handleCallDeclined(
    @MessageBody() data: { chatId: string; callId: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = data.chatId;
    this.logger.log(`Client ${client.id} declined the call in room ${room}`);
    // Use the server instance to access rooms
    const roomClients = this.server.sockets.adapter.rooms.get(room);
    if (roomClients) {
      const otherClients = Array.from(roomClients).filter((id) => id !== client.id);
      if (otherClients.length > 0) {
        const callerId = otherClients[0];
        this.server.to(callerId).emit('call-declined', { from: client.id, chatId: room });
        await this.callService.updateCallStatus(data.callId, CallStatus.DECLINED);
      }
    }
  }

  @SubscribeMessage('offer')
  handleOnOffer(
    @MessageBody() data: { target: string; caller: string; sdp: any },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Offer from ${client.id} to ${data.target}`);
    client.to(data.target).emit('offer', data);
  }

  @SubscribeMessage('answer')
  handleOnAnswer(
    @MessageBody() data: { target: string; caller: string; sdp: any },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`Answer from ${client.id} to ${data.target}`);
    client.to(data.target).emit('answer', data);
  }

  @SubscribeMessage('ice-candidate')
  handleOnICECandidate(
    @MessageBody() data: { target: string; candidate: any },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`ICE candidate from ${client.id} to ${data}`, data);
    client.to(data.target).emit('ice-candidate', data.candidate);
  }

  @SubscribeMessage('call-ended')
  async handleOnCallEnded(
    @MessageBody() data: { chatId: string; from: string; callId: string },
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log(`${data.from} Ended call`);
    await this.callService.endCall(data.callId);
    client.broadcast.to(data.chatId).emit('call-ended', data);
  }

  @SubscribeMessage('call-transcript')
  async handleOnTranscript(
    @MessageBody() data: { callId: string; text: string; userId: number; target: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      client.to(data.target).emit('call-transcription-recieved', {
        text: data.text
      });
      await this.callService.createCallTranscription(data.callId, data.text, data.userId);
    } catch (error) {
      this.logger.error('Caught error in handleOnTranscript', error);
    }
  }
}

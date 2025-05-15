// chat-ws.gateway.ts
import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

interface WsPayload<T = any> {
  event: string;
  data: T;
}

@WebSocketGateway({
  path: '/transcribe', // path acts like a “namespace”
  cors: { origin: ['http://localhost:3000'], credentials: true }
})
export class TranscribeWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  private openAIWs: WebSocket;

  afterInit() {
    console.log('WS-gateway ready on ws://localhost:4001/transcribe');
    this.openAIWs = new WebSocket('wss://api.openai.com/v1/realtime?intent=transcription', {
      headers: {
        Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    this.openAIWs.on('open', () => {
      console.log('Connected to OpenAI realtime server.');
      this.openAIWs?.send(
        JSON.stringify({
          type: 'transcription_session.update',
          session: {
            input_audio_transcription: { model: 'gpt-4o-mini-transcribe', language: 'en' },
            turn_detection: {
              prefix_padding_ms: 600,
              silence_duration_ms: 800,
              type: 'server_vad',
              threshold: 0.5
            }
          }
        })
      );
    });

    this.openAIWs.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      console.log('Received data from OpenAI:', data.type);
      // this.server.emit('transcription-result', data);

      if (data.type === 'conversation.item.input_audio_transcription.completed') {
        console.log('data.transcript', data.transcript);
      } else if (data.type === 'error') {
        console.log('data.transcript error', data.error.message);
      } else if (data.type === 'conversation.item.created') {
        console.log('conversation.item.created', data.item.content);
      } else if (data.type === 'conversation.item.input_audio_transcription.delta') {
        console.log('conversation delta', data);
      }
    });

    this.openAIWs.on('error', (error) => {
      console.log('OpenAI WebSocket Error', error);
    });
  }

  handleConnection(client: WebSocket) {
    console.log('client connected');

    client.on('message', (raw) => {
      // text frame  ────────────────────────────────
      console.log('Received text message:', raw);
      if (typeof raw === 'string') {
        const msg = JSON.parse(raw);
        switch (msg.event) {
          case 'transcribe-audio.start':
            console.log('start from', client.url);
            break;
          case 'transcribe-audio.end':
            console.log('end from', client.url);
            break;
        }
        return;
      }

      this.openAIWs.send(JSON.stringify({ type: 'input_audio_buffer.append' }));
      // 2. Send the raw audio buffer as a binary frame
      this.openAIWs.send(raw);
    });
  }

  handleDisconnect(client: WebSocket) {
    // remove from all rooms it was part of
  }

  @SubscribeMessage('transcribe-audio')
  onTranscribeAudio(@MessageBody() data: { type: string; audio: string }) {
    try {
      this.openAIWs.send(JSON.stringify(data));
      console.log('Data sent to OpenAI:', data.type);
    } catch (error) {
      console.log('Error in transcribing audio:', error);
    }
  }

  private broadcast(room: string, payload: string) {
    // this.rooms.get(room)?.forEach((ws) => {
    //   if (ws.readyState === ws.OPEN) ws.send(payload);
    // });
  }
}

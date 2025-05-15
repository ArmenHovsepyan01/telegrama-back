import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranscriptionsService } from './transcriptions.service';
import { SocketModule } from '../socket/socket.module';
import { Transcription } from './transcriptions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transcription]), SocketModule],
  providers: [TranscriptionsService],
  exports: [TranscriptionsService]
})
export class TranscriptionsModule {}

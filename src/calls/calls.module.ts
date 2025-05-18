import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CallsService } from './calls.service';
import { SocketModule } from '../socket/socket.module';
import { Call } from './call.entity';
import { Transcription } from '../transcriptions/transcriptions.entity';
import { CallsController } from './calls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Call, Transcription]), forwardRef(() => SocketModule)],
  providers: [CallsService],
  exports: [CallsService],
  controllers: [CallsController]
})
export class CallsModule {}

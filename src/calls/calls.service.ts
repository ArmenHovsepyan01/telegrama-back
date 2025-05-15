import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus } from './call.entity';
import { Transcription } from '../transcriptions/transcriptions.entity';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call) private callsRepository: Repository<Call>,
    @InjectRepository(Transcription) private transcriptionRepository: Repository<Transcription>
  ) {}

  async createCall(body: { chatId: string; callerId: number }) {
    try {
      const newCall = this.callsRepository.create(body);

      return await this.callsRepository.save(newCall);
    } catch (e) {
      console.log('Error creating call:', e);
      throw e;
    }
  }

  async updateCallStatus(callId: string, status: CallStatus) {
    try {
      const call = await this.callsRepository.findOne({
        where: { id: callId }
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      await this.callsRepository.update(
        {
          id: call.id
        },
        {
          status
        }
      );
    } catch (e) {
      console.log('Error updating call:', e);
      throw e;
    }
  }

  async createCallTranscription(callId: string, text: string, userId: number) {
    try {
      const newTranscription = this.transcriptionRepository.create({
        callId,
        userId,
        transcript: text
      });

      return await this.transcriptionRepository.save(newTranscription);
    } catch (e) {
      console.log('Error creating call:', e);
      throw e;
    }
  }

  async endCall(callId: string) {
    try {
      const call = await this.callsRepository.findOne({
        where: { id: callId }
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      await this.callsRepository.update(
        {
          id: call.id
        },
        {
          status: CallStatus.ENDED,
          endedAt: new Date()
        }
      );
    } catch (e) {
      console.log('Error ending call:', e);
      throw e;
    }
  }
}

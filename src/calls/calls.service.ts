import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus } from './call.entity';
import { Transcription } from '../transcriptions/transcriptions.entity';

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as PDFDocument from 'pdfkit';
import * as moment from 'moment/moment';

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

  async generateTranscriptPdf(callId: string): Promise<string> {
    const transcriptions = await this.transcriptionRepository.find({
      where: { callId },
      order: { createdAt: 'ASC' },
      relations: { user: true }
    });

    if (!transcriptions.length) {
      throw new HttpException('No transcriptions found for this call id', 404);
    }

    const startTime = moment(transcriptions[0].createdAt);
    const endTime = moment(transcriptions[transcriptions.length - 1].createdAt);
    const durationMins = endTime.diff(startTime, 'minutes');
    const durationSecs = endTime.diff(startTime, 'seconds');
    const formattedDate = startTime.format('ddd, MM/DD/YYYY h:mmA');
    const formattedDuration = `${durationMins} mins ${durationSecs} secs`;

    const doc = new PDFDocument({ margin: 50 });
    const publicFolder = path.join(process.cwd(), 'public', 'pdfs');
    if (!fs.existsSync(publicFolder)) {
      fs.mkdirSync(publicFolder, { recursive: true });
    }
    const fileName = `transcript-${callId}.pdf`;
    const filePath = path.join(publicFolder, fileName);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(16).text('Call Transcription', { align: 'left', underline: true });

    doc
      .moveDown(0.5)
      .fontSize(12)
      .text(`${formattedDate}    •    ${formattedDuration}`, { align: 'left' });

    doc.moveDown(1);

    doc.fontSize(12);
    for (const entry of transcriptions) {
      const timeStamp = moment(entry.createdAt).format('hh:mm:ss');
      doc
        .text(`[${timeStamp}]  ${entry.user.name}:`, { continued: true, indent: 20 })
        .text(` ${entry.transcript}`)
        .moveDown(0.5);
    }

    doc.end();

    return new Promise<string>((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve(`/public/pdfs/${fileName}`);
      });
      writeStream.on('error', reject);
    });
  }
}

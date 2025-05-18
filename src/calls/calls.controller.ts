import { Controller, Get, Param } from '@nestjs/common';
import { CallsService } from './calls.service';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get(':callId/transcript-pdf')
  async getTranscriptPdf(@Param('callId') callId: string): Promise<{ url: string }> {
    const url = await this.callsService.generateTranscriptPdf(callId);
    return { url };
  }
}

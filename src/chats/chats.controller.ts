import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { APIResponse } from '../common/interceptors/transformResponse.interceptor';
import { ZodValidationPipe } from '../common/pipes/validation.pipe';
import { createChatMessage } from './dto/create-message.dto';
import { createChat, CreateChatDto } from './dto/create-chat.dto';
import { SocketService } from '../socket/socket.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { CreateAIChatDto, createAIChat } from './dto/create-ai-chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly socketService: SocketService
  ) {}

  @Post('/:chatId/sendMessage')
  @UsePipes(new ZodValidationPipe(createChatMessage))
  @HttpCode(200)
  async sendMessage(@Request() req: any) {
    try {
      const {
        body: { message },
        params: { chatId }
      } = req;

      const newMessage = await this.chatsService.createMessage({
        message,
        userId: req.user.id,
        chatId
      });

      return new APIResponse('Success', newMessage);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async getChats(@Request() req: any) {
    try {
      const chats = await this.chatsService.getUserChats(req.user.id);

      return new APIResponse('Success', chats);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:chatId')
  async getChat(@Param() params: { chatId: string }) {
    try {
      const chat = await this.chatsService.getChat(params.chatId);

      return new APIResponse('Success', chat);
    } catch (error) {
      throw new HttpException(
        error.message,
        error?.response?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(createChat))
  @HttpCode(200)
  async createChat(@Body() body: CreateChatDto, @Request() req: any) {
    try {
      const { userMail } = body;
      const chat = await this.chatsService.createChat(userMail, req.user);

      return new APIResponse('Success', chat);
    } catch (error) {
      throw new HttpException(error.message, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/assistant/thread')
  @UsePipes(new ZodValidationPipe(createAIChat))
  @HttpCode(200)
  async createAIChat(@Body() body: CreateAIChatDto, @Request() req: any) {
    try {
      const { callId } = body;
      const assistantChat = await this.chatsService.createAIChat(callId, req.user);

      return new APIResponse('Success', assistantChat);
    } catch (error) {
      throw new HttpException(error.message, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      console.log(file);
      await fs.writeFile(`${path.resolve()}/transcriptions/${file.originalname}`, file.buffer);
      return new APIResponse('Success');
    } catch (error) {
      throw new HttpException(error.message, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('transcribe-base64')
  async fromBase64(@Body('audio') dataURL: string) {
    const [, b64] = dataURL.split(',');
    const buffer = Buffer.from(b64, 'base64');
    const filename = `sm-${Date.now()}.webm`;

    await fs.writeFile(`${path.resolve()}/transcriptions/${filename}`, buffer);
    return new APIResponse('Success');
  }
}

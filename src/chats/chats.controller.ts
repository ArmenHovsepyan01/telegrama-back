import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UsePipes
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { APIResponse } from '../common/interceptors/transformResponse.interceptor';
import { ZodValidationPipe } from '../common/pipes/validation.pipe';
import { createChatMessage } from './dto/create-message.dto';
import { createChat, CreateChatDto } from './dto/create-chat.dto';
import { SocketService } from '../socket/socket.service';
import { CreateUserDto } from '../users/dto/create.dto';

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
}

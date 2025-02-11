import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UsePipes
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { APIResponse } from '../common/interceptors/transformResponse.interceptor';
import { ZodValidationPipe } from '../common/pipes/validation.pipe';
import { createChatMessage, CreateMessageDto } from './dto/create-message.dto';
import { SocketService } from '../socket/socket.service';

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
}

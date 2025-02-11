import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chats.entity';
import { ChatMessage } from './chat-messages.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat) private chatsRepository: Repository<Chat>,
    @InjectRepository(ChatMessage) private chatMessagesRepository: Repository<ChatMessage>
  ) {}

  async getUserChats(userId: number) {
    try {
      return await this.chatsRepository
        .createQueryBuilder('chat')
        .leftJoinAndSelect('chat.users', 'chatUser', 'chatUser.id != :userId')
        .where('chat.id IN (SELECT chat_id FROM user_chats WHERE user_id = :userId)', { userId })
        .select(['chat.id', 'chatUser.name', 'chatUser.id', 'chatUser.lastName', 'chatUser.email'])
        .setParameters({ userId })
        .getMany();
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChat(chatId: string) {
    try {
      const chat = await this.chatsRepository.findOne({
        where: {
          id: chatId
        },
        relations: {
          messages: true,
          users: true
        }
      });

      return {
        ...chat,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        users: chat.users.map(({ password, isVerified, ...rest }) => rest)
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createMessage(body: { message: string; userId: number; chatId: string }) {
    try {
      const { message, chatId, userId } = body;
      const newMessage = this.chatMessagesRepository.create({
        message,
        chatId,
        userId
      });

      return await this.chatMessagesRepository.save(newMessage);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

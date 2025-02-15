import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chats.entity';
import { ChatMessage } from './chat-messages.entity';
import { User } from '../users/user.entity';
import { UserChat } from '../users/user_chats.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(UserChat) private userChatsRepository: Repository<UserChat>,
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

  async createChat(userMail: string, actualUser: User) {
    try {
      const user = await this.usersRepository.findOne({
        where: {
          email: userMail
        }
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const existingChat = await this.userChatsRepository
        .createQueryBuilder('uc')
        .select('uc.chatId', 'chatId')
        .where('uc.userId IN (:...userIds)', { userIds: [user.id, actualUser.id] })
        .groupBy('uc.chatId')
        .having('COUNT(DISTINCT uc.userId) = 2')
        .getRawOne();

      if (existingChat) {
        return { id: existingChat.chatId };
      }

      const chat = await this.chatsRepository.save(
        this.chatsRepository.create({
          isPrivate: true
        })
      );

      const userChats = this.userChatsRepository.create([
        { chatId: chat.id, userId: user.id },
        { chatId: chat.id, userId: actualUser.id }
      ]);

      await this.userChatsRepository.save(userChats);

      return chat;
    } catch (e) {
      throw new HttpException(e.message, e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

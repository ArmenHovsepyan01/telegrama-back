import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chats.entity';
import { ChatMessage } from './chat-messages.entity';
import { User } from '../users/user.entity';
import { UserChat } from '../users/user_chats.entity';
import { Call } from '../calls/call.entity';
import { OpenAIService } from '../openai/openai.service';
import { AssistantChat } from '../openai/assistant-chats.entity';
import { Transcription } from '../transcriptions/transcriptions.entity';
import * as moment from 'moment';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(UserChat) private userChatsRepository: Repository<UserChat>,
    @InjectRepository(Chat) private chatsRepository: Repository<Chat>,
    @InjectRepository(ChatMessage) private chatMessagesRepository: Repository<ChatMessage>,
    @InjectRepository(Call) private callsRepository: Repository<Call>,
    @InjectRepository(AssistantChat) private assistantChatsRepository: Repository<AssistantChat>,
    @InjectRepository(Transcription) private transcriptionRepository: Repository<Transcription>,
    private openAIService: OpenAIService
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
          users: true,
          calls: true
        }
      });

      const messages = [
        ...chat.messages.map((m) => ({
          ...m,
          type: 'message',
          created_at: m.created_at
        })),
        ...chat.calls.map(({ callerId, ...c }) => ({
          ...c,
          userId: callerId,
          type: 'call',
          created_at: c.startedAt
        }))
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      delete chat.calls;

      return {
        ...chat,
        messages,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        users: chat.users.map(({ password, isVerified, ...rest }) => rest)
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createMessage(body: { message: string; userId: number; chatId: string; role?: string }) {
    try {
      if (!body.role) {
        delete body.role;
      }

      const newMessage = this.chatMessagesRepository.create(body);

      return await this.chatMessagesRepository.save(newMessage);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateMessage(id: string, message: string) {
    try {
      await this.chatMessagesRepository.update({ id }, { message });
      return await this.chatMessagesRepository.findOne({ where: { id } });
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

      const chatWithUser = await this.chatsRepository.findOne({
        where: {
          id: chat.id
        },
        relations: {
          users: true
        }
      });

      return chatWithUser;
    } catch (e) {
      throw new HttpException(e.message, e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createAIChat(callId: string, actualUser: User) {
    try {
      const call = await this.callsRepository.findOne({
        where: {
          id: callId
        }
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      const existingAssistantChat = await this.assistantChatsRepository.findOne({
        where: {
          callId: callId,
          userId: actualUser.id
        }
      });

      if (existingAssistantChat) {
        return existingAssistantChat;
      }

      const chat = await this.chatsRepository.save(
        this.chatsRepository.create({
          isPrivate: true
        })
      );

      const callTransctiptions = await this.transcriptionRepository.find({
        where: {
          callId
        },
        relations: {
          user: true
        }
      });

      const transcription = callTransctiptions.reduce((acc, ct) => {
        acc += `${ct.user.name}: ${ct.transcript}\n | ${moment(ct.createdAt).format('hh:mm:ss')}\n`;
        return acc;
      }, 'Call Transcription:\n');

      const assistantInitialMessage = `Hey ${actualUser.name}! I'm your AI assistant. How can I help you today?`;

      const threadId = await this.openAIService.createThread(
        `My name is ${actualUser.name}`,
        transcription,
        assistantInitialMessage
      );

      await this.chatMessagesRepository.save(
        this.chatMessagesRepository.create({
          chatId: chat.id,
          message: assistantInitialMessage,
          role: 'assistant',
          userId: actualUser.id
        })
      );

      if (!threadId) {
        throw new HttpException('Failed to create thread', HttpStatus.NOT_FOUND);
      }

      return await this.assistantChatsRepository.save(
        this.assistantChatsRepository.create({
          chatId: chat.id,
          callId: call.id,
          threadId,
          userId: actualUser.id
        })
      );
    } catch (e) {
      throw new HttpException(e.message, e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendMessageToAI(callId: string, chatId: string, message: string) {
    try {
      const call = await this.callsRepository.findOne({
        where: {
          id: callId
        },
        relations: {
          chat: true
        }
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      const assistantChat = await this.assistantChatsRepository.findOne({
        where: {
          callId,
          chatId
        }
      });

      if (!assistantChat) {
        throw new HttpException('Assistant chat not found', HttpStatus.NOT_FOUND);
      }

      await this.openAIService.createMessage(assistantChat.threadId, message);
      return await this.openAIService.createRunWithStream(assistantChat.threadId);
    } catch (e) {
      throw new HttpException(e.message, e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

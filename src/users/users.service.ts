import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { User } from './user.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create.dto';
import { hash } from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { ChatsService } from '../chats/chats.service';
import { UserChat } from './user_chats.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(UserChat) private userChatsRepository: Repository<UserChat>,
    private mailService: MailService,
    private chatsService: ChatsService
  ) {}
  async findAll(searchTerm: string, userId: number) {
    const users = await this.usersRepository.find({
      select: ['id', 'email', 'name', 'lastName', 'nickName'],
      where: [{ email: Like(`%${searchTerm}%`) }, { nickName: Like(`%${searchTerm}%`) }]
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.filter((u) => u.id !== userId).map(({ id, ...rest }) => rest);
  }

  async create(user: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: user.email
      }
    });

    if (existingUser) {
      throw new BadRequestException(
        `User by ${user.email} is already exists, please use another email address.`
      );
    }

    const salt = process.env.SALT;
    user.password = await hash(user.password, salt);

    const newUser = this.usersRepository.create(user);
    const savedUser = await this.usersRepository.save(newUser);

    await this.mailService.sendEmail(savedUser.email, savedUser.name, savedUser.id);
    return savedUser;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id
      },
      select: ['id', 'email', 'name', 'lastName', 'nickName']
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async delete(id: number) {
    const result = await this.usersRepository.delete(id);
    if (!result?.affected) {
      throw new NotFoundException(`User with ID ${id} not found or already deleted`);
    }

    return result;
  }

  async getUserByOptions(options: { id: number; email: string }) {
    try {
      return await this.usersRepository.findOne({
        where: options
      });
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyUser(id: number) {
    try {
      await this.usersRepository.update(id, {
        isVerified: true
      });
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkUser(where: { id: number; email: string }) {
    try {
      const user = await this.usersRepository.findOne({
        where
      });

      if (!user) {
        throw new UnauthorizedException('Unauthorized');
      }

      if (!user.isVerified) {
        throw new BadRequestException('User is not verified.');
      }
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findUserByEmail(email: string) {
    try {
      return this.usersRepository.findOne({
        where: {
          email
        }
      });
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserChats(userId: number) {
    try {
      return await this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.chats', 'chat')
        .leftJoinAndSelect('chat.users', 'chatUser', 'chatUser.id != :userId')
        .where('user.id = :userId', { userId })
        .select([
          'user.id',
          'chat.id',
          'chatUser.id',
          'chatUser.name',
          'chatUser.lastName',
          'chatUser.email'
        ])
        .setParameters({ userId })
        .getMany();
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

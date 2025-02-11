import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { ChatsModule } from '../chats/chats.module';
import { UserChat } from './user_chats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserChat]), MailModule, ChatsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}

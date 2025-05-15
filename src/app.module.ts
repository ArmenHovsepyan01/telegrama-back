import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { SocketModule } from './socket/socket.module';
import typeorm from './config/typeorm';
import { JwtModule } from '@nestjs/jwt';
import jwtConstant from './constants/jwt.constant';
import { AuthGuard } from './auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ChatsModule } from './chats/chats.module';
import { TranscriptionsModule } from './transcriptions/transcriptions.module';
import { CallsModule } from './calls/calls.module';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [typeorm]
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('Database connected successfully');
        return configService.get('typeorm');
      }
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstant.secret
    }),
    UsersModule,
    AuthModule,
    MailModule,
    ChatsModule,
    TranscriptionsModule,
    CallsModule,
    SocketModule,
    OpenAIModule
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    MailService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
  exports: [SocketModule]
})
export class AppModule {}

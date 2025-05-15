import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  PrimaryColumn,
  ManyToMany
} from 'typeorm';
import { Chat } from '../chats/chats.entity';
import { User } from '../users/user.entity';
import { AssistantChat } from '../openai/assistant-chats.entity';

export enum CallStatus {
  STARTED = 'started',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined'
}

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @PrimaryColumn({ name: 'chat_id', type: 'uuid' })
  chatId: string;

  @PrimaryColumn({ name: 'caller_id', type: 'int' })
  callerId: number;

  @ManyToMany(() => AssistantChat, (chat) => chat.call)
  assistantChats: Chat[];

  @ManyToOne(() => Chat, { nullable: false })
  @JoinColumn({ name: 'chat_id', referencedColumnName: 'id' })
  chat: Chat;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'caller_id', referencedColumnName: 'id' })
  caller: User;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.STARTED })
  status: CallStatus;
}

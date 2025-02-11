import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { ChatMessage } from './chat-messages.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isPrivate: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToMany(() => User, (user) => user.chats)
  users: User[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chat)
  messages: ChatMessage[];
}

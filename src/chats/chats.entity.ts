import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { ChatMessage } from './chat-messages.entity';
import { Call } from '../calls/call.entity';
import { AssistantChat } from '../openai/assistant-chats.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isPrivate: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar', default: null, name: 'thread_id' })
  threadId?: string;

  @ManyToMany(() => User, (user) => user.chats)
  users: User[];

  @ManyToMany(() => AssistantChat, (chat) => chat.chat)
  assistantChats: Chat[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chat)
  messages: ChatMessage[];

  @OneToMany(() => Call, (chatCall) => chatCall.chat)
  calls: Call[];
}

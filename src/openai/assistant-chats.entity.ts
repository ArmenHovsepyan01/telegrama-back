import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Call } from '../calls/call.entity';
import { Chat } from '../chats/chats.entity';

@Entity('assistant_chats')
export class AssistantChat {
  @PrimaryColumn({ name: 'call_id', type: 'uuid' })
  callId: string;

  @PrimaryColumn({ name: 'chat_id', type: 'uuid' })
  chatId: string;

  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'thread_id', type: 'varchar', nullable: true, default: null })
  threadId?: string;

  @ManyToOne(() => Call, (call) => call.assistantChats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'call_id', referencedColumnName: 'id' })
  call: Call;

  @ManyToOne(() => Chat, (chat) => chat.assistantChats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id', referencedColumnName: 'id' })
  chat: Chat;
}

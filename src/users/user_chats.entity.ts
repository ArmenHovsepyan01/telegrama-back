import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Chat } from '../chats/chats.entity';

@Entity('user_chats')
export class UserChat {
  @PrimaryColumn({ name: 'user_id', type: 'int' }) // Matches `users.id`
  userId: number;

  @PrimaryColumn({ name: 'chat_id', type: 'uuid' }) // Matches `chats.id`
  chatId: string;

  @ManyToOne(() => User, (user) => user.chats, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User;

  @ManyToOne(() => Chat, (chat) => chat.users, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION'
  })
  @JoinColumn([{ name: 'chat_id', referencedColumnName: 'id' }])
  chats: Chat[];
}

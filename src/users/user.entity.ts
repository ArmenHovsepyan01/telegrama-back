import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from '../chats/chats.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true, default: '' })
  nickName: string;

  @Column({ default: false })
  isVerified: boolean;

  @ManyToMany(() => Chat, (chat) => chat.users)
  @JoinTable({
    name: 'user_chats',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'chat_id', referencedColumnName: 'id' }
  })
  chats: Chat[];
}

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ChatMessages1734168090448 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chat_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            default: 'gen_random_uuid()'
          },
          {
            name: 'user_id',
            type: 'serial',
            isPrimary: true
          },
          {
            name: 'chat_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'message',
            type: 'varchar',
            isNullable: true,
            default: "''"
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: true,
            default: 'user'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE'
          },
          {
            columnNames: ['chat_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'chats',
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('chat_messages');
  }
}

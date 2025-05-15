import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class CreateAssistantChats1747328180717 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assistant_chats',
        columns: [
          {
            name: 'call_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'chat_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'thread_id',
            type: 'varchar',
            isNullable: true,
            default: null
          }
        ]
      })
    );

    await queryRunner.createForeignKey(
      'assistant_chats',
      new TableForeignKey({
        columnNames: ['call_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'calls',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'assistant_chats',
      new TableForeignKey({
        columnNames: ['chat_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chats',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('assistant_chats');

    if (table) {
      const foreignKeys = table.foreignKeys.filter((fk) =>
        ['user_id', 'chat_id'].includes(fk.columnNames[0])
      );
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('assistant_chats', fk);
      }
    }

    await queryRunner.dropTable('assistant_chats');
  }
}

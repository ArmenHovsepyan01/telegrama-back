import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class UserChats1733680475313 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_chats',
        columns: [
          {
            name: 'user_id',
            type: 'serial',
            isPrimary: true
          },
          {
            name: 'chat_id',
            type: 'uuid',
            isPrimary: true
          }
        ]
      })
    );

    await queryRunner.createForeignKey(
      'user_chats',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'user_chats',
      new TableForeignKey({
        columnNames: ['chat_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chats',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_chats');

    if (table) {
      const foreignKeys = table.foreignKeys.filter((fk) =>
        ['user_id', 'chat_id'].includes(fk.columnNames[0])
      );
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('user_chats', fk);
      }
    }

    await queryRunner.dropTable('user_chats');
  }
}

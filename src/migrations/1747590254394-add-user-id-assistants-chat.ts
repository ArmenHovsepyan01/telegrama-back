import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddUserIdAssistantsChat1747590254394 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'assistant_chats',
      new TableColumn({
        name: 'user_id',
        type: 'serial',
        isNullable: false
      })
    );

    await queryRunner.createForeignKey(
      'assistant_chats',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('assistant_chats');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.includes('user_id'));
      if (foreignKey) {
        await queryRunner.dropForeignKey('assistant_chats', foreignKey);
      }
    }
    await queryRunner.dropColumn('assistant_chats', 'user_id');
  }
}

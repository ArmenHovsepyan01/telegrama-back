import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class Calls1746374221186 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'calls',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            default: 'gen_random_uuid()'
          },
          {
            name: 'chat_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'caller_id',
            type: 'int',
            isNullable: false
          },
          {
            name: 'started_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'ended_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            default: `'started'`
          }
        ]
      })
    );

    await queryRunner.createForeignKey(
      'calls',
      new TableForeignKey({
        columnNames: ['chat_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chats',
        onDelete: 'CASCADE'
      })
    );
    await queryRunner.createForeignKey(
      'calls',
      new TableForeignKey({
        columnNames: ['caller_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('calls');
  }
}

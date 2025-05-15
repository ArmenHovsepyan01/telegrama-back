// src/migrations/1733682100000-transcriptions.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class Transcriptions1746374235721 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transcriptions',
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
            type: 'int',
            isNullable: false
          },
          {
            name: 'call_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'transcript',
            type: 'text'
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
        ]
      })
    );

    await queryRunner.createForeignKey(
      'transcriptions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );
    await queryRunner.createForeignKey(
      'transcriptions',
      new TableForeignKey({
        columnNames: ['call_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'calls',
        onDelete: 'SET NULL'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transcriptions');
  }
}

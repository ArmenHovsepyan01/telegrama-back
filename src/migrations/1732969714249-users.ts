import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Users1732969714249 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'lastName',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'nickName',
            type: 'varchar',
            isNullable: true,
            default: "''"
          },
          {
            name: 'isVerified',
            type: 'boolean',
            isNullable: false,
            default: false
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}

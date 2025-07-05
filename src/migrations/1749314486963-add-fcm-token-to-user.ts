import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFcmTokenToUser1749314486963 implements MigrationInterface {
  name = 'AddFcmTokenToUser1749314486963';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'fcm_token',
        type: 'varchar',
        isNullable: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'fcm_token');
  }
}

import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join, resolve } from 'path';
import databaseConstant from '../constants/database.constant';

dotenvConfig({ path: '.env' });

const path = join(resolve(), '/dist');

const config = {
  type: 'postgres',
  host: databaseConstant.host,
  port: databaseConstant.port,
  username: databaseConstant.username,
  password: databaseConstant.password,
  database: databaseConstant.database,
  entities: [`${path}/../**/**.entity.js`],
  migrations: [`${path}/migrations/**/*.{ts,js}`],
  autoLoadEntities: true,
  synchronize: false,
  logging: false,
  migrationsRun: false,
  migrationsTransactionMode: 'each'
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);

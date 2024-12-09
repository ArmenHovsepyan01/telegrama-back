import { config } from 'dotenv';
config();

const databaseConstant = {
  host: String(process.env.DB_HOST),
  port: +process.env.DB_PORT,
  username: String(process.env.DB_USERNAME),
  password: String(process.env.DB_PASSWORD),
  database: String(process.env.DB_NAME)
};

export default databaseConstant;

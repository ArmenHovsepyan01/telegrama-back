declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      DB_DIALECT?: 'postgres';
      DB_HOST?: string;
      DB_PORT?: string;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_NAME?: string;
      SALT?: string;
      MAIL_PASSWORD?: string;
      MAIL_USERNAME?: string;
      JWT_SECRET?: string;
      APP_DOMAIN?: string;
      OPENAI_API_KEY?: string;
      ASSISTANT_ID?: string;
    }
  }
}

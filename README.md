# telegrama-back

Backend API for a Telegram-like chat application, built with NestJS, PostgreSQL, TypeORM, JWT auth, and Socket.IO.

## Features

- User authentication and authorization
- Chat and message management
- Real-time communication with WebSockets
- Email verification flow
- Swagger API documentation

## Tech Stack

- NestJS (TypeScript)
- PostgreSQL + TypeORM
- JWT
- Socket.IO

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the required variables:

- `PORT`
- `JWT_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `APP_DOMAIN`
- `MAIL_USERNAME`

3. Run database migrations (if needed):

```bash
npm run migration:run
```

4. Start the app:

```bash
npm run start:dev
```

The server starts with global prefix `api`, and Swagger is available at `/api`.

## Useful Scripts

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

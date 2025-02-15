import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createChat = z.object({
  userMail: z.string().email('Invalid email')
});

export class CreateChatDto extends createZodDto(createChat) {}

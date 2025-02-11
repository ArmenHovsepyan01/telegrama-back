import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createChatMessage = z.object({
  message: z.string()
});

export class CreateMessageDto extends createZodDto(createChatMessage) {}

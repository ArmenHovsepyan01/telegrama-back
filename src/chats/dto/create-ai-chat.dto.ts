import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createAIChat = z.object({
  callId: z.string()
});

export class CreateAIChatDto extends createZodDto(createAIChat) {}

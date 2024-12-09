import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
export const createUserSchema = z.object({
  name: z.string(),
  lastName: z.string(),
  email: z.string().email('Please provide correct email address.'),
  password: z.string().min(8, 'Password should be at least 8 characters long'),
  nickName: z.string().optional()
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

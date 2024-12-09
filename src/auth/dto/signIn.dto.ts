import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const signInUserSchema = z.object({
  email: z.string().email('Please provide correct email address.'),
  password: z.string().min(8, 'Password should be at least 8 characters long')
});

export class SignInUserDto extends createZodDto(signInUserSchema) {}

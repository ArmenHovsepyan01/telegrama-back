import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract detailed error messages
        const messages = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));

        console.log('Validation errors:', messages);

        // Throw a BadRequestException with detailed error messages
        throw new BadRequestException({
          message: 'Validation failed',
          errors: messages
        });
      }

      console.error('Unexpected error:', error);
      throw new BadRequestException('Validation failed');
    }
  }
}

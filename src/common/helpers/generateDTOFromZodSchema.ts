import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// This utility function will dynamically convert a Zod schema into a NestJS DTO class with @ApiProperty decorators
export function generateDtoFromZodSchema(zodSchema: z.ZodObject<any>, className: string) {
  const properties: Record<string, any> = zodSchema.shape;

  // Create the class dynamically
  const generatedClass: any = class {
    // Dynamically add properties to the class
    constructor() {
      for (const key in properties) {
        const property = properties[key];
        const isOptional = property.isOptional();
        const description = property._def.description || '';
        const example = property._def.example || '';

        // Add ApiProperty decorator for each field
        ApiProperty({
          description,
          example,
          required: !isOptional
        })(this, key);
      }
    }
  };

  // Set the class name for better debugging and logging
  Object.defineProperty(generatedClass, 'name', { value: className });

  // Add the properties to the class
  for (const key in properties) {
    Object.defineProperty(generatedClass.prototype, key, {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true,
      get: function () {
        return this[`_${key}`];
      },
      set: function (val) {
        this[`_${key}`] = val;
      }
    });
  }

  return generatedClass;
}

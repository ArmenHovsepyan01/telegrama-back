import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const saveFCMToken = z.object({
  fcmToken: z.string()
});

export class SaveFCMTokenDto extends createZodDto(saveFCMToken) {}

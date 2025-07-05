import { Injectable } from '@nestjs/common';

import * as admin from 'firebase-admin';
import * as serviceAccount from '../config/service-key.json';

@Injectable()
export class NotificationsService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
      });
    }
  }

  async sendNotification(token: string, payload: { title: string; body: any; link?: string }) {
    const { link = null, ...rest } = payload;
    const message = {
      notification: rest,
      token,
      webpush: link && {
        fcmOptions: {
          link
        }
      }
    };

    return await admin.messaging().send(message);
  }
}

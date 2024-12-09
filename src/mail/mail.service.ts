import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { join } from 'path';
import * as ejs from 'ejs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MailService {
  constructor(
    private mailService: MailerService,
    private jwtService: JwtService
  ) {}

  async sendEmail(email: string, name: string, id: number) {
    try {
      const templatePath = join(__dirname, '../..', 'views/verification-email.ejs');
      const verificationToken = this.jwtService.sign({
        id,
        email
      });

      const verificationURL = `${process.env.APP_DOMAIN}/api/auth/verify?token=${verificationToken}`;
      console.log('verificationURL', verificationURL);

      const html = await ejs.renderFile(templatePath, {
        email,
        name,
        verificationURL
      });

      await this.mailService.sendMail({
        from: `MessageApp <${process.env.MAIL_USERNAME}>`,
        to: email,
        subject: `How to Send Emails with Nodemailer`,
        html
      });

      console.log('Mail sent successfully');
    } catch (error) {
      console.log('Caught error from sendEmail', error);
      throw new BadRequestException(error.message);
    }
  }
}

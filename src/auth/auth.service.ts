import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignInUserDto } from './dto/signIn.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService
  ) {}
  async verifyUser(token: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { iat, ...rest } = this.jwtService.verify(token);
      const verifiedUser = await this.usersService.getUserByOptions(rest);
      console.log('payload', rest);

      if (!verifiedUser) {
        throw new UnauthorizedException('User unauthorized, verification failed.');
      }

      const accessToken = this.jwtService.sign(rest);
      console.log('accessToken', accessToken);

      await this.usersService.verifyUser(rest.id);

      return { accessToken };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async signIn(userData: SignInUserDto) {
    try {
      const user = await this.usersService.findUserByEmail(userData.email);
      if (!user) {
        throw new BadRequestException('There is no account by this email');
      }

      if (!user.isVerified) {
        throw new BadRequestException(
          'The account is not verified. Please pass the verification and try again'
        );
      }

      const isPasswordValid = await compare(userData.password, user.password);

      if (!isPasswordValid) {
        throw new BadRequestException('Password is invalid');
      }

      const accessToken = this.jwtService.sign({
        id: user.id,
        email: user.email
      });

      return { accessToken };
    } catch (e) {
      throw new HttpException(
        e.message,
        e?.response?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

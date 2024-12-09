import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
  UsePipes,
  Request,
  Response,
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { APIResponse } from '../common/interceptors/transformResponse.interceptor';
import { ZodValidationPipe } from '../common/pipes/validation.pipe';
import { SignInUserDto, signInUserSchema } from './dto/signIn.dto';
import { AuthGuard } from './auth.guard';
import { Public } from '../common/decorators/decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Get('verify')
  async verifyAccount(@Request() req, @Query() query: { token: string }, @Response() res) {
    if (!query?.token) {
      throw new UnauthorizedException('User unauthorized!');
    }

    const { token } = query;

    const payload = await this.authService.verifyUser(token);
    console.log('payload', payload);

    return res.redirect(`http://localhost:3000?idToken=${payload.accessToken}`);
  }

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(signInUserSchema))
  @HttpCode(200)
  async signIn(@Body() body: SignInUserDto) {
    const payload = await this.authService.signIn(body);
    return new APIResponse('Logged in', payload);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

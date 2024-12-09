import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  UsePipes
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, createUserSchema } from './dto/create.dto';
import { ZodValidationPipe } from '../common/pipes/validation.pipe';
import { MailService } from '../mail/mail.service';
import { APIResponse } from '../common/interceptors/transformResponse.interceptor';
import { Public } from '../common/decorators/decorators';

interface UserParams {
  id: number;
}

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private mailService: MailService
  ) {}

  @Get()
  async getUsers() {
    try {
      const users = await this.usersService.findAll();
      return new APIResponse('Success', users);
    } catch (e) {
      console.log('Caught an error in getUsers', e.message);
      throw new HttpException(e.response.message, e.response.statusCode);
    }
  }

  @Get('/:id')
  async getUser(@Param() params: UserParams) {
    try {
      const user = await this.usersService.findOne(params.id);
      return new APIResponse('Success', user);
    } catch (e) {
      console.log('Caught an error in getUsers', e.message);
      throw new HttpException(e.response.message, e.response.statusCode);
    }
  }

  @Public()
  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  @HttpCode(200)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.create(createUserDto);

      return new APIResponse(
        'You have successfully created an account, please check your email and verify your account.'
      );
    } catch (e) {
      console.log('Caught an error in createUser', e.message);
      throw new HttpException(e.message, e?.response?.statusCode || 400);
    }
  }

  @Delete('/:id')
  async deleteUser(@Param() params: UserParams) {
    try {
      await this.usersService.delete(params.id);
      return new APIResponse('Success');
    } catch (e) {
      console.error('Caught an error in deleteUser', e.response);
      throw new HttpException(e.response.message, e.response.statusCode);
    }
  }
}

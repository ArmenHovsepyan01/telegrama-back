import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { APIResponse } from './common/interceptors/transformResponse.interceptor';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello() {
    const message = this.appService.getHello();
    return new APIResponse(message);
  }
}

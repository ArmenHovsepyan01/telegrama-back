import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: HttpStatus;
  message: string;
  errors?: any;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const method = request?.method || 'UNKNOWN';
    const url = request?.url || 'UNKNOWN';
    const message = exception?.message || 'Something gone wrong';
    const exceptionResponse = exception?.getResponse();
    const errors = (exceptionResponse as any)?.errors || null;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: message
    };

    if (!!errors) {
      errorResponse.errors = errors;
    }

    this.logger.error(`HTTP ${status} Error - Method: ${method} URL: ${url}: ${message}`);

    response.status(status).json(errorResponse);
  }
}

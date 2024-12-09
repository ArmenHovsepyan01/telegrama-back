import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data?: T;
  message?: string;
}

export class APIResponse<T> implements Response<T> {
  message?: string;
  data?: T;

  constructor(message?: string, data?: T) {
    this.data = data;
    this.message = message;
  }
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((response) => {
        if (!(response instanceof APIResponse)) {
          return response;
        }

        const { data, message } = response;
        if (data === undefined && message) {
          return { message };
        }

        return message ? { data, message } : { data };
      })
    );
  }
}

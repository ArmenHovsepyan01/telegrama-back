import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch (error) {
      client.disconnect();
      console.log('Error from WSGuard', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}

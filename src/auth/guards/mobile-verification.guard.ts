import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MobileVerificationGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.user?.is_verified) {
      throw new UnauthorizedException('Phone number should be verified');
    }

    return true;
  }
}

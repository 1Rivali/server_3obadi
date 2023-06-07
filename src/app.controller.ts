import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';
@Controller('/')
export class AppController {
  // @Roles('USER')
  // @UseGuards(JwtAuthGuard, RolesGuard, MobileVerificationGuard)
  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }
  @Get()
  root(@Res() res) {
    res.sendFile(join(__dirname, '..', 'web', 'index.html'));
  }
}

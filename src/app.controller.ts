import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';
@Controller('/')
export class AppController {
  @Get()
  root(@Res() res): void {
    res.sendFile(join(__dirname, '..', 'web', 'index.html'));
  }
}

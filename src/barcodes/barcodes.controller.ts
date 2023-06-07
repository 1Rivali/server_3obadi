import {
  Controller,
  UseGuards,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseFilters,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

import { ConsumeBarcodeDto, CreateBarcodeDto } from './dto';
import { AwardService } from './services/award.service';
import { AwardEntity } from './entities/award.entity';
import { BarcodesService } from './services/barcodes.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { MobileVerificationGuard } from 'src/auth/guards/mobile-verification.guard';
import { GetCurrentUser } from 'src/utils';
import { HttpExceptionFilter } from 'src/http-exception.filter';

@UseFilters(new HttpExceptionFilter())
@Controller('api/v1/barcodes')
export class BarcodesController {
  constructor(
    private awardService: AwardService,
    private barcodeService: BarcodesService,
  ) {}

  // @Roles(UserRole.ADMIN)
  // @UseGuards(RolesGuard)

  @UseGuards(JwtAuthGuard, MobileVerificationGuard)
  @Post('/consume')
  async ConsumeBarcode(
    @Body(new ValidationPipe()) consumeBarcodeDto: ConsumeBarcodeDto,
    @GetCurrentUser() user: any,
  ) {
    const userId: string = user.userId;
    const barcode = await this.barcodeService.consumeBarcode(
      consumeBarcodeDto.code,
      userId,
    );
    console.log(barcode);
    return barcode;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, MobileVerificationGuard)
  @Get()
  async fetchScans(@GetCurrentUser() user: any) {
    console.log(user.userId);
    const barcodes = await this.barcodeService.fetchAllById(user.userId);
    return barcodes;
  }

  // @Get('test')
  // async testPercentage() {
  //   return this.barcodeService.testPercentage();
  // }
}

import {
  Controller,
  UseGuards,
  Post,
  Body,
  ValidationPipe,
  Get,
  Res,
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
import { UserRole } from 'src/users/users.entity';
import { GenerateBarcodeDto } from './dto/generate-barcode.dto';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';


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
    const userId: number = user.userId;
    const barcode = await this.barcodeService.consumeBarcode(
      consumeBarcodeDto.code,
      userId,
    );
    
    return barcode;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, MobileVerificationGuard)
  @Get()
  async fetchScans(@GetCurrentUser() user: any) {
   
    const barcodes = await this.barcodeService.fetchAllById(user.userId);
    return barcodes;
  }
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard, MobileVerificationGuard)
  @Post('/generate')
  async generateBarcodes(
    
    @Body(new ValidationPipe()) generateBarcodesDto: GenerateBarcodeDto
  ) {
    const fileName = await this.barcodeService.generateBarcodes(
      generateBarcodesDto.count,
      generateBarcodesDto.agent_id,
      generateBarcodesDto.award_id,
    );
    
   
  }
}

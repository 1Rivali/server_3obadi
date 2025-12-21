import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { Response } from "express";
import { join } from "path";

import { ConsumeBarcodeDto } from "./dto";
import { BarcodesService } from "./services/barcodes.service";

import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { HttpExceptionFilter } from "src/http-exception.filter";
import { GetCurrentUser } from "src/utils";
import { GenerateBarcodeDto } from "./dto/generate-barcode.dto";
import { RedeemBarcodeByPhoneNumberDto } from "./dto/redeem-barcode-by-phone";

@UseFilters(new HttpExceptionFilter())
@Controller("api/v1/barcodes")
export class BarcodesController {
  private readonly logger = new Logger(BarcodesController.name);
  constructor(private barcodeService: BarcodesService) {}

  // @Roles(UserRole.ADMIN)
  // @UseGuards(RolesGuard)

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @Post("/consume")
  async ConsumeBarcode(
    @Body(new ValidationPipe()) consumeBarcodeDto: ConsumeBarcodeDto,
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUser() user: any
  ) {
    const userId: number = user.userId;
    const barcode = await this.barcodeService.consumeBarcode(
      consumeBarcodeDto.code,
      userId,
      file
    );

    return barcode;
  }

  @UseGuards(JwtAuthGuard)
  @Post("/redeem-by-phone-number")
  async redeemBarcodeByPhoneNumber(
    @Body(new ValidationPipe())
    redeemBarcodeByPhoneNumberDto: RedeemBarcodeByPhoneNumberDto
  ) {
    const result = await this.barcodeService.redeemBarcodeByPhoneNumber(
      redeemBarcodeByPhoneNumberDto.mobile,
      redeemBarcodeByPhoneNumberDto.code
    );

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post("/redeem-now")
  async redeemBarcode(
    @Body(new ValidationPipe())
    redeemBarcodeDto: ConsumeBarcodeDto
  ) {
    const result = await this.barcodeService.redeemBarcode(
      redeemBarcodeDto.code
    );

    return result;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Get()
  async fetchScans(@GetCurrentUser() user: any) {
    const barcodes = await this.barcodeService.fetchAllById(user.userId);
    return barcodes;
  }

  // @Roles(UserRole.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("/generate")
  async generateBarcodes(
    @Body(new ValidationPipe()) generateBarcodesDto: GenerateBarcodeDto,
    @Res() res: Response
  ) {
    const fileName = await this.barcodeService.generateBarcodes(
      generateBarcodesDto.count,
      generateBarcodesDto.agent_id,
      generateBarcodesDto.award_id,
      generateBarcodesDto.isMetalized
    );

    const filePath = join(process.cwd(), fileName);
    return res.download(filePath, fileName);
  }
}

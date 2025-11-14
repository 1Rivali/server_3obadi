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
  UploadedFile,
  Res,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { Response } from "express";
import { join } from "path";

import { ConsumeBarcodeDto } from "./dto";
import { BarcodesService } from "./services/barcodes.service";

import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { GetCurrentUser } from "src/utils";
import { HttpExceptionFilter } from "src/http-exception.filter";
import { UserRole } from "src/users/users.entity";
import { GenerateBarcodeDto } from "./dto/generate-barcode.dto";
import { Roles } from "src/auth/roles/roles.decorator";
import { RolesGuard } from "src/auth/roles/roles.guard";
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
    if (file) {
      this.logger.log(
        `Image uploaded - filename: ${file.originalname}, mimetype: ${
          file.mimetype
        }, size: ${file.size} bytes, buffer: ${
          file.buffer ? "present" : "missing"
        }`
      );
    } else {
      this.logger.warn(
        `No image file uploaded for barcode: ${consumeBarcodeDto.code}, userId: ${user.userId}`
      );
    }

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
      generateBarcodesDto.award_id
    );

    const filePath = join(process.cwd(), fileName);
    return res.download(filePath, fileName);
  }
}

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
} from "@nestjs/common";

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
  constructor(private barcodeService: BarcodesService) {}

  // @Roles(UserRole.ADMIN)
  // @UseGuards(RolesGuard)

  @UseGuards(JwtAuthGuard)
  @Post("/consume")
  async ConsumeBarcode(
    @Body(new ValidationPipe()) consumeBarcodeDto: ConsumeBarcodeDto,
    @GetCurrentUser() user: any
  ) {
    const userId: number = user.userId;
    const barcode = await this.barcodeService.consumeBarcode(
      consumeBarcodeDto.code,
      userId
    );

    return barcode;
  }

  @UseGuards(JwtAuthGuard)
  @Post("/redeem-by-phone-number")
  async redeemBarcodeByPhoneNumber(
    @Body(new ValidationPipe())
    redeemBarcodeByPhoneNumberDto: RedeemBarcodeByPhoneNumberDto
  ) {
    try {
      const result = await this.barcodeService.redeemBarcodeByPhoneNumber(
        redeemBarcodeByPhoneNumberDto.mobile,
        redeemBarcodeByPhoneNumberDto.code
      );

      return {
        success: true,
        data: result,
        message: "Barcode redeemed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message:
            error.message || "An error occurred while redeeming the barcode",
          status: error.status || 500,
          details: error.response || null,
        },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("/redeem-now")
  async redeemBarcode(
    @Body(new ValidationPipe())
    redeemBarcodeDto: ConsumeBarcodeDto
  ) {
    try {
      const result = await this.barcodeService.redeemBarcode(
        redeemBarcodeDto.code
      );

      return {
        success: true,
        data: result,
        message: "Barcode redeemed successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message:
            error.message || "An error occurred while redeeming the barcode",
          status: error.status || 500,
          details: error.response || null,
        },
      };
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Get()
  async fetchScans(@GetCurrentUser() user: any) {
    const barcodes = await this.barcodeService.fetchAllById(user.userId);
    return barcodes;
  }
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("/generate")
  async generateBarcodes(
    @Body(new ValidationPipe()) generateBarcodesDto: GenerateBarcodeDto
  ) {
    await this.barcodeService.generateBarcodes(
      generateBarcodesDto.count,
      generateBarcodesDto.agent_id,
      generateBarcodesDto.award_id
    );
  }
}

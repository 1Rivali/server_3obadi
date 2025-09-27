import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BarcodesEntity } from "../entities/barcodes.entity";
import { Repository } from "typeorm";
import { AwardService } from "./award.service";
import { UsersService } from "src/users/users.service";
import { v4 as uuidv4 } from "uuid";
import * as xlsx from "xlsx-populate";
@Injectable()
export class BarcodesService {
  constructor(
    @InjectRepository(BarcodesEntity)
    private readonly barcodeRepo: Repository<BarcodesEntity>,
    private readonly awardService: AwardService,
    private readonly userService: UsersService
  ) {}

  async consumeBarcode(barcodeID: string, userId: number) {
    const findBarcode: BarcodesEntity = await this.barcodeRepo.findOne({
      where: { barcode_id: barcodeID.trim() },
      relations: {
        award: true,
        agent: true,
      },
    });
    if (!findBarcode.winner) {
      throw new HttpException("حظ أوفر", HttpStatus.CONFLICT);
    }
    if (findBarcode) {
      if (findBarcode.is_used === true)
        throw new HttpException(
          "هذا الباركود مستخدم من قبل",
          HttpStatus.BAD_REQUEST
        );

      const user = await this.userService.findUserById(userId);

      // Handle different award types based on award_type
      let response: any = {
        agent: findBarcode.agent.agent_name,
        agent_logo: findBarcode.agent.agent_logo,
        agent_primary_color: findBarcode.agent.agent_primary_color,
        award_type: findBarcode.award.award_type,
        award_description: findBarcode.award.award_description,
      };

      switch (findBarcode.award.award_type) {
        case "points":
          // For points, award_value is a number (points to add)
          const pointsToAdd = parseInt(findBarcode.award.award_value);
          if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
            throw new HttpException(
              "Invalid points value",
              HttpStatus.BAD_REQUEST
            );
          }
          const newPoints = user.points + pointsToAdd;
          await this.userService.updateUserPoints(user.user_id, newPoints);
          response.points_awarded = findBarcode.award.award_value;
          response.total_points = newPoints;
          response.message = `You have been awarded ${findBarcode.award.award_value} points!`;
          break;

        case "discount":
          // For discount, award_value is a string (discount code)
          response.discount_code = findBarcode.award.award_value;
          response.message = `Discount code: ${findBarcode.award.award_value}`;
          response.instructions =
            "Use this code at checkout to get your discount";
          break;

        case "physical":
          // For physical, award_value is a string (prize identifier/name)
          response.prize_name = findBarcode.award.award_value;
          response.prize_description = findBarcode.award.award_description;
          response.message = `Congratulations! You won: ${findBarcode.award.award_value}`;
          response.instructions = "Contact us to arrange prize collection";
          break;

        default:
          throw new HttpException(
            `Unsupported award type: ${findBarcode.award.award_type}`,
            HttpStatus.BAD_REQUEST
          );
      }

      // Mark barcode as used
      await this.barcodeRepo.update(
        { barcode_id: barcodeID },
        { is_used: true, user: user }
      );

      return response;
      // const award = await this.choosePoints();

      // const user = await this.userService.findUserById(userId);

      // const dbAward = await this.awardService.findAward(award);
      // const newPoints = user.points + parseInt(award);
      // this.barcodeRepo.update(
      //   { barcode_id: barcodeID },
      //   { is_used: true, user: user, award: dbAward }
      // );
      // await this.userService.updateUserPoints(user.user_id, newPoints);

      // return {
      //   points: award,
      //   agent: findBarcode.agent.agent_name,
      // };
    }
    throw new HttpException(
      "The requested barcode doesn't exist",
      HttpStatus.NOT_FOUND
    );
  }

  async fetchAllById(userId: number): Promise<any[]> {
    const barcodesList = [];

    const barcodes: BarcodesEntity[] = await this.barcodeRepo.find({
      select: {
        barcode_id: true,
        award: { award_value: true, award_type: true, award_description: true },
        used_at: true,
        is_used: true,
        created_at: true,
      },
      where: { user: { user_id: userId } },
      relations: {
        award: true,
        agent: true,
      },
      order: { created_at: "DESC" },
    });

    barcodes.forEach((barcode) => {
      const response: any = {
        barcode_id: barcode.barcode_id,
        award_type: barcode.award.award_type,
        award_description: barcode.award.award_description,
        is_redeemed: barcode.is_used,
        redeemed_at: barcode.used_at,
        created_at: barcode.created_at,
        agent: barcode.agent.agent_name,
        agent_logo: barcode.agent.agent_logo,
        agent_primary_color: barcode.agent.agent_primary_color,
      };

      // Add type-specific fields based on award type
      switch (barcode.award.award_type) {
        case "points":
          // For points, award_value is numeric
          response.points_awarded = barcode.award.award_value;
          response.message = `${barcode.award.award_value} points awarded`;
          break;
        case "discount":
          // For discount, award_value is a string (discount code)
          response.discount_code = barcode.award.award_value;
          response.message = `Discount code: ${barcode.award.award_value}`;
          break;
        case "physical":
          // For physical, award_value is a string (prize name/identifier)
          response.prize_name = barcode.award.award_value;
          response.message = `Physical prize: ${barcode.award.award_value}`;
          break;
      }

      barcodesList.push(response);
    });
    return barcodesList;
  }
  async generateBarcodes(
    count: number,
    agent_id: number,
    award_id: number
  ): Promise<string> {
    const rowsToInsert = [];

    for (let i = 0; i < count; i++) {
      const newRow = this.barcodeRepo.create({
        barcode_id: uuidv4(),
        agent: { agent_id },
        award: { award_id },
      });
      rowsToInsert.push(newRow);
    }

    // Save to the table using TypeORM
    await this.barcodeRepo.save(rowsToInsert);

    // Save barcode IDs to the XLSX file using xlsx-populate
    const workbook = await xlsx.fromBlankAsync();
    const sheet = workbook.sheet(0);

    rowsToInsert.forEach((row, index) => {
      sheet.cell(`A${index + 1}`).value(row.barcode_id);
    });
    const award = await this.awardService.findAwardById(award_id);

    const fileName = `output_${agent_id}_${count}_${
      award.award_value
    }_${new Date().getTime()}.xlsx`;
    await workbook.toFileAsync(fileName);

    console.log(
      `${count} rows inserted successfully and barcode IDs saved to ${fileName}!`
    );

    return fileName;
  }

  async redeemBarcode(barcodeID: string) {
    const findBarcode: BarcodesEntity = await this.barcodeRepo.findOne({
      where: { barcode_id: barcodeID.trim() },
    });
    if (!findBarcode) {
      throw new HttpException(
        "The requested barcode doesn't exist",
        HttpStatus.NOT_FOUND
      );
    }
    await this.barcodeRepo.update(
      { barcode_id: barcodeID },
      { is_redeemed: true, reciver_phone_number: null, immideate_redeem: true }
    );
    return {
      message: "Barcode redeemed successfully",
    };
  }

  async redeemBarcodeByPhoneNumber(phoneNumber: string, barcodeID: string) {
    const findBarcode: BarcodesEntity = await this.barcodeRepo.findOne({
      where: { barcode_id: barcodeID.trim() },
    });
    if (!findBarcode) {
      throw new HttpException(
        "The requested barcode doesn't exist",
        HttpStatus.NOT_FOUND
      );
    }
    await this.barcodeRepo.update(
      { barcode_id: barcodeID },
      {
        is_redeemed: true,
        reciver_phone_number: phoneNumber,
        immideate_redeem: false,
      }
    );
    return {
      message: "Barcode redeemed successfully",
    };
  }
  // Helper functions

  // private async choosePoints() {
  //   const options = await this.awardService.fetchAwards();
  //   const totalPercentage = options.reduce(
  //     (acc, option) => acc + option.percentage,
  //     0,
  //   );
  //   const randomNumber = Math.random() * totalPercentage;
  //   let cumulativePercentage = 0;

  //   for (const option of options) {
  //     cumulativePercentage += option.percentage;
  //     if (randomNumber < cumulativePercentage) {
  //       return option.award_value;
  //     }
  //   }
  // }
}

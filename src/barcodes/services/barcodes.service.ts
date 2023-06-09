import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BarcodesEntity } from '../entities/barcodes.entity';
import { Repository } from 'typeorm';
import { AwardService } from './award.service';
import { UsersService } from 'src/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx-populate';
@Injectable()
export class BarcodesService {
  constructor(
    @InjectRepository(BarcodesEntity)
    private readonly barcodeRepo: Repository<BarcodesEntity>,
    private readonly awardService: AwardService,
    private readonly userService: UsersService,
  ) {}

  async consumeBarcode(barcodeID: string, userId:number) {
    const findBarcode: BarcodesEntity = await this.barcodeRepo.findOne({
      where: { barcode_id: barcodeID.trim() },
      relations: {
        award: true,
        agent: true,
      },
    });
   
    
    if (findBarcode) {
      if (findBarcode.is_used === true)
      throw new HttpException(
        'The Barcode is used before',
        HttpStatus.BAD_REQUEST
      );
      
      const user = await this.userService.findUserById(userId);
      const newPoints = user.points + parseInt(findBarcode.award.award_value);
      await this.barcodeRepo.update(
        { barcode_id: barcodeID },
        { is_used: true, user: user }
      );
      await this.userService.updateUserPoints(user.user_id, newPoints);
      return {
        points: findBarcode.award.award_value,
        agent: findBarcode.agent.agent_name,
      };
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
    throw new HttpException("The requested barcode doesn't exist", HttpStatus.NOT_FOUND);
  }

  async fetchAllById(userId: number): Promise<BarcodesEntity[]> {
    const barcodesList = [];

    const barcodes: BarcodesEntity[] = await this.barcodeRepo.find({
      select: { award: { award_value: true }, used_at: true },
      where: { user: { user_id: userId } },
      relations: {
        award: true,
      },
    });
    barcodes.forEach((barcode) => {
    
      barcodesList.push({
        points: barcode.award.award_value,
        usedAt: barcode.used_at,
      });
    });
    return barcodesList;
  }
  async generateBarcodes(count: number, agent_id: number, award_id:number): Promise<string> {
    const rowsToInsert = [];

    for (let i = 0; i < count; i++) {
      const newRow = this.barcodeRepo.create({
        barcode_id: uuidv4(),
        agent: { agent_id },
        award: { award_id }
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
    
    const fileName = `output_${agent_id}_${count}_${award.award_value}_${new Date().getTime()}.xlsx`;
    await workbook.toFileAsync(fileName);

    console.log(
      `${count} rows inserted successfully and barcode IDs saved to ${fileName}!`
    );

    return fileName;
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

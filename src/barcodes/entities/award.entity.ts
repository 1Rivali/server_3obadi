import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BarcodesEntity } from './barcodes.entity';
import { Exclude } from 'class-transformer';

export enum AwardTypeEnum {
  POINTS = 'points',
  DISCOUNT = 'discount',
  PHYSICAL = 'physical',
}

@Entity({ name: 'awards' })
export class AwardEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  readonly award_id: number;

  @Exclude()
  @Column({ type: 'enum', enum: AwardTypeEnum, nullable: false })
  readonly award_type: AwardTypeEnum;

  @Column()
  readonly award_value: string;

  @Exclude()
  @Column()
  readonly percentage: number;

  @Exclude()
  @Column({ type: 'text' })
  readonly award_description: string;

  @OneToMany(() => BarcodesEntity, (barcode) => barcode.award)
  readonly barcodes: BarcodesEntity[];

  constructor(partial: Partial<AwardEntity>) {
    Object.assign(this, partial);
  }
}

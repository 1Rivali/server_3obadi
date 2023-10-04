import { Exclude } from 'class-transformer';
import { BarcodesEntity } from 'src/barcodes/entities/barcodes.entity';
import { TransitionEntity } from 'src/transitions/entities/transitions.entity';
import { PasswordVerificationEntity } from 'src/verifications/entities/password-verification.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export enum SimProviderEnum {
  SYRIATEL = 'sy',
  MTN = 'mtn',
}

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  readonly user_id: number;

  @Column()
  readonly name: string;

  @Column({ unique: true })
  readonly mobile: string;

  @Exclude()
  @Column({ type: 'enum', enum: SimProviderEnum, nullable: false })
  readonly sim_provider: SimProviderEnum;

  @Exclude()
  @Column({ default: 1 })
  readonly is_pre_paid: boolean;

  @Exclude()
  @Column()
  readonly password: string;

  @Column({ default: 0 })
  readonly points: number;

  @Exclude()
  @Column({ default: 0 })
  readonly is_verified: boolean;

  @Exclude()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  readonly role: UserRole;

  @Exclude()
  @CreateDateColumn()
  readonly created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  readonly updated_at: Date;

  @Exclude()
  @OneToMany(
    () => PasswordVerificationEntity,
    (verification) => verification.user,
  )
  readonly verifications: PasswordVerificationEntity[];

  @Exclude()
  @OneToMany(() => BarcodesEntity, (barcodes) => barcodes.user)
  readonly barcodes: BarcodesEntity[];

  @Exclude()
  @OneToMany(() => TransitionEntity, (transitions) => transitions.user)
  readonly transitions: TransitionEntity[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

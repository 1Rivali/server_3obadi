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
  @PrimaryGeneratedColumn('uuid')
  readonly user_id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  mobile: string;

  @Exclude()
  @Column({ type: 'enum', enum: SimProviderEnum, nullable: false })
  sim_provider: SimProviderEnum;

  @Exclude()
  @Column({ default: 0 })
  is_post_paid: boolean;

  @Exclude()
  @Column()
  password: string;

  @Column({ default: 0 })
  points: number;

  @Exclude()
  @Column({ default: false })
  is_verified: boolean;

  @Exclude()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Exclude()
  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @OneToMany(
    () => PasswordVerificationEntity,
    (verification) => verification.user,
  )
  verifications: PasswordVerificationEntity[];

  @Exclude()
  @OneToMany(() => BarcodesEntity, (barcodes) => barcodes.user)
  barcodes: BarcodesEntity[];

  @Exclude()
  @OneToMany(() => TransitionEntity, (transitions) => transitions.user)
  transitions: TransitionEntity[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

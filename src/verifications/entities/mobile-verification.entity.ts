import { UserEntity } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// export enum VerifiactionType {
//   RESET = 'RESET',
//   VERIFY = 'VERIFY',
// }

@Entity({ name: 'mobile_verifications' })
export class MobileVerificationEntity {
  @PrimaryGeneratedColumn()
  readonly verification_id: number;

  @OneToOne(() => UserEntity, (user) => user.verifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  readonly user: UserEntity;

  @Column()
  readonly verification_code: string;

  @Column({ default: false })
  readonly is_complete: boolean;

  @CreateDateColumn()
  readonly created_at: Date;
}

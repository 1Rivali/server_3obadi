import { UserEntity } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'password_verifications' })
export class PasswordVerificationEntity {
  @PrimaryGeneratedColumn()
  readonly verification_id: number;

  @ManyToOne(() => UserEntity, (user) => user.verifications, {
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

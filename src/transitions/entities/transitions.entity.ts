import { UserEntity } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AmountTypesEntity } from './amount-types.entity';

@Entity({ name: 'transitions' })
export class TransitionEntity {
  @PrimaryGeneratedColumn()
  readonly transition_id: number;

  @Column({ default: false })
  readonly is_success: boolean;

  @Column({ default: false })
  readonly is_accepted: boolean;

  @ManyToOne(() => UserEntity, (user) => user.transitions)
  readonly user: UserEntity;

  @ManyToOne(() => AmountTypesEntity, (amountTypes) => amountTypes.transitions)
  readonly amount: AmountTypesEntity;

  @CreateDateColumn()
  sent_at: Date;
}

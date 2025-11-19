import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransitionEntity } from './transitions.entity';

@Entity('amount_types')
export class AmountTypesEntity {
  @PrimaryGeneratedColumn()
  amount_type_id: number;

  @Column({ unique: true })
  amount: number;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => TransitionEntity, (transitions) => transitions.amount)
  transitions: TransitionEntity[];

  @CreateDateColumn()
  created_at: Date;
}

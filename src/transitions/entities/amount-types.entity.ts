import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TransitionEntity } from "./transitions.entity";
import { SimProviderEnum } from "src/users/users.entity";

@Entity("amount_types")
export class AmountTypesEntity {
  @PrimaryGeneratedColumn()
  amount_type_id: number;

  @Column()
  amount: number;

  @Column()
  provider_id: number;

  @Column({ 
    type: "enum", 
    enum: ["sy", "mtn"],
    nullable: false 
  })
  provider: SimProviderEnum;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => TransitionEntity, (transitions) => transitions.amount)
  transitions: TransitionEntity[];

  @CreateDateColumn()
  created_at: Date;
}

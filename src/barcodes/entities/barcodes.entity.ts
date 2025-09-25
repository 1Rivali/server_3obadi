import { UserEntity } from "src/users/users.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AwardEntity } from "./award.entity";
import { Exclude } from "class-transformer";
import { AgentsEntity } from "src/agents/entities/agents.entity";

@Entity({ name: "barcodes" })
export class BarcodesEntity {
  @Exclude()
  @PrimaryGeneratedColumn("uuid")
  readonly barcode_id: string;

  @ManyToOne(() => UserEntity, (user) => user.barcodes, { nullable: true })
  @JoinColumn({ name: "user_id" })
  readonly user: UserEntity;

  @ManyToOne(() => AwardEntity, (award) => award.barcodes, { nullable: true })
  @JoinColumn({ name: "award_id" })
  readonly award: AwardEntity;

  @Exclude()
  @Column({ default: false })
  readonly is_used: boolean;

  @Column({ default: false })
  readonly is_redeemed: boolean;

  @Column({ default: null })
  readonly reciver_phone_number: string;

  @Column({ default: false })
  readonly immideate_redeem: boolean;

  @ManyToOne(() => AgentsEntity, (agent) => agent.barcodes)
  @JoinColumn({ name: "agent_id" })
  readonly agent: AgentsEntity;

  @Exclude()
  @UpdateDateColumn()
  readonly used_at: Date;

  @Exclude()
  @CreateDateColumn()
  readonly created_at: Date;

  constructor(partial: Partial<BarcodesEntity>) {
    Object.assign(this, partial);
  }
}

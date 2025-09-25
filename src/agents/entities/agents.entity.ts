import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from "class-transformer";
import { BarcodesEntity } from "src/barcodes/entities/barcodes.entity";

@Entity({ name: "agents" })
export class AgentsEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  agent_id: number;

  @Column({ unique: true })
  agent_name: string;

  @Column({ default: null, nullable: true })
  agent_logo: string;

  @Column({ default: null, nullable: true })
  agent_primary_color: string;

  @OneToMany(() => BarcodesEntity, (barcode) => barcode.agent)
  barcodes: BarcodesEntity[];

  constructor(partial: Partial<AgentsEntity>) {
    Object.assign(this, partial);
  }
}

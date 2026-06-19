import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AgentsEntity } from "src/agents/entities/agents.entity";
import { AwardEntity } from "src/barcodes/entities/award.entity";
import { BarcodesEntity } from "src/barcodes/entities/barcodes.entity";
import { TransitionEntity } from "src/transitions/entities/transitions.entity";
import { UserEntity } from "src/users/users.entity";
import { Repository } from "typeorm";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { CreateAwardDto } from "./dto/create-award.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateAwardDto } from "./dto/update-award.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(BarcodesEntity)
    private readonly barcodesRepo: Repository<BarcodesEntity>,
    @InjectRepository(AwardEntity)
    private readonly awardsRepo: Repository<AwardEntity>,
    @InjectRepository(AgentsEntity)
    private readonly agentsRepo: Repository<AgentsEntity>,
    @InjectRepository(TransitionEntity)
    private readonly transitionsRepo: Repository<TransitionEntity>
  ) {}

  async getStats() {
    const [
      totalUsers,
      totalBarcodes,
      usedBarcodes,
      winnerBarcodes,
      totalTransitions,
      successfulTransitions,
      totalAgents,
      totalAwards,
    ] = await Promise.all([
      this.usersRepo.count({ where: { deleted_at: null } }),
      this.barcodesRepo.count(),
      this.barcodesRepo.count({ where: { is_used: true } }),
      this.barcodesRepo.count({ where: { winner: true } }),
      this.transitionsRepo.count(),
      this.transitionsRepo.count({
        where: { is_success: true, is_accepted: true },
      }),
      this.agentsRepo.count(),
      this.awardsRepo.count(),
    ]);

    const recentScans = await this.barcodesRepo.find({
      where: { is_used: true },
      relations: { user: true, award: true, agent: true },
      order: { used_at: "DESC" },
      take: 10,
    });

    return {
      totalUsers,
      totalBarcodes,
      usedBarcodes,
      unusedBarcodes: totalBarcodes - usedBarcodes,
      winnerBarcodes,
      totalTransitions,
      successfulTransitions,
      totalAgents,
      totalAwards,
      recentScans: recentScans.map((b) => ({
        barcode_id: b.barcode_id,
        user_name: b.user?.name ?? null,
        user_mobile: b.user?.mobile ?? null,
        award_type: b.award?.award_type ?? null,
        award_value: b.award?.award_value ?? null,
        agent_name: b.agent?.agent_name ?? null,
        used_at: b.used_at,
      })),
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const qb = this.usersRepo
      .createQueryBuilder("user")
      .where("user.deleted_at IS NULL")
      .orderBy("user.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (search?.trim()) {
      qb.andWhere(
        "(user.name LIKE :search OR user.mobile LIKE :search)",
        { search: `%${search.trim()}%` }
      );
    }

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map((u) => ({
        user_id: u.user_id,
        name: u.name,
        mobile: u.mobile,
        points: u.points,
        role: u.role,
        sim_provider: u.sim_provider,
        is_verified: u.is_verified,
        created_at: u.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBarcodes(
    page = 1,
    limit = 20,
    search?: string,
    status?: "used" | "unused" | "winner"
  ) {
    const qb = this.barcodesRepo
      .createQueryBuilder("barcode")
      .leftJoinAndSelect("barcode.user", "user")
      .leftJoinAndSelect("barcode.award", "award")
      .leftJoinAndSelect("barcode.agent", "agent")
      .orderBy("barcode.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (search?.trim()) {
      qb.andWhere("barcode.barcode_id LIKE :search", {
        search: `%${search.trim()}%`,
      });
    }

    if (status === "used") qb.andWhere("barcode.is_used = true");
    if (status === "unused") qb.andWhere("barcode.is_used = false");
    if (status === "winner") qb.andWhere("barcode.winner = true");

    const [barcodes, total] = await qb.getManyAndCount();

    return {
      data: barcodes.map((b) => ({
        barcode_id: b.barcode_id,
        is_used: b.is_used,
        winner: b.winner,
        is_redeemed: b.is_redeemed,
        isMetalized: b.isMetalized,
        user_name: b.user?.name ?? null,
        user_mobile: b.user?.mobile ?? null,
        award_type: b.award?.award_type ?? null,
        award_value: b.award?.award_value ?? null,
        agent_name: b.agent?.agent_name ?? null,
        used_at: b.used_at,
        created_at: b.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAwards() {
    const awards = await this.awardsRepo.find({
      order: { award_id: "ASC" },
    });
    return { data: awards };
  }

  async createAward(dto: CreateAwardDto) {
    const award = this.awardsRepo.create({
      award_type: dto.award_type,
      award_value: dto.award_value,
      percentage: dto.percentage,
      award_description: dto.award_description,
    });
    const saved = await this.awardsRepo.save(award);
    return { data: saved };
  }

  async updateAward(id: number, dto: UpdateAwardDto) {
    const award = await this.awardsRepo.findOne({ where: { award_id: id } });
    if (!award) throw new NotFoundException("Award not found");

    await this.awardsRepo.update({ award_id: id }, dto);
    const updated = await this.awardsRepo.findOne({ where: { award_id: id } });
    return { data: updated };
  }

  async getAgents() {
    const agents = await this.agentsRepo.find({
      order: { agent_id: "ASC" },
    });
    return { data: agents };
  }

  async createAgent(dto: CreateAgentDto) {
    const agent = this.agentsRepo.create(dto);
    const saved = await this.agentsRepo.save(agent);
    return { data: saved };
  }

  async updateAgent(id: number, dto: UpdateAgentDto) {
    const agent = await this.agentsRepo.findOne({ where: { agent_id: id } });
    if (!agent) throw new NotFoundException("Agent not found");

    await this.agentsRepo.update({ agent_id: id }, dto);
    const updated = await this.agentsRepo.findOne({ where: { agent_id: id } });
    return { data: updated };
  }

  async getTransitions(page = 1, limit = 20) {
    const [transitions, total] = await this.transitionsRepo.findAndCount({
      relations: { user: true, amount: true },
      order: { sent_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transitions.map((t) => ({
        transition_id: t.transition_id,
        is_success: t.is_success,
        is_accepted: t.is_accepted,
        user_name: t.user?.name ?? null,
        user_mobile: t.user?.mobile ?? null,
        amount: t.amount?.amount ?? null,
        provider: t.amount?.provider ?? null,
        sent_at: t.sent_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

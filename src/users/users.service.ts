import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SimProviderEnum, UserEntity } from "./users.entity";
import { Repository } from "typeorm";
import { AuthDto } from "src/auth/dtos";
import { hash } from "src/utils";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>
  ) {}

  async findOne(mobile: string): Promise<UserEntity | undefined> {
    const user = this.usersRepo.findOne({ where: { mobile } });
    if (!user) throw new NotFoundException();
    return user;
  }

  async findUserById(userId: number): Promise<UserEntity | undefined> {
    const user = this.usersRepo.findOne({ where: { user_id: userId } });
    if (!user) throw new NotFoundException();
    return user;
  }
  async createUser(
    authDto: AuthDto,
    simProvider: SimProviderEnum,
    isPrePaid: boolean
  ): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({
      where: { mobile: authDto.mobile },
    });
    if (user) {
      throw new ConflictException("User already exist");
    }

    const hashedPassword = await hash(authDto.password);

    const createdUser = this.usersRepo.create({
      name: authDto.name,
      mobile: authDto.mobile,
      password: hashedPassword,
      sim_provider: simProvider,
      is_pre_paid: isPrePaid,
      is_verified: true,
    });

    return this.usersRepo.save(createdUser);
  }

  async updateUserPassword(userId: number, password: string) {
    const hashedPassword = await hash(password);
    await this.usersRepo.update(
      { user_id: userId },
      { password: hashedPassword }
    );
  }

  async setUserPostPaid(userId: number) {
    await this.usersRepo.update({ user_id: userId }, { is_pre_paid: false });
  }

  async verifyUser(userId: number) {
    await this.usersRepo.update({ user_id: userId }, { is_verified: true });
  }

  async updateUserPoints(userId: number, points: number) {
    const updateUser = await this.usersRepo.update(
      { user_id: userId },
      { points }
    );
    return updateUser;
  }
  async getUserPoints(userId: number) {
    const user = await this.usersRepo.findOne({
      select: { points: true },
      where: { user_id: userId },
    });
    return user;
  }
  async getAllMtn() {
    return await this.usersRepo.find({
      where: { sim_provider: SimProviderEnum.MTN },
    });
  }

  async deleteAccount(userId: number, password: string) {
    // Find the user by ID
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify the password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Delete the user account
    await this.usersRepo.delete({ user_id: userId });

    return {
      message: "Account deleted successfully",
      deletedAt: new Date(),
    };
  }
}

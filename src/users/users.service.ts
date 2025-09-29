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
    const user = await this.usersRepo.findOne({
      where: {
        mobile,
        deleted_at: null, // Exclude soft deleted users
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async findUserById(userId: number): Promise<UserEntity | undefined> {
    const user = await this.usersRepo.findOne({
      where: {
        user_id: userId,
        deleted_at: null, // Exclude soft deleted users
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }
  async createUser(
    authDto: AuthDto,
    simProvider: SimProviderEnum,
    isPrePaid: boolean
  ): Promise<UserEntity> {
    // Check if user exists (including soft deleted users)
    const existingUser = await this.usersRepo.findOne({
      where: { mobile: authDto.mobile },
    });

    if (existingUser) {
      // If user exists and is NOT soft deleted, throw conflict
      if (existingUser.deleted_at === null) {
        throw new ConflictException("User already exist");
      }

      // If user is soft deleted, restore the account instead of creating new one
      console.log("Restoring soft deleted user:", authDto.mobile);
      await this.usersRepo.update(
        { user_id: existingUser.user_id },
        {
          name: authDto.name,
          password: await hash(authDto.password),
          sim_provider: simProvider,
          is_pre_paid: isPrePaid,
          is_verified: true,
          deleted_at: null, // Restore the account
        }
      );

      // Return the restored user
      return await this.usersRepo.findOne({
        where: { user_id: existingUser.user_id },
      });
    }

    // No existing user found, create new user
    console.log("Creating new user:", authDto.mobile);
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
      where: {
        user_id: userId,
        deleted_at: null, // Exclude soft deleted users
      },
    });
    return user;
  }
  async getAllMtn() {
    return await this.usersRepo.find({
      where: {
        sim_provider: SimProviderEnum.MTN,
        deleted_at: null, // Exclude soft deleted users
      },
    });
  }

  async findUserIncludingDeleted(
    mobile: string
  ): Promise<UserEntity | undefined> {
    return await this.usersRepo.findOne({
      where: { mobile },
    });
  }

  async restoreUser(mobile: string): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({
      where: { mobile },
    });

    if (!user || user.deleted_at === null) {
      throw new NotFoundException(
        "No soft deleted user found with this mobile"
      );
    }

    await this.usersRepo.update(
      { user_id: user.user_id },
      { deleted_at: null }
    );

    return await this.usersRepo.findOne({
      where: { user_id: user.user_id },
    });
  }

  async deleteAccount(userId: number, password: string) {
    // Find the user by ID (exclude already soft deleted users)
    const user = await this.usersRepo.findOne({
      where: {
        user_id: userId,
        deleted_at: null, // Only find non-deleted users
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify the password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Soft delete the user account
    console.log("Soft deleting user account:", userId);
    await this.usersRepo.update(
      { user_id: userId },
      { deleted_at: new Date() }
    );
    console.log("User account soft deleted successfully");

    return {
      message: "Account deleted successfully",
      deletedAt: new Date(),
    };
  }
}

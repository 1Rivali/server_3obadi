import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SimProviderEnum, UserEntity } from './users.entity';
import { Repository } from 'typeorm';
import { AuthDto } from 'src/auth/dtos';
import { hash } from 'src/utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async findOne(mobile: string): Promise<UserEntity | undefined> {
    let user = this.usersRepo.findOne({ where: { mobile } });
    if (!user) throw new NotFoundException();
    return user;
  }

  async findUserById(userId: string): Promise<UserEntity | undefined> {
    let user = this.usersRepo.findOne({ where: { user_id: userId } });
    if (!user) throw new NotFoundException();
    return user;
  }
  async createUser(
    authDto: AuthDto,
    simProvider: SimProviderEnum,
    isPostPaid: boolean,
  ): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({
      where: { mobile: authDto.mobile },
    });
    if (user) {
      throw new ConflictException('User already exist');
    }

    const hashedPassword = await hash(authDto.password);

    const createdUser = this.usersRepo.create({
      name: authDto.name,
      mobile: authDto.mobile,
      password: hashedPassword,
      sim_provider: simProvider,
      is_post_paid: isPostPaid,
    });

    return this.usersRepo.save(createdUser);
  }

  async updateUserPassword(userId: string, password: string) {
    const hashedPassword = await hash(password);
    const updatedUser = await this.usersRepo.update(
      { user_id: userId },
      { password: hashedPassword },
    );
  }

  async verifyUser(userId: string) {
    const user = await this.usersRepo.update(
      { user_id: userId },
      { is_verified: true },
    );
  }

  async updateUserPoints(userId: string, points: number) {
    const updateUser = await this.usersRepo.update(
      { user_id: userId },
      { points },
    );
    return updateUser;
  }
  async getUserPoints(userId: string) {
    const user = await this.usersRepo.findOne({
      select: { points: true },
      where: { user_id: userId },
    });
    return user;
  }
}

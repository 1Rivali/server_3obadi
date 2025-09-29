import {
  Controller,
  Delete,
  Body,
  ValidationPipe,
  HttpCode,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { DeleteAccountDto } from "./dto";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { GetCurrentUser } from "src/utils/get-current-user.decorator";
import { HttpExceptionFilter } from "src/http-exception.filter";

@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(HttpExceptionFilter)
@Controller("api/v1/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async deleteAccount(
    @GetCurrentUser() user: any,
    @Body(new ValidationPipe()) deleteAccountDto: DeleteAccountDto
  ) {
    return this.usersService.deleteAccount(
      user.userId,
      deleteAccountDto.password
    );
  }
}

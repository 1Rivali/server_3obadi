import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { join } from "path";

@Controller("admin")
export class AdminDashboardController {
  private readonly adminIndex = join(process.cwd(), "admin", "index.html");

  @Get(["", "*"])
  serveDashboard(@Res() res: Response) {
    return res.sendFile(this.adminIndex);
  }
}

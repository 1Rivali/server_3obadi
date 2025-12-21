import { NestFactory } from "@nestjs/core";
import { join } from "path";
import * as serveStatic from "serve-static";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  app.use(serveStatic(join(__dirname, "..", "web")));
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();

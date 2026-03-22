import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000'
  app.enableCors({ origin: corsOrigin.split(',') })
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  logger.log(`Running on http://localhost:${port}/api/v1`)
}

bootstrap()

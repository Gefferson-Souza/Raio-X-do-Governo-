import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000'
  app.enableCors({ origin: corsOrigin.split(',') })
  app.setGlobalPrefix('api/v1')

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`[api] Running on http://localhost:${port}/api/v1`)
}

bootstrap()

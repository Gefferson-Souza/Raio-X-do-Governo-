import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { HealthModule } from './health/health.module'
import { SpendingModule } from './spending/spending.module'
import { PoliticiansModule } from './politicians/politicians.module'
import { ContractsModule } from './contracts/contracts.module'
import { SyncModule } from './sync/sync.module'
import { AuditModule } from './audit/audit.module'
import { AdminModule } from './admin/admin.module'
import { PrismaModule } from './prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    HealthModule,
    SpendingModule,
    PoliticiansModule,
    ContractsModule,
    SyncModule,
    AdminModule,
  ],
})
export class AppModule {}

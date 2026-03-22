import { Module } from '@nestjs/common'
import { SpendingSyncService } from './spending-sync.service'
import { PoliticiansSyncService } from './politicians-sync.service'
import { ContractsSyncService } from './contracts-sync.service'
import { SyncSchedulerService } from './sync-scheduler.service'
import { SpendingModule } from '../spending/spending.module'
import { PoliticiansModule } from '../politicians/politicians.module'
import { ContractsModule } from '../contracts/contracts.module'

@Module({
  imports: [SpendingModule, PoliticiansModule, ContractsModule],
  providers: [
    SpendingSyncService,
    PoliticiansSyncService,
    ContractsSyncService,
    SyncSchedulerService,
  ],
  exports: [SpendingSyncService, PoliticiansSyncService, ContractsSyncService],
})
export class SyncModule {}

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SpendingSyncService } from './spending-sync.service'
import { PoliticiansSyncService } from './politicians-sync.service'
import { ContractsSyncService } from './contracts-sync.service'

@Injectable()
export class SyncSchedulerService {
  private readonly logger = new Logger(SyncSchedulerService.name)

  constructor(
    private readonly spendingSync: SpendingSyncService,
    private readonly politiciansSync: PoliticiansSyncService,
    private readonly contractsSync: ContractsSyncService,
  ) {}

  @Cron('0 6 * * *', { name: 'sync-spending' })
  async handleSpendingSync() {
    this.logger.log('Starting spending sync...')
    await this.spendingSync.syncAll()
  }

  @Cron('0 5 * * *', { name: 'sync-politicians' })
  async handlePoliticiansSync() {
    this.logger.log('Starting politicians sync...')
    await this.politiciansSync.syncAll()
  }

  @Cron('0 6 * * *', { name: 'sync-contracts' })
  async handleContractsSync() {
    this.logger.log('Starting contracts sync...')
    await this.contractsSync.syncAll()
  }
}

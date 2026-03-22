import { Controller, Post, Param } from '@nestjs/common'
import { SpendingSyncService } from '../sync/spending-sync.service'
import { PoliticiansSyncService } from '../sync/politicians-sync.service'
import { ContractsSyncService } from '../sync/contracts-sync.service'

@Controller('admin')
export class AdminController {
  constructor(
    private readonly spendingSync: SpendingSyncService,
    private readonly politiciansSync: PoliticiansSyncService,
    private readonly contractsSync: ContractsSyncService,
  ) {}

  @Post('trigger-sync/:type')
  async triggerSync(@Param('type') type: string) {
    switch (type) {
      case 'spending':
        await this.spendingSync.syncAll()
        return { triggered: 'spending', status: 'completed' }
      case 'politicians':
        await this.politiciansSync.syncAll()
        return { triggered: 'politicians', status: 'completed' }
      case 'contracts':
        await this.contractsSync.syncAll()
        return { triggered: 'contracts', status: 'completed' }
      case 'all':
        await Promise.allSettled([
          this.spendingSync.syncAll(),
          this.contractsSync.syncAll(),
        ])
        return { triggered: 'all', status: 'completed' }
      default:
        return { error: `Unknown sync type: ${type}. Use: spending, politicians, contracts, all` }
    }
  }
}

import { Controller, Get } from '@nestjs/common'
import { ContractsService } from './contracts.service'

@Controller('spending/contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get()
  async getRecent() {
    return this.contracts.getLatestSnapshot()
  }
}

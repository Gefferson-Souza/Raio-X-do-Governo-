import { Controller, Get } from '@nestjs/common'
import { PoliticiansService } from './politicians.service'

@Controller('politicians')
export class PoliticiansController {
  constructor(private readonly politicians: PoliticiansService) {}

  @Get()
  async getAll() {
    return this.politicians.getLatestSnapshot()
  }
}

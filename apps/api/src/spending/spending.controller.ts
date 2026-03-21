import { Controller, Get, Query } from '@nestjs/common'
import { SpendingService } from './spending.service'

@Controller('spending')
export class SpendingController {
  constructor(private readonly spending: SpendingService) {}

  @Get('summary')
  async getSummary(@Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()
    return this.spending.getLatestSnapshot(year)
  }
}

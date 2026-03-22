import { Controller, Get, Query, BadRequestException } from '@nestjs/common'
import { SpendingService } from './spending.service'

@Controller('spending')
export class SpendingController {
  constructor(private readonly spending: SpendingService) {}

  @Get('summary')
  async getSummary(@Query('year') yearStr?: string) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()
    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('Invalid year parameter')
    }
    return this.spending.getLatestSnapshot(year)
  }
}

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { PoliticiansService } from './politicians.service'
import {
  PoliticianYearDto,
  SearchPoliticiansDto,
} from './search-politicians.dto'

@Controller('politicians')
export class PoliticiansController {
  constructor(private readonly politicians: PoliticiansService) {}

  @Get()
  async getAll() {
    return this.politicians.getLatestSnapshot()
  }

  @Get('search')
  async search(@Query() dto: SearchPoliticiansDto) {
    const currentYear = new Date().getFullYear()
    const parties = dto.party
      ? dto.party
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : []
    const states = dto.state
      ? dto.state
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : []

    return this.politicians.search({
      q: dto.q,
      house: dto.house ?? 'all',
      parties,
      states,
      year: dto.year ?? currentYear,
      sort: dto.sort ?? 'spending_desc',
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
    })
  }

  @Get('filters')
  async getFilters() {
    return this.politicians.getFilters()
  }

  @Get('deputies/:id')
  async getDeputyDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: PoliticianYearDto,
  ) {
    const year = dto.year ?? new Date().getFullYear()
    const result = await this.politicians.getDeputyDetails(id, year)

    if (!result) {
      throw new NotFoundException(`Deputado ${id} nao encontrado`)
    }

    return result
  }

  @Get('senators/:id')
  async getSenatorDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: PoliticianYearDto,
  ) {
    const year = dto.year ?? new Date().getFullYear()
    const result = await this.politicians.getSenatorDetails(id, year)

    if (!result) {
      throw new NotFoundException(`Senador ${id} nao encontrado`)
    }

    return result
  }
}

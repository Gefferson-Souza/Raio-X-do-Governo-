import { Module } from '@nestjs/common'
import { SpendingController } from './spending.controller'
import { SpendingService } from './spending.service'

@Module({
  controllers: [SpendingController],
  providers: [SpendingService],
  exports: [SpendingService],
})
export class SpendingModule {}

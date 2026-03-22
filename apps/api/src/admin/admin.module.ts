import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { SyncModule } from '../sync/sync.module'

@Module({
  imports: [SyncModule],
  controllers: [AdminController],
})
export class AdminModule {}

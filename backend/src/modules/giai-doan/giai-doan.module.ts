import { Module } from '@nestjs/common';
import { GiaiDoanService } from './giai-doan.service';
import { GiaiDoanController } from './giai-doan.controller';

@Module({
  controllers: [GiaiDoanController],
  providers: [GiaiDoanService],
  exports: [GiaiDoanService],
})
export class GiaiDoanModule {}

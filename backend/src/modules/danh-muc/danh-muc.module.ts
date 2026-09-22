import { Module } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';
import { DanhMucController } from './danh-muc.controller';

@Module({
  controllers: [DanhMucController],
  providers: [DanhMucService],
  exports: [DanhMucService],
})
export class DanhMucModule {}

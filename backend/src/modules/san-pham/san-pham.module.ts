import { Module } from '@nestjs/common';
import { SanPhamService } from './san-pham.service';
import { SanPhamController } from './san-pham.controller';

@Module({
  controllers: [SanPhamController],
  providers: [SanPhamService],
  exports: [SanPhamService],
})
export class SanPhamModule {}

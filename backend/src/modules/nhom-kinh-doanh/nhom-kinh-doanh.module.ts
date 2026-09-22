import { Module } from '@nestjs/common';
import { NhomKinhDoanhService } from './nhom-kinh-doanh.service';
import { NhomKinhDoanhController } from './nhom-kinh-doanh.controller';

@Module({
  controllers: [NhomKinhDoanhController],
  providers: [NhomKinhDoanhService],
  exports: [NhomKinhDoanhService],
})
export class NhomKinhDoanhModule {}

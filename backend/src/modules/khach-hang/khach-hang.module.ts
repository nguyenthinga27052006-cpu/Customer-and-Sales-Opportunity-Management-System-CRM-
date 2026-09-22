import { Module } from '@nestjs/common';
import { KhachHangService } from './khach-hang.service';
import { KhachHangController } from './khach-hang.controller';
import { DataScopeService } from '../../common/services/data-scope.service';

@Module({
  controllers: [KhachHangController],
  providers: [KhachHangService, DataScopeService],
  exports: [KhachHangService],
})
export class KhachHangModule {}

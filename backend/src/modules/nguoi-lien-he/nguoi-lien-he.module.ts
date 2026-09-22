import { Module } from '@nestjs/common';
import { NguoiLienHeService } from './nguoi-lien-he.service';
import { NguoiLienHeController } from './nguoi-lien-he.controller';
import { DataScopeService } from '../../common/services/data-scope.service';

@Module({
  controllers: [NguoiLienHeController],
  providers: [NguoiLienHeService, DataScopeService],
  exports: [NguoiLienHeService],
})
export class NguoiLienHeModule {}

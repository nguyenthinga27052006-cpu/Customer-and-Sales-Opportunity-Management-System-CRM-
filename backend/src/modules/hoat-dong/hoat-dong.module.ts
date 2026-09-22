import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DataScopeService } from '../../common/services/data-scope.service';
import { HoatDongController } from './controllers/hoat-dong.controller';
import { CongViecController } from './controllers/cong-viec.controller';
import { LichLamViecController } from './controllers/lich-lam-viec.controller';
import { HoatDongService } from './services/hoat-dong.service';
import { CongViecService } from './services/cong-viec.service';
import { LichLamViecService } from './services/lich-lam-viec.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    HoatDongController,
    CongViecController,
    LichLamViecController,
  ],
  providers: [
    DataScopeService,
    HoatDongService,
    CongViecService,
    LichLamViecService,
  ],
  exports: [
    HoatDongService,
    CongViecService,
    LichLamViecService,
  ],
})
export class HoatDongModule {}

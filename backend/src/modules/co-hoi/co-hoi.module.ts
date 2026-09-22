import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DataScopeService } from '../../common/services/data-scope.service';
import { CoHoiController } from './controllers/co-hoi.controller';
import { CoHoiKanbanController } from './controllers/co-hoi-kanban.controller';
import { CoHoiForecastController } from './controllers/co-hoi-forecast.controller';
import { CoHoiService } from './services/co-hoi.service';
import { CoHoiStageService } from './services/co-hoi-stage.service';
import { CoHoiProductService } from './services/co-hoi-product.service';
import { CoHoiForecastService } from './services/co-hoi-forecast.service';
import { CoHoiStalledService } from './services/co-hoi-stalled.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CoHoiController,
    CoHoiKanbanController,
    CoHoiForecastController,
  ],
  providers: [
    DataScopeService,
    CoHoiService,
    CoHoiStageService,
    CoHoiProductService,
    CoHoiForecastService,
    CoHoiStalledService,
  ],
  exports: [
    CoHoiService,
    CoHoiStageService,
    CoHoiProductService,
    CoHoiForecastService,
    CoHoiStalledService,
  ],
})
export class CoHoiModule {}

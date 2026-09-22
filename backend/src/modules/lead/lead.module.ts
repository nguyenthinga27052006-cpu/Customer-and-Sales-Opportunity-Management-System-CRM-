import { Module } from '@nestjs/common';
import { LeadController } from './controllers/lead.controller';
import { LeadConfigController } from './controllers/lead-config.controller';
import { LeadPublicFormController } from './controllers/lead-public-form.controller';
import { LeadService } from './services/lead.service';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadAssignmentService } from './services/lead-assignment.service';
import { LeadSlaService } from './services/lead-sla.service';
import { LeadConversionService } from './services/lead-conversion.service';
import { LeadExcelService } from './services/lead-excel.service';
import { DataScopeService } from '../../common/services/data-scope.service';

@Module({
  controllers: [LeadController, LeadConfigController, LeadPublicFormController],
  providers: [
    LeadService,
    LeadScoringService,
    LeadAssignmentService,
    LeadSlaService,
    LeadConversionService,
    LeadExcelService,
    DataScopeService,
  ],
  exports: [
    LeadService,
    LeadScoringService,
    LeadAssignmentService,
    LeadConversionService,
    LeadSlaService,
  ],
})
export class LeadModule {}

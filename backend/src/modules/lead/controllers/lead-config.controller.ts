import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadScoringService } from '../services/lead-scoring.service';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import {
  TaoQuyTacChamDiemDto,
  CapNhatCauHinhChamDiemDto,
  TaoQuyTacPhanBoDto,
} from '../dto/lead.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Cấu hình Chấm điểm & Phân bổ Lead (Scoring & Assignment Config)')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeadConfigController {
  constructor(
    private readonly scoringService: LeadScoringService,
    private readonly assignmentService: LeadAssignmentService,
  ) {}

  // --- LEAD SCORING ---

  @Get('lead-scoring/config')
  @ApiOperation({ summary: 'S4-05: Lấy cấu hình ngưỡng nhiệt độ Nóng / Ấm và thời gian SLA' })
  async layCauHinhChamDiem() {
    return this.scoringService.layCauHinh();
  }

  @Put('lead-scoring/config')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-05: Cập nhật ngưỡng nhiệt độ Nóng / Ấm và thời gian SLA (Director / Admin)' })
  async capNhatCauHinhChamDiem(
    @Body() dto: CapNhatCauHinhChamDiemDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.scoringService.capNhatCauHinh(dto, currentUser);
  }

  @Get('lead-scoring/rules')
  @ApiOperation({ summary: 'S4-05: Lấy danh sách quy tắc chấm điểm Lead' })
  async layQuyTacChamDiem() {
    return this.scoringService.layDanhSachQuyTac();
  }

  @Post('lead-scoring/rules')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-05: Tạo mới quy tắc chấm điểm (Director / Admin)' })
  async taoQuyTacChamDiem(
    @Body() dto: TaoQuyTacChamDiemDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.scoringService.taoQuyTac(dto, currentUser);
  }

  @Put('lead-scoring/rules/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-05: Cập nhật quy tắc chấm điểm' })
  async capNhatQuyTacChamDiem(
    @Param('id') id: string,
    @Body() dto: Partial<TaoQuyTacChamDiemDto>,
    @CurrentUser() currentUser: any,
  ) {
    return this.scoringService.capNhatQuyTac(id, dto, currentUser);
  }

  @Delete('lead-scoring/rules/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-05: Xóa quy tắc chấm điểm' })
  async xoaQuyTacChamDiem(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.scoringService.xoaQuyTac(id, currentUser);
  }

  // --- LEAD ASSIGNMENT ---

  @Get('lead-assignment/rules')
  @ApiOperation({ summary: 'S4-06: Lấy danh sách quy tắc phân bổ Lead' })
  async layQuyTacPhanBo() {
    return this.assignmentService.layDanhSachQuyTac();
  }

  @Post('lead-assignment/rules')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-06: Tạo mới quy tắc phân bổ Lead (Director / Admin)' })
  async taoQuyTacPhanBo(
    @Body() dto: TaoQuyTacPhanBoDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.assignmentService.taoQuyTac(dto, currentUser);
  }

  @Put('lead-assignment/rules/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-06: Cập nhật quy tắc phân bổ Lead' })
  async capNhatQuyTacPhanBo(
    @Param('id') id: string,
    @Body() dto: Partial<TaoQuyTacPhanBoDto>,
    @CurrentUser() currentUser: any,
  ) {
    return this.assignmentService.capNhatQuyTac(id, dto, currentUser);
  }

  @Delete('lead-assignment/rules/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'S4-06: Xóa quy tắc phân bổ Lead' })
  async xoaQuyTacPhanBo(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.assignmentService.xoaQuyTac(id, currentUser);
  }
}

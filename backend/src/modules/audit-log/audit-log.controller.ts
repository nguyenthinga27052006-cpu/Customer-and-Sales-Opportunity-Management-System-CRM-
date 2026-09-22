import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../common/enums/role.enum';

@ApiTags('Nhật ký Hệ thống & Dữ liệu nhạy cảm (AuditLog)')
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Xem và lọc nhật ký thay đổi dữ liệu nhạy cảm (Admin, Director)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'nguoiThucHienId', required: false })
  @ApiQuery({ name: 'loaiDoiTuong', required: false, example: 'SAN_PHAM' })
  @ApiQuery({ name: 'tuNgay', required: false, example: '2026-09-01' })
  @ApiQuery({ name: 'denNgay', required: false, example: '2026-09-30' })
  async layDanhSach(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('nguoiThucHienId') nguoiThucHienId?: string,
    @Query('loaiDoiTuong') loaiDoiTuong?: string,
    @Query('tuNgay') tuNgay?: string,
    @Query('denNgay') denNgay?: string,
  ) {
    return this.auditLogService.layDanhSach({
      page,
      limit,
      nguoiThucHienId,
      loaiDoiTuong,
      tuNgay,
      denNgay,
    });
  }
}

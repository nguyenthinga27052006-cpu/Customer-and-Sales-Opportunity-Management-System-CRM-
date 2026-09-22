import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadService } from '../services/lead.service';
import { LeadConversionService } from '../services/lead-conversion.service';
import { LeadExcelService } from '../services/lead-excel.service';
import { LeadSlaService } from '../services/lead-sla.service';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import {
  TaoLeadDto,
  CapNhatLeadDto,
  LocLeadDto,
  TuChoiLeadDto,
  ChuyenDoiLeadDto,
} from '../dto/lead.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Quản lý Lead & Phân bổ (Lead - EP-04)')
@Controller('lead')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly conversionService: LeadConversionService,
    private readonly excelService: LeadExcelService,
    private readonly slaService: LeadSlaService,
    private readonly assignmentService: LeadAssignmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'S4-09: Tìm kiếm, lọc danh sách Lead theo Data Scope và nhiệt độ' })
  async layDanhSach(
    @Query() locDto: LocLeadDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.leadService.layDanhSach(locDto, currentUser);
  }

  @Get('duplicates/check')
  @ApiOperation({ summary: 'S4-04: Kiểm tra trùng lặp Lead & gợi ý Khách hàng hiện có' })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'soDienThoai', required: false })
  @ApiQuery({ name: 'congTy', required: false })
  async kiemTraTrungLap(
    @Query('email') email?: string,
    @Query('soDienThoai') soDienThoai?: string,
    @Query('congTy') congTy?: string,
  ) {
    return this.leadService.kiemTraTrungLap(email, soDienThoai, congTy);
  }

  @Post('excel/preview')
  @ApiOperation({ summary: 'S4-02: Upload file Excel/CSV xem trước kết quả & kiểm tra lỗi từng dòng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async xemTruocExcel(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel hoặc CSV để tải lên');
    }
    return this.excelService.xemTruocFileExcel(file.buffer);
  }

  @Post('excel/confirm')
  @ApiOperation({ summary: 'S4-02: Xác nhận import danh sách Lead hợp lệ từ preview' })
  async xacNhanImport(
    @Body('validRows') validRows: any[],
    @CurrentUser() currentUser: any,
  ) {
    return this.excelService.xacNhanImport(validRows, currentUser);
  }

  @Post('sla/scan')
  @ApiOperation({ summary: 'S4-07: Quét và cập nhật cờ quá hạn SLA cho các Lead chưa tiếp nhận' })
  async quetSla() {
    return this.slaService.quetVaCapNhatQuaHanSla();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết Lead (kèm lịch sử phân bổ, breakdown chấm điểm)' })
  async layChiTiet(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.leadService.layChiTiet(id, currentUser);
  }

  @Post()
  @ApiOperation({ summary: 'S4-02: Tạo Lead thủ công (Source = REQUIRED, chạy Scoring & Phân bổ)' })
  async taoLead(
    @Body() dto: TaoLeadDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.leadService.taoLead(dto, currentUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Lead (tự động tính lại điểm tiềm năng nếu đổi dữ liệu)' })
  async capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatLeadDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.leadService.capNhat(id, dto, currentUser);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'S4-07: Sales tiếp nhận Lead (Accept -> Trạng thái Đang chăm sóc)' })
  async tiepNhanLead(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.leadService.tiepNhanLead(id, currentUser);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'S4-07: Sales từ chối Lead (Reject -> bắt buộc lý do -> chuyển về Hàng đợi)' })
  async tuChoiLead(
    @Param('id') id: string,
    @Body() dto: TuChoiLeadDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.leadService.tuChoiLead(id, dto, currentUser);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'S4-06: Phân bổ Lead thủ công từ Hàng đợi cho nhân viên chỉ định' })
  async phanBoThuCong(
    @Param('id') id: string,
    @Body('nguoiNhanId') nguoiNhanId: string,
    @Body('lyDo') lyDo: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.assignmentService.phanBoThuCong(id, nguoiNhanId, currentUser, lyDo);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'S4-08: Chuyển đổi Lead sang Customer + Contact + Opportunity trong Transaction' })
  async chuyenDoiLead(
    @Param('id') id: string,
    @Body() dto: ChuyenDoiLeadDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversionService.chuyenDoiLead(id, dto, currentUser);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CongViecService } from '../services/cong-viec.service';
import {
  TaoCongViecDto,
  CapNhatCongViecDto,
  DoiTrangThaiCongViecDto,
} from '../dto/cong-viec.dto';

@ApiTags('Quản lý Công việc (Task - EP-06 S6-06, S6-09)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cong-viec')
export class CongViecController {
  constructor(private readonly congViecService: CongViecService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo công việc có hạn hoàn thành (S6-06)' })
  async taoMoi(@Body() dto: TaoCongViecDto, @CurrentUser() user: any) {
    return this.congViecService.taoCongViec(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách công việc có phân loại quá hạn theo giờ Server (S6-06, S6-09)' })
  async layDanhSach(
    @Query('trangThai') trangThai?: string,
    @Query('mucDoUuTien') mucDoUuTien?: string,
    @Query('nguoiDuocGiaoId') nguoiDuocGiaoId?: string,
    @Query('coHoiId') coHoiId?: string,
    @Query('khachHangId') khachHangId?: string,
    @Query('chiXemQuaHan') chiXemQuaHan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    return this.congViecService.layDanhSachCongViec(
      {
        trangThai,
        mucDoUuTien,
        nguoiDuocGiaoId,
        coHoiId,
        khachHangId,
        chiXemQuaHan: chiXemQuaHan === 'true',
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
      user,
    );
  }

  @Get('thong-ke/qua-han')
  @ApiOperation({ summary: 'Thống kê số lượng việc quá hạn của từng thành viên cho Trưởng nhóm (S6-09)' })
  async thongKeQuaHan(@CurrentUser() user: any) {
    return this.congViecService.thongKeQuaHan(user);
  }

  @Patch(':id/trang-thai')
  @ApiOperation({ summary: 'Đổi trạng thái công việc (Hoàn thành / Hoãn / Hủy) (S6-06)' })
  async doiTrangThai(
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiCongViecDto,
    @CurrentUser() user: any,
  ) {
    return this.congViecService.doiTrangThai(id, dto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật công việc' })
  async capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatCongViecDto,
    @CurrentUser() user: any,
  ) {
    return this.congViecService.capNhat(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa công việc' })
  async xoa(@Param('id') id: string, @CurrentUser() user: any) {
    return this.congViecService.xoa(id, user);
  }
}

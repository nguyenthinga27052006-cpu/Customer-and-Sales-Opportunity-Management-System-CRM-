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
import { NguoiLienHeService } from './nguoi-lien-he.service';
import {
  TaoNguoiLienHeDto,
  CapNhatNguoiLienHeDto,
  ChuyenKhachHangDto,
} from './dto/nguoi-lien-he.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quản lý Người liên hệ (Contact - EP-03)')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NguoiLienHeController {
  constructor(private readonly nguoiLienHeService: NguoiLienHeService) {}

  @Get('khach-hang/:khachHangId/nguoi-lien-he')
  @ApiOperation({ summary: 'S3-02: Lấy danh sách người liên hệ của một khách hàng' })
  async layTheoKhachHang(
    @Param('khachHangId') khachHangId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.nguoiLienHeService.layDanhSachTheoKhachHang(khachHangId, currentUser);
  }

  @Post('khach-hang/:khachHangId/nguoi-lien-he')
  @ApiOperation({ summary: 'S3-02: Thêm mới người liên hệ cho khách hàng' })
  async taoNguoiLienHe(
    @Param('khachHangId') khachHangId: string,
    @Body() dto: TaoNguoiLienHeDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.nguoiLienHeService.taoNguoiLienHe(khachHangId, dto, currentUser);
  }

  @Get('nguoi-lien-he/:id')
  @ApiOperation({ summary: 'S3-02: Xem chi tiết một người liên hệ' })
  async layChiTiet(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.nguoiLienHeService.layChiTiet(id, currentUser);
  }

  @Put('nguoi-lien-he/:id')
  @ApiOperation({ summary: 'S3-02: Cập nhật thông tin người liên hệ' })
  async capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatNguoiLienHeDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.nguoiLienHeService.capNhat(id, dto, currentUser);
  }

  @Delete('nguoi-lien-he/:id')
  @ApiOperation({ summary: 'S3-02: Xóa người liên hệ' })
  async xoa(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.nguoiLienHeService.xoa(id, currentUser);
  }

  @Post('nguoi-lien-he/:id/chuyen-khach-hang')
  @ApiOperation({ summary: 'S3-02: Chuyển người liên hệ sang khách hàng khác và bảo toàn lịch sử hoạt động' })
  async chuyenKhachHang(
    @Param('id') id: string,
    @Body() dto: ChuyenKhachHangDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.nguoiLienHeService.chuyenKhachHang(id, dto, currentUser);
  }
}

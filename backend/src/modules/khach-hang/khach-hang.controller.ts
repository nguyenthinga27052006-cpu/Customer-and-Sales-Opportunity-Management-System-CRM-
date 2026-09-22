import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KhachHangService } from './khach-hang.service';
import {
  TaoKhachHangDto,
  CapNhatKhachHangDto,
  LocKhachHangDto,
  GopKhachHangDto,
} from './dto/khach-hang.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quản lý Khách hàng (Customer - EP-03)')
@Controller('khach-hang')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KhachHangController {
  constructor(private readonly khachHangService: KhachHangService) {}

  @Get()
  @ApiOperation({ summary: 'S3-07: Tìm kiếm, lọc và phân trang khách hàng theo Data Scope' })
  async layDanhSach(
    @Query() locDto: LocKhachHangDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.khachHangService.layDanhSach(locDto, currentUser);
  }

  @Get('duplicates/detect')
  @ApiOperation({ summary: 'S3-04: Phát hiện khách hàng trùng lặp theo MST, Tên hoặc Website' })
  @ApiQuery({ name: 'maSoThue', required: false })
  @ApiQuery({ name: 'tenCongTy', required: false })
  @ApiQuery({ name: 'website', required: false })
  async phatHienTrungLap(
    @Query('maSoThue') maSoThue?: string,
    @Query('tenCongTy') tenCongTy?: string,
    @Query('website') website?: string,
  ) {
    return this.khachHangService.phatHienTrungLap(maSoThue, tenCongTy, website);
  }

  @Post('merge')
  @ApiOperation({ summary: 'S3-04: Gộp 2 khách hàng trùng lặp (Chỉ dành cho Team Lead trở lên)' })
  async gopKhachHang(
    @Body() dto: GopKhachHangDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.khachHangService.gopKhachHang(dto, currentUser);
  }

  @Get(':id/360')
  @ApiOperation({ summary: 'S3-03: Xem Customer 360 tổng hợp (Contacts, Opportunities, Timeline, Doanh thu)' })
  @ApiQuery({ name: 'pageActivity', required: false, type: Number })
  @ApiQuery({ name: 'limitActivity', required: false, type: Number })
  async layCustomer360(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Query('pageActivity') pageActivity: number = 1,
    @Query('limitActivity') limitActivity: number = 50,
  ) {
    return this.khachHangService.layCustomer360(id, currentUser, Number(pageActivity), Number(limitActivity));
  }

  @Get(':id')
  @ApiOperation({ summary: 'S3-01: Lấy chi tiết hồ sơ một khách hàng' })
  async layChiTiet(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.khachHangService.layChiTiet(id, currentUser);
  }

  @Post()
  @ApiOperation({ summary: 'S3-01: Thêm mới khách hàng (Kiểm tra duy nhất MST)' })
  async taoKhachHang(
    @Body() dto: TaoKhachHangDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.khachHangService.taoKhachHang(dto, currentUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'S3-01: Cập nhật thông tin khách hàng' })
  async capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatKhachHangDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.khachHangService.capNhat(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'S3-01: Xóa khách hàng (kiểm tra không có cơ hội đang mở)' })
  async xoaKhachHang(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.khachHangService.xoaKhachHang(id, currentUser);
  }
}

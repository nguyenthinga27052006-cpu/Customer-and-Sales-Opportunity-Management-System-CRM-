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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { HoatDongService } from '../services/hoat-dong.service';
import { TaoHoatDongDto, CapNhatHoatDongDto, LocHoatDongDto } from '../dto/hoat-dong.dto';

@ApiTags('Hoạt động Tương tác (Activity - EP-06 S6-05, S6-08)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hoat-dong')
export class HoatDongController {
  constructor(private readonly hoatDongService: HoatDongService) {}

  @Post()
  @ApiOperation({ summary: 'Ghi nhận cuộc gọi, cuộc gặp, email, ghi chú (S6-05)' })
  async taoMoi(@Body() dto: TaoHoatDongDto, @CurrentUser() user: any) {
    return this.hoatDongService.taoHoatDong(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách hoạt động tương tác có phân trang & lọc (S6-05)' })
  async layDanhSach(@Query() query: LocHoatDongDto, @CurrentUser() user: any) {
    return this.hoatDongService.layDanhSach(query, user);
  }

  @Get('thong-ke')
  @ApiOperation({ summary: 'Thống kê hoạt động theo thành viên và thời gian (S8-11)' })
  async thongKeHoatDong(
    @Query('tuNgay') tuNgay?: string,
    @Query('denNgay') denNgay?: string,
    @Query('nhomId') nhomId?: string,
  ) {
    return this.hoatDongService.thongKeHoatDong(tuNgay, denNgay, nhomId);
  }

  @Get('timeline/khach-hang/:khachHangId')
  @ApiOperation({ summary: 'Dòng thời gian tương tác đầy đủ của Khách hàng 360 (< 1.5s) (S6-08)' })
  async layTimelineKhachHang(@Param('khachHangId') khachHangId: string) {
    return this.hoatDongService.layTimelineKhachHang(khachHangId);
  }

  @Get('timeline/co-hoi/:coHoiId')
  @ApiOperation({ summary: 'Dòng thời gian tương tác của một Cơ hội (S6-08)' })
  async layTimelineCoHoi(@Param('coHoiId') coHoiId: string) {
    return this.hoatDongService.layTimelineCoHoi(coHoiId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hoạt động' })
  async layChiTiet(@Param('id') id: string) {
    return this.hoatDongService.layChiTiet(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật hoạt động' })
  async capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatHoatDongDto,
    @CurrentUser() user: any,
  ) {
    return this.hoatDongService.capNhat(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hoạt động' })
  async xoa(@Param('id') id: string, @CurrentUser() user: any) {
    return this.hoatDongService.xoa(id, user);
  }
}

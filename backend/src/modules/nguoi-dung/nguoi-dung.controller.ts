import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NguoiDungService } from './nguoi-dung.service';
import { TaoNguoiDungDto } from './dto/tao-nguoi-dung.dto';
import { CapNhatNguoiDungDto } from './dto/cap-nhat-nguoi-dung.dto';
import { CapNhatHoSoDto, KhoaVaBanGiaoDto } from './dto/khoa-va-ban-giao.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrangThaiNguoiDung } from '@prisma/client';

@ApiTags('Quản trị Người dùng (NguoiDung)')
@Controller('nguoi-dung')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NguoiDungController {
  constructor(private readonly nguoiDungService: NguoiDungService) {}

  @Get()
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR, VaiTroEnum.TEAM_LEAD)
  @ApiOperation({ summary: 'Tìm kiếm và phân trang danh sách người dùng' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'tuKhoa', required: false, example: 'Nguyễn' })
  @ApiQuery({ name: 'vaiTro', required: false, example: 'SALES_REP' })
  @ApiQuery({ name: 'trangThai', required: false, enum: TrangThaiNguoiDung })
  @ApiQuery({ name: 'nhomKinhDoanhId', required: false })
  async layDanhSach(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tuKhoa') tuKhoa?: string,
    @Query('vaiTro') vaiTro?: string,
    @Query('trangThai') trangThai?: TrangThaiNguoiDung,
    @Query('nhomKinhDoanhId') nhomKinhDoanhId?: string,
  ) {
    return this.nguoiDungService.layDanhSach({
      page,
      limit,
      tuKhoa,
      vaiTro,
      trangThai,
      nhomKinhDoanhId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin một người dùng' })
  async layChiTiet(@Param('id') id: string) {
    return this.nguoiDungService.layChiTiet(id);
  }

  @Post()
  @Roles(VaiTroEnum.ADMIN)
  @ApiOperation({ summary: 'Tạo tài khoản người dùng mới (chỉ Admin)' })
  async taoNguoiDung(@Body() dto: TaoNguoiDungDto, @CurrentUser('id') adminId: string) {
    return this.nguoiDungService.taoNguoiDung(dto, adminId);
  }

  @Put('ho-so')
  @ApiOperation({ summary: 'Người dùng tự cập nhật hồ sơ cá nhân của mình' })
  async capNhatHoSo(@CurrentUser('id') userId: string, @Body() dto: CapNhatHoSoDto) {
    return this.nguoiDungService.capNhatHoSo(userId, dto);
  }

  @Put(':id')
  @Roles(VaiTroEnum.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin/vai trò/nhóm của người dùng (chỉ Admin)' })
  async capNhatNguoiDung(
    @Param('id') id: string,
    @Body() dto: CapNhatNguoiDungDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.nguoiDungService.capNhatNguoiDung(id, dto, adminId);
  }

  @Post(':id/khoa-va-ban-giao')
  @Roles(VaiTroEnum.ADMIN)
  @ApiOperation({ summary: 'Khóa tài khoản và bàn giao dữ liệu (chỉ Admin)' })
  async khoaVaBanGiao(
    @Param('id') id: string,
    @Body() dto: KhoaVaBanGiaoDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.nguoiDungService.khoaVaBanGiao(id, dto, adminId);
  }
}

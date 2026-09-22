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
import { SanPhamService } from './san-pham.service';
import { TaoSanPhamDto, CapNhatSanPhamDto } from './dto/tao-san-pham.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LoaiSanPham, TrangThaiSanPham } from '@prisma/client';

@ApiTags('Danh mục Sản phẩm & Bảng giá (SanPham)')
@Controller('san-pham')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SanPhamController {
  constructor(private readonly sanPhamService: SanPhamService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (giá vốn giaVon chỉ trả về cho Director/Admin)' })
  @ApiQuery({ name: 'tuKhoa', required: false })
  @ApiQuery({ name: 'loaiSanPham', required: false, enum: LoaiSanPham })
  @ApiQuery({ name: 'trangThai', required: false, enum: TrangThaiSanPham })
  async layDanhSach(
    @Query('tuKhoa') tuKhoa?: string,
    @Query('loaiSanPham') loaiSanPham?: LoaiSanPham,
    @Query('trangThai') trangThai?: TrangThaiSanPham,
    @CurrentUser('roles') userRoles: string[] = [],
  ) {
    return this.sanPhamService.layDanhSach(
      { tuKhoa, loaiSanPham, trangThai },
      userRoles,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một sản phẩm' })
  async layChiTiet(
    @Param('id') id: string,
    @CurrentUser('roles') userRoles: string[] = [],
  ) {
    return this.sanPhamService.layChiTiet(id, userRoles);
  }

  @Post()
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Thêm mới sản phẩm & giá niêm yết (Director / Admin)' })
  async taoSanPham(
    @Body() dto: TaoSanPhamDto,
    @CurrentUser('roles') userRoles: string[] = [],
    @CurrentUser('id') userId: string = '',
  ) {
    return this.sanPhamService.taoSanPham(dto, userRoles, userId);
  }

  @Put(':id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Cập nhật sản phẩm & giá niêm yết (Director / Admin)' })
  async capNhatSanPham(
    @Param('id') id: string,
    @Body() dto: CapNhatSanPhamDto,
    @CurrentUser('roles') userRoles: string[] = [],
    @CurrentUser('id') userId: string = '',
  ) {
    return this.sanPhamService.capNhatSanPham(id, dto, userRoles, userId);
  }

  @Delete(':id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Chuyển sản phẩm sang ngừng kinh doanh an toàn' })
  async xoaSanPham(@Param('id') id: string) {
    return this.sanPhamService.xoaSanPham(id);
  }
}

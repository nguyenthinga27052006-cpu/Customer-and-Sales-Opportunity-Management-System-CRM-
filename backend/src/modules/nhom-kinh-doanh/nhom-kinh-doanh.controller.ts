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
import { NhomKinhDoanhService } from './nhom-kinh-doanh.service';
import { TaoNhomDto, CapNhatNhomDto, TaoKhuVucDto } from './dto/tao-nhom.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../common/enums/role.enum';

@ApiTags('Cơ cấu Tổ chức & Nhóm kinh doanh (NhomKinhDoanh)')
@Controller('nhom-kinh-doanh')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NhomKinhDoanhController {
  constructor(private readonly nhomKinhDoanhService: NhomKinhDoanhService) {}

  @Get('cay-to-chuc')
  @ApiOperation({ summary: 'Lấy cây cơ cấu tổ chức nhóm kinh doanh' })
  async layCayToChuc() {
    return this.nhomKinhDoanhService.layCayToChuc();
  }

  @Get('danh-sach')
  @ApiOperation({ summary: 'Lấy danh sách nhóm kinh doanh dạng phẳng' })
  async layDanhSachNhomPhang() {
    return this.nhomKinhDoanhService.layDanhSachNhomPhang();
  }

  @Get('khu-vuc')
  @ApiOperation({ summary: 'Lấy danh sách khu vực địa lý' })
  async layDanhSachKhuVuc() {
    return this.nhomKinhDoanhService.layDanhSachKhuVuc();
  }

  @Post('khu-vuc')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Thêm mới khu vực địa lý' })
  async taoKhuVuc(@Body() dto: TaoKhuVucDto) {
    return this.nhomKinhDoanhService.taoKhuVuc(dto);
  }

  @Post()
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Thêm mới nhóm kinh doanh' })
  async taoNhom(@Body() dto: TaoNhomDto) {
    return this.nhomKinhDoanhService.taoNhom(dto);
  }

  @Put(':id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Cập nhật nhóm kinh doanh' })
  async capNhatNhom(@Param('id') id: string, @Body() dto: CapNhatNhomDto) {
    return this.nhomKinhDoanhService.capNhatNhom(id, dto);
  }

  @Delete(':id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Xóa nhóm kinh doanh (chỉ khi không có thành viên)' })
  async xoaNhom(@Param('id') id: string) {
    return this.nhomKinhDoanhService.xoaNhom(id);
  }
}

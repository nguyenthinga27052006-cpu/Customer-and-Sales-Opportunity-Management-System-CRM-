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
import { GiaiDoanService } from './giai-doan.service';
import {
  TaoGiaiDoanDto,
  CapNhatGiaiDoanDto,
  TaoLyDoDto,
  TaoDoiThuDto,
} from './dto/giai-doan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../common/enums/role.enum';
import { LoaiLyDo } from '@prisma/client';

@ApiTags('Cấu hình Pipeline, Lý do Thắng/Thua, Đối thủ (GiaiDoan)')
@Controller('giai-doan')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GiaiDoanController {
  constructor(private readonly giaiDoanService: GiaiDoanService) {}

  // Giai đoạn Pipeline
  @Get('pipeline')
  @ApiOperation({ summary: 'Lấy danh sách các giai đoạn pipeline bán hàng' })
  async layDanhSachGiaiDoan() {
    return this.giaiDoanService.layDanhSachGiaiDoan();
  }

  @Post('pipeline')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Khai báo giai đoạn pipeline mới (Director / Admin)' })
  async taoGiaiDoan(@Body() dto: TaoGiaiDoanDto) {
    return this.giaiDoanService.taoGiaiDoan(dto);
  }

  @Put('pipeline/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Cập nhật giai đoạn pipeline (Director / Admin)' })
  async capNhatGiaiDoan(@Param('id') id: string, @Body() dto: CapNhatGiaiDoanDto) {
    return this.giaiDoanService.capNhatGiaiDoan(id, dto);
  }

  // Lý do thắng thua
  @Get('ly-do')
  @ApiOperation({ summary: 'Lấy danh mục lý do thắng hoặc thua' })
  @ApiQuery({ name: 'loai', required: false, enum: LoaiLyDo })
  async layDanhSachLyDo(@Query('loai') loai?: LoaiLyDo) {
    return this.giaiDoanService.layDanhSachLyDo(loai);
  }

  @Post('ly-do')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Thêm lý do thắng hoặc thua mới' })
  async taoLyDo(@Body() dto: TaoLyDoDto) {
    return this.giaiDoanService.taoLyDo(dto);
  }

  @Delete('ly-do/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Xóa lý do thắng thua' })
  async xoaLyDo(@Param('id') id: string) {
    return this.giaiDoanService.xoaLyDo(id);
  }

  // Đối thủ
  @Get('doi-thu')
  @ApiOperation({ summary: 'Lấy danh sách đối thủ cạnh tranh' })
  async layDanhSachDoiThu() {
    return this.giaiDoanService.layDanhSachDoiThu();
  }

  @Post('doi-thu')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Thêm đối thủ cạnh tranh mới' })
  async taoDoiThu(@Body() dto: TaoDoiThuDto) {
    return this.giaiDoanService.taoDoiThu(dto);
  }

  @Delete('doi-thu/:id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Xóa đối thủ cạnh tranh' })
  async xoaDoiThu(@Param('id') id: string) {
    return this.giaiDoanService.xoaDoiThu(id);
  }
}

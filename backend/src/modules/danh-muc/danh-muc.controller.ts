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
import { DanhMucService } from './danh-muc.service';
import { TaoDanhMucDto, CapNhatDanhMucDto } from './dto/danh-muc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VaiTroEnum } from '../../common/enums/role.enum';

@ApiTags('Danh mục Dùng chung (DanhMuc)')
@Controller('danh-muc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DanhMucController {
  constructor(private readonly danhMucService: DanhMucService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh mục dùng chung (ngành nghề, quy mô, nguồn lead, hoạt động)' })
  @ApiQuery({ name: 'loaiDanhMuc', required: false, example: 'NGANH_NGHE' })
  async layDanhSach(@Query('loaiDanhMuc') loaiDanhMuc?: string) {
    return this.danhMucService.layDanhSach(loaiDanhMuc);
  }

  @Post()
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Thêm mục mới vào danh mục dùng chung' })
  async taoMuc(@Body() dto: TaoDanhMucDto) {
    return this.danhMucService.taoMuc(dto);
  }

  @Put(':id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Cập nhật mục trong danh mục' })
  async capNhatMuc(@Param('id') id: string, @Body() dto: CapNhatDanhMucDto) {
    return this.danhMucService.capNhatMuc(id, dto);
  }

  @Delete(':id')
  @Roles(VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR)
  @ApiOperation({ summary: 'Xóa mục khỏi danh mục' })
  async xoaMuc(@Param('id') id: string) {
    return this.danhMucService.xoaMuc(id);
  }
}

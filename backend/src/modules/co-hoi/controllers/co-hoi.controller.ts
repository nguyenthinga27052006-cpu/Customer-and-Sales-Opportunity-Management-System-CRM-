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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CoHoiService } from '../services/co-hoi.service';
import { CoHoiStageService } from '../services/co-hoi-stage.service';
import { CoHoiProductService } from '../services/co-hoi-product.service';
import { CoHoiStalledService } from '../services/co-hoi-stalled.service';
import {
  TaoCoHoiDto,
  CapNhatCoHoiDto,
  LocCoHoiDto,
  ChuyenGiaiDoanDto,
  DongThangDto,
  DongThuaDto,
  MoLaiCoHoiDto,
  BanGiaoCoHoiDto,
} from '../dto/co-hoi.dto';
import { ThemSanPhamCoHoiDto, CapNhatSanPhamCoHoiDto } from '../dto/co-hoi-san-pham.dto';

@ApiTags('Cơ hội Bán hàng (Opportunity)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('co-hoi')
export class CoHoiController {
  constructor(
    private readonly coHoiService: CoHoiService,
    private readonly stageService: CoHoiStageService,
    private readonly productService: CoHoiProductService,
    private readonly stalledService: CoHoiStalledService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cơ hội bán hàng mới (S5-01)' })
  async taoMoi(@Body() dto: TaoCoHoiDto, @CurrentUser() user: any) {
    return this.coHoiService.taoMoi(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách cơ hội bán hàng với bộ lọc nâng cao và phân quyền Data Scope (S5-01, S6-02)' })
  async layDanhSach(@Query() query: LocCoHoiDto, @CurrentUser() user: any) {
    return this.coHoiService.layDanhSach(query, user);
  }

  @Post('danh-gia-dinh-tre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt tác vụ quét và gắn cờ cơ hội đình trệ (S5-07)' })
  async danhGiaDinhTre() {
    return this.stalledService.danhGiaCoHoiDinhTre();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết cơ hội 360 độ (S5-01)' })
  async layChiTiet(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coHoiService.layChiTiet(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật cơ hội bán hàng' })
  async capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatCoHoiDto,
    @CurrentUser() user: any,
  ) {
    return this.coHoiService.capNhat(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cơ hội bán hàng' })
  async xoa(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coHoiService.xoa(id, user);
  }

  @Post(':id/stage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chuyển giai đoạn Pipeline (Kanban) có kiểm tra điều kiện bắt buộc (S5-02, S5-04)' })
  async chuyenGiaiDoan(
    @Param('id') id: string,
    @Body() dto: ChuyenGiaiDoanDto,
    @CurrentUser() user: any,
  ) {
    return this.stageService.chuyenGiaiDoan(id, dto, user);
  }

  @Post(':id/won')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đóng Thắng cơ hội (Won) (S5-05)' })
  async dongThang(
    @Param('id') id: string,
    @Body() dto: DongThangDto,
    @CurrentUser() user: any,
  ) {
    return this.coHoiService.dongThang(id, dto, user);
  }

  @Post(':id/lost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đóng Thua cơ hội (Lost) kèm lý do và đối thủ (S5-05)' })
  async dongThua(
    @Param('id') id: string,
    @Body() dto: DongThuaDto,
    @CurrentUser() user: any,
  ) {
    return this.coHoiService.dongThua(id, dto, user);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mở lại cơ hội đã đóng (Team Lead trở lên kèm lý do) (S5-05)' })
  async moLai(
    @Param('id') id: string,
    @Body() dto: MoLaiCoHoiDto,
    @CurrentUser() user: any,
  ) {
    return this.coHoiService.moLai(id, dto, user);
  }

  @Post(':id/handover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bàn giao / Chuyển quyền sở hữu cơ hội (S5-08)' })
  async banGiao(
    @Param('id') id: string,
    @Body() dto: BanGiaoCoHoiDto,
    @CurrentUser() user: any,
  ) {
    return this.coHoiService.banGiao(id, dto, user);
  }

  // --- DÒNG SẢN PHẨM TRONG CƠ HỘI ---
  @Get(':id/san-pham')
  @ApiOperation({ summary: 'Danh sách sản phẩm trong cơ hội (S5-03)' })
  async layDanhSachSanPham(@Param('id') id: string) {
    return this.productService.layDanhSachSanPham(id);
  }

  @Post(':id/san-pham')
  @ApiOperation({ summary: 'Thêm sản phẩm vào cơ hội và tự động tính lại tổng giá trị & forecast (S5-03)' })
  async themSanPham(
    @Param('id') id: string,
    @Body() dto: ThemSanPhamCoHoiDto,
    @CurrentUser() user: any,
  ) {
    return this.productService.themSanPham(id, dto, user);
  }

  @Put(':id/san-pham/:itemId')
  @ApiOperation({ summary: 'Cập nhật số lượng / đơn giá / chiết khấu của sản phẩm trong cơ hội (S5-03)' })
  async capNhatSanPham(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: CapNhatSanPhamCoHoiDto,
    @CurrentUser() user: any,
  ) {
    return this.productService.capNhatSanPham(id, itemId, dto, user);
  }

  @Delete(':id/san-pham/:itemId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi cơ hội và tính lại tổng giá trị (S5-03)' })
  async xoaSanPham(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.productService.xoaSanPham(id, itemId, user);
  }
}

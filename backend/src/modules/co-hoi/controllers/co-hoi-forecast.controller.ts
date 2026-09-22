import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CoHoiForecastService } from '../services/co-hoi-forecast.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('Dự báo Doanh số (Forecast - EP-05 S5-06)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('co-hoi/forecast')
export class CoHoiForecastController {
  constructor(
    private readonly forecastService: CoHoiForecastService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('report')
  @ApiOperation({ summary: 'Báo cáo dự báo doanh số tính theo trọng số xác suất (S5-06)' })
  async layBaoCaoForecast(
    @Query('nam') nam?: string,
    @CurrentUser() user?: any,
  ) {
    const year = nam ? parseInt(nam, 10) : new Date().getFullYear();
    return this.forecastService.layBaoCaoForecast(year, user);
  }

  @Get('chi-tieu')
  @ApiOperation({ summary: 'Danh sách chỉ tiêu doanh số theo năm' })
  async layChiTieu(@Query('nam') nam?: string) {
    const year = nam ? parseInt(nam, 10) : new Date().getFullYear();
    return this.prisma.chiTieuDoanhSo.findMany({
      where: { nam: year },
      include: {
        nguoiDung: { select: { id: true, hoTen: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('chi-tieu')
  @ApiOperation({ summary: 'Thiết lập hoặc cập nhật chỉ tiêu doanh số' })
  async taoHoacCapNhatChiTieu(
    @Body()
    body: {
      nguoiDungId?: string;
      nhomKinhDoanhId?: string;
      nam: number;
      thang?: number;
      quy?: number;
      chiTieu: number;
    },
  ) {
    return this.prisma.chiTieuDoanhSo.create({
      data: {
        nguoiDungId: body.nguoiDungId || null,
        nhomKinhDoanhId: body.nhomKinhDoanhId || null,
        nam: body.nam,
        thang: body.thang || null,
        quy: body.quy || null,
        chiTieu: body.chiTieu,
      },
    });
  }
}

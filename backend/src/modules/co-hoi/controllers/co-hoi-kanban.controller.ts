import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { TrangThaiCoHoi, Prisma } from '@prisma/client';

@ApiTags('Pipeline Kanban (EP-05 S5-02)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('co-hoi/kanban')
export class CoHoiKanbanController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy dữ liệu bảng Kanban đa cột tối ưu hiệu năng (S5-02)' })
  async layDuLieuKanban(
    @Query('nguoiSoHuuId') nguoiSoHuuId?: string,
    @Query('nhomKinhDoanhId') nhomKinhDoanhId?: string,
    @Query('tuNgayChot') tuNgayChot?: string,
    @Query('denNgayChot') denNgayChot?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: any,
  ) {
    // 1. Data Scope
    const whereScope: Prisma.CoHoiWhereInput = {};
    if (currentUser) {
      const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
      if (userIds !== null) {
        whereScope.nguoiSoHuuId = { in: userIds };
      }
    }

    // 2. Filters
    if (nguoiSoHuuId) {
      whereScope.nguoiSoHuuId = nguoiSoHuuId;
    }
    if (nhomKinhDoanhId) {
      whereScope.nhomKinhDoanhId = nhomKinhDoanhId;
    }
    if (search) {
      const q = search.trim();
      whereScope.OR = [
        { maCoHoi: { contains: q, mode: 'insensitive' } },
        { tenCoHoi: { contains: q, mode: 'insensitive' } },
        { khachHang: { tenCongTy: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (tuNgayChot || denNgayChot) {
      whereScope.ngayKyDuKien = {};
      if (tuNgayChot) whereScope.ngayKyDuKien.gte = new Date(tuNgayChot);
      if (denNgayChot) {
        const end = new Date(denNgayChot);
        end.setHours(23, 59, 59, 999);
        whereScope.ngayKyDuKien.lte = end;
      }
    }

    // 3. Lấy tất cả giai đoạn kích hoạt
    const stages = await this.prisma.giaiDoanPipeline.findMany({
      where: { kichHoat: true },
      orderBy: { thuTu: 'asc' },
    });

    // 4. Lấy các cơ hội đang xử lý hoặc mới đóng gần đây (lightweight query)
    const opportunities = await this.prisma.coHoi.findMany({
      where: {
        ...whereScope,
        trangThai: TrangThaiCoHoi.DANG_XU_LY,
      },
      select: {
        id: true,
        maCoHoi: true,
        tenCoHoi: true,
        giaiDoanId: true,
        giaTriDuKien: true,
        xacSuat: true,
        duBaoGiaTri: true,
        ngayKyDuKien: true,
        laDinhTre: true,
        trangThai: true,
        nguoiSoHuuId: true,
        khachHang: {
          select: {
            id: true,
            tenCongTy: true,
            maKhachHang: true,
          },
        },
        nguoiSoHuu: {
          select: {
            id: true,
            hoTen: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ laDinhTre: 'desc' }, { createdAt: 'desc' }],
    });

    // 5. Gom cơ hội theo từng cột giai đoạn
    const stageMap = new Map<string, typeof opportunities>();
    for (const st of stages) {
      stageMap.set(st.id, []);
    }

    for (const opp of opportunities) {
      if (stageMap.has(opp.giaiDoanId)) {
        stageMap.get(opp.giaiDoanId)!.push(opp);
      }
    }

    const columns = stages.map((st) => {
      const cards = stageMap.get(st.id) || [];
      const tongGiaTri = cards.reduce((sum, c) => sum + Number(c.giaTriDuKien), 0);
      return {
        giaiDoan: st,
        soLuong: cards.length,
        tongGiaTri,
        coHoi: cards,
      };
    });

    return {
      tongSoCoHoi: opportunities.length,
      tongGiaTriPipeline: opportunities.reduce((sum, c) => sum + Number(c.giaTriDuKien), 0),
      columns,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrangThaiCoHoi } from '@prisma/client';

@Injectable()
export class CoHoiStalledService {
  private readonly logger = new Logger(CoHoiStalledService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Story [S5-07]: Quét và đánh giá cơ hội đình trệ
   */
  async danhGiaCoHoiDinhTre() {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Lấy tất cả cơ hội đang xử lý kèm giai đoạn
    const openOpportunities = await this.prisma.coHoi.findMany({
      where: { trangThai: TrangThaiCoHoi.DANG_XU_LY },
      include: {
        giaiDoan: { select: { id: true, soNgayDinhTre: true, tenGiaiDoan: true } },
      },
    });

    let countStalled = 0;
    let countActive = 0;

    for (const coHoi of openOpportunities) {
      const soNgayChoPhep = coHoi.giaiDoan?.soNgayDinhTre || 7;
      const thresholdDate = new Date(now.getTime() - soNgayChoPhep * 86400000);

      // Mốc hoạt động gần nhất: lấy ngayHoatDongCuoi hoặc updatedAt
      const lastActivityDate = coHoi.ngayHoatDongCuoi || coHoi.updatedAt;

      // Điều kiện 1: Không có hoạt động trong N ngày
      const isInactive = lastActivityDate < thresholdDate;

      // Điều kiện 2: Quá ngày dự kiến chốt mà chưa đóng
      const isPastCloseDate = coHoi.ngayKyDuKien ? coHoi.ngayKyDuKien < startOfToday : false;

      const shouldBeStalled = isInactive || isPastCloseDate;

      if (coHoi.laDinhTre !== shouldBeStalled) {
        await this.prisma.coHoi.update({
          where: { id: coHoi.id },
          data: { laDinhTre: shouldBeStalled },
        });

        if (shouldBeStalled) {
          countStalled++;
        } else {
          countActive++;
        }
      }
    }

    this.logger.log(
      `Đánh giá đình trệ hoàn tất: ${countStalled} cơ hội bị gắn cờ đình trệ, ${countActive} cơ hội được gỡ cờ`,
    );

    return {
      thanhCong: true,
      tongQuet: openOpportunities.length,
      soLuongGanCoMoi: countStalled,
      soLuongGoCo: countActive,
    };
  }
}

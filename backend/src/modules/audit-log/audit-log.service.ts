import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Story [S2-04]: Xem nhật ký thay đổi dữ liệu nhạy cảm
   * Lọc theo người dùng, loại đối tượng, khoảng thời gian
   */
  async layDanhSach(params: {
    page?: number;
    limit?: number;
    nguoiThucHienId?: string;
    loaiDoiTuong?: string;
    tuNgay?: string;
    denNgay?: string;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.max(Number(params.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.NhatKyHeThongWhereInput = {};

    if (params.nguoiThucHienId) {
      where.nguoiThucHienId = params.nguoiThucHienId;
    }

    if (params.loaiDoiTuong) {
      where.loaiDoiTuong = params.loaiDoiTuong;
    }

    if (params.tuNgay || params.denNgay) {
      where.createdAt = {};
      if (params.tuNgay) {
        where.createdAt.gte = new Date(params.tuNgay);
      }
      if (params.denNgay) {
        // Cuối ngày
        const end = new Date(params.denNgay);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.nhatKyHeThong.count({ where }),
      this.prisma.nhatKyHeThong.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          nguoiThucHien: {
            select: { id: true, hoTen: true, email: true },
          },
        },
      }),
    ]);

    return {
      duLieu: items,
      tongSo: total,
      trangHienTai: page,
      soLuongMoiTrang: limit,
      tongSoTrang: Math.ceil(total / limit),
    };
  }
}

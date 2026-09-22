import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LichLamViecService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Story [S6-07]: Lấy sự kiện lịch làm việc kết hợp Cuộc gặp và Công việc
   */
  async layLichLamViec(
    query: {
      tuNgay?: string;
      denNgay?: string;
      xemTeam?: boolean;
      nguoiDungId?: string;
    },
    currentUser: any,
  ) {
    const tuNgay = query.tuNgay ? new Date(query.tuNgay) : new Date(Date.now() - 30 * 86400000);
    const denNgay = query.denNgay ? new Date(query.denNgay) : new Date(Date.now() + 30 * 86400000);

    // Xác định danh sách user được phép xem
    let allowedUserIds: string[] = [currentUser.id];

    if (query.xemTeam) {
      const teamUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
      if (teamUserIds === null) {
        // Admin / Director xem được tất cả
        allowedUserIds = [];
      } else {
        allowedUserIds = teamUserIds;
      }
    } else if (query.nguoiDungId) {
      const teamUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
      if (teamUserIds === null || teamUserIds.includes(query.nguoiDungId)) {
        allowedUserIds = [query.nguoiDungId];
      }
    }

    // 1. Lấy cuộc gặp (GAP_MAT)
    const whereMeetings: Prisma.HoatDongWhereInput = {
      loaiHoatDong: { in: ['GAP_MAT', 'CUOC_GAP'] },
      thoiGian: { gte: tuNgay, lte: denNgay },
    };
    if (allowedUserIds.length > 0) {
      whereMeetings.nguoiThucHienId = { in: allowedUserIds };
    }

    // 2. Lấy công việc có hạn (CONG_VIEC)
    const whereTasks: Prisma.HoatDongWhereInput = {
      loaiHoatDong: 'CONG_VIEC',
      hanHoanThanh: { gte: tuNgay, lte: denNgay },
    };
    if (allowedUserIds.length > 0) {
      whereTasks.OR = [
        { nguoiDuocGiaoId: { in: allowedUserIds } },
        { nguoiThucHienId: { in: allowedUserIds } },
      ];
    }

    const [meetings, tasks] = await Promise.all([
      this.prisma.hoatDong.findMany({
        where: whereMeetings,
        include: {
          nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
          khachHang: { select: { id: true, tenCongTy: true } },
          coHoi: { select: { id: true, tenCoHoi: true } },
        },
      }),
      this.prisma.hoatDong.findMany({
        where: whereTasks,
        include: {
          nguoiDuocGiao: { select: { id: true, hoTen: true, avatarUrl: true } },
          nguoiThucHien: { select: { id: true, hoTen: true } },
          khachHang: { select: { id: true, tenCongTy: true } },
          coHoi: { select: { id: true, tenCoHoi: true } },
        },
      }),
    ]);

    // Chuẩn hóa thành định dạng sự kiện Lịch thống nhất
    const events = [
      ...meetings.map((m) => ({
        id: m.id,
        loai: 'CUOC_GAP',
        tieuDe: m.tieuDe,
        noiDung: m.noiDung,
        batDau: m.thoiGian,
        ketThuc: new Date(m.thoiGian.getTime() + (m.thoiLuongPhut || 60) * 60000),
        thoiLuongPhut: m.thoiLuongPhut || 60,
        diaDiem: m.diaDiem,
        nguoiPhuTrach: m.nguoiThucHien,
        khachHang: m.khachHang,
        coHoi: m.coHoi,
        mauSac: '#3b82f6', // Xanh dương
      })),
      ...tasks.map((t) => ({
        id: t.id,
        loai: 'CONG_VIEC',
        tieuDe: t.tieuDe,
        noiDung: t.noiDung,
        batDau: t.hanHoanThanh,
        ketThuc: t.hanHoanThanh,
        thoiLuongPhut: 0,
        trangThai: t.trangThaiCongViec,
        mucDoUuTien: t.mucDoUuTien,
        nguoiPhuTrach: t.nguoiDuocGiao || t.nguoiThucHien,
        khachHang: t.khachHang,
        coHoi: t.coHoi,
        mauSac: t.mucDoUuTien === 'KHAN_CAP' ? '#ef4444' : t.mucDoUuTien === 'CAO' ? '#f97316' : '#10b981',
      })),
    ];

    // Sắp xếp sự kiện theo thời gian bắt đầu
    events.sort((a, b) => new Date(a.batDau).getTime() - new Date(b.batDau).getTime());

    return {
      muiGio: 'Asia/Ho_Chi_Minh',
      tongSoSuKien: events.length,
      suKien: events,
    };
  }
}

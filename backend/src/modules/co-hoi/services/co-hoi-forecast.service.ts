import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { TrangThaiCoHoi, Prisma } from '@prisma/client';

@Injectable()
export class CoHoiForecastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Story [S5-06]: Báo cáo Dự báo Doanh số theo Trọng số xác suất (Weighted Forecast)
   */
  async layBaoCaoForecast(nam?: number, currentUser?: any) {
    const currentYear = nam || new Date().getFullYear();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentQuarter = Math.ceil(currentMonth / 3); // 1-4

    // Data Scope filter
    const whereScope: Prisma.CoHoiWhereInput = {};
    if (currentUser) {
      const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
      if (userIds !== null) {
        whereScope.nguoiSoHuuId = { in: userIds };
      }
    }

    // 1. Lấy tất cả cơ hội đang xử lý hoặc đã chốt trong năm
    const coHoiList = await this.prisma.coHoi.findMany({
      where: {
        ...whereScope,
        OR: [
          { trangThai: TrangThaiCoHoi.DANG_XU_LY },
          {
            trangThai: TrangThaiCoHoi.DONG_THANG,
            ngayDongThucTe: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
            },
          },
        ],
      },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true, nhomKinhDoanhId: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
        giaiDoan: { select: { id: true, tenGiaiDoan: true, xacSuatThang: true } },
      },
    });

    // 2. Lấy chỉ tiêu doanh số trong năm
    const chiTieuList = await this.prisma.chiTieuDoanhSo.findMany({
      where: { nam: currentYear },
    });

    // 3. Tính toán theo 3 mốc thời gian: Tháng này, Tháng sau, Quý này
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const startOfNextMonth = new Date(nextMonthYear, nextMonth - 1, 1);
    const endOfNextMonth = new Date(nextMonthYear, nextMonth, 0, 23, 59, 59, 999);

    const startOfQuarterMonth = (currentQuarter - 1) * 3;
    const startOfQuarter = new Date(currentYear, startOfQuarterMonth, 1);
    const endOfQuarter = new Date(currentYear, startOfQuarterMonth + 3, 0, 23, 59, 59, 999);

    const filterByPeriod = (start: Date, end: Date) => {
      return coHoiList.filter((c) => {
        const targetDate = c.ngayKyDuKien || c.createdAt;
        return targetDate >= start && targetDate <= end;
      });
    };

    const coHoiThangNay = filterByPeriod(startOfCurrentMonth, endOfCurrentMonth);
    const coHoiThangSau = filterByPeriod(startOfNextMonth, endOfNextMonth);
    const coHoiQuyNay = filterByPeriod(startOfQuarter, endOfQuarter);

    const tinhToanChiTiet = (items: typeof coHoiList, thang?: number, quy?: number) => {
      const dangXuLy = items.filter((c) => c.trangThai === TrangThaiCoHoi.DANG_XU_LY);
      const daThang = items.filter((c) => c.trangThai === TrangThaiCoHoi.DONG_THANG);

      const tongGiaTriPipeline = dangXuLy.reduce((sum, c) => sum + Number(c.giaTriDuKien), 0);
      const duBaoTrongSo = dangXuLy.reduce((sum, c) => sum + Number(c.duBaoGiaTri), 0);
      const thucTeDaChot = daThang.reduce((sum, c) => sum + Number(c.giaTriThucTe || c.giaTriDuKien), 0);

      // Tính tổng chỉ tiêu
      let chiTieu = 0;
      if (thang) {
        chiTieu = chiTieuList
          .filter((ct) => ct.thang === thang && (whereScope.nguoiSoHuuId ? (whereScope.nguoiSoHuuId as any).in?.includes(ct.nguoiDungId) : true))
          .reduce((sum, ct) => sum + Number(ct.chiTieu), 0);
      } else if (quy) {
        chiTieu = chiTieuList
          .filter((ct) => ct.quy === quy || ([1, 2, 3].map((m) => m + (quy - 1) * 3).includes(ct.thang || 0)))
          .reduce((sum, ct) => sum + Number(ct.chiTieu), 0);
      }

      const tiLeHoanThanh = chiTieu > 0 ? ((thucTeDaChot / chiTieu) * 100).toFixed(1) : '0.0';
      const tiLeDuBao = chiTieu > 0 ? (((thucTeDaChot + duBaoTrongSo) / chiTieu) * 100).toFixed(1) : '0.0';

      return {
        soLuongCoHoi: dangXuLy.length,
        tongGiaTriPipeline,
        duBaoTrongSo,
        thucTeDaChot,
        chiTieu,
        tiLeHoanThanh: Number(tiLeHoanThanh),
        tiLeDuBao: Number(tiLeDuBao),
      };
    };

    // 4. Báo cáo phân bổ theo Nhân viên
    const theoNhanVienMap = new Map<string, any>();
    for (const c of coHoiList) {
      const uId = c.nguoiSoHuuId;
      if (!theoNhanVienMap.has(uId)) {
        theoNhanVienMap.set(uId, {
          nguoiDungId: uId,
          hoTen: c.nguoiSoHuu.hoTen,
          nhomKinhDoanh: c.nhomKinhDoanh?.tenNhom || 'Chưa gán nhóm',
          tongPipeline: 0,
          duBaoTrongSo: 0,
          thucTeDaChot: 0,
          soLuongCoHoi: 0,
        });
      }
      const record = theoNhanVienMap.get(uId);
      if (c.trangThai === TrangThaiCoHoi.DANG_XU_LY) {
        record.tongPipeline += Number(c.giaTriDuKien);
        record.duBaoTrongSo += Number(c.duBaoGiaTri);
        record.soLuongCoHoi += 1;
      } else if (c.trangThai === TrangThaiCoHoi.DONG_THANG) {
        record.thucTeDaChot += Number(c.giaTriThucTe || c.giaTriDuKien);
      }
    }

    // 5. Báo cáo phân bổ theo Nhóm kinh doanh
    const theoNhomMap = new Map<string, any>();
    for (const c of coHoiList) {
      const teamId = c.nhomKinhDoanhId || 'NONE';
      const teamName = c.nhomKinhDoanh?.tenNhom || 'Không có nhóm';
      if (!theoNhomMap.has(teamId)) {
        theoNhomMap.set(teamId, {
          nhomKinhDoanhId: teamId,
          tenNhom: teamName,
          tongPipeline: 0,
          duBaoTrongSo: 0,
          thucTeDaChot: 0,
          soLuongCoHoi: 0,
        });
      }
      const record = theoNhomMap.get(teamId);
      if (c.trangThai === TrangThaiCoHoi.DANG_XU_LY) {
        record.tongPipeline += Number(c.giaTriDuKien);
        record.duBaoTrongSo += Number(c.duBaoGiaTri);
        record.soLuongCoHoi += 1;
      } else if (c.trangThai === TrangThaiCoHoi.DONG_THANG) {
        record.thucTeDaChot += Number(c.giaTriThucTe || c.giaTriDuKien);
      }
    }

    return {
      nam: currentYear,
      thoiDiemTinhToan: new Date().toISOString(),
      thangNay: {
        thang: currentMonth,
        ...tinhToanChiTiet(coHoiThangNay, currentMonth),
      },
      thangSau: {
        thang: nextMonth,
        ...tinhToanChiTiet(coHoiThangSau, nextMonth),
      },
      quyNay: {
        quy: currentQuarter,
        ...tinhToanChiTiet(coHoiQuyNay, undefined, currentQuarter),
      },
      theoNhanVien: Array.from(theoNhanVienMap.values()),
      theoNhom: Array.from(theoNhomMap.values()),
    };
  }
}

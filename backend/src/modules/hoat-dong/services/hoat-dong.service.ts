import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { TaoHoatDongDto, CapNhatHoatDongDto, LocHoatDongDto } from '../dto/hoat-dong.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class HoatDongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Story [S6-05]: Ghi nhận một hoạt động với khách hàng (cuộc gọi, cuộc gặp, email, ghi chú)
   */
  async taoHoatDong(dto: TaoHoatDongDto, currentUser: any) {
    // 1. Kiểm tra quyền sở hữu nếu gắn với Cơ hội hoặc Khách hàng
    if (dto.coHoiId) {
      const coHoi = await this.prisma.coHoi.findUnique({ where: { id: dto.coHoiId } });
      if (!coHoi) {
        throw new NotFoundException('Không tìm thấy cơ hội liên quan');
      }
      const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
      if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
        throw new ForbiddenException('Bạn không có quyền thêm hoạt động vào cơ hội này');
      }
    }

    if (dto.khachHangId) {
      const khachHang = await this.prisma.khachHang.findUnique({ where: { id: dto.khachHangId } });
      if (!khachHang) {
        throw new NotFoundException('Không tìm thấy khách hàng liên quan');
      }
    }

    const thoiGian = dto.thoiGian ? new Date(dto.thoiGian) : new Date();

    const hoatDong = await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: dto.loaiHoatDong,
        tieuDe: dto.tieuDe,
        noiDung: dto.noiDung,
        khachHangId: dto.khachHangId,
        nguoiLienHeId: dto.nguoiLienHeId,
        coHoiId: dto.coHoiId,
        leadId: dto.leadId,
        nguoiThucHienId: currentUser.id,
        thoiGian,
        thoiLuongPhut: dto.thoiLuongPhut,
        diaDiem: dto.diaDiem,
        ketQua: dto.ketQua,
      },
      include: {
        nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
        nguoiLienHe: { select: { id: true, hoTen: true, soDienThoai: true } },
        khachHang: { select: { id: true, tenCongTy: true, maKhachHang: true } },
        coHoi: { select: { id: true, tenCoHoi: true, maCoHoi: true } },
      },
    });

    // Rule 59 / Story [S5-07]: Cập nhật ngày hoạt động cuối của cơ hội và gỡ cờ đình trệ ngay lập tức
    if (dto.coHoiId) {
      await this.prisma.coHoi.update({
        where: { id: dto.coHoiId },
        data: {
          ngayHoatDongCuoi: thoiGian,
          laDinhTre: false,
        },
      });
    }

    return hoatDong;
  }

  /**
   * Lấy danh sách hoạt động với bộ lọc nâng cao
   */
  async layDanhSach(loc: LocHoatDongDto, currentUser: any) {
    const page = Math.max(Number(loc.page) || 1, 1);
    const limit = Math.max(Number(loc.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.HoatDongWhereInput = {
      loaiHoatDong: { not: 'CONG_VIEC' }, // Tách riêng công việc (Task)
    };

    if (loc.khachHangId) {
      where.khachHangId = loc.khachHangId;
    }
    if (loc.coHoiId) {
      where.coHoiId = loc.coHoiId;
    }
    if (loc.loaiHoatDong) {
      where.loaiHoatDong = loc.loaiHoatDong;
    }
    if (loc.nguoiThucHienId) {
      where.nguoiThucHienId = loc.nguoiThucHienId;
    }
    if (loc.tuNgay || loc.denNgay) {
      where.thoiGian = {};
      if (loc.tuNgay) where.thoiGian.gte = new Date(loc.tuNgay);
      if (loc.denNgay) {
        const end = new Date(loc.denNgay);
        end.setHours(23, 59, 59, 999);
        where.thoiGian.lte = end;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.hoatDong.count({ where }),
      this.prisma.hoatDong.findMany({
        where,
        skip,
        take: limit,
        orderBy: { thoiGian: 'desc' },
        include: {
          nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
          nguoiLienHe: { select: { id: true, hoTen: true } },
          khachHang: { select: { id: true, tenCongTy: true } },
          coHoi: { select: { id: true, tenCoHoi: true } },
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

  /**
   * Lấy chi tiết một hoạt động
   */
  async layChiTiet(id: string) {
    const item = await this.prisma.hoatDong.findUnique({
      where: { id },
      include: {
        nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
        nguoiLienHe: true,
        khachHang: true,
        coHoi: true,
      },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy hoạt động');
    }
    return item;
  }

  /**
   * Cập nhật hoạt động
   */
  async capNhat(id: string, dto: CapNhatHoatDongDto, currentUser: any) {
    const item = await this.prisma.hoatDong.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy hoạt động');
    }
    if (item.nguoiThucHienId !== currentUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể chỉnh sửa hoạt động do chính mình tạo');
    }

    return this.prisma.hoatDong.update({
      where: { id },
      data: dto,
      include: {
        nguoiThucHien: { select: { id: true, hoTen: true } },
      },
    });
  }

  /**
   * Xóa hoạt động
   */
  async xoa(id: string, currentUser: any) {
    const item = await this.prisma.hoatDong.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy hoạt động');
    }
    if (item.nguoiThucHienId !== currentUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể xóa hoạt động do chính mình tạo');
    }

    await this.prisma.hoatDong.delete({ where: { id } });
    return { thanhCong: true, thongDiep: 'Đã xóa hoạt động' };
  }

  /**
   * Story [S6-08]: Customer Timeline tối ưu hóa (< 1.5s)
   */
  async layTimelineKhachHang(khachHangId: string) {
    const activities = await this.prisma.hoatDong.findMany({
      where: { khachHangId },
      orderBy: { thoiGian: 'desc' },
      take: 100,
      include: {
        nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
        nguoiLienHe: { select: { id: true, hoTen: true } },
        coHoi: { select: { id: true, tenCoHoi: true, maCoHoi: true } },
      },
    });

    return activities;
  }

  /**
   * Timeline hoạt động của một cơ hội cụ thể
   */
  async layTimelineCoHoi(coHoiId: string) {
    return this.prisma.hoatDong.findMany({
      where: { coHoiId },
      orderBy: { thoiGian: 'desc' },
      take: 100,
      include: {
        nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
        nguoiLienHe: { select: { id: true, hoTen: true } },
      },
    });
  }

  /**
   * Story [S8-11]: Thống kê hoạt động theo thành viên và thời gian
   */
  async thongKeHoatDong(tuNgay?: string, denNgay?: string, nhomId?: string) {
    const where: Prisma.HoatDongWhereInput = {
      loaiHoatDong: { not: 'CONG_VIEC' },
    };

    if (tuNgay || denNgay) {
      where.thoiGian = {};
      if (tuNgay) where.thoiGian.gte = new Date(tuNgay);
      if (denNgay) {
        const end = new Date(denNgay);
        end.setHours(23, 59, 59, 999);
        where.thoiGian.lte = end;
      }
    }

    const items = await this.prisma.hoatDong.findMany({
      where,
      include: {
        nguoiThucHien: { select: { id: true, hoTen: true, nhomKinhDoanhId: true } },
      },
    });

    const userStats = new Map<string, any>();
    for (const it of items) {
      const u = it.nguoiThucHien;
      if (!u) continue;
      if (nhomId && u.nhomKinhDoanhId !== nhomId) continue;

      if (!userStats.has(u.id)) {
        userStats.set(u.id, {
          nguoiDungId: u.id,
          hoTen: u.hoTen,
          tongSo: 0,
          cuocGoi: 0,
          cuocGap: 0,
          email: 0,
          ghiChu: 0,
        });
      }
      const st = userStats.get(u.id);
      st.tongSo++;
      if (it.loaiHoatDong === 'GOI_DIEN' || it.loaiHoatDong === 'CUOC_GOI') st.cuocGoi++;
      else if (it.loaiHoatDong === 'GAP_MAT' || it.loaiHoatDong === 'CUOC_GAP') st.cuocGap++;
      else if (it.loaiHoatDong === 'EMAIL') st.email++;
      else if (it.loaiHoatDong === 'GHI_CHU') st.ghiChu++;
    }

    return Array.from(userStats.values());
  }
}

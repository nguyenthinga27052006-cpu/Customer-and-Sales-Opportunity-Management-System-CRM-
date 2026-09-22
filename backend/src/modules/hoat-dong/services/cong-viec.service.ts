import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import {
  TaoCongViecDto,
  CapNhatCongViecDto,
  DoiTrangThaiCongViecDto,
  TrangThaiCongViec,
} from '../dto/cong-viec.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CongViecService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Story [S6-06]: Tạo và theo dõi công việc có hạn hoàn thành (Task)
   */
  async taoCongViec(dto: TaoCongViecDto, currentUser: any) {
    const nguoiDuocGiaoId = dto.nguoiDuocGiaoId || currentUser.id;

    // Kiểm tra người được giao
    const assignee = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiDuocGiaoId },
    });
    if (!assignee) {
      throw new NotFoundException('Người được giao công việc không tồn tại');
    }

    const task = await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'CONG_VIEC',
        tieuDe: dto.tieuDe,
        noiDung: dto.noiDung,
        hanHoanThanh: new Date(dto.hanHoanThanh),
        mucDoUuTien: dto.mucDoUuTien || 'TRUNG_BINH',
        trangThaiCongViec: TrangThaiCongViec.CHUA_HOAN_THANH,
        nguoiDuocGiaoId,
        nguoiThucHienId: currentUser.id,
        khachHangId: dto.khachHangId,
        coHoiId: dto.coHoiId,
        thoiGianNhacNho: dto.thoiGianNhacNho ? new Date(dto.thoiGianNhacNho) : null,
      },
      include: {
        nguoiDuocGiao: { select: { id: true, hoTen: true, avatarUrl: true } },
        nguoiThucHien: { select: { id: true, hoTen: true } },
        khachHang: { select: { id: true, tenCongTy: true, maKhachHang: true } },
        coHoi: { select: { id: true, tenCoHoi: true, maCoHoi: true } },
      },
    });

    return task;
  }

  /**
   * Lấy danh sách công việc có tính toán quá hạn theo giờ Server (S6-06, S6-09)
   */
  async layDanhSachCongViec(
    query: {
      trangThai?: string;
      mucDoUuTien?: string;
      nguoiDuocGiaoId?: string;
      coHoiId?: string;
      khachHangId?: string;
      chiXemQuaHan?: boolean;
      page?: number;
      limit?: number;
    },
    currentUser: any,
  ) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 20, 1);
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.HoatDongWhereInput = {
      loaiHoatDong: 'CONG_VIEC',
    };

    // Áp dụng Data Scope: xem task mình được giao hoặc người tạo
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null) {
      where.OR = [
        { nguoiDuocGiaoId: { in: userIds } },
        { nguoiThucHienId: { in: userIds } },
      ];
    }

    if (query.trangThai) {
      where.trangThaiCongViec = query.trangThai;
    }

    if (query.mucDoUuTien) {
      where.mucDoUuTien = query.mucDoUuTien;
    }

    if (query.nguoiDuocGiaoId) {
      where.nguoiDuocGiaoId = query.nguoiDuocGiaoId;
    }

    if (query.coHoiId) {
      where.coHoiId = query.coHoiId;
    }

    if (query.khachHangId) {
      where.khachHangId = query.khachHangId;
    }

    // Story [S6-09]: Lọc việc quá hạn theo giờ Server
    if (query.chiXemQuaHan) {
      where.hanHoanThanh = { lt: now };
      where.trangThaiCongViec = { not: TrangThaiCongViec.HOAN_THANH };
    }

    const [total, items] = await Promise.all([
      this.prisma.hoatDong.count({ where }),
      this.prisma.hoatDong.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ hanHoanThanh: 'asc' }, { createdAt: 'desc' }],
        include: {
          nguoiDuocGiao: { select: { id: true, hoTen: true, avatarUrl: true } },
          nguoiThucHien: { select: { id: true, hoTen: true } },
          khachHang: { select: { id: true, tenCongTy: true } },
          coHoi: { select: { id: true, tenCoHoi: true } },
        },
      }),
    ]);

    // Bổ sung cờ quaHan tính toán theo Server time
    const enriched = items.map((task) => {
      const quaHan =
        Boolean(task.hanHoanThanh && task.hanHoanThanh < now && task.trangThaiCongViec !== TrangThaiCongViec.HOAN_THANH);
      return {
        ...task,
        laQuaHan: quaHan,
      };
    });

    return {
      duLieu: enriched,
      tongSo: total,
      trangHienTai: page,
      soLuongMoiTrang: limit,
      tongSoTrang: Math.ceil(total / limit),
    };
  }

  /**
   * Đổi trạng thái công việc (Hoàn thành / Hoãn / Hủy)
   */
  async doiTrangThai(id: string, dto: DoiTrangThaiCongViecDto, currentUser: any) {
    const task = await this.prisma.hoatDong.findFirst({
      where: { id, loaiHoatDong: 'CONG_VIEC' },
    });
    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    const updateData: Prisma.HoatDongUpdateInput = {
      trangThaiCongViec: dto.trangThaiCongViec,
      lyDoHoanHuy: dto.lyDoHoanHuy || null,
    };

    if (dto.trangThaiCongViec === TrangThaiCongViec.HOAN_THANH) {
      updateData.ngayHoanThanh = new Date();
    }

    return this.prisma.hoatDong.update({
      where: { id },
      data: updateData,
      include: {
        nguoiDuocGiao: { select: { id: true, hoTen: true } },
      },
    });
  }

  /**
   * Cập nhật công việc
   */
  async capNhat(id: string, dto: CapNhatCongViecDto, currentUser: any) {
    const task = await this.prisma.hoatDong.findFirst({
      where: { id, loaiHoatDong: 'CONG_VIEC' },
    });
    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    const updateData: Prisma.HoatDongUpdateInput = {
      tieuDe: dto.tieuDe,
      noiDung: dto.noiDung,
      mucDoUuTien: dto.mucDoUuTien,
    };

    if (dto.hanHoanThanh) {
      updateData.hanHoanThanh = new Date(dto.hanHoanThanh);
    }

    if (dto.nguoiDuocGiaoId) {
      updateData.nguoiDuocGiao = { connect: { id: dto.nguoiDuocGiaoId } };
    }

    return this.prisma.hoatDong.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Xóa công việc
   */
  async xoa(id: string, currentUser: any) {
    const task = await this.prisma.hoatDong.findFirst({
      where: { id, loaiHoatDong: 'CONG_VIEC' },
    });
    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    await this.prisma.hoatDong.delete({ where: { id } });
    return { thanhCong: true, thongDiep: 'Đã xóa công việc' };
  }

  /**
   * Story [S6-09]: Thống kê việc quá hạn của từng thành viên cho Trưởng nhóm
   */
  async thongKeQuaHan(currentUser: any) {
    const now = new Date();
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);

    const where: Prisma.HoatDongWhereInput = {
      loaiHoatDong: 'CONG_VIEC',
      hanHoanThanh: { lt: now },
      trangThaiCongViec: { not: TrangThaiCongViec.HOAN_THANH },
    };

    if (userIds !== null) {
      where.nguoiDuocGiaoId = { in: userIds };
    }

    const overdueTasks = await this.prisma.hoatDong.findMany({
      where,
      include: {
        nguoiDuocGiao: { select: { id: true, hoTen: true, email: true } },
      },
    });

    const memberStats = new Map<string, any>();
    for (const t of overdueTasks) {
      const u = t.nguoiDuocGiao;
      if (!u) continue;
      if (!memberStats.has(u.id)) {
        memberStats.set(u.id, {
          nguoiDungId: u.id,
          hoTen: u.hoTen,
          email: u.email,
          soViecQuaHan: 0,
        });
      }
      memberStats.get(u.id).soViecQuaHan++;
    }

    return {
      tongSoViecQuaHan: overdueTasks.length,
      thoiDiemKiemTra: now.toISOString(),
      danhSachThanhVien: Array.from(memberStats.values()),
    };
  }
}

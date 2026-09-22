import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DataScopeService } from '../../common/services/data-scope.service';
import { TaoKhachHangDto, CapNhatKhachHangDto, LocKhachHangDto, GopKhachHangDto } from './dto/khach-hang.dto';
import { VaiTroEnum } from '../../common/enums/role.enum';

@Injectable()
export class KhachHangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Sinh mã khách hàng tự động: KH-00001
   */
  private async sinhMaKhachHang(): Promise<string> {
    const count = await this.prisma.khachHang.count();
    const nextNum = (count + 1).toString().padStart(5, '0');
    let code = `KH-${nextNum}`;
    let exists = await this.prisma.khachHang.findUnique({ where: { maKhachHang: code } });
    let i = 1;
    while (exists) {
      code = `KH-${(count + 1 + i).toString().padStart(5, '0')}`;
      exists = await this.prisma.khachHang.findUnique({ where: { maKhachHang: code } });
      i++;
    }
    return code;
  }

  /**
   * S3-01: Tạo mới hồ sơ khách hàng
   */
  async taoKhachHang(dto: TaoKhachHangDto, currentUser: any) {
    // 1. Kiểm tra MST trùng (Mã số thuế nếu có phải unique)
    if (dto.maSoThue && dto.maSoThue.trim() !== '') {
      const existingMst = await this.prisma.khachHang.findUnique({
        where: { maSoThue: dto.maSoThue.trim() },
      });
      if (existingMst && !existingMst.daGopVaoId) {
        throw new ConflictException(
          `Mã số thuế ${dto.maSoThue} đã tồn tại trên khách hàng: ${existingMst.tenCongTy} (${existingMst.maKhachHang})`,
        );
      }
    }

    const maKhachHang = await this.sinhMaKhachHang();
    const nguoiSoHuuId = dto.nguoiSoHuuId || currentUser.id;

    // Lấy nhóm kinh doanh của người sở hữu
    const owner = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiSoHuuId },
      select: { nhomKinhDoanhId: true },
    });

    const khachHang = await this.prisma.khachHang.create({
      data: {
        maKhachHang,
        tenCongTy: dto.tenCongTy.trim(),
        maSoThue: dto.maSoThue?.trim() || null,
        nganhNghe: dto.nganhNghe || null,
        quyMo: dto.quyMo || null,
        website: dto.website?.trim() || null,
        diaChi: dto.diaChi?.trim() || null,
        tinhThanh: dto.tinhThanh?.trim() || null,
        quocGia: dto.quocGia || 'Vietnam',
        nguoiSoHuuId,
        nhomKinhDoanhId: owner?.nhomKinhDoanhId || null,
        trangThai: dto.trangThai || 'TIEM_NANG',
        moTa: dto.moTa || null,
      },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
      },
    });

    // Ghi log hoạt động ban đầu
    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: 'Tạo mới hồ sơ khách hàng',
        noiDung: `Khách hàng được tạo bởi ${currentUser.hoTen || currentUser.email}`,
        khachHangId: khachHang.id,
        nguoiThucHienId: currentUser.id,
      },
    });

    // Audit log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'KHACH_HANG',
        doiTuongId: khachHang.id,
        hanhDong: 'TAO',
        giaTriSau: khachHang as any,
      },
    });

    return khachHang;
  }

  /**
   * S3-07: Tìm kiếm, lọc và phân trang khách hàng có kiểm soát Data Scope
   */
  async layDanhSach(locDto: LocKhachHangDto, currentUser: any) {
    const { tuKhoa, trangThai, nganhNghe, quyMo, nguoiSoHuuId, page = 1, limit = 10 } = locDto;

    // Kiểm tra phạm vi dữ liệu kế thừa từ Sprint 1
    const allowedUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);

    const where: any = {
      daGopVaoId: null, // Không hiển thị khách hàng đã bị gộp
    };

    // Áp dụng Data Scope: Sales Rep -> chỉ của mình; Team Lead -> team; Director -> ALL
    if (allowedUserIds !== null) {
      where.nguoiSoHuuId = { in: allowedUserIds };
    }

    // Nếu người dùng chỉ định lọc theo owner cụ thể
    if (nguoiSoHuuId) {
      if (allowedUserIds !== null && !allowedUserIds.includes(nguoiSoHuuId)) {
        throw new ForbiddenException('Bạn không có quyền xem dữ liệu của nhân viên này');
      }
      where.nguoiSoHuuId = nguoiSoHuuId;
    }

    if (trangThai) where.trangThai = trangThai;
    if (nganhNghe) where.nganhNghe = nganhNghe;
    if (quyMo) where.quyMo = quyMo;

    // Tìm kiếm đa trường: tên công ty, mã khách hàng, MST, hoặc số điện thoại người liên hệ
    if (tuKhoa && tuKhoa.trim() !== '') {
      const keyword = tuKhoa.trim();
      where.OR = [
        { tenCongTy: { contains: keyword, mode: 'insensitive' } },
        { maKhachHang: { contains: keyword, mode: 'insensitive' } },
        { maSoThue: { contains: keyword, mode: 'insensitive' } },
        {
          nguoiLienHe: {
            some: {
              OR: [
                { soDienThoai: { contains: keyword } },
                { hoTen: { contains: keyword, mode: 'insensitive' } },
                { email: { contains: keyword, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.khachHang.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
          nhomKinhDoanh: { select: { id: true, tenNhom: true } },
          nguoiLienHe: {
            where: { laDauMoiChinh: true },
            select: { id: true, hoTen: true, soDienThoai: true, email: true, chucDanh: true },
            take: 1,
          },
          _count: {
            select: {
              nguoiLienHe: true,
              coHoi: true,
            },
          },
        },
      }),
      this.prisma.khachHang.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết hồ sơ một khách hàng (có kiểm tra Data Scope)
   */
  async layChiTiet(id: string, currentUser: any) {
    const khachHang = await this.prisma.khachHang.findUnique({
      where: { id },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
        nguoiLienHe: {
          orderBy: [{ laDauMoiChinh: 'desc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: { coHoi: true, nguoiLienHe: true, hoatDong: true },
        },
      },
    });

    if (!khachHang) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    // Kiểm tra Data Scope
    const allowedUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (allowedUserIds !== null && !allowedUserIds.includes(khachHang.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền truy cập hồ sơ khách hàng này');
    }

    return khachHang;
  }

  /**
   * Cập nhật thông tin khách hàng
   */
  async capNhat(id: string, dto: CapNhatKhachHangDto, currentUser: any) {
    const khachHang = await this.layChiTiet(id, currentUser);

    // Kiểm tra MST nếu thay đổi
    if (dto.maSoThue && dto.maSoThue.trim() !== khachHang.maSoThue) {
      const existingMst = await this.prisma.khachHang.findUnique({
        where: { maSoThue: dto.maSoThue.trim() },
      });
      if (existingMst && existingMst.id !== id && !existingMst.daGopVaoId) {
        throw new ConflictException(`Mã số thuế ${dto.maSoThue} đã được sử dụng bởi khách hàng khác`);
      }
    }

    let updateData: any = { ...dto };
    if (dto.tenCongTy) updateData.tenCongTy = dto.tenCongTy.trim();
    if (dto.maSoThue !== undefined) updateData.maSoThue = dto.maSoThue ? dto.maSoThue.trim() : null;

    // Nếu chuyển giao người sở hữu
    if (dto.nguoiSoHuuId && dto.nguoiSoHuuId !== khachHang.nguoiSoHuuId) {
      const newOwner = await this.prisma.nguoiDung.findUnique({
        where: { id: dto.nguoiSoHuuId },
        select: { id: true, hoTen: true, nhomKinhDoanhId: true },
      });
      if (!newOwner) {
        throw new BadRequestException('Người sở hữu mới không tồn tại');
      }
      updateData.nhomKinhDoanhId = newOwner.nhomKinhDoanhId;

      await this.prisma.hoatDong.create({
        data: {
          loaiHoatDong: 'GHI_CHU',
          tieuDe: 'Bàn giao quyền sở hữu khách hàng',
          noiDung: `Bàn giao từ ${khachHang.nguoiSoHuu.hoTen} sang ${newOwner.hoTen}`,
          khachHangId: id,
          nguoiThucHienId: currentUser.id,
        },
      });
    }

    const updated = await this.prisma.khachHang.update({
      where: { id },
      data: updateData,
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
      },
    });

    // Audit log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'KHACH_HANG',
        doiTuongId: id,
        hanhDong: 'SUA',
        giaTriTruoc: khachHang as any,
        giaTriSau: updated as any,
      },
    });

    return updated;
  }

  /**
   * Xóa khách hàng
   */
  async xoaKhachHang(id: string, currentUser: any) {
    const khachHang = await this.layChiTiet(id, currentUser);

    // Kiểm tra có cơ hội bán hàng đang mở không
    const openOppsCount = await this.prisma.coHoi.count({
      where: { khachHangId: id, trangThai: 'DANG_XU_LY' },
    });
    if (openOppsCount > 0) {
      throw new BadRequestException(
        `Không thể xóa khách hàng đang có ${openOppsCount} cơ hội bán hàng đang xử lý. Vui lòng đóng hoặc bàn giao cơ hội trước.`,
      );
    }

    await this.prisma.khachHang.delete({ where: { id } });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'KHACH_HANG',
        doiTuongId: id,
        hanhDong: 'XOA',
        giaTriTruoc: khachHang as any,
      },
    });

    return { message: 'Đã xóa khách hàng thành công' };
  }

  /**
   * S3-03: Customer 360 Aggregation View
   * Yêu cầu hiệu năng: < 1.5 giây cho 500 activities nhờ selective loading & indexed queries
   */
  async layCustomer360(id: string, currentUser: any, pageActivity: number = 1, limitActivity: number = 50) {
    const startTime = Date.now();
    const khachHang = await this.layChiTiet(id, currentUser);

    const [contacts, openOpportunities, closedOpportunities, valueAggregates, activities, totalActivities] =
      await Promise.all([
        // 1. Danh sách người liên hệ
        this.prisma.nguoiLienHe.findMany({
          where: { khachHangId: id },
          orderBy: [{ laDauMoiChinh: 'desc' }, { createdAt: 'asc' }],
        }),

        // 2. Cơ hội đang mở (DANG_XU_LY)
        this.prisma.coHoi.findMany({
          where: { khachHangId: id, trangThai: 'DANG_XU_LY' },
          include: {
            giaiDoan: { select: { id: true, tenGiaiDoan: true, xacSuatThang: true } },
            nguoiSoHuu: { select: { id: true, hoTen: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),

        // 3. Cơ hội đã đóng (DONG_THANG hoặc DONG_THUA)
        this.prisma.coHoi.findMany({
          where: { khachHangId: id, trangThai: { in: ['DONG_THANG', 'DONG_THUA'] } },
          include: {
            giaiDoan: { select: { id: true, tenGiaiDoan: true } },
            nguoiSoHuu: { select: { id: true, hoTen: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),

        // 4. Tổng hợp giá trị cơ hội & hợp đồng
        this.prisma.coHoi.groupBy({
          by: ['trangThai'],
          where: { khachHangId: id },
          _sum: {
            giaTriDuKien: true,
          },
        }),

        // 5. Activity Timeline phân trang (Index theo khachHangId + thoiGian)
        this.prisma.hoatDong.findMany({
          where: { khachHangId: id },
          skip: (pageActivity - 1) * limitActivity,
          take: limitActivity,
          orderBy: { thoiGian: 'desc' },
          include: {
            nguoiThucHien: { select: { id: true, hoTen: true, avatarUrl: true } },
            nguoiLienHe: { select: { id: true, hoTen: true } },
            coHoi: { select: { id: true, tenCoHoi: true } },
          },
        }),

        // 6. Tổng số hoạt động
        this.prisma.hoatDong.count({ where: { khachHangId: id } }),
      ]);

    // Tính toán tổng giá trị đã ký và tổng giá trị đang mở
    let tongGiaTriDaKy = 0;
    let tongGiaTriCoHoiMo = 0;

    for (const agg of valueAggregates) {
      const sum = Number(agg._sum.giaTriDuKien || 0);
      if (agg.trangThai === 'DONG_THANG') {
        tongGiaTriDaKy += sum;
      } else if (agg.trangThai === 'DANG_XU_LY') {
        tongGiaTriCoHoiMo += sum;
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      thongTinChung: khachHang,
      nguoiLienHe: contacts,
      coHoiDangMo: openOpportunities,
      coHoiDaDong: closedOpportunities,
      thongKe: {
        tongGiaTriDaKy,
        tongGiaTriCoHoiMo,
        tongSoLienHe: contacts.length,
        tongSoCoHoi: openOpportunities.length + closedOpportunities.length,
        tongSoHoatDong: totalActivities,
      },
      dongThoiGian: {
        items: activities,
        total: totalActivities,
        page: pageActivity,
        limit: limitActivity,
      },
      hieuNang: {
        thoiGianTruyVanMs: durationMs,
        datMucTieu1500ms: durationMs < 1500,
      },
    };
  }

  /**
   * S3-04: Phát hiện khách hàng trùng lặp theo MST, Tên công ty hoặc Website
   */
  async phatHienTrungLap(maSoThue?: string, tenCongTy?: string, website?: string) {
    const conditions: any[] = [];

    if (maSoThue && maSoThue.trim()) {
      conditions.push({ maSoThue: maSoThue.trim() });
    }
    if (tenCongTy && tenCongTy.trim()) {
      conditions.push({
        tenCongTy: { contains: tenCongTy.trim(), mode: 'insensitive' },
      });
    }
    if (website && website.trim()) {
      conditions.push({
        website: { contains: website.trim().replace(/^https?:\/\//, ''), mode: 'insensitive' },
      });
    }

    if (conditions.length === 0) {
      return [];
    }

    const duplicates = await this.prisma.khachHang.findMany({
      where: {
        daGopVaoId: null,
        OR: conditions,
      },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true } },
        _count: { select: { nguoiLienHe: true, coHoi: true } },
      },
      take: 10,
    });

    return duplicates;
  }

  /**
   * S3-04: Gộp 2 khách hàng trùng lặp (Chỉ dành cho Team Lead trở lên)
   */
  async gopKhachHang(dto: GopKhachHangDto, currentUser: any) {
    const userRoles: string[] = currentUser.roles || [];
    const coQuyenGop = userRoles.some((r) =>
      [VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR, VaiTroEnum.TEAM_LEAD].includes(r as any),
    );

    if (!coQuyenGop) {
      throw new ForbiddenException('Chỉ Trưởng nhóm kinh doanh trở lên mới có quyền thực hiện gộp khách hàng');
    }

    if (dto.khachHangGocId === dto.khachHangGopId) {
      throw new BadRequestException('Khách hàng chính và khách hàng bị gộp không được trùng nhau');
    }

    const [master, secondary] = await Promise.all([
      this.prisma.khachHang.findUnique({
        where: { id: dto.khachHangGocId },
        include: { nguoiLienHe: true, coHoi: true },
      }),
      this.prisma.khachHang.findUnique({
        where: { id: dto.khachHangGopId },
        include: { nguoiLienHe: true, coHoi: true },
      }),
    ]);

    if (!master || master.daGopVaoId) {
      throw new NotFoundException('Khách hàng chính không hợp lệ hoặc đã bị gộp trước đó');
    }
    if (!secondary || secondary.daGopVaoId) {
      throw new NotFoundException('Khách hàng bị gộp không tồn tại hoặc đã bị gộp trước đó');
    }

    // Thực thi trong Transaction đảm bảo bảo toàn dữ liệu và Foreign Keys
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Chuyển toàn bộ Người liên hệ của secondary sang master
      await tx.nguoiLienHe.updateMany({
        where: { khachHangId: secondary.id },
        data: { khachHangId: master.id },
      });

      // 2. Chuyển toàn bộ Cơ hội bán hàng của secondary sang master
      await tx.coHoi.updateMany({
        where: { khachHangId: secondary.id },
        data: { khachHangId: master.id },
      });

      // 3. Chuyển toàn bộ Hoạt động của secondary sang master
      await tx.hoatDong.updateMany({
        where: { khachHangId: secondary.id },
        data: { khachHangId: master.id },
      });

      // 4. Cập nhật các Lead từng chuyển đổi sang secondary -> trỏ về master
      await tx.lead.updateMany({
        where: { khachHangChuyenDoiId: secondary.id },
        data: { khachHangChuyenDoiId: master.id },
      });

      // 5. Đánh dấu khách hàng phụ đã bị gộp
      const updatedSecondary = await tx.khachHang.update({
        where: { id: secondary.id },
        data: {
          daGopVaoId: master.id,
          trangThai: 'NGUNG_HOP_TAC',
          moTa: `[ĐÃ GỘP VÀO: ${master.tenCongTy} (${master.maKhachHang})] - ${secondary.moTa || ''}`,
        },
      });

      // 6. Ghi nhận Hoạt động sáp nhập trên khách hàng chính
      await tx.hoatDong.create({
        data: {
          loaiHoatDong: 'MERGE_CUSTOMER',
          tieuDe: `Gộp khách hàng trùng lặp: ${secondary.tenCongTy}`,
          noiDung: `Đã tiếp nhận toàn bộ liên hệ, cơ hội và lịch sử từ khách hàng ${secondary.tenCongTy} (${secondary.maKhachHang}). Lý do: ${dto.ghiChu || 'Gộp khách hàng trùng lặp'}`,
          khachHangId: master.id,
          nguoiThucHienId: currentUser.id,
        },
      });

      // 7. Ghi Audit log
      await tx.nhatKyHeThong.create({
        data: {
          nguoiThucHienId: currentUser.id,
          loaiDoiTuong: 'KHACH_HANG',
          doiTuongId: master.id,
          hanhDong: 'GOP_KHACH_HANG',
          giaTriTruoc: {
            masterId: master.id,
            secondaryId: secondary.id,
          },
          giaTriSau: {
            masterId: master.id,
            transferredContacts: secondary.nguoiLienHe.length,
            transferredOpportunities: secondary.coHoi.length,
          },
        },
      });

      return {
        masterId: master.id,
        mergedId: secondary.id,
        transferredContacts: secondary.nguoiLienHe.length,
        transferredOpportunities: secondary.coHoi.length,
      };
    });

    return {
      message: `Đã gộp thành công khách hàng ${secondary.tenCongTy} vào ${master.tenCongTy}`,
      chiTiet: result,
    };
  }
}

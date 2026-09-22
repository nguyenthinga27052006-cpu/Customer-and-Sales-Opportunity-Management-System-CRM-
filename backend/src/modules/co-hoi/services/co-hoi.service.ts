import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import {
  TaoCoHoiDto,
  CapNhatCoHoiDto,
  LocCoHoiDto,
  DongThangDto,
  DongThuaDto,
  MoLaiCoHoiDto,
  BanGiaoCoHoiDto,
} from '../dto/co-hoi.dto';
import { Prisma, TrangThaiCoHoi } from '@prisma/client';
import { VaiTroEnum } from '../../../common/enums/role.enum';

@Injectable()
export class CoHoiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Sinh mã cơ hội tự động định dạng CH-xxxxxx
   */
  private async sinhMaCoHoi(): Promise<string> {
    const count = await this.prisma.coHoi.count();
    const sequence = (count + 1).toString().padStart(6, '0');
    let ma = `CH-${sequence}`;

    let duplicate = await this.prisma.coHoi.findUnique({ where: { maCoHoi: ma } });
    let salt = 1;
    while (duplicate) {
      const nextSeq = (count + 1 + salt).toString().padStart(6, '0');
      ma = `CH-${nextSeq}`;
      duplicate = await this.prisma.coHoi.findUnique({ where: { maCoHoi: ma } });
      salt++;
    }
    return ma;
  }

  /**
   * Story [S5-01]: Tạo mới cơ hội bán hàng
   */
  async taoMoi(dto: TaoCoHoiDto, currentUser: any) {
    // 1. Kiểm tra Khách hàng tồn tại
    const khachHang = await this.prisma.khachHang.findUnique({
      where: { id: dto.khachHangId },
      include: { nguoiLienHe: true },
    });
    if (!khachHang) {
      throw new NotFoundException('Không tìm thấy khách hàng liên kết');
    }

    // 2. Kiểm tra Giai đoạn Pipeline
    const giaiDoan = await this.prisma.giaiDoanPipeline.findUnique({
      where: { id: dto.giaiDoanId },
    });
    if (!giaiDoan) {
      throw new NotFoundException('Giai đoạn pipeline không tồn tại');
    }

    // 3. Acceptance Criteria [S5-01]: Ngày dự kiến chốt không được ở quá khứ khi tạo mới
    let ngayKyDuKien: Date | null = null;
    if (dto.ngayKyDuKien) {
      ngayKyDuKien = new Date(dto.ngayKyDuKien);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (ngayKyDuKien < startOfToday) {
        throw new BadRequestException('Ngày dự kiến chốt không được ở quá khứ khi tạo mới cơ hội');
      }
    }

    // 4. Xác định người sở hữu và nhóm kinh doanh
    const nguoiSoHuuId = dto.nguoiSoHuuId || currentUser.id;
    const owner = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiSoHuuId },
      select: { id: true, nhomKinhDoanhId: true },
    });
    if (!owner) {
      throw new NotFoundException('Người sở hữu không tồn tại');
    }

    // 5. Tính xác suất thắng và dự báo giá trị
    const xacSuat = dto.xacSuat !== undefined ? dto.xacSuat : giaiDoan.xacSuatThang;
    const giaTriDuKien = dto.giaTriDuKien || 0;
    const duBaoGiaTri = (giaTriDuKien * xacSuat) / 100;

    // 6. Xác định người liên hệ chính nếu chưa truyền
    let nguoiLienHeId = dto.nguoiLienHeId;
    if (!nguoiLienHeId && khachHang.nguoiLienHe?.length > 0) {
      const primary = khachHang.nguoiLienHe.find((c) => c.laDauMoiChinh);
      nguoiLienHeId = primary ? primary.id : khachHang.nguoiLienHe[0].id;
    }

    const maCoHoi = await this.sinhMaCoHoi();

    const coHoi = await this.prisma.coHoi.create({
      data: {
        maCoHoi,
        tenCoHoi: dto.tenCoHoi,
        khachHangId: dto.khachHangId,
        nguoiLienHeId,
        giaiDoanId: dto.giaiDoanId,
        nhomKinhDoanhId: owner.nhomKinhDoanhId,
        nguoiSoHuuId,
        giaTriDuKien,
        xacSuat,
        ghiChuXacSuat: dto.ghiChuXacSuat,
        duBaoGiaTri,
        ngayKyDuKien,
        nguonCoHoi: dto.nguonCoHoi,
        moTa: dto.moTa,
        trangThai: TrangThaiCoHoi.DANG_XU_LY,
        ngayHoatDongCuoi: new Date(),
        laDinhTre: false,
      },
      include: {
        khachHang: { select: { id: true, tenCongTy: true, maKhachHang: true } },
        giaiDoan: true,
        nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
      },
    });

    // Ghi Audit Log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: coHoi.id,
        hanhDong: 'TAO',
        giaTriSau: {
          maCoHoi: coHoi.maCoHoi,
          tenCoHoi: coHoi.tenCoHoi,
          khachHangId: coHoi.khachHangId,
          giaTriDuKien: Number(coHoi.giaTriDuKien),
        },
      },
    });

    return coHoi;
  }

  /**
   * Story [S5-01, S6-02]: Lấy danh sách cơ hội có bộ lọc nâng cao và Data Scope
   */
  async layDanhSach(loc: LocCoHoiDto, currentUser: any) {
    const page = Math.max(Number(loc.page) || 1, 1);
    const limit = Math.max(Number(loc.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.CoHoiWhereInput = {};

    // 1. Phân quyền Data Scope
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null) {
      where.nguoiSoHuuId = { in: userIds };
    }

    // 2. Bộ lọc tìm kiếm
    if (loc.search) {
      const q = loc.search.trim();
      where.OR = [
        { maCoHoi: { contains: q, mode: 'insensitive' } },
        { tenCoHoi: { contains: q, mode: 'insensitive' } },
        { khachHang: { tenCongTy: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (loc.giaiDoanId) {
      where.giaiDoanId = loc.giaiDoanId;
    }

    if (loc.trangThai) {
      where.trangThai = loc.trangThai;
    }

    if (loc.nguoiSoHuuId) {
      // Nếu lọc cụ thể người sở hữu nhưng người gọi bị giới hạn data scope thì phải thuộc userIds
      if (userIds !== null && !userIds.includes(loc.nguoiSoHuuId)) {
        throw new ForbiddenException('Không có quyền xem cơ hội của nhân viên này');
      }
      where.nguoiSoHuuId = loc.nguoiSoHuuId;
    }

    if (loc.nhomKinhDoanhId) {
      where.nhomKinhDoanhId = loc.nhomKinhDoanhId;
    }

    if (loc.khachHangId) {
      where.khachHangId = loc.khachHangId;
    }

    if (loc.laDinhTre !== undefined) {
      where.laDinhTre = loc.laDinhTre;
    }

    if (loc.tuNgayChot || loc.denNgayChot) {
      where.ngayKyDuKien = {};
      if (loc.tuNgayChot) {
        where.ngayKyDuKien.gte = new Date(loc.tuNgayChot);
      }
      if (loc.denNgayChot) {
        const end = new Date(loc.denNgayChot);
        end.setHours(23, 59, 59, 999);
        where.ngayKyDuKien.lte = end;
      }
    }

    if (loc.giaTriTu !== undefined || loc.giaTriDen !== undefined) {
      where.giaTriDuKien = {};
      if (loc.giaTriTu !== undefined) {
        where.giaTriDuKien.gte = loc.giaTriTu;
      }
      if (loc.giaTriDen !== undefined) {
        where.giaTriDuKien.lte = loc.giaTriDen;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.coHoi.count({ where }),
      this.prisma.coHoi.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ laDinhTre: 'desc' }, { createdAt: 'desc' }],
        include: {
          khachHang: { select: { id: true, tenCongTy: true, maKhachHang: true } },
          nguoiLienHe: { select: { id: true, hoTen: true, soDienThoai: true, email: true } },
          giaiDoan: { select: { id: true, tenGiaiDoan: true, thuTu: true, xacSuatThang: true } },
          nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
          nhomKinhDoanh: { select: { id: true, tenNhom: true } },
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
   * Lấy chi tiết cơ hội 360 độ (kèm dòng sản phẩm, lịch sử giai đoạn và hoạt động)
   */
  async layChiTiet(id: string, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({
      where: { id },
      include: {
        khachHang: {
          select: {
            id: true,
            maKhachHang: true,
            tenCongTy: true,
            website: true,
            diaChi: true,
          },
        },
        nguoiLienHe: true,
        giaiDoan: true,
        nguoiSoHuu: {
          select: { id: true, hoTen: true, email: true, soDienThoai: true, avatarUrl: true },
        },
        nhomKinhDoanh: { select: { id: true, tenNhom: true, maNhom: true } },
        lyDoThangThua: true,
        doiThu: true,
        sanPhamCoHoi: {
          include: {
            sanPham: {
              select: { id: true, maSanPham: true, tenSanPham: true, donViTinh: true, giaNiemYet: true },
            },
          },
        },
        lichSuChuyenGiaiDoan: {
          orderBy: { createdAt: 'desc' },
          include: {
            giaiDoanTruoc: { select: { id: true, tenGiaiDoan: true } },
            giaiDoanSau: { select: { id: true, tenGiaiDoan: true } },
            nguoiThucHien: { select: { id: true, hoTen: true } },
          },
        },
      },
    });

    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội bán hàng');
    }

    // Kiểm tra quyền Data Scope
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin cơ hội này');
    }

    return coHoi;
  }

  /**
   * Cập nhật thông tin cơ hội bán hàng
   */
  async capNhat(id: string, dto: CapNhatCoHoiDto, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội bán hàng');
    }

    // Story [S5-05]: Cơ hội đã đóng không sửa được
    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội đã đóng (Thắng/Thua) không thể sửa đổi thông tin');
    }

    // Kiểm tra Data Scope
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa cơ hội này');
    }

    const updateData: Prisma.CoHoiUpdateInput = {
      tenCoHoi: dto.tenCoHoi,
      nguonCoHoi: dto.nguonCoHoi,
      moTa: dto.moTa,
      ghiChuXacSuat: dto.ghiChuXacSuat,
    };

    if (dto.nguoiLienHeId !== undefined) {
      updateData.nguoiLienHe = dto.nguoiLienHeId ? { connect: { id: dto.nguoiLienHeId } } : { disconnect: true };
    }

    if (dto.ngayKyDuKien) {
      updateData.ngayKyDuKien = new Date(dto.ngayKyDuKien);
    }

    // Nếu sửa xác suất, tính lại forecast
    if (dto.xacSuat !== undefined) {
      updateData.xacSuat = dto.xacSuat;
      updateData.duBaoGiaTri = (Number(coHoi.giaTriDuKien) * dto.xacSuat) / 100;
    }

    const updated = await this.prisma.coHoi.update({
      where: { id },
      data: updateData,
      include: {
        khachHang: { select: { id: true, tenCongTy: true } },
        giaiDoan: true,
        nguoiSoHuu: { select: { id: true, hoTen: true } },
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: id,
        hanhDong: 'SUA',
        giaTriTruoc: { tenCoHoi: coHoi.tenCoHoi, xacSuat: coHoi.xacSuat },
        giaTriSau: { tenCoHoi: updated.tenCoHoi, xacSuat: updated.xacSuat },
      },
    });

    return updated;
  }

  /**
   * Xóa cơ hội (chỉ Team Lead trở lên hoặc chủ sở hữu)
   */
  async xoa(id: string, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }

    const roles: string[] = currentUser.roles || [];
    const isLeadOrAdmin =
      roles.includes(VaiTroEnum.ADMIN) ||
      roles.includes(VaiTroEnum.DIRECTOR) ||
      roles.includes(VaiTroEnum.TEAM_LEAD);

    if (!isLeadOrAdmin && coHoi.nguoiSoHuuId !== currentUser.id) {
      throw new ForbiddenException('Bạn không có quyền xóa cơ hội này');
    }

    await this.prisma.coHoi.delete({ where: { id } });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: id,
        hanhDong: 'XOA',
        giaTriTruoc: { maCoHoi: coHoi.maCoHoi, tenCoHoi: coHoi.tenCoHoi },
      },
    });

    return { thanhCong: true, thongDiep: 'Đã xóa cơ hội thành công' };
  }

  /**
   * Story [S5-05]: Đóng cơ hội Thắng (Won)
   * Bắt buộc nhập giá trị chốt thực tế và ngày ký
   */
  async dongThang(id: string, dto: DongThangDto, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }
    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội này đã được đóng trước đó');
    }

    // Kiểm tra quyền
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên cơ hội này');
    }

    // Tìm giai đoạn Thắng nếu có
    const gdThang = await this.prisma.giaiDoanPipeline.findFirst({
      where: { OR: [{ xacSuatThang: 100 }, { maGiaiDoan: 'GD_05_CHOT_HOP_DONG' }] },
    });

    const updated = await this.prisma.coHoi.update({
      where: { id },
      data: {
        trangThai: TrangThaiCoHoi.DONG_THANG,
        giaTriThucTe: dto.giaTriThucTe,
        ngayDongThucTe: new Date(dto.ngayDongThucTe),
        xacSuat: 100,
        duBaoGiaTri: dto.giaTriThucTe,
        ghiChuDong: dto.ghiChuDong,
        giaiDoanId: gdThang ? gdThang.id : coHoi.giaiDoanId,
        laDinhTre: false,
      },
    });

    // Ghi nhận lịch sử chuyển giai đoạn nếu đổi sang stage thắng
    if (gdThang && gdThang.id !== coHoi.giaiDoanId) {
      await this.prisma.lichSuChuyenGiaiDoan.create({
        data: {
          coHoiId: id,
          giaiDoanTruocId: coHoi.giaiDoanId,
          giaiDoanSauId: gdThang.id,
          giaTriTruoc: coHoi.giaTriDuKien,
          giaTriSau: dto.giaTriThucTe,
          lyDoChuyen: 'Đóng Thắng cơ hội bán hàng',
          nguoiThucHienId: currentUser.id,
        },
      });
    }

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: id,
        hanhDong: 'DONG_THANG',
        giaTriSau: {
          giaTriThucTe: dto.giaTriThucTe,
          ngayDongThucTe: dto.ngayDongThucTe,
        },
      },
    });

    return updated;
  }

  /**
   * Story [S5-05]: Đóng cơ hội Thua (Lost)
   * Bắt buộc chọn lý do thua và đối thủ nếu có
   */
  async dongThua(id: string, dto: DongThuaDto, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }
    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội này đã được đóng trước đó');
    }

    // Kiểm tra lý do thua
    const lyDo = await this.prisma.lyDoThangThua.findUnique({
      where: { id: dto.lyDoThangThuaId },
    });
    if (!lyDo) {
      throw new NotFoundException('Lý do thua thầu không hợp lệ');
    }

    // Kiểm tra đối thủ nếu truyền
    if (dto.doiThuId) {
      const dt = await this.prisma.doiThu.findUnique({ where: { id: dto.doiThuId } });
      if (!dt) {
        throw new NotFoundException('Đối thủ cạnh tranh không tồn tại');
      }
    }

    // Kiểm tra quyền
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên cơ hội này');
    }

    // Tìm giai đoạn Thất bại nếu có
    const gdThua = await this.prisma.giaiDoanPipeline.findFirst({
      where: { OR: [{ xacSuatThang: 0 }, { maGiaiDoan: 'GD_06_DONG_THAT_BAI' }] },
    });

    const updated = await this.prisma.coHoi.update({
      where: { id },
      data: {
        trangThai: TrangThaiCoHoi.DONG_THUA,
        lyDoThangThuaId: dto.lyDoThangThuaId,
        doiThuId: dto.doiThuId,
        xacSuat: 0,
        duBaoGiaTri: 0,
        ghiChuDong: dto.ghiChuDong,
        giaiDoanId: gdThua ? gdThua.id : coHoi.giaiDoanId,
        laDinhTre: false,
      },
    });

    // Ghi nhận lịch sử chuyển giai đoạn nếu đổi sang stage thua
    if (gdThua && gdThua.id !== coHoi.giaiDoanId) {
      await this.prisma.lichSuChuyenGiaiDoan.create({
        data: {
          coHoiId: id,
          giaiDoanTruocId: coHoi.giaiDoanId,
          giaiDoanSauId: gdThua.id,
          giaTriTruoc: coHoi.giaTriDuKien,
          giaTriSau: coHoi.giaTriDuKien,
          lyDoChuyen: `Đóng Thua: ${lyDo.noiDung}`,
          nguoiThucHienId: currentUser.id,
        },
      });
    }

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: id,
        hanhDong: 'DONG_THUA',
        giaTriSau: {
          lyDoThangThuaId: dto.lyDoThangThuaId,
          doiThuId: dto.doiThuId,
        },
      },
    });

    return updated;
  }

  /**
   * Story [S5-05]: Mở lại cơ hội đã đóng (Chỉ Trưởng nhóm trở lên kèm lý do)
   */
  async moLai(id: string, dto: MoLaiCoHoiDto, currentUser: any) {
    const roles: string[] = currentUser.roles || [];
    const isTeamLeadOrAbove =
      roles.includes(VaiTroEnum.ADMIN) ||
      roles.includes(VaiTroEnum.DIRECTOR) ||
      roles.includes(VaiTroEnum.TEAM_LEAD);

    if (!isTeamLeadOrAbove) {
      throw new ForbiddenException('Chỉ Trưởng nhóm trở lên mới có quyền mở lại cơ hội đã đóng');
    }

    const coHoi = await this.prisma.coHoi.findUnique({ where: { id } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội bán hàng');
    }
    if (coHoi.trangThai === TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội này đang trong quá trình xử lý, không cần mở lại');
    }

    // Đưa về giai đoạn tiếp cận hoặc giai đoạn 2
    const defaultStage = await this.prisma.giaiDoanPipeline.findFirst({
      orderBy: { thuTu: 'asc' },
    });

    const xacSuat = defaultStage ? defaultStage.xacSuatThang : 10;
    const duBaoGiaTri = (Number(coHoi.giaTriDuKien) * xacSuat) / 100;

    const updated = await this.prisma.coHoi.update({
      where: { id },
      data: {
        trangThai: TrangThaiCoHoi.DANG_XU_LY,
        giaiDoanId: defaultStage ? defaultStage.id : coHoi.giaiDoanId,
        xacSuat,
        duBaoGiaTri,
        ghiChuDong: `[MỞ LẠI lúc ${new Date().toISOString()}] Lý do: ${dto.lyDoMoLai}`,
        lyDoThangThuaId: null,
        doiThuId: null,
        giaTriThucTe: null,
        ngayDongThucTe: null,
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: id,
        hanhDong: 'MO_LAI_CO_HOI',
        giaTriSau: {
          lyDoMoLai: dto.lyDoMoLai,
          trangThaiMoi: TrangThaiCoHoi.DANG_XU_LY,
        },
      },
    });

    return updated;
  }

  /**
   * Story [S5-08]: Bàn giao / Phân bổ lại quyền sở hữu cơ hội
   */
  async banGiao(id: string, dto: BanGiaoCoHoiDto, currentUser: any) {
    const roles: string[] = currentUser.roles || [];
    const isTeamLeadOrAbove =
      roles.includes(VaiTroEnum.ADMIN) ||
      roles.includes(VaiTroEnum.DIRECTOR) ||
      roles.includes(VaiTroEnum.TEAM_LEAD);

    const coHoi = await this.prisma.coHoi.findUnique({ where: { id } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }

    // Chỉ chủ sở hữu hoặc Trưởng nhóm trở lên được bàn giao
    if (!isTeamLeadOrAbove && coHoi.nguoiSoHuuId !== currentUser.id) {
      throw new ForbiddenException('Bạn không có quyền chuyển quyền sở hữu cơ hội này');
    }

    const nguoiMoi = await this.prisma.nguoiDung.findUnique({
      where: { id: dto.nguoiSoHuuMoiId },
      select: { id: true, hoTen: true, email: true, nhomKinhDoanhId: true },
    });
    if (!nguoiMoi) {
      throw new NotFoundException('Người nhận bàn giao không tồn tại');
    }

    const updated = await this.prisma.coHoi.update({
      where: { id },
      data: {
        nguoiSoHuuId: nguoiMoi.id,
        nhomKinhDoanhId: nguoiMoi.nhomKinhDoanhId,
      },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
      },
    });

    // Ghi lịch sử chuyển giai đoạn/người sở hữu
    await this.prisma.lichSuChuyenGiaiDoan.create({
      data: {
        coHoiId: id,
        giaiDoanTruocId: coHoi.giaiDoanId,
        giaiDoanSauId: coHoi.giaiDoanId,
        nguoiSoHuuTruocId: coHoi.nguoiSoHuuId,
        nguoiSoHuuSauId: nguoiMoi.id,
        lyDoChuyen: `Bàn giao sở hữu: ${dto.lyDoBanGiao}`,
        nguoiThucHienId: currentUser.id,
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'CO_HOI',
        doiTuongId: id,
        hanhDong: 'BAN_GIAO_CO_HOI',
        giaTriTruoc: { nguoiSoHuuId: coHoi.nguoiSoHuuId },
        giaTriSau: { nguoiSoHuuId: nguoiMoi.id, lyDo: dto.lyDoBanGiao },
      },
    });

    return updated;
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaoNguoiDungDto } from './dto/tao-nguoi-dung.dto';
import { CapNhatNguoiDungDto } from './dto/cap-nhat-nguoi-dung.dto';
import { CapNhatHoSoDto, KhoaVaBanGiaoDto } from './dto/khoa-va-ban-giao.dto';
import { TrangThaiNguoiDung, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { VaiTroEnum } from '../../common/enums/role.enum';

@Injectable()
export class NguoiDungService {
  constructor(private prisma: PrismaService) {}

  /**
   * Story [S1-08]: Tìm kiếm, lọc theo vai trò/trạng thái/nhóm, phân trang mặc định 20 dòng
   */
  async layDanhSach(params: {
    page?: number;
    limit?: number;
    tuKhoa?: string;
    vaiTro?: string;
    trangThai?: TrangThaiNguoiDung;
    nhomKinhDoanhId?: string;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.max(Number(params.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.NguoiDungWhereInput = {};

    if (params.tuKhoa) {
      const q = params.tuKhoa.trim();
      where.OR = [
        { hoTen: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { soDienThoai: { contains: q } },
      ];
    }

    if (params.trangThai) {
      where.trangThai = params.trangThai;
    }

    if (params.nhomKinhDoanhId) {
      where.nhomKinhDoanhId = params.nhomKinhDoanhId;
    }

    if (params.vaiTro) {
      where.vaiTro = {
        some: {
          vaiTro: {
            maVaiTro: params.vaiTro,
          },
        },
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.nguoiDung.count({ where }),
      this.prisma.nguoiDung.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vaiTro: { include: { vaiTro: true } },
          nhomKinhDoanh: { include: { khuVuc: true } },
        },
      }),
    ]);

    const formatted = items.map((u) => ({
      id: u.id,
      email: u.email,
      hoTen: u.hoTen,
      soDienThoai: u.soDienThoai,
      chuKyEmail: u.chuKyEmail,
      avatarUrl: u.avatarUrl,
      trangThai: u.trangThai,
      lanDangNhapCuoi: u.lanDangNhapCuoi,
      createdAt: u.createdAt,
      roles: u.vaiTro.map((vt) => vt.vaiTro.maVaiTro),
      tenVaiTro: u.vaiTro.map((vt) => vt.vaiTro.tenVaiTro).join(', '),
      nhomKinhDoanh: u.nhomKinhDoanh
        ? {
            id: u.nhomKinhDoanh.id,
            maNhom: u.nhomKinhDoanh.maNhom,
            tenNhom: u.nhomKinhDoanh.tenNhom,
            khuVuc: u.nhomKinhDoanh.khuVuc?.tenKhuVuc || null,
          }
        : null,
    }));

    return {
      duLieu: formatted,
      tongSo: total,
      trangHienTai: page,
      soLuongMoiTrang: limit,
      tongSoTrang: Math.ceil(total / limit),
    };
  }

  /**
   * Xem chi tiết người dùng
   */
  async layChiTiet(id: string) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { id },
      include: {
        vaiTro: { include: { vaiTro: true } },
        nhomKinhDoanh: { include: { khuVuc: true, truongNhom: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng này');
    }

    return {
      id: user.id,
      email: user.email,
      hoTen: user.hoTen,
      soDienThoai: user.soDienThoai,
      chuKyEmail: user.chuKyEmail,
      avatarUrl: user.avatarUrl,
      trangThai: user.trangThai,
      lanDangNhapCuoi: user.lanDangNhapCuoi,
      createdAt: user.createdAt,
      roles: user.vaiTro.map((vt) => vt.vaiTro.maVaiTro),
      nhomKinhDoanh: user.nhomKinhDoanh
        ? {
            id: user.nhomKinhDoanh.id,
            maNhom: user.nhomKinhDoanh.maNhom,
            tenNhom: user.nhomKinhDoanh.tenNhom,
            khuVuc: user.nhomKinhDoanh.khuVuc?.tenKhuVuc || null,
          }
        : null,
    };
  }

  /**
   * Story [S1-08] & [S1-09]: Tạo tài khoản người dùng, email trùng bị từ chối
   */
  async taoNguoiDung(dto: TaoNguoiDungDto, adminId: string) {
    const emailLower = dto.email.toLowerCase().trim();

    const existing = await this.prisma.nguoiDung.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      throw new BadRequestException(`Email "${dto.email}" đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.`);
    }

    // Story [S1-09]: Người giữ vai trò Trưởng nhóm phải được gán một nhóm cụ thể
    if (dto.roleCodes.includes(VaiTroEnum.TEAM_LEAD) && !dto.nhomKinhDoanhId) {
      throw new BadRequestException('Người giữ vai trò Trưởng nhóm (TEAM_LEAD) bắt buộc phải được gắn vào một nhóm kinh doanh cụ thể');
    }

    // Lấy các vai trò hợp lệ
    const roles = await this.prisma.vaiTro.findMany({
      where: { maVaiTro: { in: dto.roleCodes } },
    });

    if (roles.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một vai trò hợp lệ trong hệ thống');
    }

    // Mật khẩu tạm thời mặc định
    const matKhauTam = 'Password@123';
    const matKhauHash = await bcrypt.hash(matKhauTam, 10);

    const user = await this.prisma.nguoiDung.create({
      data: {
        email: emailLower,
        hoTen: dto.hoTen,
        soDienThoai: dto.soDienThoai,
        chuKyEmail: dto.chuKyEmail,
        nhomKinhDoanhId: dto.nhomKinhDoanhId || null,
        matKhauHash,
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
        vaiTro: {
          create: roles.map((r) => ({
            vaiTroId: r.id,
          })),
        },
      },
      include: {
        vaiTro: { include: { vaiTro: true } },
      },
    });

    // Ghi nhật ký Audit Log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: adminId,
        loaiDoiTuong: 'NGUOI_DUNG',
        doiTuongId: user.id,
        hanhDong: 'TAO',
        giaTriSau: {
          email: user.email,
          hoTen: user.hoTen,
          roles: dto.roleCodes,
          nhomKinhDoanhId: dto.nhomKinhDoanhId,
        },
      },
    });

    return {
      thanhCong: true,
      thongDiep: `Tạo tài khoản thành công cho ${user.hoTen}. Mật khẩu tạm thời được cấp là: ${matKhauTam}`,
      nguoiDung: {
        id: user.id,
        email: user.email,
        hoTen: user.hoTen,
        matKhauTam,
      },
    };
  }

  /**
   * Story [S1-08] & [S1-09]: Cập nhật người dùng, gán vai trò/nhóm, không tự thu hồi vai trò admin của chính mình
   */
  async capNhatNguoiDung(id: string, dto: CapNhatNguoiDungDto, adminId: string) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { id },
      include: { vaiTro: { include: { vaiTro: true } } },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const currentRoles = user.vaiTro.map((vt) => vt.vaiTro.maVaiTro);

    // Story [S1-09]: Không thể tự thu hồi vai trò quản trị của chính mình
    if (id === adminId && currentRoles.includes(VaiTroEnum.ADMIN)) {
      if (dto.roleCodes && !dto.roleCodes.includes(VaiTroEnum.ADMIN)) {
        throw new ForbiddenException('Bạn không thể tự thu hồi vai trò Quản trị viên (ADMIN) của chính mình');
      }
      if (dto.trangThai === TrangThaiNguoiDung.DA_KHOA) {
        throw new ForbiddenException('Bạn không thể tự khóa tài khoản của chính mình');
      }
    }

    // Kiểm tra gán Trưởng nhóm
    const targetRoles = dto.roleCodes !== undefined ? dto.roleCodes : currentRoles;
    const targetTeamId = dto.nhomKinhDoanhId !== undefined ? dto.nhomKinhDoanhId : user.nhomKinhDoanhId;

    if (targetRoles.includes(VaiTroEnum.TEAM_LEAD) && !targetTeamId) {
      throw new BadRequestException('Người giữ vai trò Trưởng nhóm (TEAM_LEAD) bắt buộc phải được gắn vào một nhóm kinh doanh cụ thể');
    }

    const updateData: Prisma.NguoiDungUpdateInput = {};
    if (dto.hoTen !== undefined) updateData.hoTen = dto.hoTen;
    if (dto.soDienThoai !== undefined) updateData.soDienThoai = dto.soDienThoai;
    if (dto.chuKyEmail !== undefined) updateData.chuKyEmail = dto.chuKyEmail;
    if (dto.nhomKinhDoanhId !== undefined) {
      updateData.nhomKinhDoanh = dto.nhomKinhDoanhId ? { connect: { id: dto.nhomKinhDoanhId } } : { disconnect: true };
    }
    if (dto.trangThai !== undefined) updateData.trangThai = dto.trangThai;

    // Cập nhật vai trò nếu có
    if (dto.roleCodes) {
      const validRoles = await this.prisma.vaiTro.findMany({
        where: { maVaiTro: { in: dto.roleCodes } },
      });

      // Xóa vai trò cũ và thêm mới
      await this.prisma.nguoiDungVaiTro.deleteMany({ where: { nguoiDungId: id } });
      await this.prisma.nguoiDungVaiTro.createMany({
        data: validRoles.map((r) => ({
          nguoiDungId: id,
          vaiTroId: r.id,
        })),
      });
    }

    const updated = await this.prisma.nguoiDung.update({
      where: { id },
      data: updateData,
      include: {
        vaiTro: { include: { vaiTro: true } },
        nhomKinhDoanh: true,
      },
    });

    // Ghi nhật ký Audit Log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: adminId,
        loaiDoiTuong: 'NGUOI_DUNG',
        doiTuongId: id,
        hanhDong: 'SUA',
        giaTriTruoc: {
          hoTen: user.hoTen,
          roles: currentRoles,
          nhomKinhDoanhId: user.nhomKinhDoanhId,
          trangThai: user.trangThai,
        },
        giaTriSau: {
          hoTen: updated.hoTen,
          roles: updated.vaiTro.map((vt) => vt.vaiTro.maVaiTro),
          nhomKinhDoanhId: updated.nhomKinhDoanhId,
          trangThai: updated.trangThai,
        },
      },
    });

    return {
      thanhCong: true,
      thongDiep: 'Cập nhật thông tin người dùng thành công',
      nguoiDung: updated,
    };
  }

  /**
   * Story [S2-02]: Người dùng tự cập nhật hồ sơ cá nhân (không đổi email, nhóm, vai trò)
   */
  async capNhatHoSo(id: string, dto: CapNhatHoSoDto) {
    const updated = await this.prisma.nguoiDung.update({
      where: { id },
      data: {
        hoTen: dto.hoTen,
        soDienThoai: dto.soDienThoai,
        chuKyEmail: dto.chuKyEmail,
      },
    });

    return {
      thanhCong: true,
      thongDiep: 'Cập nhật hồ sơ cá nhân thành công',
      nguoiDung: {
        id: updated.id,
        hoTen: updated.hoTen,
        soDienThoai: updated.soDienThoai,
        chuKyEmail: updated.chuKyEmail,
      },
    };
  }

  /**
   * Story [S1-10]: Khóa tài khoản và bàn giao dữ liệu khi nhân viên nghỉ
   */
  async khoaVaBanGiao(id: string, dto: KhoaVaBanGiaoDto, adminId: string) {
    if (id === adminId) {
      throw new ForbiddenException('Bạn không thể tự khóa tài khoản của chính mình');
    }

    if (id === dto.nguoiTiepNhanId) {
      throw new BadRequestException('Người tiếp nhận dữ liệu phải là một người dùng khác');
    }

    const [user, receiver] = await Promise.all([
      this.prisma.nguoiDung.findUnique({ where: { id } }),
      this.prisma.nguoiDung.findUnique({ where: { id: dto.nguoiTiepNhanId } }),
    ]);

    if (!user) throw new NotFoundException('Không tìm thấy người dùng cần khóa');
    if (!receiver) throw new NotFoundException('Không tìm thấy người tiếp nhận bàn giao');

    if (receiver.trangThai === TrangThaiNguoiDung.DA_KHOA) {
      throw new BadRequestException('Người tiếp nhận dữ liệu đang trong trạng thái Đã Khóa. Vui lòng chọn người dùng đang hoạt động.');
    }

    // 1. Cập nhật trạng thái khóa tài khoản
    await this.prisma.nguoiDung.update({
      where: { id },
      data: { trangThai: TrangThaiNguoiDung.DA_KHOA },
    });

    // 2. Thu hồi toàn bộ phiên đăng nhập đang hoạt động
    await this.prisma.phienDangNhap.updateMany({
      where: { nguoiDungId: id },
      data: { daThuHoi: true },
    });

    // 3. Ghi nhật ký Audit Log bàn giao dữ liệu
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: adminId,
        loaiDoiTuong: 'QUYEN_SO_HUU',
        doiTuongId: id,
        hanhDong: 'BAN_GIAO',
        giaTriTruoc: {
          nguoiBiKhoa: { id: user.id, hoTen: user.hoTen, email: user.email },
        },
        giaTriSau: {
          nguoiTiepNhan: { id: receiver.id, hoTen: receiver.hoTen, email: receiver.email },
          lyDo: dto.lyDo || 'Nhân viên nghỉ việc hoặc chuyển công tác',
        },
      },
    });

    return {
      thanhCong: true,
      thongDiep: `Đã khóa tài khoản ${user.hoTen} thành công và thiết lập bàn giao toàn bộ dữ liệu cho ${receiver.hoTen}. Mọi phiên làm việc đã bị thu hồi.`,
    };
  }
}

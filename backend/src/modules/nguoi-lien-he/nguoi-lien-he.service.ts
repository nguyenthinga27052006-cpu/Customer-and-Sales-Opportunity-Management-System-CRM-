import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DataScopeService } from '../../common/services/data-scope.service';
import {
  TaoNguoiLienHeDto,
  CapNhatNguoiLienHeDto,
  ChuyenKhachHangDto,
} from './dto/nguoi-lien-he.dto';

@Injectable()
export class NguoiLienHeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Kiểm tra quyền Data Scope của người dùng với khách hàng
   */
  private async kiemTraQuyenKhachHang(khachHangId: string, currentUser: any) {
    const khachHang = await this.prisma.khachHang.findUnique({
      where: { id: khachHangId },
      select: { id: true, nguoiSoHuuId: true, tenCongTy: true, daGopVaoId: true },
    });

    if (!khachHang || khachHang.daGopVaoId) {
      throw new NotFoundException('Khách hàng không tồn tại hoặc đã bị gộp');
    }

    const allowedUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (allowedUserIds !== null && !allowedUserIds.includes(khachHang.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách hàng này');
    }

    return khachHang;
  }

  /**
   * S3-02: Lấy danh sách người liên hệ của một khách hàng
   */
  async layDanhSachTheoKhachHang(khachHangId: string, currentUser: any) {
    await this.kiemTraQuyenKhachHang(khachHangId, currentUser);

    return this.prisma.nguoiLienHe.findMany({
      where: { khachHangId },
      orderBy: [{ laDauMoiChinh: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Lấy chi tiết một người liên hệ
   */
  async layChiTiet(id: string, currentUser: any) {
    const contact = await this.prisma.nguoiLienHe.findUnique({
      where: { id },
      include: {
        khachHang: {
          select: { id: true, tenCongTy: true, maKhachHang: true, nguoiSoHuuId: true },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Không tìm thấy thông tin người liên hệ');
    }

    await this.kiemTraQuyenKhachHang(contact.khachHangId, currentUser);

    return contact;
  }

  /**
   * S3-02: Thêm mới người liên hệ cho khách hàng
   */
  async taoNguoiLienHe(khachHangId: string, dto: TaoNguoiLienHeDto, currentUser: any) {
    const khachHang = await this.kiemTraQuyenKhachHang(khachHangId, currentUser);

    // Nếu đánh dấu là đầu mối chính, reset các liên hệ khác của khách hàng này
    if (dto.laDauMoiChinh) {
      await this.prisma.nguoiLienHe.updateMany({
        where: { khachHangId, laDauMoiChinh: true },
        data: { laDauMoiChinh: false },
      });
    }

    const contact = await this.prisma.nguoiLienHe.create({
      data: {
        khachHangId,
        hoTen: dto.hoTen.trim(),
        chucDanh: dto.chucDanh?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        soDienThoai: dto.soDienThoai?.trim() || null,
        vaiTroQuyetDinh: dto.vaiTroQuyetDinh || 'NGUOI_DUNG_CUOI',
        laDauMoiChinh: dto.laDauMoiChinh || false,
        ghiChu: dto.ghiChu?.trim() || null,
      },
    });

    // Ghi nhận hoạt động
    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: `Thêm người liên hệ: ${contact.hoTen}`,
        noiDung: `Chức danh: ${contact.chucDanh || 'N/A'}, Vai trò: ${contact.vaiTroQuyetDinh}`,
        khachHangId,
        nguoiLienHeId: contact.id,
        nguoiThucHienId: currentUser.id,
      },
    });

    return contact;
  }

  /**
   * S3-02: Cập nhật thông tin người liên hệ
   */
  async capNhat(id: string, dto: CapNhatNguoiLienHeDto, currentUser: any) {
    const existing = await this.layChiTiet(id, currentUser);

    // Nếu đặt làm đầu mối chính, reset các liên hệ khác
    if ((dto as any).laDauMoiChinh === true) {
      await this.prisma.nguoiLienHe.updateMany({
        where: { khachHangId: existing.khachHangId, id: { not: id } },
        data: { laDauMoiChinh: false },
      });
    }

    const updated = await this.prisma.nguoiLienHe.update({
      where: { id },
      data: {
        ...(dto as any),
      },
    });

    return updated;
  }

  /**
   * Xóa người liên hệ
   */
  async xoa(id: string, currentUser: any) {
    const contact = await this.layChiTiet(id, currentUser);

    await this.prisma.nguoiLienHe.delete({ where: { id } });

    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: `Đã xóa người liên hệ: ${contact.hoTen}`,
        khachHangId: contact.khachHangId,
        nguoiThucHienId: currentUser.id,
      },
    });

    return { message: 'Đã xóa người liên hệ thành công' };
  }

  /**
   * S3-02: Chuyển người liên hệ sang khách hàng khác và bảo toàn lịch sử hoạt động
   */
  async chuyenKhachHang(id: string, dto: ChuyenKhachHangDto, currentUser: any) {
    const contact = await this.layChiTiet(id, currentUser);
    const khachHangCu = contact.khachHang;

    const khachHangMoi = await this.kiemTraQuyenKhachHang(dto.khachHangMoiId, currentUser);

    if (khachHangCu.id === khachHangMoi.id) {
      throw new BadRequestException('Khách hàng mới trùng với khách hàng hiện tại');
    }

    // Cập nhật người liên hệ sang khách hàng mới (laDauMoiChinh mặc định false để tránh xung đột)
    const updated = await this.prisma.nguoiLienHe.update({
      where: { id },
      data: {
        khachHangId: khachHangMoi.id,
        laDauMoiChinh: false,
      },
    });

    // Tạo bản ghi hoạt động trên khách hàng cũ
    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: `Chuyển người liên hệ ${contact.hoTen} sang công ty mới`,
        noiDung: `Đã chuyển sang ${khachHangMoi.tenCongTy}. Lý do: ${dto.lyDo || 'Thay đổi nơi công tác'}`,
        khachHangId: khachHangCu.id,
        nguoiThucHienId: currentUser.id,
      },
    });

    // Tạo bản ghi hoạt động trên khách hàng mới (bảo toàn lịch sử)
    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: `Tiếp nhận người liên hệ: ${contact.hoTen}`,
        noiDung: `Chuyển từ ${khachHangCu.tenCongTy}. Chức danh: ${contact.chucDanh || 'N/A'}. Lý do: ${dto.lyDo || 'Thay đổi nơi công tác'}`,
        khachHangId: khachHangMoi.id,
        nguoiLienHeId: contact.id,
        nguoiThucHienId: currentUser.id,
      },
    });

    return {
      message: `Đã chuyển người liên hệ ${contact.hoTen} từ ${khachHangCu.tenCongTy} sang ${khachHangMoi.tenCongTy} thành công`,
      nguoiLienHe: updated,
    };
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaoSanPhamDto, CapNhatSanPhamDto } from './dto/tao-san-pham.dto';
import { LoaiSanPham, TrangThaiSanPham, Prisma } from '@prisma/client';
import { VaiTroEnum } from '../../common/enums/role.enum';

@Injectable()
export class SanPhamService {
  constructor(private prisma: PrismaService) {}

  /**
   * Story [S2-05]: Lấy danh sách sản phẩm & bảng giá niêm yết
   * BẢO MẬT: Giá vốn (giaVon) CHỈ hiển thị với vai trò DIRECTOR hoặc ADMIN
   */
  async layDanhSach(
    params: {
      tuKhoa?: string;
      loaiSanPham?: LoaiSanPham;
      trangThai?: TrangThaiSanPham;
    },
    userRoles: string[],
  ) {
    const where: Prisma.SanPhamWhereInput = {};

    if (params.tuKhoa) {
      const q = params.tuKhoa.trim();
      where.OR = [
        { maSanPham: { contains: q, mode: 'insensitive' } },
        { tenSanPham: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.loaiSanPham) {
      where.loaiSanPham = params.loaiSanPham;
    }

    if (params.trangThai) {
      where.trangThai = params.trangThai;
    }

    const products = await this.prisma.sanPham.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const isDirectorOrAdmin =
      userRoles.includes(VaiTroEnum.ADMIN) || userRoles.includes(VaiTroEnum.DIRECTOR);

    return products.map((sp) => {
      const { giaVon, ...publicFields } = sp;
      return {
        ...publicFields,
        ...(isDirectorOrAdmin ? { giaVon } : {}),
      };
    });
  }

  /**
   * Lấy chi tiết sản phẩm
   */
  async layChiTiet(id: string, userRoles: string[]) {
    const sp = await this.prisma.sanPham.findUnique({ where: { id } });
    if (!sp) {
      throw new NotFoundException('Không tìm thấy sản phẩm này');
    }

    const isDirectorOrAdmin =
      userRoles.includes(VaiTroEnum.ADMIN) || userRoles.includes(VaiTroEnum.DIRECTOR);

    const { giaVon, ...publicFields } = sp;
    return {
      ...publicFields,
      ...(isDirectorOrAdmin ? { giaVon } : {}),
    };
  }

  /**
   * Story [S2-05]: Tạo sản phẩm mới
   */
  async taoSanPham(dto: TaoSanPhamDto, userRoles: string[], userId: string) {
    const isDirectorOrAdmin =
      userRoles.includes(VaiTroEnum.ADMIN) || userRoles.includes(VaiTroEnum.DIRECTOR);

    if (dto.giaSan > dto.giaNiemYet) {
      throw new BadRequestException('Giá sàn (ngưỡng duyệt chiết khấu) không được vượt quá giá niêm yết');
    }

    const existing = await this.prisma.sanPham.findUnique({
      where: { maSanPham: dto.maSanPham },
    });
    if (existing) {
      throw new BadRequestException(`Mã sản phẩm "${dto.maSanPham}" đã tồn tại`);
    }

    const giaVon = isDirectorOrAdmin ? dto.giaVon || 0 : 0;

    const sp = await this.prisma.sanPham.create({
      data: {
        maSanPham: dto.maSanPham,
        tenSanPham: dto.tenSanPham,
        loaiSanPham: dto.loaiSanPham,
        donViTinh: dto.donViTinh,
        giaNiemYet: dto.giaNiemYet,
        giaSan: dto.giaSan,
        giaVon: giaVon,
        moTa: dto.moTa || null,
        trangThai: TrangThaiSanPham.DANG_KINH_DOANH,
      },
    });

    // Ghi nhật ký Audit Log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: userId,
        loaiDoiTuong: 'SAN_PHAM',
        doiTuongId: sp.id,
        hanhDong: 'TAO',
        giaTriSau: {
          maSanPham: sp.maSanPham,
          tenSanPham: sp.tenSanPham,
          giaNiemYet: sp.giaNiemYet,
          giaSan: sp.giaSan,
        },
      },
    });

    return sp;
  }

  /**
   * Story [S2-05]: Cập nhật sản phẩm & bảng giá
   */
  async capNhatSanPham(
    id: string,
    dto: CapNhatSanPhamDto,
    userRoles: string[],
    userId: string,
  ) {
    const sp = await this.prisma.sanPham.findUnique({ where: { id } });
    if (!sp) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const isDirectorOrAdmin =
      userRoles.includes(VaiTroEnum.ADMIN) || userRoles.includes(VaiTroEnum.DIRECTOR);

    const updateGiaNiemYet = dto.giaNiemYet !== undefined ? dto.giaNiemYet : Number(sp.giaNiemYet);
    const updateGiaSan = dto.giaSan !== undefined ? dto.giaSan : Number(sp.giaSan);

    if (updateGiaSan > updateGiaNiemYet) {
      throw new BadRequestException('Giá sàn không được lớn hơn giá niêm yết');
    }

    const data: Prisma.SanPhamUpdateInput = {};
    if (dto.tenSanPham !== undefined) data.tenSanPham = dto.tenSanPham;
    if (dto.loaiSanPham !== undefined) data.loaiSanPham = dto.loaiSanPham;
    if (dto.donViTinh !== undefined) data.donViTinh = dto.donViTinh;
    if (dto.giaNiemYet !== undefined) data.giaNiemYet = dto.giaNiemYet;
    if (dto.giaSan !== undefined) data.giaSan = dto.giaSan;
    if (dto.trangThai !== undefined) data.trangThai = dto.trangThai;
    if (dto.moTa !== undefined) data.moTa = dto.moTa;

    // Giá vốn chỉ Director/Admin mới được cập nhật
    if (isDirectorOrAdmin && dto.giaVon !== undefined) {
      data.giaVon = dto.giaVon;
    }

    const updated = await this.prisma.sanPham.update({
      where: { id },
      data,
    });

    // Ghi nhật ký Audit Log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: userId,
        loaiDoiTuong: 'SAN_PHAM',
        doiTuongId: id,
        hanhDong: 'SUA',
        giaTriTruoc: {
          giaNiemYet: sp.giaNiemYet,
          giaSan: sp.giaSan,
          trangThai: sp.trangThai,
        },
        giaTriSau: {
          giaNiemYet: updated.giaNiemYet,
          giaSan: updated.giaSan,
          trangThai: updated.trangThai,
        },
      },
    });

    const { giaVon, ...publicFields } = updated;
    return {
      ...publicFields,
      ...(isDirectorOrAdmin ? { giaVon } : {}),
    };
  }

  /**
   * Ngừng kinh doanh hoặc xóa sản phẩm
   * Quy tắc nghiệp vụ S2-05: Sản phẩm đã xuất hiện trong báo giá thì không xoá được, chỉ ngừng kinh doanh
   */
  async xoaSanPham(id: string) {
    const sp = await this.prisma.sanPham.findUnique({ where: { id } });
    if (!sp) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Chuyển trạng thái sang ngừng kinh doanh an toàn
    await this.prisma.sanPham.update({
      where: { id },
      data: { trangThai: TrangThaiSanPham.NGUNG_KINH_DOANH },
    });

    return {
      thanhCong: true,
      thongDiep: `Sản phẩm "${sp.tenSanPham}" đã được chuyển sang trạng thái Ngừng kinh doanh an toàn.`,
    };
  }
}

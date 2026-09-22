import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { ThemSanPhamCoHoiDto, CapNhatSanPhamCoHoiDto } from '../dto/co-hoi-san-pham.dto';
import { LoaiSanPham, TrangThaiCoHoi, Prisma } from '@prisma/client';

@Injectable()
export class CoHoiProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Tính toán lại tổng giá trị cơ hội và dự báo từ các dòng sản phẩm
   */
  private async capNhatGiaTriCoHoi(coHoiId: string, tx: any) {
    const items = await tx.coHoiSanPham.findMany({
      where: { coHoiId },
    });

    const tongGiaTri = items.reduce((sum: number, item: any) => sum + Number(item.thanhTien), 0);

    const coHoi = await tx.coHoi.findUnique({
      where: { id: coHoiId },
      select: { xacSuat: true },
    });

    const xacSuat = coHoi ? coHoi.xacSuat : 10;
    const duBaoGiaTri = (tongGiaTri * xacSuat) / 100;

    await tx.coHoi.update({
      where: { id: coHoiId },
      data: {
        giaTriDuKien: tongGiaTri,
        duBaoGiaTri,
        ngayHoatDongCuoi: new Date(),
      },
    });

    return { giaTriDuKien: tongGiaTri, duBaoGiaTri };
  }

  /**
   * Story [S5-03]: Thêm sản phẩm dịch vụ vào cơ hội
   */
  async themSanPham(coHoiId: string, dto: ThemSanPhamCoHoiDto, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id: coHoiId } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }
    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội đã đóng không thể thêm sản phẩm');
    }

    // Kiểm tra Data Scope
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền thêm sản phẩm cho cơ hội này');
    }

    const sanPham = await this.prisma.sanPham.findUnique({
      where: { id: dto.sanPhamId },
    });
    if (!sanPham) {
      throw new NotFoundException('Sản phẩm không tồn tại trong danh mục');
    }

    // Lấy đơn giá mặc định từ bảng giá nếu không truyền
    const donGia = dto.donGia !== undefined ? dto.donGia : Number(sanPham.giaNiemYet);
    const soLuong = dto.soLuong || 1;
    let chietKhauPhanTram = dto.chietKhauPhanTram || 0;
    let chietKhauSoTien = dto.chietKhauSoTien || 0;

    if (chietKhauPhanTram > 0 && chietKhauSoTien === 0) {
      chietKhauSoTien = (soLuong * donGia * chietKhauPhanTram) / 100;
    } else if (chietKhauSoTien > 0 && chietKhauPhanTram === 0) {
      chietKhauPhanTram = ((chietKhauSoTien / (soLuong * donGia)) * 100);
    }

    let soKyThueBao = dto.soKyThueBao || 1;
    let giaTriNam: number | null = null;
    let baseTotal = soLuong * donGia;

    if (sanPham.loaiSanPham === LoaiSanPham.THUE_BAO) {
      // Đối với thuê bao: tính theo số kỳ (tháng)
      baseTotal = soLuong * donGia * soKyThueBao;
      giaTriNam = soLuong * donGia * 12;
    }

    const thanhTien = Math.max(baseTotal - chietKhauSoTien, 0);

    return this.prisma.$transaction(async (tx) => {
      const lineItem = await tx.coHoiSanPham.create({
        data: {
          coHoiId,
          sanPhamId: dto.sanPhamId,
          soLuong,
          donGia,
          chietKhauPhanTram,
          chietKhauSoTien,
          thanhTien,
          soKyThueBao,
          giaTriNam,
          ghiChu: dto.ghiChu,
        },
        include: {
          sanPham: { select: { id: true, maSanPham: true, tenSanPham: true, donViTinh: true } },
        },
      });

      const { giaTriDuKien, duBaoGiaTri } = await this.capNhatGiaTriCoHoi(coHoiId, tx);

      return {
        lineItem,
        tongGiaTriCoHoi: giaTriDuKien,
        duBaoGiaTri,
      };
    });
  }

  /**
   * Cập nhật dòng sản phẩm trong cơ hội
   */
  async capNhatSanPham(coHoiId: string, itemId: string, dto: CapNhatSanPhamCoHoiDto, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id: coHoiId } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }
    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội đã đóng không thể chỉnh sửa sản phẩm');
    }

    const currentItem = await this.prisma.coHoiSanPham.findFirst({
      where: { id: itemId, coHoiId },
      include: { sanPham: true },
    });
    if (!currentItem) {
      throw new NotFoundException('Không tìm thấy dòng sản phẩm');
    }

    const soLuong = dto.soLuong !== undefined ? dto.soLuong : currentItem.soLuong;
    const donGia = dto.donGia !== undefined ? dto.donGia : Number(currentItem.donGia);
    let chietKhauPhanTram =
      dto.chietKhauPhanTram !== undefined ? dto.chietKhauPhanTram : Number(currentItem.chietKhauPhanTram);
    let chietKhauSoTien =
      dto.chietKhauSoTien !== undefined ? dto.chietKhauSoTien : Number(currentItem.chietKhauSoTien);

    let soKyThueBao =
      dto.soKyThueBao !== undefined ? dto.soKyThueBao : currentItem.soKyThueBao || 1;
    let baseTotal = soLuong * donGia;
    let giaTriNam = currentItem.giaTriNam;

    if (currentItem.sanPham.loaiSanPham === LoaiSanPham.THUE_BAO) {
      baseTotal = soLuong * donGia * soKyThueBao;
      giaTriNam = new Prisma.Decimal(soLuong * donGia * 12);
    }

    if (dto.chietKhauPhanTram !== undefined) {
      chietKhauSoTien = (baseTotal * chietKhauPhanTram) / 100;
    }

    const thanhTien = Math.max(baseTotal - chietKhauSoTien, 0);

    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.coHoiSanPham.update({
        where: { id: itemId },
        data: {
          soLuong,
          donGia,
          chietKhauPhanTram,
          chietKhauSoTien,
          thanhTien,
          soKyThueBao,
          giaTriNam,
          ghiChu: dto.ghiChu !== undefined ? dto.ghiChu : currentItem.ghiChu,
        },
        include: {
          sanPham: { select: { id: true, maSanPham: true, tenSanPham: true, donViTinh: true } },
        },
      });

      const { giaTriDuKien, duBaoGiaTri } = await this.capNhatGiaTriCoHoi(coHoiId, tx);

      return {
        lineItem: updatedItem,
        tongGiaTriCoHoi: giaTriDuKien,
        duBaoGiaTri,
      };
    });
  }

  /**
   * Xóa dòng sản phẩm khỏi cơ hội
   */
  async xoaSanPham(coHoiId: string, itemId: string, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({ where: { id: coHoiId } });
    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội');
    }
    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội đã đóng không thể xóa sản phẩm');
    }

    const item = await this.prisma.coHoiSanPham.findFirst({
      where: { id: itemId, coHoiId },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy dòng sản phẩm');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.coHoiSanPham.delete({ where: { id: itemId } });
      const { giaTriDuKien, duBaoGiaTri } = await this.capNhatGiaTriCoHoi(coHoiId, tx);
      return {
        thanhCong: true,
        thongDiep: 'Đã xóa sản phẩm khỏi cơ hội',
        tongGiaTriCoHoi: giaTriDuKien,
        duBaoGiaTri,
      };
    });
  }

  /**
   * Lấy danh sách sản phẩm trong cơ hội
   */
  async layDanhSachSanPham(coHoiId: string) {
    return this.prisma.coHoiSanPham.findMany({
      where: { coHoiId },
      include: {
        sanPham: {
          select: {
            id: true,
            maSanPham: true,
            tenSanPham: true,
            loaiSanPham: true,
            donViTinh: true,
            giaNiemYet: true,
          },
        },
      },
    });
  }
}

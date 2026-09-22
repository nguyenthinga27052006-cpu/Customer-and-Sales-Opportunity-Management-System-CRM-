import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaoDanhMucDto, CapNhatDanhMucDto } from './dto/danh-muc.dto';

@Injectable()
export class DanhMucService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh mục theo loại hoặc lấy toàn bộ
   */
  async layDanhSach(loaiDanhMuc?: string) {
    return this.prisma.danhMucDungChung.findMany({
      where: loaiDanhMuc ? { loaiDanhMuc } : {},
      orderBy: [{ loaiDanhMuc: 'asc' }, { thuTuHienThi: 'asc' }],
    });
  }

  /**
   * Thêm mục mới vào danh mục dùng chung
   */
  async taoMuc(dto: TaoDanhMucDto) {
    const existing = await this.prisma.danhMucDungChung.findUnique({
      where: {
        loaiDanhMuc_maMuc: {
          loaiDanhMuc: dto.loaiDanhMuc,
          maMuc: dto.maMuc,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Mục "${dto.maMuc}" đã tồn tại trong danh mục ${dto.loaiDanhMuc}`);
    }

    return this.prisma.danhMucDungChung.create({
      data: dto,
    });
  }

  /**
   * Cập nhật mục
   */
  async capNhatMuc(id: string, dto: CapNhatDanhMucDto) {
    const item = await this.prisma.danhMucDungChung.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy mục danh mục này');
    }

    return this.prisma.danhMucDungChung.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Xóa mục khỏi danh mục
   */
  async xoaMuc(id: string) {
    const item = await this.prisma.danhMucDungChung.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy mục');
    }

    await this.prisma.danhMucDungChung.delete({ where: { id } });
    return { thanhCong: true, thongDiep: 'Xóa mục danh mục thành công' };
  }
}

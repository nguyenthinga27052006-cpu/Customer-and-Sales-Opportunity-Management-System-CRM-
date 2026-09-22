import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TaoGiaiDoanDto,
  CapNhatGiaiDoanDto,
  TaoLyDoDto,
  TaoDoiThuDto,
} from './dto/giai-doan.dto';
import { LoaiLyDo } from '@prisma/client';

@Injectable()
export class GiaiDoanService {
  constructor(private prisma: PrismaService) {}

  // 1. GIAI ĐOẠN PIPELINE
  async layDanhSachGiaiDoan() {
    return this.prisma.giaiDoanPipeline.findMany({
      orderBy: { thuTu: 'asc' },
    });
  }

  async taoGiaiDoan(dto: TaoGiaiDoanDto) {
    const existing = await this.prisma.giaiDoanPipeline.findUnique({
      where: { maGiaiDoan: dto.maGiaiDoan },
    });
    if (existing) {
      throw new BadRequestException(`Mã giai đoạn "${dto.maGiaiDoan}" đã tồn tại`);
    }

    return this.prisma.giaiDoanPipeline.create({
      data: dto,
    });
  }

  async capNhatGiaiDoan(id: string, dto: CapNhatGiaiDoanDto) {
    const gd = await this.prisma.giaiDoanPipeline.findUnique({ where: { id } });
    if (!gd) {
      throw new NotFoundException('Không tìm thấy giai đoạn');
    }

    return this.prisma.giaiDoanPipeline.update({
      where: { id },
      data: dto,
    });
  }

  // 2. LÝ DO THẮNG THUA
  async layDanhSachLyDo(loai?: LoaiLyDo) {
    return this.prisma.lyDoThangThua.findMany({
      where: loai ? { loai } : {},
      orderBy: { thuTu: 'asc' },
    });
  }

  async taoLyDo(dto: TaoLyDoDto) {
    return this.prisma.lyDoThangThua.create({
      data: dto,
    });
  }

  async xoaLyDo(id: string) {
    await this.prisma.lyDoThangThua.delete({ where: { id } });
    return { thanhCong: true, thongDiep: 'Xóa lý do thành công' };
  }

  // 3. ĐỐI THỦ CẠNH TRANH
  async layDanhSachDoiThu() {
    return this.prisma.doiThu.findMany({
      orderBy: { tenDoiThu: 'asc' },
    });
  }

  async taoDoiThu(dto: TaoDoiThuDto) {
    const existing = await this.prisma.doiThu.findUnique({
      where: { tenDoiThu: dto.tenDoiThu },
    });
    if (existing) {
      throw new BadRequestException(`Đối thủ "${dto.tenDoiThu}" đã tồn tại`);
    }

    return this.prisma.doiThu.create({
      data: dto,
    });
  }

  async xoaDoiThu(id: string) {
    await this.prisma.doiThu.delete({ where: { id } });
    return { thanhCong: true, thongDiep: 'Xóa đối thủ thành công' };
  }
}

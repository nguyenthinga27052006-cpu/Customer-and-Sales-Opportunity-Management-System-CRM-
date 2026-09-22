import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaoNhomDto, CapNhatNhomDto, TaoKhuVucDto } from './dto/tao-nhom.dto';

@Injectable()
export class NhomKinhDoanhService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy cây sơ đồ tổ chức phòng ban kinh doanh
   */
  async layCayToChuc() {
    const teams = await this.prisma.nhomKinhDoanh.findMany({
      include: {
        khuVuc: true,
        truongNhom: {
          select: { id: true, hoTen: true, email: true, soDienThoai: true, avatarUrl: true },
        },
        thanhVien: {
          select: {
            id: true,
            hoTen: true,
            email: true,
            soDienThoai: true,
            trangThai: true,
            vaiTro: { include: { vaiTro: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Xây dựng cấu trúc cây (tree structure)
    const mapTeams = new Map<string, any>();
    teams.forEach((t) => {
      mapTeams.set(t.id, {
        ...t,
        nhomCon: [],
        soLuongThanhVien: t.thanhVien.length,
      });
    });

    const rootTeams: any[] = [];
    teams.forEach((t) => {
      if (t.nhomChaId && mapTeams.has(t.nhomChaId)) {
        mapTeams.get(t.nhomChaId).nhomCon.push(mapTeams.get(t.id));
      } else {
        rootTeams.push(mapTeams.get(t.id));
      }
    });

    return rootTeams;
  }

  /**
   * Lấy danh sách nhóm dạng phẳng cho select option
   */
  async layDanhSachNhomPhang() {
    return this.prisma.nhomKinhDoanh.findMany({
      include: {
        khuVuc: true,
        truongNhom: { select: { id: true, hoTen: true } },
      },
      orderBy: { tenNhom: 'asc' },
    });
  }

  /**
   * Lấy danh sách khu vực
   */
  async layDanhSachKhuVuc() {
    return this.prisma.khuVuc.findMany({
      orderBy: { tenKhuVuc: 'asc' },
    });
  }

  /**
   * Tạo khu vực địa lý mới
   */
  async taoKhuVuc(dto: TaoKhuVucDto) {
    const existing = await this.prisma.khuVuc.findUnique({
      where: { maKhuVuc: dto.maKhuVuc },
    });
    if (existing) {
      throw new BadRequestException(`Mã khu vực ${dto.maKhuVuc} đã tồn tại`);
    }

    return this.prisma.khuVuc.create({
      data: dto,
    });
  }

  /**
   * Tạo nhóm kinh doanh mới
   */
  async taoNhom(dto: TaoNhomDto) {
    const existing = await this.prisma.nhomKinhDoanh.findUnique({
      where: { maNhom: dto.maNhom },
    });
    if (existing) {
      throw new BadRequestException(`Mã nhóm ${dto.maNhom} đã tồn tại`);
    }

    return this.prisma.nhomKinhDoanh.create({
      data: {
        maNhom: dto.maNhom,
        tenNhom: dto.tenNhom,
        nhomChaId: dto.nhomChaId || null,
        khuVucId: dto.khuVucId || null,
        truongNhomId: dto.truongNhomId || null,
      },
      include: {
        khuVuc: true,
        truongNhom: { select: { id: true, hoTen: true } },
      },
    });
  }

  /**
   * Cập nhật thông tin nhóm
   */
  async capNhatNhom(id: string, dto: CapNhatNhomDto) {
    const team = await this.prisma.nhomKinhDoanh.findUnique({ where: { id } });
    if (!team) {
      throw new NotFoundException('Không tìm thấy nhóm kinh doanh này');
    }

    if (dto.nhomChaId && dto.nhomChaId === id) {
      throw new BadRequestException('Một nhóm không thể tự làm nhóm cha của chính mình');
    }

    return this.prisma.nhomKinhDoanh.update({
      where: { id },
      data: dto,
      include: {
        khuVuc: true,
        truongNhom: { select: { id: true, hoTen: true } },
      },
    });
  }

  /**
   * Xóa nhóm kinh doanh (chỉ khi không có thành viên và không có nhóm con)
   */
  async xoaNhom(id: string) {
    const team = await this.prisma.nhomKinhDoanh.findUnique({
      where: { id },
      include: {
        thanhVien: true,
        nhomCon: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    if (team.thanhVien.length > 0) {
      throw new BadRequestException('Không thể xóa nhóm này vì vẫn còn nhân viên trực thuộc. Vui lòng chuyển nhân viên sang nhóm khác trước.');
    }

    if (team.nhomCon.length > 0) {
      throw new BadRequestException('Không thể xóa nhóm này vì đang có nhóm con trực thuộc.');
    }

    await this.prisma.nhomKinhDoanh.delete({ where: { id } });
    return { thanhCong: true, thongDiep: 'Đã xóa nhóm kinh doanh thành công' };
  }
}

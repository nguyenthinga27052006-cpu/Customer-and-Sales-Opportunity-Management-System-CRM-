import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PhanLoaiLead } from '@prisma/client';
import { TaoQuyTacChamDiemDto, CapNhatCauHinhChamDiemDto } from '../dto/lead.dto';

export interface KetQuaChamDiem {
  diemTiemNang: number;
  phanLoai: PhanLoaiLead;
  chiTietDiem: {
    tenQuyTac: string;
    tieuChi: string;
    giaTri: string;
    diem: number;
  }[];
}

@Injectable()
export class LeadScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * S4-05: Scoring Engine độc lập
   * Tính toán điểm tiềm năng và phân loại NÓNG / ẤM / LẠNH theo các quy tắc động
   */
  async tinhDiem(leadData: {
    nganhNghe?: string | null;
    quyMo?: string | null;
    nguonLead?: string | null;
    nhuCauQuanTam?: string | null;
  }): Promise<KetQuaChamDiem> {
    // 1. Lấy cấu hình ngưỡng nhiệt độ
    let cauHinh = await this.prisma.cauHinhChamDiem.findFirst();
    if (!cauHinh) {
      cauHinh = await this.prisma.cauHinhChamDiem.create({
        data: { nguongNong: 50, nguongAm: 25, thoiGianSlaGio: 24 },
      });
    }

    // 2. Lấy danh sách các quy tắc chấm điểm đang kích hoạt
    const rules = await this.prisma.quyTacChamDiem.findMany({
      where: { kichHoat: true },
      orderBy: { thuTu: 'asc' },
    });

    let totalScore = 0;
    const chiTietDiem: { tenQuyTac: string; tieuChi: string; giaTri: string; diem: number }[] = [];

    for (const r of rules) {
      let matched = false;

      switch (r.tieuChi) {
        case 'NGANH_NGHE':
          if (leadData.nganhNghe && leadData.nganhNghe.toLowerCase() === r.giaTri.toLowerCase()) {
            matched = true;
          }
          break;

        case 'QUY_MO':
          if (leadData.quyMo && leadData.quyMo.toLowerCase() === r.giaTri.toLowerCase()) {
            matched = true;
          }
          break;

        case 'NGUON_LEAD':
          if (leadData.nguonLead && leadData.nguonLead.toLowerCase() === r.giaTri.toLowerCase()) {
            matched = true;
          }
          break;

        case 'MUC_DO_QUAN_TAM':
          if (leadData.nhuCauQuanTam) {
            const nhuCau = leadData.nhuCauQuanTam.toLowerCase();
            const giaTriSoKhop = r.giaTri.toLowerCase();
            if (nhuCau.includes(giaTriSoKhop) || (giaTriSoKhop === 'rat_cao' && nhuCau.length > 30)) {
              matched = true;
            }
          }
          break;
      }

      if (matched) {
        totalScore += r.diem;
        chiTietDiem.push({
          tenQuyTac: r.tenQuyTac,
          tieuChi: r.tieuChi,
          giaTri: r.giaTri,
          diem: r.diem,
        });
      }
    }

    // Phân loại nhiệt độ theo ngưỡng cấu hình
    let phanLoai: PhanLoaiLead = PhanLoaiLead.LANH;
    if (totalScore >= cauHinh.nguongNong) {
      phanLoai = PhanLoaiLead.NONG;
    } else if (totalScore >= cauHinh.nguongAm) {
      phanLoai = PhanLoaiLead.AM;
    }

    return {
      diemTiemNang: totalScore,
      phanLoai,
      chiTietDiem,
    };
  }

  // --- CÁC HÀM CẤU HÌNH DÀNH CHO DIRECTOR / ADMIN ---

  async layCauHinh() {
    let config = await this.prisma.cauHinhChamDiem.findFirst();
    if (!config) {
      config = await this.prisma.cauHinhChamDiem.create({
        data: { nguongNong: 50, nguongAm: 25, thoiGianSlaGio: 24 },
      });
    }
    return config;
  }

  async capNhatCauHinh(dto: CapNhatCauHinhChamDiemDto, currentUser: any) {
    let config = await this.prisma.cauHinhChamDiem.findFirst();
    if (!config) {
      config = await this.prisma.cauHinhChamDiem.create({
        data: dto,
      });
    } else {
      config = await this.prisma.cauHinhChamDiem.update({
        where: { id: config.id },
        data: dto,
      });
    }

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'QUY_TAC_CHAM_DIEM',
        hanhDong: 'SUA',
        giaTriSau: config as any,
      },
    });

    return config;
  }

  async layDanhSachQuyTac() {
    return this.prisma.quyTacChamDiem.findMany({
      orderBy: { thuTu: 'asc' },
    });
  }

  async taoQuyTac(dto: TaoQuyTacChamDiemDto, currentUser: any) {
    const rule = await this.prisma.quyTacChamDiem.create({
      data: dto,
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'QUY_TAC_CHAM_DIEM',
        doiTuongId: rule.id,
        hanhDong: 'TAO',
        giaTriSau: rule as any,
      },
    });

    return rule;
  }

  async capNhatQuyTac(id: string, dto: Partial<TaoQuyTacChamDiemDto>, currentUser: any) {
    const rule = await this.prisma.quyTacChamDiem.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Quy tắc chấm điểm không tồn tại');

    const updated = await this.prisma.quyTacChamDiem.update({
      where: { id },
      data: dto,
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'QUY_TAC_CHAM_DIEM',
        doiTuongId: id,
        hanhDong: 'SUA',
        giaTriSau: updated as any,
      },
    });

    return updated;
  }

  async xoaQuyTac(id: string, currentUser: any) {
    await this.prisma.quyTacChamDiem.delete({ where: { id } });
    return { message: 'Đã xóa quy tắc chấm điểm' };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LeadSlaService {
  private readonly logger = new Logger(LeadSlaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * S4-07: Quét và gắn cờ các Lead đã quá hạn tiếp nhận (SLA)
   * Sử dụng hoàn toàn thời gian server (server-side clock).
   */
  async quetVaCapNhatQuaHanSla(): Promise<{ soLuongQuaHanMoi: number }> {
    const now = new Date();

    // Tìm các Lead đang chờ tiếp nhận nhưng đã quá slaDeadline và chưa bị flag
    const overdueLeads = await this.prisma.lead.findMany({
      where: {
        trangThai: 'CHO_TIEP_NHAN',
        slaDeadline: { lt: now },
        quaHanSla: false,
      },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true } },
      },
    });

    if (overdueLeads.length === 0) {
      return { soLuongQuaHanMoi: 0 };
    }

    for (const lead of overdueLeads) {
      // 1. Cập nhật cờ quá hạn SLA
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { quaHanSla: true },
      });

      // 2. Ghi hoạt động cảnh báo SLA
      await this.prisma.hoatDong.create({
        data: {
          loaiHoatDong: 'GHI_CHU',
          tieuDe: 'CẢNH BÁO QUÁ HẠN SLA TIẾP NHẬN LEAD',
          noiDung: `Lead ${lead.hoTen} (${lead.maLead}) được giao cho ${lead.nguoiSoHuu?.hoTen || 'Sales'} lúc ${lead.assignedAt?.toLocaleString('vi-VN')} nhưng chưa được tiếp nhận trước hạn ${lead.slaDeadline?.toLocaleString('vi-VN')}.`,
          leadId: lead.id,
          nguoiThucHienId: lead.nguoiSoHuuId || 'system',
        },
      });

      this.logger.warn(`Lead ${lead.maLead} đã quá hạn SLA tiếp nhận. Đã gắn cờ quaHanSla.`);
    }

    return { soLuongQuaHanMoi: overdueLeads.length };
  }
}

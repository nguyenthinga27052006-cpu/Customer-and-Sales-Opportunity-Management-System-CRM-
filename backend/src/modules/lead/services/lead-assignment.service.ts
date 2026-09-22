import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoaiPhanBo } from '@prisma/client';
import { TaoQuyTacPhanBoDto } from '../dto/lead.dto';

@Injectable()
export class LeadAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * S4-06: Phân bổ Lead tự động theo Rules (Strategy: Region, Industry, Round Robin)
   * Nguyên tắc: First matching rule wins. Nếu không khớp rule nào -> Vào hàng đợi (Queue).
   */
  async phanBoLeadTuDong(leadId: string): Promise<{
    duocPhanBo: boolean;
    nguoiNhanId: string | null;
    quyTacId: string | null;
    tenQuyTac: string | null;
  }> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead không tồn tại');

    // Lấy cấu hình SLA để tính deadline
    const cauHinh = await this.prisma.cauHinhChamDiem.findFirst();
    const slaHours = cauHinh?.thoiGianSlaGio || 24;

    // Lấy danh sách quy tắc phân bổ kích hoạt, sắp xếp theo thứ tự ưu tiên tăng dần
    const rules = await this.prisma.quyTacPhanBo.findMany({
      where: { kichHoat: true },
      orderBy: { thuTuUuTien: 'asc' },
    });

    for (const r of rules) {
      let matched = false;
      let targetUserId: string | null = null;

      if (r.loaiQuyTac === LoaiPhanBo.KHU_VUC) {
        const cond = r.dieuKien as any;
        if (cond?.khuVucId && lead.khuVucId === cond.khuVucId) {
          matched = true;
          targetUserId = r.nguoiNhanId;
        }
      } else if (r.loaiQuyTac === LoaiPhanBo.NGANH_NGHE) {
        const cond = r.dieuKien as any;
        if (
          cond?.nganhNghe &&
          lead.nganhNghe &&
          lead.nganhNghe.toLowerCase() === cond.nganhNghe.toLowerCase()
        ) {
          matched = true;
          targetUserId = r.nguoiNhanId;
        }
      } else if (r.loaiQuyTac === LoaiPhanBo.ROUND_ROBIN) {
        const userList = (r.danhSachNguoiDungIds as string[]) || [];
        if (userList.length > 0) {
          matched = true;
          const currentIndex = r.chiSoHienTai % userList.length;
          targetUserId = userList[currentIndex];

          // Cập nhật con trỏ Round Robin
          await this.prisma.quyTacPhanBo.update({
            where: { id: r.id },
            data: { chiSoHienTai: (currentIndex + 1) % userList.length },
          });
        }
      }

      // FIRST MATCHING RULE WINS
      if (matched && targetUserId) {
        const now = new Date();
        const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

        // Lấy thông tin nhóm của người nhận
        const targetUser = await this.prisma.nguoiDung.findUnique({
          where: { id: targetUserId },
          select: { id: true, hoTen: true, nhomKinhDoanhId: true },
        });

        // Cập nhật Lead
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            nguoiSoHuuId: targetUserId,
            nhomKinhDoanhId: targetUser?.nhomKinhDoanhId || null,
            trangThai: 'CHO_TIEP_NHAN',
            assignedAt: now,
            slaDeadline,
            quaHanSla: false,
          },
        });

        // Ghi lịch sử phân bổ
        await this.prisma.lichSuPhanBo.create({
          data: {
            leadId,
            nguoiDuocPhanBoId: targetUserId,
            quyTacId: r.id,
            loaiPhanBo: 'TU_DONG',
            lyDo: `Khớp quy tắc: ${r.tenQuyTac}`,
          },
        });

        // Ghi hoạt động
        await this.prisma.hoatDong.create({
          data: {
            loaiHoatDong: 'PHAN_BO_LEAD',
            tieuDe: `Phân bổ tự động cho: ${targetUser?.hoTen || 'Sales'}`,
            noiDung: `Quy tắc: ${r.tenQuyTac}. Hạn SLA phản hồi: ${slaDeadline.toLocaleString('vi-VN')}`,
            leadId,
            nguoiThucHienId: targetUserId,
          },
        });

        return {
          duocPhanBo: true,
          nguoiNhanId: targetUserId,
          quyTacId: r.id,
          tenQuyTac: r.tenQuyTac,
        };
      }
    }

    // Không khớp rule nào: Đưa vào Hàng đợi phân bổ thủ công (Assignment Queue)
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        nguoiSoHuuId: null,
        nhomKinhDoanhId: null,
        trangThai: 'MOI',
        assignedAt: null,
        slaDeadline: null,
        quaHanSla: false,
      },
    });

    return {
      duocPhanBo: false,
      nguoiNhanId: null,
      quyTacId: null,
      tenQuyTac: null,
    };
  }

  /**
   * Phân bổ thủ công bởi Quản lý / Team Lead
   */
  async phanBoThuCong(leadId: string, nguoiNhanId: string, currentUser: any, lyDo?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead không tồn tại');

    const targetUser = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiNhanId },
      select: { id: true, hoTen: true, nhomKinhDoanhId: true },
    });
    if (!targetUser) throw new NotFoundException('Người nhận không tồn tại');

    const cauHinh = await this.prisma.cauHinhChamDiem.findFirst();
    const slaHours = cauHinh?.thoiGianSlaGio || 24;
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        nguoiSoHuuId: nguoiNhanId,
        nhomKinhDoanhId: targetUser.nhomKinhDoanhId,
        trangThai: 'CHO_TIEP_NHAN',
        assignedAt: now,
        slaDeadline,
        quaHanSla: false,
      },
    });

    await this.prisma.lichSuPhanBo.create({
      data: {
        leadId,
        nguoiDuocPhanBoId: nguoiNhanId,
        loaiPhanBo: 'THU_CONG',
        lyDo: lyDo || `Phân bổ thủ công bởi ${currentUser.hoTen || currentUser.email}`,
        nguoiThucHienId: currentUser.id,
      },
    });

    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'PHAN_BO_LEAD',
        tieuDe: `Bàn giao Lead cho ${targetUser.hoTen}`,
        noiDung: lyDo || 'Phân bổ thủ công từ hàng đợi',
        leadId,
        nguoiThucHienId: currentUser.id,
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'LEAD',
        doiTuongId: leadId,
        hanhDong: 'BAN_GIAO',
        giaTriTruoc: { nguoiSoHuuId: lead.nguoiSoHuuId },
        giaTriSau: { nguoiSoHuuId: nguoiNhanId },
      },
    });

    return updated;
  }

  // --- QUẢN LÝ QUY TẮC PHÂN BỔ (DIRECTOR/ADMIN) ---

  async layDanhSachQuyTac() {
    return this.prisma.quyTacPhanBo.findMany({
      orderBy: { thuTuUuTien: 'asc' },
    });
  }

  async taoQuyTac(dto: TaoQuyTacPhanBoDto, currentUser: any) {
    const rule = await this.prisma.quyTacPhanBo.create({
      data: {
        tenQuyTac: dto.tenQuyTac,
        thuTuUuTien: dto.thuTuUuTien,
        loaiQuyTac: dto.loaiQuyTac,
        dieuKien: dto.dieuKien || null,
        nguoiNhanId: dto.nguoiNhanId || null,
        danhSachNguoiDungIds: dto.danhSachNguoiDungIds || null,
        kichHoat: dto.kichHoat !== undefined ? dto.kichHoat : true,
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'QUY_TAC_PHAN_BO',
        doiTuongId: rule.id,
        hanhDong: 'TAO',
        giaTriSau: rule as any,
      },
    });

    return rule;
  }

  async capNhatQuyTac(id: string, dto: Partial<TaoQuyTacPhanBoDto>, currentUser: any) {
    const existing = await this.prisma.quyTacPhanBo.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Quy tắc không tồn tại');

    const updated = await this.prisma.quyTacPhanBo.update({
      where: { id },
      data: dto as any,
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'QUY_TAC_PHAN_BO',
        doiTuongId: id,
        hanhDong: 'SUA',
        giaTriSau: updated as any,
      },
    });

    return updated;
  }

  async xoaQuyTac(id: string, currentUser: any) {
    await this.prisma.quyTacPhanBo.delete({ where: { id } });
    return { message: 'Đã xóa quy tắc phân bổ' };
  }
}

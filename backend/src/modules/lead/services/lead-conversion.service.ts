import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChuyenDoiLeadDto } from '../dto/lead.dto';

@Injectable()
export class LeadConversionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh mã khách hàng tự động
   */
  private async sinhMaKhachHang(tx: any): Promise<string> {
    const count = await tx.khachHang.count();
    const nextNum = (count + 1).toString().padStart(5, '0');
    let code = `KH-${nextNum}`;
    let exists = await tx.khachHang.findUnique({ where: { maKhachHang: code } });
    let i = 1;
    while (exists) {
      code = `KH-${(count + 1 + i).toString().padStart(5, '0')}`;
      exists = await tx.khachHang.findUnique({ where: { maKhachHang: code } });
      i++;
    }
    return code;
  }

  /**
   * Sinh mã cơ hội bán hàng tự động: CH-00001
   */
  private async sinhMaCoHoi(tx: any): Promise<string> {
    const count = await tx.coHoi.count();
    const nextNum = (count + 1).toString().padStart(5, '0');
    let code = `CH-${nextNum}`;
    let exists = await tx.coHoi.findUnique({ where: { maCoHoi: code } });
    let i = 1;
    while (exists) {
      code = `CH-${(count + 1 + i).toString().padStart(5, '0')}`;
      exists = await tx.coHoi.findUnique({ where: { maCoHoi: code } });
      i++;
    }
    return code;
  }

  /**
   * S4-08: Chuyển đổi Lead sang Customer + Contact + Opportunity trong một Transaction
   * Đảm bảo tính toàn vẹn dữ liệu: thất bại là ROLLBACK toàn bộ.
   */
  async chuyenDoiLead(leadId: string, dto: ChuyenDoiLeadDto, currentUser: any) {
    // 1. Kiểm tra Lead hợp lệ
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { khuVuc: true },
    });

    if (!lead) {
      throw new NotFoundException('Lead không tồn tại');
    }

    if (lead.trangThai === 'DA_CHUYEN_DOI') {
      throw new BadRequestException('Lead này đã được chuyển đổi thành công trước đó (Read-only)');
    }

    // 2. Tìm giai đoạn Pipeline ban đầu (nếu không truyền)
    let giaiDoanId = dto.giaiDoanId;
    if (!giaiDoanId) {
      const firstStage = await this.prisma.giaiDoanPipeline.findFirst({
        where: { kichHoat: true },
        orderBy: { thuTu: 'asc' },
      });
      if (!firstStage) {
        throw new BadRequestException('Chưa có giai đoạn Pipeline nào được cấu hình trong hệ thống');
      }
      giaiDoanId = firstStage.id;
    }

    const nguoiSoHuuId = dto.nguoiSoHuuId || lead.nguoiSoHuuId || currentUser.id;

    // 3. THỰC THI TOÀN BỘ TRONG PRISMA TRANSACTION
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let khachHangId: string;
        let tenCongTyFinal: string;

        // a. Tái sử dụng hoặc tạo mới Khách hàng
        if (dto.khachHangHienCoId) {
          const existingCust = await tx.khachHang.findUnique({
            where: { id: dto.khachHangHienCoId },
          });
          if (!existingCust || existingCust.daGopVaoId) {
            throw new BadRequestException('Khách hàng được chọn không tồn tại hoặc đã bị gộp');
          }
          khachHangId = existingCust.id;
          tenCongTyFinal = existingCust.tenCongTy;
        } else {
          // Tạo khách hàng mới
          const maKhachHang = await this.sinhMaKhachHang(tx);
          tenCongTyFinal = dto.tenCongTy || lead.congTy || `Công ty của ${lead.hoTen}`;

          // Kiểm tra MST nếu có
          if (dto.maSoThue && dto.maSoThue.trim() !== '') {
            const dupMst = await tx.khachHang.findUnique({
              where: { maSoThue: dto.maSoThue.trim() },
            });
            if (dupMst && !dupMst.daGopVaoId) {
              throw new BadRequestException(`Mã số thuế ${dto.maSoThue} đã tồn tại trên khách hàng ${dupMst.tenCongTy}`);
            }
          }

          // Lấy nhóm của người sở hữu
          const ownerInfo = await tx.nguoiDung.findUnique({
            where: { id: nguoiSoHuuId },
            select: { nhomKinhDoanhId: true },
          });

          const newCustomer = await tx.khachHang.create({
            data: {
              maKhachHang,
              tenCongTy: tenCongTyFinal,
              maSoThue: dto.maSoThue?.trim() || null,
              nganhNghe: lead.nganhNghe || null,
              quyMo: lead.quyMo || null,
              nguoiSoHuuId,
              nhomKinhDoanhId: ownerInfo?.nhomKinhDoanhId || null,
              trangThai: 'TIEM_NANG',
              moTa: `Chuyển đổi từ Lead: ${lead.hoTen} (${lead.maLead})`,
            },
          });
          khachHangId = newCustomer.id;
        }

        // b. Tạo Người liên hệ mới từ thông tin Lead
        const newContact = await tx.nguoiLienHe.create({
          data: {
            khachHangId,
            hoTen: lead.hoTen,
            chucDanh: lead.chucDanh || null,
            email: lead.email || null,
            soDienThoai: lead.soDienThoai || null,
            vaiTroQuyetDinh: 'NGUOI_QUYET_DINH',
            laDauMoiChinh: true,
            ghiChu: `Tạo tự động khi chuyển đổi Lead ${lead.maLead}`,
          },
        });

        // c. Tạo Cơ hội bán hàng tối thiểu (Minimal Opportunity integration)
        const maCoHoi = await this.sinhMaCoHoi(tx);
        const newOpportunity = await tx.coHoi.create({
          data: {
            maCoHoi,
            tenCoHoi: dto.tenCoHoi,
            khachHangId,
            leadId: lead.id,
            giaiDoanId,
            giaTriDuKien: dto.giaTriDuKien || 0,
            ngayKyDuKien: dto.ngayKyDuKien ? new Date(dto.ngayKyDuKien) : null,
            nguoiSoHuuId,
            trangThai: 'DANG_XU_LY',
          },
        });

        // d. Bảo toàn và chuyển tiếp lịch sử hoạt động của Lead sang Customer & Opportunity
        await tx.hoatDong.updateMany({
          where: { leadId: lead.id },
          data: {
            khachHangId,
            coHoiId: newOpportunity.id,
          },
        });

        // Ghi nhận hoạt động chuyển đổi
        await tx.hoatDong.create({
          data: {
            loaiHoatDong: 'CONVERT_LEAD',
            tieuDe: `Chuyển đổi Lead thành công: ${lead.hoTen}`,
            noiDung: `Tạo Khách hàng: ${tenCongTyFinal}, Người liên hệ: ${lead.hoTen}, Cơ hội: ${dto.tenCoHoi} (${maCoHoi})`,
            leadId: lead.id,
            khachHangId,
            nguoiLienHeId: newContact.id,
            coHoiId: newOpportunity.id,
            nguoiThucHienId: currentUser.id,
          },
        });

        // e. Cập nhật trạng thái Lead = DA_CHUYEN_DOI (trở thành Read-only)
        const updatedLead = await tx.lead.update({
          where: { id: lead.id },
          data: {
            trangThai: 'DA_CHUYEN_DOI',
            khachHangChuyenDoiId: khachHangId,
            coHoiChuyenDoiId: newOpportunity.id,
          },
        });

        // f. Ghi Audit Log
        await tx.nhatKyHeThong.create({
          data: {
            nguoiThucHienId: currentUser.id,
            loaiDoiTuong: 'LEAD',
            doiTuongId: lead.id,
            hanhDong: 'CHUYEN_DOI_LEAD',
            giaTriTruoc: { trangThai: lead.trangThai },
            giaTriSau: {
              trangThai: 'DA_CHUYEN_DOI',
              khachHangId,
              contactId: newContact.id,
              coHoiId: newOpportunity.id,
            },
          },
        });

        return {
          lead: updatedLead,
          khachHangId,
          nguoiLienHeId: newContact.id,
          coHoiId: newOpportunity.id,
          maCoHoi,
        };
      });

      return {
        message: 'Chuyển đổi Lead thành công!',
        ketQua: result,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Chuyển đổi Lead thất bại và đã rollback an toàn: ${error.message}`,
      );
    }
  }
}

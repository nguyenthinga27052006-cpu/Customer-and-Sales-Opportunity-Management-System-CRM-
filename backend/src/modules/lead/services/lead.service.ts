import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { LeadScoringService } from './lead-scoring.service';
import { LeadAssignmentService } from './lead-assignment.service';
import { TaoLeadDto, CapNhatLeadDto, LocLeadDto, TuChoiLeadDto } from '../dto/lead.dto';

@Injectable()
export class LeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
    private readonly scoringService: LeadScoringService,
    private readonly assignmentService: LeadAssignmentService,
  ) {}

  private async sinhMaLead(): Promise<string> {
    const count = await this.prisma.lead.count();
    const nextNum = (count + 1).toString().padStart(5, '0');
    let code = `LEAD-${nextNum}`;
    let exists = await this.prisma.lead.findUnique({ where: { maLead: code } });
    let i = 1;
    while (exists) {
      code = `LEAD-${(count + 1 + i).toString().padStart(5, '0')}`;
      exists = await this.prisma.lead.findUnique({ where: { maLead: code } });
      i++;
    }
    return code;
  }

  /**
   * S4-09: Tìm kiếm, lọc và phân trang Lead có kiểm soát Data Scope
   */
  async layDanhSach(locDto: LocLeadDto, currentUser: any) {
    const {
      tuKhoa,
      trangThai,
      phanLoai,
      nguonLead,
      nguoiSoHuuId,
      trongHangDoi,
      quaHanSla,
      tuNgay,
      denNgay,
      page = 1,
      limit = 10,
    } = locDto;

    const allowedUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);

    const where: any = {};

    // Xử lý phạm vi dữ liệu:
    // Nếu lọc xem Hàng đợi chưa phân bổ (nguoiSoHuuId == null) -> cho phép mọi người có quyền xem queue
    if (trongHangDoi) {
      where.nguoiSoHuuId = null;
    } else if (allowedUserIds !== null) {
      // Sales Rep / Team Lead: xem lead của mình hoặc lead unassigned nếu muốn
      where.OR = [
        { nguoiSoHuuId: { in: allowedUserIds } },
        { nguoiSoHuuId: null }, // Có thể xem Lead trong queue chờ tiếp nhận
      ];
    }

    if (nguoiSoHuuId) {
      where.nguoiSoHuuId = nguoiSoHuuId;
    }

    if (trangThai) where.trangThai = trangThai;
    if (phanLoai) where.phanLoai = phanLoai;
    if (nguonLead) where.nguonLead = nguonLead;
    if (quaHanSla !== undefined) where.quaHanSla = quaHanSla;

    if (tuNgay || denNgay) {
      where.createdAt = {};
      if (tuNgay) where.createdAt.gte = new Date(tuNgay);
      if (denNgay) {
        const d = new Date(denNgay);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    if (tuKhoa && tuKhoa.trim() !== '') {
      const keyword = tuKhoa.trim();
      const keywordFilter = [
        { hoTen: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { soDienThoai: { contains: keyword } },
        { congTy: { contains: keyword, mode: 'insensitive' } },
        { maLead: { contains: keyword, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [{ OR: keywordFilter }];
      } else {
        where.OR = keywordFilter;
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ diemTiemNang: 'desc' }, { createdAt: 'desc' }],
        include: {
          nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
          nhomKinhDoanh: { select: { id: true, tenNhom: true } },
          khuVuc: { select: { id: true, tenKhuVuc: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Xem chi tiết một Lead
   */
  async layChiTiet(id: string, currentUser: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
        nhomKinhDoanh: { select: { id: true, tenNhom: true } },
        khuVuc: { select: { id: true, tenKhuVuc: true } },
        khachHangChuyenDoi: { select: { id: true, maKhachHang: true, tenCongTy: true } },
        coHoiChuyenDoi: { select: { id: true, maCoHoi: true, tenCoHoi: true } },
        lichSuPhanBo: {
          orderBy: { createdAt: 'desc' },
          include: {
            nguoiDuocPhanBo: { select: { id: true, hoTen: true } },
            quyTac: { select: { id: true, tenQuyTac: true } },
            nguoiThucHien: { select: { id: true, hoTen: true } },
          },
        },
        hoatDong: {
          orderBy: { thoiGian: 'desc' },
          include: {
            nguoiThucHien: { select: { id: true, hoTen: true } },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead không tồn tại');
    }

    // Kiểm tra Data Scope
    const allowedUserIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (allowedUserIds !== null && lead.nguoiSoHuuId && !allowedUserIds.includes(lead.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền truy cập hồ sơ Lead này');
    }

    // Lấy chi tiết breakdown điểm tiềm năng
    const scoreDetail = await this.scoringService.tinhDiem({
      nganhNghe: lead.nganhNghe,
      quyMo: lead.quyMo,
      nguonLead: lead.nguonLead,
      nhuCauQuanTam: lead.nhuCauQuanTam,
    });

    return {
      ...lead,
      chiTietDiem: scoreDetail.chiTietDiem,
    };
  }

  /**
   * S4-02: Tạo Lead thủ công (Source = REQUIRED, chạy Scoring và Phân bổ)
   */
  async taoLead(dto: TaoLeadDto, currentUser: any) {
    if (!dto.nguonLead || dto.nguonLead.trim() === '') {
      throw new BadRequestException('Nguồn Lead là bắt buộc (Source = REQUIRED)');
    }

    // S4-04: Duplicate detection - Gợi ý nếu đã trùng với Khách hàng hiện có
    let khachHangGoiYId: string | null = null;
    if (dto.email || dto.soDienThoai) {
      const existingCustomer = await this.prisma.khachHang.findFirst({
        where: {
          daGopVaoId: null,
          OR: [
            ...(dto.email ? [{ nguoiLienHe: { some: { email: dto.email.trim().toLowerCase() } } }] : []),
            ...(dto.soDienThoai ? [{ nguoiLienHe: { some: { soDienThoai: dto.soDienThoai.trim() } } }] : []),
          ],
        },
        select: { id: true, tenCongTy: true },
      });

      if (existingCustomer) {
        khachHangGoiYId = existingCustomer.id;
      }
    }

    // 1. Chạy Scoring Engine
    const scoreResult = await this.scoringService.tinhDiem({
      nganhNghe: dto.nganhNghe,
      quyMo: dto.quyMo,
      nguonLead: dto.nguonLead,
      nhuCauQuanTam: dto.nhuCauQuanTam,
    });

    const maLead = await this.sinhMaLead();

    // 2. Tạo Lead
    const lead = await this.prisma.lead.create({
      data: {
        maLead,
        hoTen: dto.hoTen.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        soDienThoai: dto.soDienThoai?.trim() || null,
        congTy: dto.congTy?.trim() || null,
        chucDanh: dto.chucDanh?.trim() || null,
        nhuCauQuanTam: dto.nhuCauQuanTam?.trim() || null,
        nguonLead: dto.nguonLead.trim(),
        nganhNghe: dto.nganhNghe || null,
        quyMo: dto.quyMo || null,
        khuVucId: dto.khuVucId || null,
        trangThai: 'MOI',
        phanLoai: scoreResult.phanLoai,
        diemTiemNang: scoreResult.diemTiemNang,
        khachHangGoiYId,
      },
    });

    // 3. Ghi nhận hoạt động khởi tạo
    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: 'Khởi tạo Lead mới',
        noiDung: `Tạo bởi: ${currentUser.hoTen || currentUser.email}. Điểm tiềm năng ban đầu: ${scoreResult.diemTiemNang} (${scoreResult.phanLoai})`,
        leadId: lead.id,
        nguoiThucHienId: currentUser.id,
      },
    });

    // 4. Phân bổ Lead: Nếu có chỉ định người sở hữu thì phân trực tiếp, nếu không chạy tự động
    if (dto.nguoiSoHuuId) {
      await this.assignmentService.phanBoThuCong(lead.id, dto.nguoiSoHuuId, currentUser, 'Chỉ định khi tạo');
    } else {
      await this.assignmentService.phanBoLeadTuDong(lead.id);
    }

    return this.layChiTiet(lead.id, currentUser);
  }

  /**
   * S4-05: Cập nhật Lead (Nếu thay đổi dữ liệu ngành/quy mô/nguồn -> Score được tính lại tự động)
   */
  async capNhat(id: string, dto: CapNhatLeadDto, currentUser: any) {
    const lead = await this.layChiTiet(id, currentUser);

    if (lead.trangThai === 'DA_CHUYEN_DOI') {
      throw new BadRequestException('Lead đã chuyển đổi sang khách hàng thành công và ở trạng thái chỉ đọc (Read-only)');
    }

    const updateData: any = { ...dto };

    // Checkpoint Rule 41: "Lead thay đổi dữ liệu -> Score được tính lại"
    const needRescore =
      dto.nganhNghe !== undefined ||
      dto.quyMo !== undefined ||
      dto.nguonLead !== undefined ||
      dto.nhuCauQuanTam !== undefined;

    if (needRescore) {
      const scoreResult = await this.scoringService.tinhDiem({
        nganhNghe: dto.nganhNghe !== undefined ? dto.nganhNghe : lead.nganhNghe,
        quyMo: dto.quyMo !== undefined ? dto.quyMo : lead.quyMo,
        nguonLead: dto.nguonLead !== undefined ? dto.nguonLead : lead.nguonLead,
        nhuCauQuanTam: dto.nhuCauQuanTam !== undefined ? dto.nhuCauQuanTam : lead.nhuCauQuanTam,
      });

      updateData.diemTiemNang = scoreResult.diemTiemNang;
      updateData.phanLoai = scoreResult.phanLoai;
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: 'Cập nhật thông tin Lead',
        noiDung: needRescore
          ? `Đã cập nhật dữ liệu và tính lại điểm tiềm năng: ${updated.diemTiemNang} (${updated.phanLoai})`
          : 'Cập nhật thông tin chi tiết',
        leadId: id,
        nguoiThucHienId: currentUser.id,
      },
    });

    return updated;
  }

  /**
   * S4-07: Sales tiếp nhận Lead (Accept)
   */
  async tiepNhanLead(id: string, currentUser: any) {
    const lead = await this.layChiTiet(id, currentUser);

    if (lead.trangThai === 'DA_CHUYEN_DOI') {
      throw new BadRequestException('Lead đã chuyển đổi thành công');
    }

    const now = new Date();
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        trangThai: 'DANG_CHAM_SOC',
        acceptedAt: now,
        firstContactAt: lead.firstContactAt || now,
      },
    });

    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: 'Tiếp nhận Lead chăm sóc',
        noiDung: `Sales ${currentUser.hoTen || currentUser.email} đã tiếp nhận xử lý Lead vào lúc ${now.toLocaleString('vi-VN')}`,
        leadId: id,
        nguoiThucHienId: currentUser.id,
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'LEAD',
        doiTuongId: id,
        hanhDong: 'TIEP_NHAN_LEAD',
        giaTriSau: { trangThai: 'DANG_CHAM_SOC', acceptedAt: now },
      },
    });

    return updated;
  }

  /**
   * S4-07: Sales từ chối Lead (Reject - bắt buộc có lý do -> quay về Queue)
   */
  async tuChoiLead(id: string, dto: TuChoiLeadDto, currentUser: any) {
    const lead = await this.layChiTiet(id, currentUser);

    if (!dto.lyDo || dto.lyDo.trim() === '') {
      throw new BadRequestException('Lý do từ chối Lead là bắt buộc');
    }

    const now = new Date();

    // Lead quay về hàng đợi phân bổ (nguoiSoHuuId = null)
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        trangThai: 'TU_CHOI',
        nguoiSoHuuId: null,
        nhomKinhDoanhId: null,
        rejectedAt: now,
        lyDoTuChoi: dto.lyDo.trim(),
        assignedAt: null,
        slaDeadline: null,
        quaHanSla: false,
      },
    });

    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: 'Từ chối tiếp nhận Lead',
        noiDung: `Nhân viên ${currentUser.hoTen || currentUser.email} từ chối tiếp nhận. Lý do: ${dto.lyDo.trim()}. Lead được chuyển về Hàng đợi để phân bổ lại.`,
        leadId: id,
        nguoiThucHienId: currentUser.id,
      },
    });

    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'LEAD',
        doiTuongId: id,
        hanhDong: 'TU_CHOI_LEAD',
        giaTriTruoc: { nguoiSoHuuId: lead.nguoiSoHuuId, trangThai: lead.trangThai },
        giaTriSau: { trangThai: 'TU_CHOI', lyDo: dto.lyDo.trim() },
      },
    });

    return updated;
  }

  /**
   * S4-04: Phát hiện duplicate Lead theo Email, SĐT hoặc Tên công ty
   */
  async kiemTraTrungLap(email?: string, soDienThoai?: string, congTy?: string) {
    const conditions: any[] = [];
    if (email && email.trim()) {
      conditions.push({ email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } });
    }
    if (soDienThoai && soDienThoai.trim()) {
      conditions.push({ soDienThoai: { contains: soDienThoai.trim() } });
    }
    if (congTy && congTy.trim()) {
      conditions.push({ congTy: { contains: congTy.trim(), mode: 'insensitive' } });
    }

    if (conditions.length === 0) return { leads: [], suggestedCustomer: null };

    const [duplicateLeads, customerMatches] = await Promise.all([
      this.prisma.lead.findMany({
        where: { OR: conditions },
        select: { id: true, maLead: true, hoTen: true, email: true, soDienThoai: true, congTy: true, trangThai: true },
        take: 5,
      }),
      this.prisma.khachHang.findFirst({
        where: {
          daGopVaoId: null,
          OR: [
            ...(email ? [{ nguoiLienHe: { some: { email: email.trim().toLowerCase() } } }] : []),
            ...(soDienThoai ? [{ nguoiLienHe: { some: { soDienThoai: soDienThoai.trim() } } }] : []),
            ...(congTy ? [{ tenCongTy: { contains: congTy.trim(), mode: 'insensitive' as const } }] : []),
          ],
        },
        select: { id: true, maKhachHang: true, tenCongTy: true, maSoThue: true },
      }),
    ]);

    return {
      leads: duplicateLeads,
      suggestedCustomer: customerMatches,
    };
  }
}

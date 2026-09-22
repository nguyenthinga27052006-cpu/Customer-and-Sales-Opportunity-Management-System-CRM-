import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { LeadScoringService } from '../services/lead-scoring.service';
import { LeadAssignmentService } from '../services/lead-assignment.service';
import { SubmitWebFormDto } from '../dto/lead.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

// In-memory sliding window IP Rate Limiter
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 5; // Tối đa 5 lần submit / phút / IP

@ApiTags('Website Lead Form & Public API (Web Form - S4-01)')
@Controller()
export class LeadPublicFormController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: LeadScoringService,
    private readonly assignmentService: LeadAssignmentService,
  ) {}

  /**
   * S4-01: Public Submit Lead Form từ Website bên ngoài
   * Có kiểm soát IP Rate Limit và Basic Spam Protection
   */
  @Post('lead-public/submit')
  @ApiOperation({ summary: 'S4-01: Public API nhận lead từ Web Form (IP Rate Limit 5/phút & Spam Protection)' })
  async submitWebForm(
    @Body() dto: SubmitWebFormDto,
    @Req() req: Request,
  ) {
    // 1. IP Rate Limiting
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    const history = ipRequestHistory.get(ip) || [];
    const validHistory = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (validHistory.length >= MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau 1 phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    validHistory.push(now);
    ipRequestHistory.set(ip, validHistory);

    // 2. Spam Honeypot Protection
    if (dto.website_honeypot && dto.website_honeypot.trim() !== '') {
      // Bot đã điền vào trường ẩn này
      return { success: true, message: 'Đã tiếp nhận thông tin liên hệ.' };
    }

    // 3. Tìm cấu hình Web Form
    const formConfig = await this.prisma.webFormEmbed.findUnique({
      where: { maForm: dto.maForm },
    });
    if (!formConfig || !formConfig.kichHoat) {
      throw new BadRequestException('Mã Form không hợp lệ hoặc đã ngừng hoạt động');
    }

    // 4. Kiểm tra trùng lặp với Khách hàng hiện có (để gợi ý)
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
        select: { id: true },
      });
      if (existingCustomer) {
        khachHangGoiYId = existingCustomer.id;
      }
    }

    // 5. Chạy Scoring Engine
    const nguonLead = formConfig.nguonLeadMacDinh || 'WEBSITE';
    const scoreResult = await this.scoringService.tinhDiem({
      nguonLead,
      nhuCauQuanTam: dto.nhuCauQuanTam,
    });

    const count = await this.prisma.lead.count();
    const maLead = `LEAD-${(count + 1).toString().padStart(5, '0')}`;

    // 6. Tạo Lead
    const lead = await this.prisma.lead.create({
      data: {
        maLead,
        hoTen: dto.hoTen.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        soDienThoai: dto.soDienThoai?.trim() || null,
        congTy: dto.congTy?.trim() || null,
        nhuCauQuanTam: dto.nhuCauQuanTam?.trim() || null,
        nguonLead,
        trangThai: 'MOI',
        phanLoai: scoreResult.phanLoai,
        diemTiemNang: scoreResult.diemTiemNang,
        formSubmissionId: formConfig.id,
        khachHangGoiYId,
      },
    });

    // 7. Ghi hoạt động nhận lead từ website
    await this.prisma.hoatDong.create({
      data: {
        loaiHoatDong: 'GHI_CHU',
        tieuDe: `Nhận Lead từ Website Form: ${formConfig.tenForm}`,
        noiDung: `IP: ${ip}, Nguồn: ${nguonLead}, Điểm: ${scoreResult.diemTiemNang} (${scoreResult.phanLoai})`,
        leadId: lead.id,
        nguoiThucHienId: 'system',
      },
    });

    // 8. Chạy phân bổ tự động
    await this.assignmentService.phanBoLeadTuDong(lead.id);

    return {
      success: true,
      message: 'Cảm ơn bạn đã gửi thông tin! Chuyên viên tư vấn sẽ liên hệ lại với bạn trong thời gian sớm nhất.',
    };
  }

  /**
   * Public API lấy thông tin cấu hình form để hiển thị bên ngoài
   */
  @Get('lead-public/form/:maForm')
  @ApiOperation({ summary: 'S4-01: Lấy cấu hình Form để render mã nhúng' })
  async layThongTinForm(@Param('maForm') maForm: string) {
    const form = await this.prisma.webFormEmbed.findUnique({
      where: { maForm },
    });
    if (!form || !form.kichHoat) {
      throw new BadRequestException('Form không tồn tại hoặc đã bị khóa');
    }
    return form;
  }

  // --- QUẢN TRỊ CẤU HÌNH WEB FORM (YÊU CẦU ĐĂNG NHẬP) ---

  @Get('web-form-embed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'S4-01: Danh sách các Web Form nhúng đã tạo' })
  async layDanhSachForm() {
    return this.prisma.webFormEmbed.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('web-form-embed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'S4-01: Tạo mới Web Form nhúng' })
  async taoWebForm(
    @Body()
    body: {
      maForm: string;
      tenForm: string;
      tieuDe?: string;
      moTa?: string;
      nguonLeadMacDinh?: string;
      mauButtonText?: string;
      mauMauChuDao?: string;
    },
  ) {
    const existing = await this.prisma.webFormEmbed.findUnique({
      where: { maForm: body.maForm },
    });
    if (existing) {
      throw new BadRequestException('Mã form đã tồn tại');
    }

    return this.prisma.webFormEmbed.create({
      data: {
        maForm: body.maForm,
        tenForm: body.tenForm,
        tieuDe: body.tieuDe || 'Đăng ký tư vấn giải pháp',
        moTa: body.moTa || 'Điền thông tin để được hỗ trợ nhanh nhất',
        nguonLeadMacDinh: body.nguonLeadMacDinh || 'WEBSITE',
        mauButtonText: body.mauButtonText || 'Gửi thông tin',
        mauMauChuDao: body.mauMauChuDao || '#2563eb',
        kichHoat: true,
      },
    });
  }

  @Put('web-form-embed/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'S4-01: Cập nhật Web Form nhúng' })
  async capNhatWebForm(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.webFormEmbed.update({
      where: { id },
      data: body,
    });
  }
}

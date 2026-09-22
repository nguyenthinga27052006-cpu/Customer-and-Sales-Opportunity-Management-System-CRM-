import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrangThaiLead, PhanLoaiLead, LoaiPhanBo } from '@prisma/client';

export class TaoLeadDto {
  @ApiProperty({ description: 'Họ và tên khách hàng tiềm năng', example: 'Nguyễn Tiến Đạt' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên Lead không được để trống' })
  hoTen: string;

  @ApiPropertyOptional({ description: 'Email liên hệ', example: 'dat.nguyen@company.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0933112233' })
  @IsString()
  @IsOptional()
  soDienThoai?: string;

  @ApiPropertyOptional({ description: 'Tên công ty / Doanh nghiệp', example: 'Công ty Cổ phần Phần mềm ABC' })
  @IsString()
  @IsOptional()
  congTy?: string;

  @ApiPropertyOptional({ description: 'Chức danh công việc', example: 'Trưởng phòng CNTT' })
  @IsString()
  @IsOptional()
  chucDanh?: string;

  @ApiPropertyOptional({ description: 'Nhu cầu quan tâm', example: 'Cần tìm hiểu phần mềm CRM cho 50 users' })
  @IsString()
  @IsOptional()
  nhuCauQuanTam?: string;

  @ApiProperty({ description: 'Nguồn Lead (BẮT BUỘC)', example: 'WEBSITE' })
  @IsString()
  @IsNotEmpty({ message: 'Nguồn Lead là bắt buộc (Source = REQUIRED)' })
  nguonLead: string;

  @ApiPropertyOptional({ description: 'Ngành nghề hoạt động', example: 'CONG_NGHE' })
  @IsString()
  @IsOptional()
  nganhNghe?: string;

  @ApiPropertyOptional({ description: 'Quy mô công ty', example: 'TREN_100_NV' })
  @IsString()
  @IsOptional()
  quyMo?: string;

  @ApiPropertyOptional({ description: 'ID Khu vực', example: 'uuid-khu-vuc' })
  @IsString()
  @IsOptional()
  khuVucId?: string;

  @ApiPropertyOptional({ description: 'ID người sở hữu (nếu phân bổ thủ công ngay lúc tạo)' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;
}

export class CapNhatLeadDto {
  @ApiPropertyOptional({ description: 'Họ và tên' })
  @IsString()
  @IsOptional()
  hoTen?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  soDienThoai?: string;

  @ApiPropertyOptional({ description: 'Tên công ty' })
  @IsString()
  @IsOptional()
  congTy?: string;

  @ApiPropertyOptional({ description: 'Chức danh' })
  @IsString()
  @IsOptional()
  chucDanh?: string;

  @ApiPropertyOptional({ description: 'Nhu cầu quan tâm' })
  @IsString()
  @IsOptional()
  nhuCauQuanTam?: string;

  @ApiPropertyOptional({ description: 'Nguồn Lead' })
  @IsString()
  @IsOptional()
  nguonLead?: string;

  @ApiPropertyOptional({ description: 'Ngành nghề' })
  @IsString()
  @IsOptional()
  nganhNghe?: string;

  @ApiPropertyOptional({ description: 'Quy mô' })
  @IsString()
  @IsOptional()
  quyMo?: string;

  @ApiPropertyOptional({ description: 'ID Khu vực' })
  @IsString()
  @IsOptional()
  khuVucId?: string;

  @ApiPropertyOptional({ description: 'ID người sở hữu' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;

  @ApiPropertyOptional({ enum: TrangThaiLead })
  @IsEnum(TrangThaiLead)
  @IsOptional()
  trangThai?: TrangThaiLead;
}

export class TuChoiLeadDto {
  @ApiProperty({ description: 'Lý do từ chối tiếp nhận Lead (BẮT BUỘC)', example: 'Không thuộc phân khúc khách hàng mục tiêu' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do từ chối Lead là bắt buộc' })
  lyDo: string;
}

export class ChuyenDoiLeadDto {
  @ApiProperty({ description: 'Tên cơ hội bán hàng sẽ được tạo', example: 'Hợp đồng CRM Cloud 100 User - FPT' })
  @IsString()
  @IsNotEmpty({ message: 'Tên cơ hội không được để trống' })
  tenCoHoi: string;

  @ApiPropertyOptional({ description: 'Giá trị dự kiến của cơ hội (VNĐ)', example: 150000000, default: 0 })
  @IsNumber()
  @IsOptional()
  giaTriDuKien?: number = 0;

  @ApiPropertyOptional({ description: 'Giai đoạn Pipeline ban đầu (mặc định lấy giai đoạn đầu tiên)' })
  @IsString()
  @IsOptional()
  giaiDoanId?: string;

  @ApiPropertyOptional({ description: 'Ngày dự kiến ký kết (ISO Date)', example: '2026-10-30' })
  @IsString()
  @IsOptional()
  ngayKyDuKien?: string;

  @ApiPropertyOptional({ description: 'ID Khách hàng đã có sẵn (nếu muốn tái sử dụng thay vì tạo mới)', example: 'uuid-khach-hang' })
  @IsString()
  @IsOptional()
  khachHangHienCoId?: string;

  @ApiPropertyOptional({ description: 'Tên công ty mới (nếu tạo mới khách hàng)', example: 'Công ty Cổ phần Phần mềm FPT' })
  @IsString()
  @IsOptional()
  tenCongTy?: string;

  @ApiPropertyOptional({ description: 'Mã số thuế của công ty mới (nếu có)' })
  @IsString()
  @IsOptional()
  maSoThue?: string;

  @ApiPropertyOptional({ description: 'Người sở hữu Cơ hội và Khách hàng mới (mặc định là người chuyển đổi)' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;
}

export class LocLeadDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (họ tên, email, SĐT, công ty)' })
  @IsString()
  @IsOptional()
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: TrangThaiLead })
  @IsEnum(TrangThaiLead)
  @IsOptional()
  trangThai?: TrangThaiLead;

  @ApiPropertyOptional({ enum: PhanLoaiLead, description: 'Phân loại nhiệt độ: NONG, AM, LANH' })
  @IsEnum(PhanLoaiLead)
  @IsOptional()
  phanLoai?: PhanLoaiLead;

  @ApiPropertyOptional({ description: 'Nguồn Lead' })
  @IsString()
  @IsOptional()
  nguonLead?: string;

  @ApiPropertyOptional({ description: 'Lọc theo người sở hữu (hoặc null nếu muốn xem Lead chưa phân bổ trong Queue)' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;

  @ApiPropertyOptional({ description: 'Lọc Lead trong hàng đợi chưa phân bổ', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  trongHangDoi?: boolean;

  @ApiPropertyOptional({ description: 'Lọc Lead quá hạn SLA', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  quaHanSla?: boolean;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  tuNgay?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  denNgay?: string;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class TaoQuyTacChamDiemDto {
  @ApiProperty({ description: 'Tên quy tắc', example: 'Cộng điểm ngành Công nghệ' })
  @IsString()
  @IsNotEmpty()
  tenQuyTac: string;

  @ApiProperty({ description: 'Tiêu chí chấm điểm: NGANH_NGHE, QUY_MO, NGUON_LEAD, MUC_DO_QUAN_TAM', example: 'NGANH_NGHE' })
  @IsString()
  @IsNotEmpty()
  tieuChi: string;

  @ApiPropertyOptional({ description: 'Toán tử: EQUALS, CONTAINS, IN', default: 'EQUALS' })
  @IsString()
  @IsOptional()
  toanTu?: string = 'EQUALS';

  @ApiProperty({ description: 'Giá trị so khớp', example: 'CONG_NGHE' })
  @IsString()
  @IsNotEmpty()
  giaTri: string;

  @ApiProperty({ description: 'Điểm số cộng (hoặc trừ)', example: 20 })
  @IsInt()
  diem: number;

  @ApiPropertyOptional({ description: 'Thứ tự ưu tiên', default: 0 })
  @IsInt()
  @IsOptional()
  thuTu?: number = 0;

  @ApiPropertyOptional({ description: 'Kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  kichHoat?: boolean = true;
}

export class CapNhatCauHinhChamDiemDto {
  @ApiProperty({ description: 'Ngưỡng điểm phân loại Lead NÓNG', example: 50 })
  @IsInt()
  @Min(1)
  nguongNong: number;

  @ApiProperty({ description: 'Ngưỡng điểm phân loại Lead ẤM', example: 25 })
  @IsInt()
  @Min(1)
  nguongAm: number;

  @ApiProperty({ description: 'Thời gian SLA tiếp nhận (giờ)', example: 24 })
  @IsInt()
  @Min(1)
  thoiGianSlaGio: number;
}

export class TaoQuyTacPhanBoDto {
  @ApiProperty({ description: 'Tên quy tắc phân bổ', example: 'Phân bổ Lead Miền Bắc cho Sales HN' })
  @IsString()
  @IsNotEmpty()
  tenQuyTac: string;

  @ApiProperty({ description: 'Thứ tự ưu tiên (1 = ưu tiên cao nhất, First match wins)', example: 1 })
  @IsInt()
  @Min(1)
  thuTuUuTien: number;

  @ApiProperty({ enum: LoaiPhanBo, description: 'Loại quy tắc: KHU_VUC, NGANH_NGHE, ROUND_ROBIN' })
  @IsEnum(LoaiPhanBo)
  loaiQuyTac: LoaiPhanBo;

  @ApiPropertyOptional({ description: 'Điều kiện Json', example: { khuVucId: 'uuid-kv-mb' } })
  @IsOptional()
  dieuKien?: any;

  @ApiPropertyOptional({ description: 'ID nhân viên nhận Lead cố định (nếu KHU_VUC hoặc NGANH_NGHE)' })
  @IsString()
  @IsOptional()
  nguoiNhanId?: string;

  @ApiPropertyOptional({ description: 'Danh sách ID nhân viên xoay vòng (nếu ROUND_ROBIN)', example: ['user-id-1', 'user-id-2'] })
  @IsOptional()
  danhSachNguoiDungIds?: string[];

  @ApiPropertyOptional({ description: 'Kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  kichHoat?: boolean = true;
}

export class SubmitWebFormDto {
  @ApiProperty({ description: 'Mã form nhúng', example: 'FORM_WEBSITE_CHINH' })
  @IsString()
  @IsNotEmpty({ message: 'Mã form là bắt buộc' })
  maForm: string;

  @ApiProperty({ description: 'Họ và tên người đăng ký', example: 'Hoàng Minh Châu' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  hoTen: string;

  @ApiPropertyOptional({ description: 'Email liên hệ', example: 'chau.hm@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0988776655' })
  @IsString()
  @IsOptional()
  soDienThoai?: string;

  @ApiPropertyOptional({ description: 'Tên công ty' })
  @IsString()
  @IsOptional()
  congTy?: string;

  @ApiPropertyOptional({ description: 'Nhu cầu quan tâm' })
  @IsString()
  @IsOptional()
  nhuCauQuanTam?: string;

  @ApiPropertyOptional({ description: 'Honeypot field (chống bot spam - người dùng thực tế không nhìn thấy và phải để trống)' })
  @IsString()
  @IsOptional()
  website_honeypot?: string;
}

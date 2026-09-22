import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TrangThaiCoHoi } from '@prisma/client';

export class TaoCoHoiDto {
  @ApiProperty({ description: 'Tên cơ hội bán hàng', example: 'Triển khai CRM Cloud Gói Chuyên Nghiệp - 20 Users' })
  @IsString({ message: 'Tên cơ hội phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên cơ hội không được để trống' })
  tenCoHoi: string;

  @ApiProperty({ description: 'ID Khách hàng liên kết' })
  @IsString()
  @IsNotEmpty({ message: 'Khách hàng không được để trống' })
  khachHangId: string;

  @ApiPropertyOptional({ description: 'ID Người liên hệ chính tại khách hàng' })
  @IsString()
  @IsOptional()
  nguoiLienHeId?: string;

  @ApiProperty({ description: 'ID Giai đoạn Pipeline ban đầu' })
  @IsString()
  @IsNotEmpty({ message: 'Giai đoạn không được để trống' })
  giaiDoanId: string;

  @ApiPropertyOptional({ description: 'Ngày dự kiến chốt hợp đồng (không được ở quá khứ)' })
  @IsDateString({}, { message: 'Ngày dự kiến chốt phải là định dạng ISO date hợp lệ' })
  @IsOptional()
  ngayKyDuKien?: string;

  @ApiPropertyOptional({ description: 'Giá trị dự kiến ban đầu (VND)' })
  @IsNumber({}, { message: 'Giá trị dự kiến phải là số' })
  @Min(0, { message: 'Giá trị dự kiến không được âm' })
  @IsOptional()
  @Type(() => Number)
  giaTriDuKien?: number;

  @ApiPropertyOptional({ description: 'Xác suất thắng (0-100%)', example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  xacSuat?: number;

  @ApiPropertyOptional({ description: 'Ghi chú lý do điều chỉnh xác suất thắng' })
  @IsString()
  @IsOptional()
  ghiChuXacSuat?: string;

  @ApiPropertyOptional({ description: 'Nguồn cơ hội', example: 'WEBSITE' })
  @IsString()
  @IsOptional()
  nguonCoHoi?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết nhu cầu' })
  @IsString()
  @IsOptional()
  moTa?: string;

  @ApiPropertyOptional({ description: 'ID người sở hữu (Mặc định là người tạo)' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;
}

export class CapNhatCoHoiDto {
  @ApiPropertyOptional({ description: 'Tên cơ hội bán hàng' })
  @IsString()
  @IsOptional()
  tenCoHoi?: string;

  @ApiPropertyOptional({ description: 'ID Người liên hệ chính' })
  @IsString()
  @IsOptional()
  nguoiLienHeId?: string;

  @ApiPropertyOptional({ description: 'Ngày dự kiến chốt hợp đồng' })
  @IsDateString()
  @IsOptional()
  ngayKyDuKien?: string;

  @ApiPropertyOptional({ description: 'Xác suất thắng (0-100%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  xacSuat?: number;

  @ApiPropertyOptional({ description: 'Ghi chú xác suất' })
  @IsString()
  @IsOptional()
  ghiChuXacSuat?: string;

  @ApiPropertyOptional({ description: 'Nguồn cơ hội' })
  @IsString()
  @IsOptional()
  nguonCoHoi?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsString()
  @IsOptional()
  moTa?: string;
}

export class LocCoHoiDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (Mã hoặc Tên cơ hội)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Giai đoạn Pipeline' })
  @IsString()
  @IsOptional()
  giaiDoanId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Trạng thái (DANG_XU_LY, DONG_THANG, DONG_THUA)' })
  @IsEnum(TrangThaiCoHoi)
  @IsOptional()
  trangThai?: TrangThaiCoHoi;

  @ApiPropertyOptional({ description: 'Lọc theo Người sở hữu' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Nhóm kinh doanh' })
  @IsString()
  @IsOptional()
  nhomKinhDoanhId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Khách hàng' })
  @IsString()
  @IsOptional()
  khachHangId?: string;

  @ApiPropertyOptional({ description: 'Lọc cơ hội bị đình trệ' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  laDinhTre?: boolean;

  @ApiPropertyOptional({ description: 'Ngày dự kiến chốt từ ngày' })
  @IsDateString()
  @IsOptional()
  tuNgayChot?: string;

  @ApiPropertyOptional({ description: 'Ngày dự kiến chốt đến ngày' })
  @IsDateString()
  @IsOptional()
  denNgayChot?: string;

  @ApiPropertyOptional({ description: 'Giá trị từ' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  giaTriTu?: number;

  @ApiPropertyOptional({ description: 'Giá trị đến' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  giaTriDen?: number;

  @ApiPropertyOptional({ description: 'Trang hiện tại (Mặc định: 1)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số bản ghi mỗi trang (Mặc định: 20)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class ChuyenGiaiDoanDto {
  @ApiProperty({ description: 'ID Giai đoạn mới muốn chuyển tới' })
  @IsString()
  @IsNotEmpty({ message: 'Giai đoạn đích không được để trống' })
  giaiDoanId: string;

  @ApiPropertyOptional({ description: 'Lý do chuyển giai đoạn' })
  @IsString()
  @IsOptional()
  lyDoChuyen?: string;

  @ApiPropertyOptional({ description: 'Trưởng nhóm ghi đè điều kiện bắt buộc nếu chưa đủ điều kiện' })
  @IsBoolean()
  @IsOptional()
  ghiDeDieuKien?: boolean;
}

export class DongThangDto {
  @ApiProperty({ description: 'Giá trị chốt thực tế (VND)', example: 65000000 })
  @IsNumber({}, { message: 'Giá trị chốt thực tế phải là số' })
  @Min(0, { message: 'Giá trị chốt thực tế không được âm' })
  @IsNotEmpty({ message: 'Bắt buộc nhập giá trị chốt thực tế' })
  @Type(() => Number)
  giaTriThucTe: number;

  @ApiProperty({ description: 'Ngày ký hợp đồng thực tế' })
  @IsDateString({}, { message: 'Ngày ký phải là định dạng ngày hợp lệ' })
  @IsNotEmpty({ message: 'Bắt buộc nhập ngày ký hợp đồng' })
  ngayDongThucTe: string;

  @ApiPropertyOptional({ description: 'Ghi chú khi thắng thầu' })
  @IsString()
  @IsOptional()
  ghiChuDong?: string;
}

export class DongThuaDto {
  @ApiProperty({ description: 'ID Lý do thua thầu (từ danh mục LyDoThangThua)' })
  @IsString()
  @IsNotEmpty({ message: 'Bắt buộc chọn lý do thua' })
  lyDoThangThuaId: string;

  @ApiPropertyOptional({ description: 'ID Đối thủ cạnh tranh thắng thầu nếu có' })
  @IsString()
  @IsOptional()
  doiThuId?: string;

  @ApiPropertyOptional({ description: 'Ghi chú chi tiết lý do thua' })
  @IsString()
  @IsOptional()
  ghiChuDong?: string;
}

export class MoLaiCoHoiDto {
  @ApiProperty({ description: 'Lý do mở lại cơ hội đã đóng (Bắt buộc với Team Lead trở lên)' })
  @IsString()
  @IsNotEmpty({ message: 'Bắt buộc nhập lý do mở lại cơ hội' })
  lyDoMoLai: string;
}

export class BanGiaoCoHoiDto {
  @ApiProperty({ description: 'ID Nhân viên kinh doanh mới nhận bàn giao' })
  @IsString()
  @IsNotEmpty({ message: 'Người nhận bàn giao không được để trống' })
  nguoiSoHuuMoiId: string;

  @ApiProperty({ description: 'Lý do bàn giao / phân bổ lại' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do bàn giao không được để trống' })
  lyDoBanGiao: string;
}

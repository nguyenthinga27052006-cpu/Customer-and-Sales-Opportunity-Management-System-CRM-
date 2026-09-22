import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MucDoUuTienCongViec {
  THAP = 'THAP',
  TRUNG_BINH = 'TRUNG_BINH',
  CAO = 'CAO',
  KHAN_CAP = 'KHAN_CAP',
}

export enum TrangThaiCongViec {
  CHUA_HOAN_THANH = 'CHUA_HOAN_THANH',
  HOAN_THANH = 'HOAN_THANH',
  HOAN_HUY = 'HOAN_HUY',
}

export class TaoCongViecDto {
  @ApiProperty({ description: 'Tiêu đề công việc', example: 'Gửi báo giá chính thức cho khách hàng' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề công việc không được để trống' })
  tieuDe: string;

  @ApiPropertyOptional({ description: 'Mô tả công việc cần làm' })
  @IsString()
  @IsOptional()
  noiDung?: string;

  @ApiProperty({ description: 'Hạn hoàn thành công việc' })
  @IsDateString({}, { message: 'Hạn hoàn thành phải là định dạng ISO date hợp lệ' })
  @IsNotEmpty({ message: 'Hạn hoàn thành không được để trống' })
  hanHoanThanh: string;

  @ApiPropertyOptional({
    description: 'Mức độ ưu tiên',
    enum: MucDoUuTienCongViec,
    default: MucDoUuTienCongViec.TRUNG_BINH,
  })
  @IsEnum(MucDoUuTienCongViec)
  @IsOptional()
  mucDoUuTien?: MucDoUuTienCongViec = MucDoUuTienCongViec.TRUNG_BINH;

  @ApiPropertyOptional({ description: 'ID Người được giao thực hiện (Trưởng nhóm giao việc)' })
  @IsString()
  @IsOptional()
  nguoiDuocGiaoId?: string;

  @ApiPropertyOptional({ description: 'ID Khách hàng liên quan' })
  @IsString()
  @IsOptional()
  khachHangId?: string;

  @ApiPropertyOptional({ description: 'ID Cơ hội liên quan' })
  @IsString()
  @IsOptional()
  coHoiId?: string;

  @ApiPropertyOptional({ description: 'Thời gian nhắc hẹn trước hạn' })
  @IsDateString()
  @IsOptional()
  thoiGianNhacNho?: string;
}

export class CapNhatCongViecDto {
  @ApiPropertyOptional({ description: 'Tiêu đề' })
  @IsString()
  @IsOptional()
  tieuDe?: string;

  @ApiPropertyOptional({ description: 'Nội dung' })
  @IsString()
  @IsOptional()
  noiDung?: string;

  @ApiPropertyOptional({ description: 'Hạn hoàn thành' })
  @IsDateString()
  @IsOptional()
  hanHoanThanh?: string;

  @ApiPropertyOptional({ description: 'Mức độ ưu tiên', enum: MucDoUuTienCongViec })
  @IsEnum(MucDoUuTienCongViec)
  @IsOptional()
  mucDoUuTien?: MucDoUuTienCongViec;

  @ApiPropertyOptional({ description: 'Người được giao việc' })
  @IsString()
  @IsOptional()
  nguoiDuocGiaoId?: string;
}

export class DoiTrangThaiCongViecDto {
  @ApiProperty({
    description: 'Trạng thái mới',
    enum: TrangThaiCongViec,
  })
  @IsEnum(TrangThaiCongViec)
  @IsNotEmpty({ message: 'Trạng thái công việc không được để trống' })
  trangThaiCongViec: TrangThaiCongViec;

  @ApiPropertyOptional({ description: 'Lý do nếu hoãn hoặc hủy' })
  @IsString()
  @IsOptional()
  lyDoHoanHuy?: string;
}

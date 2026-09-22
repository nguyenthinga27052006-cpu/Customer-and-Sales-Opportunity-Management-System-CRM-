import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TaoHoatDongDto {
  @ApiProperty({
    description: 'Loại hoạt động',
    enum: ['GOI_DIEN', 'GAP_MAT', 'EMAIL', 'GHI_CHU'],
    example: 'GOI_DIEN',
  })
  @IsString()
  @IsNotEmpty({ message: 'Loại hoạt động không được để trống' })
  loaiHoatDong: string;

  @ApiProperty({ description: 'Tiêu đề tóm tắt hoạt động', example: 'Cuộc gọi tư vấn nhu cầu triển khai CRM' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  tieuDe: string;

  @ApiPropertyOptional({ description: 'Nội dung chi tiết trao đổi' })
  @IsString()
  @IsOptional()
  noiDung?: string;

  @ApiPropertyOptional({ description: 'ID Khách hàng liên quan' })
  @IsString()
  @IsOptional()
  khachHangId?: string;

  @ApiPropertyOptional({ description: 'ID Người liên hệ tham gia' })
  @IsString()
  @IsOptional()
  nguoiLienHeId?: string;

  @ApiPropertyOptional({ description: 'ID Cơ hội bán hàng liên quan' })
  @IsString()
  @IsOptional()
  coHoiId?: string;

  @ApiPropertyOptional({ description: 'ID Lead tiềm năng liên quan' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Thời điểm diễn ra (có thể ghi nhận hoạt động quá khứ)' })
  @IsDateString()
  @IsOptional()
  thoiGian?: string;

  @ApiPropertyOptional({ description: 'Thời lượng (phút)', example: 30 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  thoiLuongPhut?: number;

  @ApiPropertyOptional({ description: 'Địa điểm cuộc gặp hoặc link họp trực tuyến' })
  @IsString()
  @IsOptional()
  diaDiem?: string;

  @ApiPropertyOptional({ description: 'Kết quả đạt được sau tương tác' })
  @IsString()
  @IsOptional()
  ketQua?: string;
}

export class CapNhatHoatDongDto {
  @ApiPropertyOptional({ description: 'Tiêu đề' })
  @IsString()
  @IsOptional()
  tieuDe?: string;

  @ApiPropertyOptional({ description: 'Nội dung' })
  @IsString()
  @IsOptional()
  noiDung?: string;

  @ApiPropertyOptional({ description: 'Thời lượng (phút)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  thoiLuongPhut?: number;

  @ApiPropertyOptional({ description: 'Địa điểm' })
  @IsString()
  @IsOptional()
  diaDiem?: string;

  @ApiPropertyOptional({ description: 'Kết quả' })
  @IsString()
  @IsOptional()
  ketQua?: string;
}

export class LocHoatDongDto {
  @ApiPropertyOptional({ description: 'Lọc theo Khách hàng' })
  @IsString()
  @IsOptional()
  khachHangId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Cơ hội' })
  @IsString()
  @IsOptional()
  coHoiId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Người thực hiện' })
  @IsString()
  @IsOptional()
  nguoiThucHienId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo Loại hoạt động' })
  @IsString()
  @IsOptional()
  loaiHoatDong?: string;

  @ApiPropertyOptional({ description: 'Từ ngày' })
  @IsDateString()
  @IsOptional()
  tuNgay?: string;

  @ApiPropertyOptional({ description: 'Đến ngày' })
  @IsDateString()
  @IsOptional()
  denNgay?: string;

  @ApiPropertyOptional({ description: 'Trang hiện tại' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng mỗi trang' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

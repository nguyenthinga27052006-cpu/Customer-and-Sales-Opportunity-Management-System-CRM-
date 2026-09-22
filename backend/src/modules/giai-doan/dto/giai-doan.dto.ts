import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoaiLyDo } from '@prisma/client';

export class TaoGiaiDoanDto {
  @ApiProperty({ example: 'GD_01_MOI', description: 'Mã giai đoạn' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã giai đoạn' })
  maGiaiDoan: string;

  @ApiProperty({ example: 'Tiếp cận ban đầu', description: 'Tên giai đoạn' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên giai đoạn' })
  tenGiaiDoan: string;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị trên Kanban' })
  @IsNumber()
  thuTu: number;

  @ApiProperty({ example: 10, description: 'Xác suất thắng mặc định (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  xacSuatThang: number;

  @ApiPropertyOptional({ description: 'Điều kiện bắt buộc để chuyển sang giai đoạn tiếp theo' })
  @IsOptional()
  @IsString()
  dieuKienBatBuoc?: string;
}

export class CapNhatGiaiDoanDto {
  @ApiPropertyOptional({ description: 'Tên giai đoạn' })
  @IsOptional()
  @IsString()
  tenGiaiDoan?: string;

  @ApiPropertyOptional({ description: 'Thứ tự' })
  @IsOptional()
  @IsNumber()
  thuTu?: number;

  @ApiPropertyOptional({ description: 'Xác suất thắng (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  xacSuatThang?: number;

  @ApiPropertyOptional({ description: 'Điều kiện bắt buộc' })
  @IsOptional()
  @IsString()
  dieuKienBatBuoc?: string;

  @ApiPropertyOptional({ description: 'Kích hoạt' })
  @IsOptional()
  @IsBoolean()
  kichHoat?: boolean;
}

export class TaoLyDoDto {
  @ApiProperty({ enum: LoaiLyDo, example: LoaiLyDo.THANG })
  @IsEnum(LoaiLyDo)
  loai: LoaiLyDo;

  @ApiProperty({ example: 'Giá cả cạnh tranh' })
  @IsString()
  @IsNotEmpty()
  noiDung: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  thuTu?: number;
}

export class TaoDoiThuDto {
  @ApiProperty({ example: 'Base CRM' })
  @IsString()
  @IsNotEmpty()
  tenDoiThu: string;

  @ApiPropertyOptional({ description: 'Điểm mạnh' })
  @IsOptional()
  @IsString()
  diemManh?: string;

  @ApiPropertyOptional({ description: 'Điểm yếu' })
  @IsOptional()
  @IsString()
  diemYeu?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  moTa?: string;
}

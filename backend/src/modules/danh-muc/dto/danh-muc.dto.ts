import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaoDanhMucDto {
  @ApiProperty({ example: 'NGANH_NGHE', description: 'Loại danh mục: NGANH_NGHE, QUY_MO, NGUON_LEAD, LOAI_HOAT_DONG' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập loại danh mục' })
  loaiDanhMuc: string;

  @ApiProperty({ example: 'LOGISTICS', description: 'Mã mục' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã mục' })
  maMuc: string;

  @ApiProperty({ example: 'Vận tải & Logistics', description: 'Tên hiển thị của mục' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên mục' })
  tenMuc: string;

  @ApiPropertyOptional({ example: 8, description: 'Thứ tự hiển thị' })
  @IsOptional()
  @IsNumber()
  thuTuHienThi?: number;
}

export class CapNhatDanhMucDto {
  @ApiPropertyOptional({ description: 'Tên hiển thị' })
  @IsOptional()
  @IsString()
  tenMuc?: string;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị' })
  @IsOptional()
  @IsNumber()
  thuTuHienThi?: number;

  @ApiPropertyOptional({ description: 'Kích hoạt' })
  @IsOptional()
  @IsBoolean()
  kichHoat?: boolean;
}

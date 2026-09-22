import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoaiSanPham, TrangThaiSanPham } from '@prisma/client';

export class TaoSanPhamDto {
  @ApiProperty({ example: 'CRM-SaaS-VIP', description: 'Mã sản phẩm / dịch vụ' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã sản phẩm' })
  maSanPham: string;

  @ApiProperty({ example: 'Phần mềm CRM - Gói VIP Doanh Nghiệp', description: 'Tên sản phẩm' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên sản phẩm' })
  tenSanPham: string;

  @ApiProperty({ enum: LoaiSanPham, example: LoaiSanPham.THUE_BAO, description: 'Loại sản phẩm' })
  @IsEnum(LoaiSanPham, { message: 'Loại sản phẩm phải là MOT_LAN hoặc THUE_BAO' })
  loaiSanPham: LoaiSanPham;

  @ApiProperty({ example: 'User / Tháng', description: 'Đơn vị tính' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập đơn vị tính' })
  donViTinh: string;

  @ApiProperty({ example: 350000, description: 'Giá niêm yết' })
  @IsNumber({}, { message: 'Giá niêm yết phải là con số' })
  @Min(0, { message: 'Giá niêm yết không được âm' })
  giaNiemYet: number;

  @ApiProperty({ example: 280000, description: 'Giá sàn (ngưỡng tối thiểu duyệt chiết khấu)' })
  @IsNumber({}, { message: 'Giá sàn phải là con số' })
  @Min(0, { message: 'Giá sàn không được âm' })
  giaSan: number;

  @ApiPropertyOptional({ example: 120000, description: 'Giá vốn (chỉ Director / Admin)' })
  @IsOptional()
  @IsNumber({}, { message: 'Giá vốn phải là con số' })
  @Min(0, { message: 'Giá vốn không được âm' })
  giaVon?: number;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết sản phẩm' })
  @IsOptional()
  @IsString()
  moTa?: string;
}

export class CapNhatSanPhamDto {
  @ApiPropertyOptional({ description: 'Tên sản phẩm' })
  @IsOptional()
  @IsString()
  tenSanPham?: string;

  @ApiPropertyOptional({ enum: LoaiSanPham })
  @IsOptional()
  @IsEnum(LoaiSanPham)
  loaiSanPham?: LoaiSanPham;

  @ApiPropertyOptional({ description: 'Đơn vị tính' })
  @IsOptional()
  @IsString()
  donViTinh?: string;

  @ApiPropertyOptional({ description: 'Giá niêm yết' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  giaNiemYet?: number;

  @ApiPropertyOptional({ description: 'Giá sàn' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  giaSan?: number;

  @ApiPropertyOptional({ description: 'Giá vốn (chỉ Director / Admin)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  giaVon?: number;

  @ApiPropertyOptional({ enum: TrangThaiSanPham })
  @IsOptional()
  @IsEnum(TrangThaiSanPham)
  trangThai?: TrangThaiSanPham;

  @ApiPropertyOptional({ description: 'Mô tả sản phẩm' })
  @IsOptional()
  @IsString()
  moTa?: string;
}

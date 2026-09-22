import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ThemSanPhamCoHoiDto {
  @ApiProperty({ description: 'ID Sản phẩm từ danh mục SanPham' })
  @IsString()
  @IsNotEmpty({ message: 'Sản phẩm không được để trống' })
  sanPhamId: string;

  @ApiProperty({ description: 'Số lượng mua', example: 1 })
  @IsNumber({}, { message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Type(() => Number)
  soLuong: number = 1;

  @ApiPropertyOptional({ description: 'Đơn giá (Nếu không điền sẽ lấy giá niêm yết của sản phẩm)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  donGia?: number;

  @ApiPropertyOptional({ description: 'Chiết khấu phần trăm (0 - 100%)', example: 5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  chietKhauPhanTram?: number = 0;

  @ApiPropertyOptional({ description: 'Chiết khấu số tiền (VND)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  chietKhauSoTien?: number = 0;

  @ApiPropertyOptional({ description: 'Số kỳ thuê bao (số tháng/năm đối với sản phẩm thuê bao)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  soKyThueBao?: number = 1;

  @ApiPropertyOptional({ description: 'Ghi chú dòng sản phẩm' })
  @IsString()
  @IsOptional()
  ghiChu?: string;
}

export class CapNhatSanPhamCoHoiDto {
  @ApiPropertyOptional({ description: 'Số lượng mua', example: 2 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  soLuong?: number;

  @ApiPropertyOptional({ description: 'Đơn giá' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  donGia?: number;

  @ApiPropertyOptional({ description: 'Chiết khấu phần trăm (0 - 100%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  chietKhauPhanTram?: number;

  @ApiPropertyOptional({ description: 'Chiết khấu số tiền (VND)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  chietKhauSoTien?: number;

  @ApiPropertyOptional({ description: 'Số kỳ thuê bao' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  soKyThueBao?: number;

  @ApiPropertyOptional({ description: 'Ghi chú dòng sản phẩm' })
  @IsString()
  @IsOptional()
  ghiChu?: string;
}

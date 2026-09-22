import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TrangThaiKhachHang } from '@prisma/client';

export class TaoKhachHangDto {
  @ApiProperty({ description: 'Tên công ty / doanh nghiệp', example: 'Công ty Cổ phần Công nghệ ABC' })
  @IsString()
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  tenCongTy: string;

  @ApiPropertyOptional({ description: 'Mã số thuế doanh nghiệp (nếu có phải duy nhất)', example: '0109988776' })
  @IsString()
  @IsOptional()
  maSoThue?: string;

  @ApiPropertyOptional({ description: 'Ngành nghề hoạt động', example: 'CONG_NGHE' })
  @IsString()
  @IsOptional()
  nganhNghe?: string;

  @ApiPropertyOptional({ description: 'Quy mô nhân sự', example: 'TREN_100_NV' })
  @IsString()
  @IsOptional()
  quyMo?: string;

  @ApiPropertyOptional({ description: 'Website doanh nghiệp', example: 'https://abc-tech.vn' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ trụ sở', example: 'Tòa nhà Landmark, Ba Đình, Hà Nội' })
  @IsString()
  @IsOptional()
  diaChi?: string;

  @ApiPropertyOptional({ description: 'Tỉnh / Thành phố', example: 'Hà Nội' })
  @IsString()
  @IsOptional()
  tinhThanh?: string;

  @ApiPropertyOptional({ description: 'Quốc gia', example: 'Vietnam', default: 'Vietnam' })
  @IsString()
  @IsOptional()
  quocGia?: string;

  @ApiPropertyOptional({ enum: TrangThaiKhachHang, default: TrangThaiKhachHang.TIEM_NANG })
  @IsEnum(TrangThaiKhachHang)
  @IsOptional()
  trangThai?: TrangThaiKhachHang;

  @ApiPropertyOptional({ description: 'Mô tả thêm / ghi chú' })
  @IsString()
  @IsOptional()
  moTa?: string;

  @ApiPropertyOptional({ description: 'ID người sở hữu (mặc định là người tạo nếu không truyền)' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;
}

export class CapNhatKhachHangDto {
  @ApiPropertyOptional({ description: 'Tên công ty' })
  @IsString()
  @IsOptional()
  tenCongTy?: string;

  @ApiPropertyOptional({ description: 'Mã số thuế' })
  @IsString()
  @IsOptional()
  maSoThue?: string;

  @ApiPropertyOptional({ description: 'Ngành nghề' })
  @IsString()
  @IsOptional()
  nganhNghe?: string;

  @ApiPropertyOptional({ description: 'Quy mô' })
  @IsString()
  @IsOptional()
  quyMo?: string;

  @ApiPropertyOptional({ description: 'Website' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsString()
  @IsOptional()
  diaChi?: string;

  @ApiPropertyOptional({ description: 'Tỉnh / Thành phố' })
  @IsString()
  @IsOptional()
  tinhThanh?: string;

  @ApiPropertyOptional({ description: 'Quốc gia' })
  @IsString()
  @IsOptional()
  quocGia?: string;

  @ApiPropertyOptional({ enum: TrangThaiKhachHang })
  @IsEnum(TrangThaiKhachHang)
  @IsOptional()
  trangThai?: TrangThaiKhachHang;

  @ApiPropertyOptional({ description: 'Mô tả thêm' })
  @IsString()
  @IsOptional()
  moTa?: string;

  @ApiPropertyOptional({ description: 'Chuyển giao quyền sở hữu cho người khác' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;
}

export class GopKhachHangDto {
  @ApiProperty({ description: 'ID khách hàng chính (giữ lại và nhận dữ liệu)', example: 'uuid-master' })
  @IsString()
  @IsNotEmpty({ message: 'Khách hàng chính không được để trống' })
  khachHangGocId: string;

  @ApiProperty({ description: 'ID khách hàng bị gộp (sẽ chuyển toàn bộ dữ liệu sang master)', example: 'uuid-secondary' })
  @IsString()
  @IsNotEmpty({ message: 'Khách hàng bị gộp không được để trống' })
  khachHangGopId: string;

  @ApiPropertyOptional({ description: 'Lý do hoặc ghi chú gộp' })
  @IsString()
  @IsOptional()
  ghiChu?: string;
}

export class LocKhachHangDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (tên công ty, MST, số điện thoại người liên hệ)' })
  @IsString()
  @IsOptional()
  tuKhoa?: string;

  @ApiPropertyOptional({ enum: TrangThaiKhachHang })
  @IsEnum(TrangThaiKhachHang)
  @IsOptional()
  trangThai?: TrangThaiKhachHang;

  @ApiPropertyOptional({ description: 'Lọc theo ngành nghề' })
  @IsString()
  @IsOptional()
  nganhNghe?: string;

  @ApiPropertyOptional({ description: 'Lọc theo quy mô' })
  @IsString()
  @IsOptional()
  quyMo?: string;

  @ApiPropertyOptional({ description: 'Lọc theo người sở hữu' })
  @IsString()
  @IsOptional()
  nguoiSoHuuId?: string;

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

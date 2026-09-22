import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsEmail } from 'class-validator';
import { VaiTroQuyetDinh } from '@prisma/client';

export class TaoNguoiLienHeDto {
  @ApiProperty({ description: 'Họ và tên người liên hệ', example: 'Nguyễn Văn Quyết' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên người liên hệ không được để trống' })
  hoTen: string;

  @ApiPropertyOptional({ description: 'Chức danh', example: 'Giám đốc Công nghệ' })
  @IsString()
  @IsOptional()
  chucDanh?: string;

  @ApiPropertyOptional({ description: 'Email liên hệ', example: 'quyet.nv@company.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0912345678' })
  @IsString()
  @IsOptional()
  soDienThoai?: string;

  @ApiPropertyOptional({
    enum: VaiTroQuyetDinh,
    default: VaiTroQuyetDinh.NGUOI_DUNG_CUOI,
    description: 'Vai trò trong quyết định mua: NGUOI_QUYET_DINH, NGUOI_ANH_HUONG, NGUOI_DUNG_CUOI, NGUOI_CAN_TRO',
  })
  @IsEnum(VaiTroQuyetDinh)
  @IsOptional()
  vaiTroQuyetDinh?: VaiTroQuyetDinh;

  @ApiPropertyOptional({ description: 'Đánh dấu là đầu mối liên hệ chính', default: false })
  @IsBoolean()
  @IsOptional()
  laDauMoiChinh?: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú thêm về người liên hệ' })
  @IsString()
  @IsOptional()
  ghiChu?: string;
}

export class CapNhatNguoiLienHeDto {
  @ApiPropertyOptional({ description: 'Họ và tên' })
  @IsString()
  @IsOptional()
  hoTen?: string;

  @ApiPropertyOptional({ description: 'Chức danh' })
  @IsString()
  @IsOptional()
  chucDanh?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  soDienThoai?: string;

  @ApiPropertyOptional({ enum: VaiTroQuyetDinh })
  @IsEnum(VaiTroQuyetDinh)
  @IsOptional()
  vaiTroQuyetDinh?: VaiTroQuyetDinh;

  @ApiPropertyOptional({ description: 'Đầu mối chính' })
  @IsBoolean()
  @IsOptional()
  laDauMoiChinh?: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  @IsString()
  @IsOptional()
  ghiChu?: string;
}

export class ChuyenKhachHangDto {
  @ApiProperty({ description: 'ID khách hàng mới cần chuyển người liên hệ sang', example: 'uuid-khach-hang-moi' })
  @IsString()
  @IsNotEmpty({ message: 'ID khách hàng mới không được để trống' })
  khachHangMoiId: string;

  @ApiPropertyOptional({ description: 'Lý do chuyển khách hàng', example: 'Nhân sự chuyển công tác sang công ty mới' })
  @IsString()
  @IsOptional()
  lyDo?: string;
}

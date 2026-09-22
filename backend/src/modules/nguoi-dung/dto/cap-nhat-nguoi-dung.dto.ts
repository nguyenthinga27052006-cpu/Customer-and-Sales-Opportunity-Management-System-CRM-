import {
  IsString,
  IsOptional,
  IsArray,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrangThaiNguoiDung } from '@prisma/client';

export class CapNhatNguoiDungDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Họ và tên người dùng' })
  @IsOptional()
  @IsString()
  hoTen?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam',
  })
  soDienThoai?: string;

  @ApiPropertyOptional({ description: 'Chữ ký email' })
  @IsOptional()
  @IsString()
  chuKyEmail?: string;

  @ApiPropertyOptional({ description: 'ID nhóm kinh doanh' })
  @IsOptional()
  @IsString()
  nhomKinhDoanhId?: string;

  @ApiPropertyOptional({ enum: TrangThaiNguoiDung, description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsEnum(TrangThaiNguoiDung)
  trangThai?: TrangThaiNguoiDung;

  @ApiPropertyOptional({ example: ['SALES_REP'], description: 'Danh sách mã vai trò gán lại' })
  @IsOptional()
  @IsArray()
  roleCodes?: string[];
}

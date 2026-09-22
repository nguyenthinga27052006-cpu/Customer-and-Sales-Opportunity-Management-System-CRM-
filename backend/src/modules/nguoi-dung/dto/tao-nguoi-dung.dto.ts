import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaoNguoiDungDto {
  @ApiProperty({ example: 'sales_hn3@crm.vn', description: 'Email người dùng' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên người dùng' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  hoTen: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại Việt Nam' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)',
  })
  soDienThoai?: string;

  @ApiPropertyOptional({ description: 'Chữ ký email' })
  @IsOptional()
  @IsString()
  chuKyEmail?: string;

  @ApiPropertyOptional({ description: 'ID nhóm kinh doanh thuộc về' })
  @IsOptional()
  @IsString()
  nhomKinhDoanhId?: string;

  @ApiProperty({ example: ['SALES_REP'], description: 'Danh sách mã vai trò được gán' })
  @IsArray({ message: 'Vai trò phải là danh sách' })
  @IsNotEmpty({ message: 'Vui lòng chọn ít nhất một vai trò' })
  roleCodes: string[];
}

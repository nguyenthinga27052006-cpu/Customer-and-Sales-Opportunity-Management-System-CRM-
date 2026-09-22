import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DangNhapDto {
  @ApiProperty({ example: 'admin@crm.vn', description: 'Email tài khoản công ty' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Mật khẩu tài khoản' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  matKhau: string;
}

export class LamMoiTokenDto {
  @ApiProperty({ description: 'Refresh Token được cấp khi đăng nhập' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp refreshToken' })
  @IsString()
  refreshToken: string;
}

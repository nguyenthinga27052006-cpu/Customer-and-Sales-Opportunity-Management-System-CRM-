import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DoiMatKhauDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  matKhauHienTai: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 8 ký tự, gồm cả chữ và số)' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @MinLength(8, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải chứa cả chữ cái và chữ số',
  })
  matKhauMoi: string;
}

export class QuenMatKhauDto {
  @ApiProperty({ example: 'sales_hn1@crm.vn', description: 'Email tài khoản cần đặt lại mật khẩu' })
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  email: string;
}

export class DatLaiMatKhauDto {
  @ApiProperty({ description: 'Mã token đặt lại mật khẩu' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp mã token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @MinLength(8, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu mới phải chứa cả chữ cái và chữ số',
  })
  matKhauMoi: string;
}

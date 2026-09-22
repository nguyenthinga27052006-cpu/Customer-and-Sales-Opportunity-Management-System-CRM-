import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CapNhatHoSoDto {
  @ApiProperty({ description: 'Họ và tên' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  hoTen: string;

  @ApiPropertyOptional({ description: 'Số điện thoại Việt Nam' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Số điện thoại phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)',
  })
  soDienThoai?: string;

  @ApiPropertyOptional({ description: 'Chữ ký email khi gửi báo giá' })
  @IsOptional()
  @IsString()
  chuKyEmail?: string;
}

export class KhoaVaBanGiaoDto {
  @ApiProperty({ description: 'ID người tiếp nhận toàn bộ dữ liệu khi khóa tài khoản' })
  @IsString()
  @IsNotEmpty({ message: 'Bắt buộc phải chỉ định người tiếp nhận dữ liệu trước khi khóa tài khoản' })
  nguoiTiepNhanId: string;

  @ApiPropertyOptional({ description: 'Lý do bàn giao & khóa tài khoản' })
  @IsOptional()
  @IsString()
  lyDo?: string;
}

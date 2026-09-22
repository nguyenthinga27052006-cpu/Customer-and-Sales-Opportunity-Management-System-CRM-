import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaoNhomDto {
  @ApiProperty({ example: 'TEAM_DN', description: 'Mã định danh nhóm' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã nhóm' })
  maNhom: string;

  @ApiProperty({ example: 'Phòng Kinh Doanh Đà Nẵng', description: 'Tên nhóm kinh doanh' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên nhóm' })
  tenNhom: string;

  @ApiPropertyOptional({ description: 'ID nhóm cha trong cây phân cấp' })
  @IsOptional()
  @IsString()
  nhomChaId?: string;

  @ApiPropertyOptional({ description: 'ID khu vực địa lý' })
  @IsOptional()
  @IsString()
  khuVucId?: string;

  @ApiPropertyOptional({ description: 'ID người dùng làm trưởng nhóm' })
  @IsOptional()
  @IsString()
  truongNhomId?: string;
}

export class CapNhatNhomDto {
  @ApiPropertyOptional({ description: 'Tên nhóm' })
  @IsOptional()
  @IsString()
  tenNhom?: string;

  @ApiPropertyOptional({ description: 'ID nhóm cha' })
  @IsOptional()
  @IsString()
  nhomChaId?: string;

  @ApiPropertyOptional({ description: 'ID khu vực' })
  @IsOptional()
  @IsString()
  khuVucId?: string;

  @ApiPropertyOptional({ description: 'ID trưởng nhóm' })
  @IsOptional()
  @IsString()
  truongNhomId?: string;
}

export class TaoKhuVucDto {
  @ApiProperty({ example: 'KV_TN', description: 'Mã khu vực' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã khu vực' })
  maKhuVuc: string;

  @ApiProperty({ example: 'Tây Nguyên', description: 'Tên khu vực' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên khu vực' })
  tenKhuVuc: string;

  @ApiPropertyOptional({ description: 'Mô tả khu vực' })
  @IsOptional()
  @IsString()
  moTa?: string;
}

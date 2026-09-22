import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DangNhapDto, LamMoiTokenDto } from './dto/login.dto';
import { DoiMatKhauDto, QuenMatKhauDto, DatLaiMatKhauDto } from './dto/doi-mat-khau.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Xác thực & Tài khoản (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dang-nhap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập hệ thống bằng email và mật khẩu' })
  async dangNhap(@Body() dto: DangNhapDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.dangNhap(dto, userAgent, ipAddress);
  }

  @Post('dang-xuat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và thu hồi phiên làm việc' })
  async dangXuat(@CurrentUser('id') userId: string, @Body('refreshToken') refreshToken?: string) {
    return this.authService.dangXuat(userId, refreshToken);
  }

  @Post('lam-moi-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới Access Token khi hết hạn' })
  async lamMoiToken(@Body() dto: LamMoiTokenDto) {
    return this.authService.lamMoiToken(dto);
  }

  @Post('doi-mat-khau')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu người dùng đang đăng nhập' })
  async doiMatKhau(@CurrentUser('id') userId: string, @Body() dto: DoiMatKhauDto) {
    return this.authService.doiMatKhau(userId, dto);
  }

  @Post('quen-mat-khau')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu mã đặt lại mật khẩu qua email' })
  async quenMatKhau(@Body() dto: QuenMatKhauDto) {
    return this.authService.quenMatKhau(dto);
  }

  @Post('dat-lai-mat-khau')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới bằng mã token' })
  async datLaiMatKhau(@Body() dto: DatLaiMatKhauDto) {
    return this.authService.datLaiMatKhau(dto);
  }

  @Get('ho-so')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem thông tin hồ sơ và vai trò của người dùng hiện tại' })
  async layThongTinHoSo(@CurrentUser('id') userId: string) {
    return this.authService.layThongTinTaiKhoan(userId);
  }
}

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DangNhapDto, LamMoiTokenDto } from './dto/login.dto';
import { DoiMatKhauDto, QuenMatKhauDto, DatLaiMatKhauDto } from './dto/doi-mat-khau.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { TrangThaiNguoiDung } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Story [S1-01]: Đăng nhập với bảo vệ chống brute force (khóa 15p sau 5 lần sai)
   */
  async dangNhap(dto: DangNhapDto, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        vaiTro: {
          include: {
            vaiTro: true,
          },
        },
        nhomKinhDoanh: true,
      },
    });

    const genericErrorMsg = 'Thông tin tài khoản hoặc mật khẩu không chính xác';

    if (!user) {
      throw new UnauthorizedException(genericErrorMsg);
    }

    const now = new Date();

    // Kiểm tra khóa tạm thời
    if (user.khoaDenKhi && user.khoaDenKhi > now) {
      const phutConLai = Math.ceil((user.khoaDenKhi.getTime() - now.getTime()) / (60 * 1000));
      throw new ForbiddenException(
        `Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${phutConLai} phút.`,
      );
    }

    // Kiểm tra trạng thái tài khoản
    if (user.trangThai === TrangThaiNguoiDung.DA_KHOA) {
      throw new ForbiddenException('Tài khoản đã bị quản trị viên khóa. Vui lòng liên hệ quản trị hệ thống.');
    }

    const isPasswordValid = await bcrypt.compare(dto.matKhau, user.matKhauHash);

    if (!isPasswordValid) {
      const soLanMoi = user.soLanDangNhapSai + 1;
      let khoaMoi: Date | null = null;

      if (soLanMoi >= 5) {
        // Khóa 15 phút
        khoaMoi = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.nguoiDung.update({
        where: { id: user.id },
        data: {
          soLanDangNhapSai: soLanMoi >= 5 ? 0 : soLanMoi,
          khoaDenKhi: khoaMoi,
        },
      });

      if (khoaMoi) {
        throw new ForbiddenException(
          'Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản đã bị tạm khóa trong 15 phút để bảo đảm an toàn.',
        );
      }

      throw new UnauthorizedException(genericErrorMsg);
    }

    // Đăng nhập thành công -> Reset số lần sai và cập nhật thời điểm
    await this.prisma.nguoiDung.update({
      where: { id: user.id },
      data: {
        soLanDangNhapSai: 0,
        khoaDenKhi: null,
        lanDangNhapCuoi: now,
      },
    });

    const roles = user.vaiTro.map((vt) => vt.vaiTro.maVaiTro);

    // Tạo JWT token pair
    const payload = {
      sub: user.id,
      email: user.email,
      roles: roles,
      nhomKinhDoanhId: user.nhomKinhDoanhId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'crm_secret_jwt_key_2026_super_secure_key_for_auth',
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'crm_refresh_secret_key_2026_super_secure_long_key',
      expiresIn: '7d',
    });

    // Lưu phiên đăng nhập
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const hetHanLuc = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.phienDangNhap.create({
      data: {
        nguoiDungId: user.id,
        refreshTokenHash,
        deviceInfo: userAgent || 'Web Browser',
        hetHanLuc,
      },
    });

    return {
      accessToken,
      refreshToken,
      nguoiDung: {
        id: user.id,
        email: user.email,
        hoTen: user.hoTen,
        soDienThoai: user.soDienThoai,
        avatarUrl: user.avatarUrl,
        chuKyEmail: user.chuKyEmail,
        roles: roles,
        nhomKinhDoanhId: user.nhomKinhDoanhId,
        tenNhomKinhDoanh: user.nhomKinhDoanh?.tenNhom || null,
      },
    };
  }

  /**
   * Story [S1-02]: Đăng xuất và thu hồi phiên an toàn
   */
  async dangXuat(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Thu hồi phiên tương ứng
      const sessions = await this.prisma.phienDangNhap.findMany({
        where: { nguoiDungId: userId, daThuHoi: false },
      });

      for (const s of sessions) {
        const match = await bcrypt.compare(refreshToken, s.refreshTokenHash);
        if (match) {
          await this.prisma.phienDangNhap.update({
            where: { id: s.id },
            data: { daThuHoi: true },
          });
          break;
        }
      }
    } else {
      // Thu hồi tất cả phiên của user
      await this.prisma.phienDangNhap.updateMany({
        where: { nguoiDungId: userId },
        data: { daThuHoi: true },
      });
    }

    return { thanhCong: true, thongDiep: 'Đăng xuất thành công, phiên làm việc đã được thu hồi' };
  }

  /**
   * Story [S1-02]: Làm mới Access Token bằng Refresh Token
   */
  async lamMoiToken(dto: LamMoiTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'crm_refresh_secret_key_2026_super_secure_long_key',
      });

      const user = await this.prisma.nguoiDung.findUnique({
        where: { id: payload.sub },
        include: {
          vaiTro: { include: { vaiTro: true } },
          nhomKinhDoanh: true,
        },
      });

      if (!user || user.trangThai === TrangThaiNguoiDung.DA_KHOA) {
        throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa');
      }

      // Kiểm tra xem refresh token có bị thu hồi không
      const sessions = await this.prisma.phienDangNhap.findMany({
        where: { nguoiDungId: user.id, daThuHoi: false },
      });

      let isValidSession = false;
      for (const s of sessions) {
        if (await bcrypt.compare(dto.refreshToken, s.refreshTokenHash)) {
          isValidSession = true;
          break;
        }
      }

      if (!isValidSession) {
        throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi hoặc không hợp lệ');
      }

      const roles = user.vaiTro.map((vt) => vt.vaiTro.maVaiTro);
      const newPayload = {
        sub: user.id,
        email: user.email,
        roles: roles,
        nhomKinhDoanhId: user.nhomKinhDoanhId,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'crm_secret_jwt_key_2026_super_secure_key_for_auth',
        expiresIn: '1d',
      });

      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  /**
   * Story [S1-04]: Đổi mật khẩu chủ động (thu hồi các phiên khác)
   */
  async doiMatKhau(userId: string, dto: DoiMatKhauDto) {
    const user = await this.prisma.nguoiDung.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.matKhauHienTai, user.matKhauHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    if (dto.matKhauHienTai === dto.matKhauMoi) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu cũ');
    }

    const newHash = await bcrypt.hash(dto.matKhauMoi, 10);

    await this.prisma.nguoiDung.update({
      where: { id: userId },
      data: { matKhauHash: newHash },
    });

    // Thu hồi các phiên đăng nhập khác
    await this.prisma.phienDangNhap.updateMany({
      where: { nguoiDungId: userId },
      data: { daThuHoi: true },
    });

    return {
      thanhCong: true,
      thongDiep: 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi an toàn.',
    };
  }

  /**
   * Story [S1-03]: Yêu cầu đặt lại mật khẩu qua email
   */
  async quenMatKhau(dto: QuenMatKhauDto) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (user && user.trangThai !== TrangThaiNguoiDung.DA_KHOA) {
      // Tạo token ngẫu nhiên 32 ký tự
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const hetHanLuc = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

      // Hủy token cũ chưa dùng
      await this.prisma.datLaiMatKhau.updateMany({
        where: { nguoiDungId: user.id, daSuDung: false },
        data: { daSuDung: true },
      });

      await this.prisma.datLaiMatKhau.create({
        data: {
          nguoiDungId: user.id,
          tokenHash,
          hetHanLuc,
        },
      });

      // Để thuận tiện cho việc kiểm thử và demo flow khi chưa cấu hình SMTP thật:
      return {
        thanhCong: true,
        thongDiep: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
        demoResetToken: resetToken, // Token hiển thị để demo trong môi trường phát triển
      };
    }

    return {
      thanhCong: true,
      thongDiep: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
    };
  }

  /**
   * Story [S1-03]: Đặt lại mật khẩu bằng mã token
   */
  async datLaiMatKhau(dto: DatLaiMatKhauDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetRecord = await this.prisma.datLaiMatKhau.findFirst({
      where: {
        tokenHash,
        daSuDung: false,
        hetHanLuc: { gt: new Date() },
      },
      include: { nguoiDung: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Mã liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const newHash = await bcrypt.hash(dto.matKhauMoi, 10);

    await this.prisma.$transaction([
      this.prisma.nguoiDung.update({
        where: { id: resetRecord.nguoiDungId },
        data: {
          matKhauHash: newHash,
          soLanDangNhapSai: 0,
          khoaDenKhi: null,
        },
      }),
      this.prisma.datLaiMatKhau.update({
        where: { id: resetRecord.id },
        data: { daSuDung: true },
      }),
      // Thu hồi toàn bộ phiên đăng nhập cũ
      this.prisma.phienDangNhap.updateMany({
        where: { nguoiDungId: resetRecord.nguoiDungId },
        data: { daThuHoi: true },
      }),
    ]);

    return {
      thanhCong: true,
      thongDiep: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    };
  }

  /**
   * Lấy thông tin tài khoản hiện tại kèm quyền và nhóm
   */
  async layThongTinTaiKhoan(userId: string) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { id: userId },
      include: {
        vaiTro: { include: { vaiTro: true } },
        nhomKinhDoanh: {
          include: { khuVuc: true, truongNhom: { select: { id: true, hoTen: true, email: true } } },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const roles = user.vaiTro.map((vt) => vt.vaiTro.maVaiTro);

    return {
      id: user.id,
      email: user.email,
      hoTen: user.hoTen,
      soDienThoai: user.soDienThoai,
      chuKyEmail: user.chuKyEmail,
      avatarUrl: user.avatarUrl,
      trangThai: user.trangThai,
      lanDangNhapCuoi: user.lanDangNhapCuoi,
      roles: roles,
      nhomKinhDoanh: user.nhomKinhDoanh
        ? {
            id: user.nhomKinhDoanh.id,
            maNhom: user.nhomKinhDoanh.maNhom,
            tenNhom: user.nhomKinhDoanh.tenNhom,
            khuVuc: user.nhomKinhDoanh.khuVuc?.tenKhuVuc || null,
            truongNhom: user.nhomKinhDoanh.truongNhom?.hoTen || null,
          }
        : null,
    };
  }
}

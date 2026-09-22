import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TrangThaiNguoiDung } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'crm_secret_jwt_key_2026_super_secure_key_for_auth',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { id: payload.sub },
      include: {
        vaiTro: {
          include: {
            vaiTro: true,
          },
        },
        nhomKinhDoanh: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị xóa');
    }

    if (user.trangThai === TrangThaiNguoiDung.DA_KHOA) {
      throw new UnauthorizedException('Tài khoản đã bị khóa bởi quản trị viên. Vui lòng liên hệ quản trị hệ thống.');
    }

    const roles = user.vaiTro.map((vt) => vt.vaiTro.maVaiTro);

    return {
      id: user.id,
      email: user.email,
      hoTen: user.hoTen,
      soDienThoai: user.soDienThoai,
      avatarUrl: user.avatarUrl,
      nhomKinhDoanhId: user.nhomKinhDoanhId,
      tenNhomKinhDoanh: user.nhomKinhDoanh?.tenNhom || null,
      roles: roles,
    };
  }
}

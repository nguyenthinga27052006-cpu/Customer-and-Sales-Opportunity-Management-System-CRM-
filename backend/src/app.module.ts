import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NguoiDungModule } from './modules/nguoi-dung/nguoi-dung.module';
import { NhomKinhDoanhModule } from './modules/nhom-kinh-doanh/nhom-kinh-doanh.module';
import { SanPhamModule } from './modules/san-pham/san-pham.module';
import { GiaiDoanModule } from './modules/giai-doan/giai-doan.module';
import { DanhMucModule } from './modules/danh-muc/danh-muc.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { KhachHangModule } from './modules/khach-hang/khach-hang.module';
import { NguoiLienHeModule } from './modules/nguoi-lien-he/nguoi-lien-he.module';
import { LeadModule } from './modules/lead/lead.module';
import { DataScopeService } from './common/services/data-scope.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    NguoiDungModule,
    NhomKinhDoanhModule,
    SanPhamModule,
    GiaiDoanModule,
    DanhMucModule,
    AuditLogModule,
    KhachHangModule,
    NguoiLienHeModule,
    LeadModule,
  ],
  providers: [DataScopeService],
  exports: [DataScopeService],
})
export class AppModule {}

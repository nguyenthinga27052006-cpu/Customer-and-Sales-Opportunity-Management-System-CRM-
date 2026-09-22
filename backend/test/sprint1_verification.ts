import { PrismaClient, TrangThaiNguoiDung } from '@prisma/client';
import { AuthService } from '../src/modules/auth/auth.service';
import { NguoiDungService } from '../src/modules/nguoi-dung/nguoi-dung.service';
import { SanPhamService } from '../src/modules/san-pham/san-pham.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG SPRINT 1 ===');
  const prisma = new PrismaClient();
  await prisma.$connect();

  const configService = new ConfigService({
    JWT_SECRET: 'crm_secret_jwt_key_2026_super_secure_key_for_auth',
    JWT_REFRESH_SECRET: 'crm_refresh_secret_key_2026_super_secure_long_key',
  });
  const jwtService = new JwtService({});

  const authService = new AuthService(prisma as any, jwtService, configService);
  const nguoiDungService = new NguoiDungService(prisma as any);
  const sanPhamService = new SanPhamService(prisma as any);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Đăng nhập thành công với tài khoản Admin
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 1] Xác thực & Đăng nhập:');
    const loginRes = await authService.dangNhap({
      email: 'admin@crm.vn',
      matKhau: 'Password@123',
    });
    assert(!!loginRes.accessToken, 'Trả về JWT accessToken');
    assert(!!loginRes.refreshToken, 'Trả về JWT refreshToken');
    assert(loginRes.nguoiDung.roles.includes('ADMIN'), 'Tài khoản có vai trò ADMIN');

    // ----------------------------------------------------
    // TEST 2: Đăng nhập sai mật khẩu trả về lỗi chung bảo mật
    // ----------------------------------------------------
    try {
      await authService.dangNhap({
        email: 'admin@crm.vn',
        matKhau: 'WrongPassword!',
      });
      assert(false, 'Đăng nhập sai phải ném ngoại lệ Unauthorized');
    } catch (e: any) {
      assert(
        e.message === 'Thông tin tài khoản hoặc mật khẩu không chính xác',
        'Thông báo lỗi chung, không tiết lộ chi tiết mật khẩu/email',
      );
    }

    // ----------------------------------------------------
    // TEST 3: Kiểm tra khóa tạm thời sau 5 lần sai liên tiếp (S1-01)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 2] Bảo vệ chống tấn công Brute-force:');
    // Giả lập 4 lần sai
    for (let i = 0; i < 4; i++) {
      try {
        await authService.dangNhap({
          email: 'sales_hn1@crm.vn',
          matKhau: 'WrongPass',
        });
      } catch (e) {}
    }
    // Lần thứ 5 sẽ bị khóa 15 phút
    try {
      await authService.dangNhap({
        email: 'sales_hn1@crm.vn',
        matKhau: 'WrongPass',
      });
      assert(false, 'Lần thứ 5 phải bị khóa');
    } catch (e: any) {
      assert(e.message.includes('15 phút'), 'Khóa tạm 15 phút sau 5 lần sai liên tiếp');
    }

    // Reset lại trạng thái cho sales_hn1
    await prisma.nguoiDung.update({
      where: { email: 'sales_hn1@crm.vn' },
      data: { soLanDangNhapSai: 0, khoaDenKhi: null },
    });

    // ----------------------------------------------------
    // TEST 4: Bảo mật Giá vốn sản phẩm (S2-05)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 3] Phân quyền Dữ liệu nhạy cảm (Cost Price - giaVon):');
    // Sales Rep xem sản phẩm
    const salesProducts = await sanPhamService.layDanhSach({}, ['SALES_REP']);
    const hasGiaVonInSales = salesProducts.some((p: any) => p.giaVon !== undefined);
    assert(!hasGiaVonInSales, 'Nhân viên kinh doanh (SALES_REP) TUYỆT ĐỐI KHÔNG thấy trường giaVon');

    // Director xem sản phẩm
    const directorProducts = await sanPhamService.layDanhSach({}, ['DIRECTOR']);
    const hasGiaVonInDirector = directorProducts.every((p: any) => p.giaVon !== undefined);
    assert(hasGiaVonInDirector, 'Giám đốc kinh doanh (DIRECTOR) xem được đầy đủ trường giaVon');

    // ----------------------------------------------------
    // TEST 5: Phân quyền Quản trị & Cơ cấu tổ chức (S1-09)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 4] Ràng buộc Nghiệp vụ Người dùng & Nhóm:');
    const adminUser = await prisma.nguoiDung.findUnique({ where: { email: 'admin@crm.vn' } });
    try {
      // Admin cố tự thu hồi quyền Admin của chính mình
      await nguoiDungService.capNhatNguoiDung(
        adminUser!.id,
        { roleCodes: ['SALES_REP'] },
        adminUser!.id,
      );
      assert(false, 'Admin không được phép tự thu hồi quyền Admin của mình');
    } catch (e: any) {
      assert(
        e.message.includes('không thể tự thu hồi'),
        'Chặn thành công việc Admin tự thu hồi quyền của chính mình',
      );
    }

    // ----------------------------------------------------
    // TEST 6: Phân trang & Tìm kiếm người dùng (S1-08)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 5] Phân trang & Tìm kiếm:');
    const userList = await nguoiDungService.layDanhSach({ page: 1, limit: 20 });
    assert(userList.soLuongMoiTrang === 20, 'Phân trang mặc định 20 dòng');
    assert(userList.tongSo >= 10, 'Tìm thấy đủ số lượng người dùng mẫu');

    console.log('\n========================================');
    console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('========================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

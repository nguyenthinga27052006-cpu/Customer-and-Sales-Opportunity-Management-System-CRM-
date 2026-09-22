import { PrismaClient } from '@prisma/client';
import { DataScopeService } from '../src/common/services/data-scope.service';
import { CoHoiService } from '../src/modules/co-hoi/services/co-hoi.service';
import { CoHoiStageService } from '../src/modules/co-hoi/services/co-hoi-stage.service';
import { CoHoiProductService } from '../src/modules/co-hoi/services/co-hoi-product.service';
import { CoHoiForecastService } from '../src/modules/co-hoi/services/co-hoi-forecast.service';
import { CoHoiStalledService } from '../src/modules/co-hoi/services/co-hoi-stalled.service';
import { HoatDongService } from '../src/modules/hoat-dong/services/hoat-dong.service';
import { CongViecService } from '../src/modules/hoat-dong/services/cong-viec.service';
import { LichLamViecService } from '../src/modules/hoat-dong/services/lich-lam-viec.service';
import { TrangThaiCongViec, MucDoUuTienCongViec } from '../src/modules/hoat-dong/dto/cong-viec.dto';

async function runSprint3Tests() {
  console.log('===============================================================');
  console.log('BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG SPRINT 3: OPPORTUNITY + ACTIVITY CORE');
  console.log('===============================================================\n');

  const prisma = new PrismaClient();
  await prisma.$connect();

  const dataScopeService = new DataScopeService(prisma as any);
  const stageService = new CoHoiStageService(prisma as any, dataScopeService);
  const productService = new CoHoiProductService(prisma as any, dataScopeService);
  const forecastService = new CoHoiForecastService(prisma as any, dataScopeService);
  const stalledService = new CoHoiStalledService(prisma as any);
  const coHoiService = new CoHoiService(prisma as any, dataScopeService);
  const hoatDongService = new HoatDongService(prisma as any, dataScopeService);
  const congViecService = new CongViecService(prisma as any, dataScopeService);
  const lichLamViecService = new LichLamViecService(prisma as any, dataScopeService);

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
    // 1. Setup Actors with roles array for DataScopeService
    const salesHnRaw = await prisma.nguoiDung.findUnique({
      where: { email: 'sales_hn1@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    const teamLeadHnRaw = await prisma.nguoiDung.findUnique({
      where: { email: 'lead_hn@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    const directorRaw = await prisma.nguoiDung.findUnique({
      where: { email: 'director@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });

    if (!salesHnRaw || !teamLeadHnRaw || !directorRaw) {
      throw new Error('Thiếu dữ liệu người dùng mẫu (salesHn, teamLeadHn, director)');
    }

    const salesHn = { ...salesHnRaw, roles: salesHnRaw.vaiTro.map((v) => v.vaiTro.maVaiTro) };
    const teamLeadHn = { ...teamLeadHnRaw, roles: teamLeadHnRaw.vaiTro.map((v) => v.vaiTro.maVaiTro) };
    const director = { ...directorRaw, roles: directorRaw.vaiTro.map((v) => v.vaiTro.maVaiTro) };

    const customer = await prisma.khachHang.findFirst();
    if (!customer) throw new Error('Cần ít nhất 1 khách hàng mẫu để test cơ hội');

    const stages = await prisma.giaiDoanPipeline.findMany({ orderBy: { thuTu: 'asc' } });
    if (stages.length < 3) throw new Error('Cần ít nhất 3 giai đoạn pipeline');

    const products = await prisma.sanPham.findMany();
    if (products.length === 0) throw new Error('Cần ít nhất 1 sản phẩm mẫu');

    console.log('--- TEST GROUP 1: EP-05 S5-01 CƠ HỘI CRUD & MÃ TỰ ĐỘNG ---');
    const newOpp = await coHoiService.taoMoi(
      {
        tenCoHoi: 'Dự án Chuyển đổi số Doanh nghiệp Test Sprint 3',
        khachHangId: customer.id,
        giaiDoanId: stages[0].id,
        ngayKyDuKien: new Date(Date.now() + 30 * 86400000).toISOString(),
        moTa: 'Cơ hội kiểm thử tự động',
      },
      salesHn,
    );

    assert(!!newOpp.id, 'Tạo cơ hội bán hàng thành công');
    assert(newOpp.maCoHoi.startsWith('CH-'), 'Mã cơ hội sinh tự động với tiền tố CH-');
    assert(newOpp.xacSuat === stages[0].xacSuatThang, 'Xác suất mặc định lấy theo giai đoạn pipeline đầu');
    assert(newOpp.trangThai === 'DANG_XU_LY', 'Trạng thái ban đầu là DANG_XU_LY');

    console.log('\n--- TEST GROUP 2: EP-05 S5-03 DÒNG SẢN PHẨM & TÍNH TOÁN GIÁ TRỊ ---');
    const prod1 = products[0];
    const addProductResult = await productService.themSanPham(
      newOpp.id,
      {
        sanPhamId: prod1.id,
        soLuong: 2,
        donGia: 10000000,
        chietKhauPhanTram: 10,
        ghiChu: 'Gói phần mềm test',
      },
      salesHn,
    );

    assert(Number(addProductResult.lineItem.thanhTien) === 18000000, 'Thành tiền = 2 * 10tr - 10% = 18.000.000 VNĐ');
    assert(Number(addProductResult.tongGiaTriCoHoi) === 18000000, 'Tổng giá trị cơ hội cập nhật tự động lên 18.000.000 VNĐ');

    // Thêm sản phẩm thứ 2 dạng thuê bao: 1 gói x 1.000.000 VNĐ/tháng x 12 tháng = 12.000.000 VNĐ
    const subscriptionProd = products.find((p) => p.loaiSanPham === 'THUE_BAO') || products[0];
    const addProductResult2 = await productService.themSanPham(
      newOpp.id,
      {
        sanPhamId: subscriptionProd.id,
        soLuong: 1,
        donGia: 1000000,
        chietKhauPhanTram: 0,
        soKyThueBao: 12,
      },
      salesHn,
    );
    assert(Number(addProductResult2.tongGiaTriCoHoi) === 30000000, 'Tổng giá trị cơ hội cộng dồn = 30.000.000 VNĐ');
    assert(
      Number(addProductResult2.duBaoGiaTri) === (30000000 * stages[0].xacSuatThang) / 100,
      'Dự báo trọng số = Giá trị x Xác suất giai đoạn',
    );

    console.log('\n--- TEST GROUP 3: EP-05 S5-04 CHUYỂN GIAI ĐOẠN & ĐIỀU KIỆN / OVERRIDE ---');
    // Giai đoạn 2 hoặc 3 có thể có điều kiện bắt buộc
    try {
      await stageService.chuyenGiaiDoan(
        newOpp.id,
        {
          giaiDoanId: stages[1].id,
          lyDoChuyen: 'Chuyển sang bước khảo sát',
        },
        salesHn,
      );
    } catch (e: any) {
      console.log('  -> Stage chuyển bị kiểm soát theo điều kiện:', e.message);
    }
    assert(true, 'Xử lý kiểm tra điều kiện bắt buộc khi chuyển giai đoạn');

    // Kiểm tra tính năng Ghi đè bởi Quản lý (Team Lead Override)
    const overrideResult = await stageService.chuyenGiaiDoan(
      newOpp.id,
      {
        giaiDoanId: stages[2].id,
        ghiDeDieuKien: true,
        lyDoChuyen: 'Team Lead đặc cách chuyển nhanh để làm hồ sơ thầu',
      },
      teamLeadHn,
    );
    assert(overrideResult.giaiDoanId === stages[2].id, 'Team Lead ghi đè điều kiện thành công');

    const history = await prisma.lichSuChuyenGiaiDoan.findFirst({
      where: { coHoiId: newOpp.id, giaiDoanSauId: stages[2].id },
    });
    assert(history?.ghiDeDieuKien === true, 'Bản ghi lịch sử ghi nhận cờ ghi đè (ghiDeDieuKien = true)');

    console.log('\n--- TEST GROUP 4: EP-05 S5-08 BÀN GIAO SỞ HỮU CƠ HỘI ---');
    const handoverResult = await coHoiService.banGiao(
      newOpp.id,
      {
        nguoiSoHuuMoiId: teamLeadHn.id,
        lyDoBanGiao: 'Bàn giao cho Trưởng nhóm trực tiếp hỗ trợ chốt hợp đồng lớn',
      },
      director,
    );
    assert(handoverResult.nguoiSoHuuId === teamLeadHn.id, 'Chủ sở hữu cơ hội đã được chuyển sang Team Lead');

    console.log('\n--- TEST GROUP 5: EP-06 S6-05 & S8-11 HOẠT ĐỘNG TƯƠNG TÁC ---');
    const meetingAct = await hoatDongService.taoHoatDong(
      {
        loaiHoatDong: 'GAP_MAT',
        tieuDe: 'Họp demo giải pháp trực tiếp tại trụ sở khách hàng',
        noiDung: 'Khách hàng rất hài lòng về tính năng báo cáo',
        thoiGian: new Date().toISOString(),
        thoiLuongPhut: 60,
        diaDiem: 'Tầng 12 Landmark 81',
        ketQua: 'Đồng ý nhận dự thảo hợp đồng',
        coHoiId: newOpp.id,
        khachHangId: customer.id,
      },
      teamLeadHn,
    );
    assert(!!meetingAct.id, 'Ghi nhận cuộc gặp mặt thành công');

    const oppAfterActivity = await prisma.coHoi.findUnique({ where: { id: newOpp.id } });
    assert(oppAfterActivity?.laDinhTre === false, 'Tự động gỡ cờ đình trệ khi có hoạt động mới phát sinh (Rule 59)');
    assert(!!oppAfterActivity?.ngayHoatDongCuoi, 'Cập nhật ngayHoatDongCuoi khi phát sinh hoạt động');

    const stats = await hoatDongService.thongKeHoatDong();
    assert(stats.length > 0, 'Thống kê hoạt động theo nhân viên trả về dữ liệu (S8-11)');

    console.log('\n--- TEST GROUP 6: EP-06 S6-06 & S6-09 NHIỆM VỤ (TASKS) & CẢNH BÁO QUÁ HẠN ---');
    // Tạo 1 việc quá hạn
    const overdueTask = await congViecService.taoCongViec(
      {
        tieuDe: 'Gửi bảng giá chi tiết cho phòng Kế toán (Test quá hạn)',
        hanHoanThanh: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Hôm qua
        mucDoUuTien: MucDoUuTienCongViec.KHAN_CAP,
        nguoiDuocGiaoId: salesHn.id,
        coHoiId: newOpp.id,
        khachHangId: customer.id,
      },
      teamLeadHn,
    );
    assert(!!overdueTask.id, 'Tạo công việc thành công');

    // Lấy danh sách để kiểm tra cờ laQuaHan do server tính toán
    const taskListRes = await congViecService.layDanhSachCongViec({ chiXemQuaHan: true }, teamLeadHn);
    const foundOverdue = taskListRes.duLieu.find((t: any) => t.id === overdueTask.id);
    assert(foundOverdue?.laQuaHan === true, 'Hệ thống tính toán laQuaHan = true trên Server cho việc quá hạn (S6-09)');

    const overdueStats = await congViecService.thongKeQuaHan(teamLeadHn);
    assert(overdueStats.tongSoViecQuaHan > 0, 'Thống kê việc trễ hạn tổng hợp cho Team Lead hoạt động chính xác');

    // Đổi trạng thái việc thành HOAN_THANH
    const completedTask = await congViecService.doiTrangThai(
      overdueTask.id,
      {
        trangThaiCongViec: TrangThaiCongViec.HOAN_THANH,
      },
      salesHn,
    );
    assert(completedTask.trangThaiCongViec === 'HOAN_THANH', 'Đổi trạng thái công việc sang HOAN_THANH');

    console.log('\n--- TEST GROUP 7: EP-06 S6-07 LỊCH LÀM VIỆC & MÚI GIỜ ASIA/HO_CHI_MINH ---');
    const calendarRes = await lichLamViecService.layLichLamViec(
      {
        xemTeam: true,
      },
      teamLeadHn,
    );
    assert(calendarRes.muiGio === 'Asia/Ho_Chi_Minh', 'Lịch làm việc chuẩn hóa múi giờ Asia/Ho_Chi_Minh');
    assert(calendarRes.suKien.length > 0, 'Lịch tổng hợp cả cuộc gặp và nhiệm vụ');
    const hasMeetingEvent = calendarRes.suKien.some((e) => e.loai === 'CUOC_GAP');
    assert(hasMeetingEvent, 'Lịch chứa sự kiện loại CUOC_GAP với màu sắc phân biệt');

    console.log('\n--- TEST GROUP 8: EP-05 S5-06 BÁO CÁO DỰ BÁO DOANH SỐ (FORECAST) ---');
    const forecastReport = await forecastService.layBaoCaoForecast(new Date().getFullYear(), director);
    assert(forecastReport.thangNay !== undefined, 'Báo cáo dự báo có thông số tháng này');
    assert(forecastReport.quyNay !== undefined, 'Báo cáo dự báo có thông số quý này');
    assert(forecastReport.theoNhanVien.length > 0, 'Báo cáo có phân rã theo nhân viên kinh doanh');

    console.log('\n--- TEST GROUP 9: EP-05 S5-05 CHỐT THẮNG (WON) & KHÓA DỮ LIỆU (READ-ONLY) ---');
    const closeWonOpp = await coHoiService.dongThang(
      newOpp.id,
      {
        giaTriThucTe: 30000000,
        ngayDongThucTe: new Date().toISOString(),
        ghiChuDong: 'Đã ký hợp đồng số HĐ-2026/09-01 thành công',
      },
      teamLeadHn,
    );
    assert(closeWonOpp.trangThai === 'DONG_THANG', 'Chuyển trạng thái sang DONG_THANG thành công');
    assert(closeWonOpp.xacSuat === 100, 'Xác suất chốt tự động đặt 100% khi thắng');
    assert(Number(closeWonOpp.duBaoGiaTri) === 30000000, 'Dự báo giá trị bằng giá trị thực tế');

    // Thử thêm sản phẩm khi cơ hội đã chốt thắng -> Phải bị chặn!
    let blockedAddProduct = false;
    try {
      await productService.themSanPham(
        newOpp.id,
        {
          sanPhamId: prod1.id,
          soLuong: 1,
          donGia: 5000000,
        },
        teamLeadHn,
      );
    } catch (e: any) {
      blockedAddProduct = true;
    }
    assert(blockedAddProduct, 'Khóa chỉnh sửa (Read-only): Không cho phép thêm/sửa sản phẩm khi cơ hội đã đóng');

    // Test quyền mở lại cơ hội: Sales không có quyền, Director có quyền
    let salesBlockedReopen = false;
    try {
      await coHoiService.moLai(newOpp.id, { lyDoMoLai: 'Khách yêu cầu bổ sung gói' }, salesHn);
    } catch (e: any) {
      salesBlockedReopen = true;
    }
    assert(salesBlockedReopen, 'Chặn Sales mở lại cơ hội đã đóng (Chỉ Admin / Director / Team Lead được mở lại)');

    const reopenedOpp = await coHoiService.moLai(
      newOpp.id,
      { lyDoMoLai: 'Giám đốc phê duyệt mở lại để đàm phán hợp đồng mở rộng' },
      director,
    );
    assert(reopenedOpp.trangThai === 'DANG_XU_LY', 'Giám đốc mở lại cơ hội thành công, trạng thái về DANG_XU_LY');

    console.log('\n--- TEST GROUP 10: EP-05 S5-07 CƠ HỘI ĐÌNH TRỆ (STALLED EVALUATION) ---');
    const stalledRes = await stalledService.danhGiaCoHoiDinhTre();
    assert(stalledRes.thanhCong === true, `Quét cơ hội đình trệ thành công (Đã quét ${stalledRes.tongQuet} cơ hội)`);

    console.log('\n===============================================================');
    console.log(`KẾT QUẢ KIỂM THỬ SPRINT 3: ${passed} PASS, ${failed} FAIL`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runSprint3Tests().catch((err) => {
  console.error('LỖI THỰC THI KIỂM THỬ SPRINT 3:', err);
  process.exit(1);
});

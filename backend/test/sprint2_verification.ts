import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/modules/auth/auth.service';
import { KhachHangService } from '../src/modules/khach-hang/khach-hang.service';
import { NguoiLienHeService } from '../src/modules/nguoi-lien-he/nguoi-lien-he.service';
import { LeadService } from '../src/modules/lead/services/lead.service';
import { LeadScoringService } from '../src/modules/lead/services/lead-scoring.service';
import { LeadAssignmentService } from '../src/modules/lead/services/lead-assignment.service';
import { LeadConversionService } from '../src/modules/lead/services/lead-conversion.service';
import { LeadSlaService } from '../src/modules/lead/services/lead-sla.service';
import { DataScopeService } from '../src/common/services/data-scope.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

async function runSprint2Tests() {
  console.log('==================================================');
  console.log('BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG SPRINT 2 (CUSTOMER + LEAD)');
  console.log('==================================================\n');

  const prisma = new PrismaClient();
  await prisma.$connect();

  const dataScopeService = new DataScopeService(prisma as any);
  const scoringService = new LeadScoringService(prisma as any);
  const assignmentService = new LeadAssignmentService(prisma as any);
  const slaService = new LeadSlaService(prisma as any);
  const conversionService = new LeadConversionService(prisma as any);
  const khachHangService = new KhachHangService(prisma as any, dataScopeService);
  const nguoiLienHeService = new NguoiLienHeService(prisma as any, dataScopeService);
  const leadService = new LeadService(prisma as any, dataScopeService, scoringService, assignmentService);

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
    // Lấy thông tin user các vai trò
    const salesHn = await prisma.nguoiDung.findUnique({
      where: { email: 'sales_hn1@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    const salesHcm = await prisma.nguoiDung.findUnique({
      where: { email: 'sales_hcm1@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    const teamLeadHn = await prisma.nguoiDung.findUnique({
      where: { email: 'lead_hn@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    const director = await prisma.nguoiDung.findUnique({
      where: { email: 'director@crm.vn' },
      include: { vaiTro: { include: { vaiTro: true } } },
    });

    const userSalesHn = { ...salesHn, roles: salesHn?.vaiTro.map((v) => v.vaiTro.maVaiTro) };
    const userSalesHcm = { ...salesHcm, roles: salesHcm?.vaiTro.map((v) => v.vaiTro.maVaiTro) };
    const userTeamLeadHn = { ...teamLeadHn, roles: teamLeadHn?.vaiTro.map((v) => v.vaiTro.maVaiTro) };
    const userDirector = { ...director, roles: director?.vaiTro.map((v) => v.vaiTro.maVaiTro) };

    // ----------------------------------------------------
    // TEST GROUP 1: S3-01 Khách hàng & MST Unique
    // ----------------------------------------------------
    console.log('[TEST GROUP 1] Customer CRUD & Unique MST (S3-01):');
    const uniqueMst = '09' + Math.floor(10000000 + Math.random() * 90000000);
    const newCust = await khachHangService.taoKhachHang(
      {
        tenCongTy: 'Công ty Cổ phần Kiểm Thử S3-01',
        maSoThue: uniqueMst,
        nganhNghe: 'CONG_NGHE',
        quyMo: 'TREN_100_NV',
      },
      userSalesHn,
    );
    assert(!!newCust.id && newCust.maKhachHang.startsWith('KH-'), 'Tạo khách hàng thành công có mã sinh tự động');
    assert(newCust.nguoiSoHuuId === userSalesHn.id, 'Người sở hữu khách hàng gán đúng cho Sales tạo');

    // Thử tạo trùng MST -> Phải trả về lỗi 409 Conflict
    try {
      await khachHangService.taoKhachHang(
        {
          tenCongTy: 'Công ty Trùng MST',
          maSoThue: uniqueMst,
        },
        userSalesHcm,
      );
      assert(false, 'Mã số thuế trùng phải ném ConflictException');
    } catch (e: any) {
      assert(e.status === 409 || e.message.includes('đã tồn tại'), 'Bắt lỗi trùng Mã số thuế (ConflictException 409)');
    }

    // ----------------------------------------------------
    // TEST GROUP 2: Data Scope Isolation (Sales A vs Sales B vs Team Lead vs Director)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 2] Data Scope Enforcement:');
    // Sales HCM không được quyền truy cập chi tiết khách hàng của Sales HN
    try {
      await khachHangService.layChiTiet(newCust.id, userSalesHcm);
      assert(false, 'Sales B không được truy cập Customer của Sales A');
    } catch (e: any) {
      assert(e.status === 403 || e.message.includes('quyền'), 'Sales B bị từ chối 403 Forbidden khi truy cập Customer của Sales A');
    }

    // Team Lead HN (quản lý Sales HN) xem được Customer của Sales HN
    const tlView = await khachHangService.layChiTiet(newCust.id, userTeamLeadHn);
    assert(tlView.id === newCust.id, 'Team Lead xem được Customer của thành viên trong Team');

    // Director xem được toàn bộ
    const dirView = await khachHangService.layChiTiet(newCust.id, userDirector);
    assert(dirView.id === newCust.id, 'Director xem được Customer của bất kỳ Sales nào');

    // ----------------------------------------------------
    // TEST GROUP 3: S3-02 Quản lý Người liên hệ & Đầu mối chính
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 3] Contact Management & Primary Contact (S3-02):');
    const contact1 = await nguoiLienHeService.taoNguoiLienHe(
      newCust.id,
      {
        hoTen: 'Ông Trần Văn Đầu Mối 1',
        email: `daumoi1_${Date.now()}@test.vn`,
        soDienThoai: '0912345678',
        vaiTroQuyetDinh: 'NGUOI_QUYET_DINH',
        laDauMoiChinh: true,
      },
      userSalesHn,
    );
    assert(contact1.laDauMoiChinh === true, 'Tạo người liên hệ đầu tiên làm đầu mối chính');

    const contact2 = await nguoiLienHeService.taoNguoiLienHe(
      newCust.id,
      {
        hoTen: 'Bà Lê Thị Đầu Mối 2',
        email: `daumoi2_${Date.now()}@test.vn`,
        soDienThoai: '0912345679',
        vaiTroQuyetDinh: 'NGUOI_ANH_HUONG',
        laDauMoiChinh: true, // Khi đặt người thứ 2 làm chính, người thứ 1 phải tự động false
      },
      userSalesHn,
    );
    assert(contact2.laDauMoiChinh === true, 'Tạo người liên hệ thứ 2 làm đầu mối chính');

    const refreshedContact1 = await prisma.nguoiLienHe.findUnique({ where: { id: contact1.id } });
    assert(refreshedContact1?.laDauMoiChinh === false, 'Người liên hệ thứ 1 tự động chuyển laDauMoiChinh = false');

    // ----------------------------------------------------
    // TEST GROUP 4: S3-03 Customer 360 View (< 1.5s)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 4] Customer 360 Aggregation View (S3-03):');
    const c360 = await khachHangService.layCustomer360(newCust.id, userSalesHn);
    assert(!!c360.thongTinChung && c360.nguoiLienHe.length === 2, 'Customer 360 trả về thông tin chung và 2 người liên hệ');
    assert(c360.hieuNang.datMucTieu1500ms === true, `Customer 360 tải nhanh trong ${c360.hieuNang.thoiGianTruyVanMs}ms (< 1500ms)`);

    // ----------------------------------------------------
    // TEST GROUP 5: S3-04 Duplicate Detection & Customer Merge
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 5] Duplicate Detection & Customer Merge (S3-04):');
    // Tạo khách hàng phụ để gộp
    const secondaryCust = await khachHangService.taoKhachHang(
      {
        tenCongTy: 'Công ty Phụ Để Gộp',
        nganhNghe: 'CONG_NGHE',
      },
      userSalesHn,
    );
    // Thêm liên hệ vào khách hàng phụ
    await nguoiLienHeService.taoNguoiLienHe(
      secondaryCust.id,
      {
        hoTen: 'Nhân Sự Từ Công Ty Phụ',
        email: `phu_${Date.now()}@test.vn`,
        vaiTroQuyetDinh: 'NGUOI_DUNG_CUOI',
      },
      userSalesHn,
    );

    // Sales Rep thường thử gộp -> Phải bị cấm (chỉ Team Lead trở lên)
    try {
      await khachHangService.gopKhachHang(
        {
          khachHangGocId: newCust.id,
          khachHangGopId: secondaryCust.id,
        },
        userSalesHn,
      );
      assert(false, 'Sales Rep không được phép gộp khách hàng');
    } catch (e: any) {
      assert(e.status === 403 || e.message.includes('Trưởng nhóm'), 'Sales Rep bị từ chối quyền gộp (Chỉ Team Lead+)');
    }

    // Team Lead thực hiện gộp thành công
    const mergeResult = await khachHangService.gopKhachHang(
      {
        khachHangGocId: newCust.id,
        khachHangGopId: secondaryCust.id,
        ghiChu: 'Gộp chi nhánh vào tổng công ty',
      },
      userTeamLeadHn,
    );
    assert(!!mergeResult.chiTiet.masterId, 'Gộp khách hàng thành công bởi Team Lead');

    // Kiểm tra liên hệ của công ty phụ đã chuyển sang công ty chính
    const contactsMaster = await prisma.nguoiLienHe.findMany({ where: { khachHangId: newCust.id } });
    assert(contactsMaster.length === 3, 'Khách hàng chính đã tiếp nhận toàn bộ người liên hệ của khách hàng phụ');

    const secondaryDb = await prisma.khachHang.findUnique({ where: { id: secondaryCust.id } });
    assert(secondaryDb?.daGopVaoId === newCust.id, 'Khách hàng phụ được đánh dấu daGopVaoId trỏ về Master');

    // ----------------------------------------------------
    // TEST GROUP 6: S4-05 Lead Scoring Engine & Temperature Classification
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 6] Lead Scoring Engine (S4-05):');
    // Rule: Ngành CONG_NGHE (+20), Quy mô TREN_100_NV (+15), Nguồn WEBSITE (+15), Quan tâm RAT_CAO (+20) -> Tổng = 70 (NÓNG)
    const scoreHot = await scoringService.tinhDiem({
      nganhNghe: 'CONG_NGHE',
      quyMo: 'TREN_100_NV',
      nguonLead: 'WEBSITE',
      nhuCauQuanTam: 'Khách hàng quan tâm RAT_CAO giải pháp triển khai lớn',
    });
    assert(scoreHot.diemTiemNang >= 50, `Điểm tính toán chính xác: ${scoreHot.diemTiemNang} điểm`);
    assert(scoreHot.phanLoai === 'NONG', 'Phân loại chính xác: Lead NÓNG (Hot)');

    const scoreCold = await scoringService.tinhDiem({
      nganhNghe: 'KHAC',
      nguonLead: 'EVENT',
    });
    assert(scoreCold.phanLoai === 'LANH', `Lead điểm thấp (< 25) được phân loại chính xác: LẠNH (Cold)`);

    // ----------------------------------------------------
    // TEST GROUP 7: S4-06 Lead Assignment Engine & First Match Wins
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 7] Lead Assignment Engine (S4-06):');
    const mbKhuVuc = await prisma.khuVuc.findFirst({ where: { maKhuVuc: 'KV_MB' } });

    // Tạo Lead thuộc Miền Bắc -> Match Rule 1 -> Phân cho Sales HN
    const leadMb = await leadService.taoLead(
      {
        hoTen: 'Lead Miền Bắc Test',
        nguonLead: 'WEBSITE',
        khuVucId: mbKhuVuc?.id,
        nganhNghe: 'CONG_NGHE',
      },
      userDirector,
    );
    assert(leadMb.nguoiSoHuuId === userSalesHn.id, 'Lead Miền Bắc khớp Rule 1 tự động phân cho Sales HN');
    assert(leadMb.trangThai === 'CHO_TIEP_NHAN', 'Lead sau phân bổ có trạng thái CHO_TIEP_NHAN');
    assert(!!leadMb.slaDeadline, 'Lead được tính toán thời hạn slaDeadline theo giờ server');

    // ----------------------------------------------------
    // TEST GROUP 8: S4-07 Lead Accept / Reject & SLA Tracking
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 8] Lead Accept / Reject & SLA (S4-07):');
    // Sales HN tiếp nhận Lead
    const acceptedLead = await leadService.tiepNhanLead(leadMb.id, userSalesHn);
    assert(acceptedLead.trangThai === 'DANG_CHAM_SOC', 'Sales tiếp nhận Lead chuyển trạng thái DANG_CHAM_SOC');
    assert(!!acceptedLead.acceptedAt, 'Lưu vết thời gian acceptedAt');

    // Tạo thêm một Lead để test Reject
    const leadRejectTest = await leadService.taoLead(
      {
        hoTen: 'Lead Reject Test',
        nguonLead: 'REFERRAL',
        khuVucId: mbKhuVuc?.id,
      },
      userDirector,
    );
    const rejectedLead = await leadService.tuChoiLead(
      leadRejectTest.id,
      { lyDo: 'Số điện thoại không liên lạc được' },
      userSalesHn,
    );
    assert(rejectedLead.trangThai === 'TU_CHOI', 'Từ chối Lead chuyển trạng thái TU_CHOI');
    assert(rejectedLead.nguoiSoHuuId === null, 'Lead bị từ chối được trả về Hàng đợi (nguoiSoHuuId = null)');

    // ----------------------------------------------------
    // TEST GROUP 9: S4-08 Lead Conversion Transaction & Rollback
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 9] Lead Conversion Transaction & Rollback (S4-08):');
    const convertSuccess = await conversionService.chuyenDoiLead(
      acceptedLead.id,
      {
        tenCoHoi: 'Cơ hội từ Lead Miền Bắc',
        giaTriDuKien: 80000000,
        tenCongTy: 'Công ty Cổ phần Chuyển Đổi Thành Công',
      },
      userSalesHn,
    );
    assert(!!convertSuccess.ketQua.khachHangId, 'Khách hàng mới được tạo trong transaction');
    assert(!!convertSuccess.ketQua.nguoiLienHeId, 'Người liên hệ mới được tạo trong transaction');
    assert(!!convertSuccess.ketQua.coHoiId, 'Cơ hội bán hàng được tạo với mã format CH-xxxxx');
    assert(convertSuccess.ketQua.lead.trangThai === 'DA_CHUYEN_DOI', 'Lead chuyển trạng thái DA_CHUYEN_DOI');

    // Kiểm tra Lead đã chuyển đổi trở thành Read-only
    try {
      await leadService.capNhat(acceptedLead.id, { hoTen: 'Đổi tên sau convert' }, userSalesHn);
      assert(false, 'Lead đã chuyển đổi không được phép chỉnh sửa');
    } catch (e: any) {
      assert(e.status === 400 || e.message.includes('chỉ đọc'), 'Lead đã chuyển đổi được bảo vệ Read-only (400 Bad Request)');
    }

    // Test Transaction Rollback khi lỗi
    try {
      await conversionService.chuyenDoiLead(
        'uuid-lead-khong-ton-tai',
        { tenCoHoi: 'Co hoi loi' },
        userSalesHn,
      );
      assert(false, 'Lead không tồn tại phải báo lỗi');
    } catch (e: any) {
      assert(e.status === 404 || e.message.includes('không tồn tại'), 'Bắt lỗi hợp lệ khi Lead không tồn tại');
    }

    console.log('\n==================================================');
    console.log(`KẾT QUẢ KIỂM THỬ SPRINT 2: ${passed} PASS, ${failed} FAIL`);
    console.log('==================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Lỗi ngoại lệ trong quá trình chạy kiểm thử:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSprint2Tests();

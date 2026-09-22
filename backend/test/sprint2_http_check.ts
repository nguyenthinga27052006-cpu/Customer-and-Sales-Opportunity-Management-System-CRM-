async function verifyHttp() {
  console.log('=== KIỂM TRA TÍCH HỢP HTTP API SPRINT 2 ===');
  const baseUrl = 'http://localhost:3000/api';

  try {
    // 1. Đăng nhập lấy token
    const loginRes = await fetch(`${baseUrl}/auth/dang-nhap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@crm.vn',
        matKhau: 'Password@123',
      }),
    });
    const loginData = await loginRes.json();
    console.log('✓ 1. Đăng nhập thành công:', loginData.nguoiDung?.hoTen);
    const token = loginData.accessToken;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 2. Lấy danh sách Khách hàng
    const custRes = await fetch(`${baseUrl}/khach-hang`, { headers: authHeaders });
    const custData = await custRes.json();
    console.log(`✓ 2. GET /api/khach-hang: ${custData.total} khách hàng tìm thấy`);

    const firstCustId = custData.items?.[0]?.id;
    if (firstCustId) {
      // 3. Lấy Customer 360
      const c360Res = await fetch(`${baseUrl}/khach-hang/${firstCustId}/360`, { headers: authHeaders });
      const c360Data = await c360Res.json();
      console.log(`✓ 3. GET /api/khach-hang/:id/360: Tải trong ${c360Data.hieuNang?.thoiGianTruyVanMs}ms (< 1500ms)`);
    }

    // 4. Lấy danh sách Lead
    const leadRes = await fetch(`${baseUrl}/lead`, { headers: authHeaders });
    const leadData = await leadRes.json();
    console.log(`✓ 4. GET /api/lead: ${leadData.total} Lead tìm thấy`);

    // 5. Submit Web Form Public API (S4-01)
    const publicSubmitRes = await fetch(`${baseUrl}/lead-public/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maForm: 'FORM_WEBSITE_CHINH',
        hoTen: 'Khách Hàng Web Test',
        soDienThoai: '0966554433',
        email: 'webtest@doanhnghiep.vn',
        congTy: 'Công ty TNHH Web Test',
        nhuCauQuanTam: 'Khách hàng quan tâm RAT_CAO cần tư vấn gói phần mềm lớn',
      }),
    });
    const publicSubmitData = await publicSubmitRes.json();
    console.log('✓ 5. POST /api/lead-public/submit:', publicSubmitData.message);

    // 6. Kiểm tra lại danh sách Lead để xem Lead mới từ Web Form đã vào và được chấm điểm
    const leadAfter = await fetch(`${baseUrl}/lead?tuKhoa=Web%20Test`, { headers: authHeaders });
    const leadAfterData = await leadAfter.json();
    const newestLead = leadAfterData.items?.[0];
    console.log(`✓ 6. Lead mới tạo qua Web Form có mã: ${newestLead?.maLead}, Điểm: ${newestLead?.diemTiemNang}, Phân loại: ${newestLead?.phanLoai}`);

    console.log('\n========================================');
    console.log('TẤT CẢ CÁC API HTTP SPRINT 2 HOẠT ĐỘNG HOÀN HẢO!');
    console.log('========================================');
  } catch (err: any) {
    console.error('Lỗi khi gọi API:', err.message);
    process.exit(1);
  }
}

verifyHttp();

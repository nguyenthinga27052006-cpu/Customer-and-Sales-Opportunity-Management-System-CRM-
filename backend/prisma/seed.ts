import { PrismaClient, LoaiSanPham, TrangThaiSanPham, LoaiLyDo, TrangThaiNguoiDung } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING PRISMA SEED ---');

  // 1. VAI TRÒ (7 Vai trò chuẩn)
  const vaiTroData = [
    { maVaiTro: 'ADMIN', tenVaiTro: 'Quản trị hệ thống', moTa: 'Toàn quyền cấu hình và quản trị ứng dụng' },
    { maVaiTro: 'DIRECTOR', tenVaiTro: 'Giám đốc kinh doanh', moTa: 'Chủ sở hữu hoạt động kinh doanh, xem toàn bộ dữ liệu, xem giá vốn, duyệt chiết khấu cao' },
    { maVaiTro: 'TEAM_LEAD', tenVaiTro: 'Trưởng nhóm kinh doanh', moTa: 'Quản lý nhóm kinh doanh, theo dõi pipeline nhóm, duyệt chiết khấu trong hạn mức' },
    { maVaiTro: 'SALES_REP', tenVaiTro: 'Nhân viên kinh doanh', moTa: 'Bán hàng trực tiếp, quản lý khách hàng và cơ hội của bản thân' },
    { maVaiTro: 'MARKETING', tenVaiTro: 'Nhân viên Marketing', moTa: 'Tạo lead từ chiến dịch, theo dõi hiệu quả nguồn lead' },
    { maVaiTro: 'CUST_SUCCESS', tenVaiTro: 'Chăm sóc khách hàng', moTa: 'Hỗ trợ khách hàng sau bán, xem lịch sử 360 độ' },
    { maVaiTro: 'ACCOUNTANT', tenVaiTro: 'Kế toán', moTa: 'Xác nhận giá trị hợp đồng, theo dõi thanh toán và gia hạn' },
  ];

  const mapVaiTro = new Map<string, string>();
  for (const vt of vaiTroData) {
    const record = await prisma.vaiTro.upsert({
      where: { maVaiTro: vt.maVaiTro },
      update: { tenVaiTro: vt.tenVaiTro, moTa: vt.moTa },
      create: vt,
    });
    mapVaiTro.set(vt.maVaiTro, record.id);
  }
  console.log('✓ Seeded 7 VaiTro');

  // 2. KHU VỰC
  const khuVucData = [
    { maKhuVuc: 'KV_MB', tenKhuVuc: 'Miền Bắc', moTa: 'Khu vực các tỉnh phía Bắc' },
    { maKhuVuc: 'KV_MT', tenKhuVuc: 'Miền Trung', moTa: 'Khu vực các tỉnh miền Trung' },
    { maKhuVuc: 'KV_MN', tenKhuVuc: 'Miền Nam', moTa: 'Khu vực các tỉnh miền Nam' },
  ];
  const mapKhuVuc = new Map<string, string>();
  for (const kv of khuVucData) {
    const record = await prisma.khuVuc.upsert({
      where: { maKhuVuc: kv.maKhuVuc },
      update: { tenKhuVuc: kv.tenKhuVuc, moTa: kv.moTa },
      create: kv,
    });
    mapKhuVuc.set(kv.maKhuVuc, record.id);
  }
  console.log('✓ Seeded KhuVuc');

  // 3. NHÓM KINH DOANH (Cơ cấu cây tổ chức)
  // Tạo nhóm gốc Khối Kinh Doanh
  const khoiKD = await prisma.nhomKinhDoanh.upsert({
    where: { maNhom: 'KHOI_KD' },
    update: { tenNhom: 'Khối Kinh Doanh Toàn Quốc' },
    create: {
      maNhom: 'KHOI_KD',
      tenNhom: 'Khối Kinh Doanh Toàn Quốc',
    },
  });

  const nhomHN = await prisma.nhomKinhDoanh.upsert({
    where: { maNhom: 'TEAM_HN' },
    update: {
      tenNhom: 'Phòng Kinh Doanh Hà Nội',
      nhomChaId: khoiKD.id,
      khuVucId: mapKhuVuc.get('KV_MB'),
    },
    create: {
      maNhom: 'TEAM_HN',
      tenNhom: 'Phòng Kinh Doanh Hà Nội',
      nhomChaId: khoiKD.id,
      khuVucId: mapKhuVuc.get('KV_MB'),
    },
  });

  const nhomHCM = await prisma.nhomKinhDoanh.upsert({
    where: { maNhom: 'TEAM_HCM' },
    update: {
      tenNhom: 'Phòng Kinh Doanh TP.HCM',
      nhomChaId: khoiKD.id,
      khuVucId: mapKhuVuc.get('KV_MN'),
    },
    create: {
      maNhom: 'TEAM_HCM',
      tenNhom: 'Phòng Kinh Doanh TP.HCM',
      nhomChaId: khoiKD.id,
      khuVucId: mapKhuVuc.get('KV_MN'),
    },
  });
  console.log('✓ Seeded NhomKinhDoanh tree');

  // 4. NGƯỜI DÙNG MẪU (Password mặc định: Password@123)
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const nguoiDungList = [
    {
      email: 'admin@crm.vn',
      hoTen: 'Quản Trị Viên Hệ Thống',
      soDienThoai: '0901000001',
      chuKyEmail: 'Quản trị viên CRM - Hệ thống quản lý bán hàng',
      roleCodes: ['ADMIN'],
      nhomId: null,
    },
    {
      email: 'director@crm.vn',
      hoTen: 'Nguyễn Văn Giám Đốc',
      soDienThoai: '0901000002',
      chuKyEmail: 'Giám Đốc Kinh Doanh - Mobile: 0901000002',
      roleCodes: ['DIRECTOR'],
      nhomId: khoiKD.id,
    },
    {
      email: 'lead_hn@crm.vn',
      hoTen: 'Trần Thị Trưởng Nhóm HN',
      soDienThoai: '0901000003',
      chuKyEmail: 'Trưởng nhóm Kinh Doanh Hà Nội',
      roleCodes: ['TEAM_LEAD'],
      nhomId: nhomHN.id,
    },
    {
      email: 'sales_hn1@crm.vn',
      hoTen: 'Lê Văn Sales HN 1',
      soDienThoai: '0901000004',
      chuKyEmail: 'Chuyên viên tư vấn giải pháp CRM',
      roleCodes: ['SALES_REP'],
      nhomId: nhomHN.id,
    },
    {
      email: 'sales_hn2@crm.vn',
      hoTen: 'Phạm Thị Sales HN 2',
      soDienThoai: '0901000005',
      chuKyEmail: 'Chuyên viên tư vấn giải pháp CRM',
      roleCodes: ['SALES_REP'],
      nhomId: nhomHN.id,
    },
    {
      email: 'lead_hcm@crm.vn',
      hoTen: 'Hoàng Văn Trưởng Nhóm HCM',
      soDienThoai: '0901000006',
      chuKyEmail: 'Trưởng nhóm Kinh Doanh TP.HCM',
      roleCodes: ['TEAM_LEAD'],
      nhomId: nhomHCM.id,
    },
    {
      email: 'sales_hcm1@crm.vn',
      hoTen: 'Vũ Thị Sales HCM 1',
      soDienThoai: '0901000007',
      chuKyEmail: 'Chuyên viên kinh doanh khu vực Miền Nam',
      roleCodes: ['SALES_REP'],
      nhomId: nhomHCM.id,
    },
    {
      email: 'marketing@crm.vn',
      hoTen: 'Đỗ Văn Marketing',
      soDienThoai: '0901000008',
      chuKyEmail: 'Phòng Tiếp Thị & Phát Triển Thương Hiệu',
      roleCodes: ['MARKETING'],
      nhomId: null,
    },
    {
      email: 'csm@crm.vn',
      hoTen: 'Ngô Thị Chăm Sóc Khách Hàng',
      soDienThoai: '0901000009',
      chuKyEmail: 'Bộ phận Customer Success',
      roleCodes: ['CUST_SUCCESS'],
      nhomId: null,
    },
    {
      email: 'accountant@crm.vn',
      hoTen: 'Bùi Văn Kế Toán',
      soDienThoai: '0901000010',
      chuKyEmail: 'Phòng Tài Chính - Kế Toán',
      roleCodes: ['ACCOUNTANT'],
      nhomId: null,
    },
  ];

  for (const nd of nguoiDungList) {
    const user = await prisma.nguoiDung.upsert({
      where: { email: nd.email },
      update: {
        hoTen: nd.hoTen,
        soDienThoai: nd.soDienThoai,
        chuKyEmail: nd.chuKyEmail,
        nhomKinhDoanhId: nd.nhomId,
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
      create: {
        email: nd.email,
        matKhauHash: passwordHash,
        hoTen: nd.hoTen,
        soDienThoai: nd.soDienThoai,
        chuKyEmail: nd.chuKyEmail,
        nhomKinhDoanhId: nd.nhomId,
        trangThai: TrangThaiNguoiDung.HOAT_DONG,
      },
    });

    // Gán vai trò
    for (const rCode of nd.roleCodes) {
      const vId = mapVaiTro.get(rCode);
      if (vId) {
        await prisma.nguoiDungVaiTro.upsert({
          where: {
            nguoiDungId_vaiTroId: {
              nguoiDungId: user.id,
              vaiTroId: vId,
            },
          },
          update: {},
          create: {
            nguoiDungId: user.id,
            vaiTroId: vId,
          },
        });
      }
    }

    // Nếu là trưởng nhóm thì cập nhật truongNhomId của nhóm
    if (nd.email === 'lead_hn@crm.vn') {
      await prisma.nhomKinhDoanh.update({ where: { id: nhomHN.id }, data: { truongNhomId: user.id } });
    } else if (nd.email === 'lead_hcm@crm.vn') {
      await prisma.nhomKinhDoanh.update({ where: { id: nhomHCM.id }, data: { truongNhomId: user.id } });
    }
  }
  console.log('✓ Seeded Users & Role assignments');

  // 5. SẢN PHẨM & BẢNG GIÁ NIÊM YẾT
  const sanPhamData = [
    {
      maSanPham: 'CRM-SaaS-STD',
      tenSanPham: 'Phần mềm CRM - Gói Tiêu Chuẩn',
      loaiSanPham: LoaiSanPham.THUE_BAO,
      donViTinh: 'User / Tháng',
      giaNiemYet: 150000,
      giaSan: 120000,
      giaVon: 50000,
      trangThai: TrangThaiSanPham.DANG_KINH_DOANH,
      moTa: 'Gói giải pháp cho nhóm kinh doanh từ 3-10 người, quản lý khách hàng và cơ hội cơ bản.',
    },
    {
      maSanPham: 'CRM-SaaS-PRO',
      tenSanPham: 'Phần mềm CRM - Gói Chuyên Nghiệp',
      loaiSanPham: LoaiSanPham.THUE_BAO,
      donViTinh: 'User / Tháng',
      giaNiemYet: 290000,
      giaSan: 240000,
      giaVon: 90000,
      trangThai: TrangThaiSanPham.DANG_KINH_DOANH,
      moTa: 'Gói giải pháp chuyên sâu cho phòng kinh doanh, hỗ trợ pipeline kanban, báo giá đa cấp duyệt.',
    },
    {
      maSanPham: 'CRM-SaaS-ENT',
      tenSanPham: 'Phần mềm CRM - Gói Doanh Nghiệp',
      loaiSanPham: LoaiSanPham.THUE_BAO,
      donViTinh: 'User / Tháng',
      giaNiemYet: 490000,
      giaSan: 400000,
      giaVon: 150000,
      trangThai: TrangThaiSanPham.DANG_KINH_DOANH,
      moTa: 'Gói giải pháp cao cấp nhất, không giới hạn tính năng, tích hợp API tùy biến.',
    },
    {
      maSanPham: 'SRV-IMPL-01',
      tenSanPham: 'Dịch vụ Khởi tạo & Đào tạo Chuẩn',
      loaiSanPham: LoaiSanPham.MOT_LAN,
      donViTinh: 'Gói dịch vụ',
      giaNiemYet: 15000000,
      giaSan: 12000000,
      giaVon: 5000000,
      trangThai: TrangThaiSanPham.DANG_KINH_DOANH,
      moTa: 'Chuyển giao dữ liệu từ Excel, cấu hình phân quyền và đào tạo người dùng trong 3 ngày.',
    },
    {
      maSanPham: 'SRV-CUSTOM-01',
      tenSanPham: 'Dịch vụ Lập trình Tính năng Riêng',
      loaiSanPham: LoaiSanPham.MOT_LAN,
      donViTinh: 'Man-day',
      giaNiemYet: 3500000,
      giaSan: 3000000,
      giaVon: 1800000,
      trangThai: TrangThaiSanPham.DANG_KINH_DOANH,
      moTa: 'Tùy chỉnh luồng nghiệp vụ hoặc mẫu báo giá/hợp đồng theo yêu cầu riêng của khách hàng.',
    },
  ];

  for (const sp of sanPhamData) {
    await prisma.sanPham.upsert({
      where: { maSanPham: sp.maSanPham },
      update: sp,
      create: sp,
    });
  }
  console.log('✓ Seeded 5 SanPham');

  // 6. GIAI ĐOẠN PIPELINE
  const giaiDoanData = [
    {
      maGiaiDoan: 'GD_01_TIEP_CAN',
      tenGiaiDoan: 'Tiếp cận ban đầu',
      thuTu: 1,
      xacSuatThang: 10,
      dieuKienBatBuoc: 'Đã xác định được người liên hệ chính và số điện thoại / email',
    },
    {
      maGiaiDoan: 'GD_02_KHAO_SAT',
      tenGiaiDoan: 'Khảo sát & Xác định nhu cầu',
      thuTu: 2,
      xacSuatThang: 30,
      dieuKienBatBuoc: 'Đã hoàn thành tối thiểu một cuộc họp hoặc cuộc gọi tư vấn ghi nhận yêu cầu',
    },
    {
      maGiaiDoan: 'GD_03_DE_XUAT',
      tenGiaiDoan: 'Đề xuất giải pháp (Demo)',
      thuTu: 3,
      xacSuatThang: 50,
      dieuKienBatBuoc: 'Đã hoàn thành buổi demo giải pháp cho khách hàng',
    },
    {
      maGiaiDoan: 'GD_04_BAO_GIA',
      tenGiaiDoan: 'Gửi báo giá & Đàm phán',
      thuTu: 4,
      xacSuatThang: 75,
      dieuKienBatBuoc: 'Đã phát hành báo giá chính thức cho khách hàng',
    },
    {
      maGiaiDoan: 'GD_05_CHOT_HOP_DONG',
      tenGiaiDoan: 'Chốt hợp đồng (Thắng)',
      thuTu: 5,
      xacSuatThang: 100,
      dieuKienBatBuoc: 'Khách hàng đã ký hợp đồng hoặc xác nhận đơn hàng bằng văn bản',
    },
    {
      maGiaiDoan: 'GD_06_DONG_THAT_BAI',
      tenGiaiDoan: 'Đóng cơ hội (Thua)',
      thuTu: 6,
      xacSuatThang: 0,
      dieuKienBatBuoc: 'Bắt buộc ghi rõ lý do thua và đối thủ cạnh tranh (nếu có)',
    },
  ];

  for (const gd of giaiDoanData) {
    await prisma.giaiDoanPipeline.upsert({
      where: { maGiaiDoan: gd.maGiaiDoan },
      update: gd,
      create: gd,
    });
  }
  console.log('✓ Seeded 6 GiaiDoanPipeline');

  // 7. DANH MỤC DÙNG CHUNG
  const danhMucData = [
    // Ngành nghề
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'CNTT', tenMuc: 'Công nghệ thông tin & Viễn thông', thuTuHienThi: 1 },
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'SAN_XUAT', tenMuc: 'Sản xuất & Chế tạo công nghiệp', thuTuHienThi: 2 },
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'BAN_LE', tenMuc: 'Bán lẻ & Thương mại điện tử', thuTuHienThi: 3 },
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'TAI_CHINH', tenMuc: 'Tài chính - Ngân hàng - Bảo hiểm', thuTuHienThi: 4 },
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'BAT_DONG_SAN', tenMuc: 'Bất động sản & Xây dựng', thuTuHienThi: 5 },
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'GIAO_DUC', tenMuc: 'Giáo dục & Đào tạo', thuTuHienThi: 6 },
    { loaiDanhMuc: 'NGANH_NGHE', maMuc: 'Y_TE', tenMuc: 'Y tế & Dược phẩm', thuTuHienThi: 7 },

    // Quy mô doanh nghiệp
    { loaiDanhMuc: 'QUY_MO', maMuc: 'DUOI_10', tenMuc: 'Dưới 10 nhân sự', thuTuHienThi: 1 },
    { loaiDanhMuc: 'QUY_MO', maMuc: '10_50', tenMuc: 'Từ 10 - 50 nhân sự', thuTuHienThi: 2 },
    { loaiDanhMuc: 'QUY_MO', maMuc: '50_200', tenMuc: 'Từ 50 - 200 nhân sự', thuTuHienThi: 3 },
    { loaiDanhMuc: 'QUY_MO', maMuc: '200_500', tenMuc: 'Từ 200 - 500 nhân sự', thuTuHienThi: 4 },
    { loaiDanhMuc: 'QUY_MO', maMuc: 'TREN_500', tenMuc: 'Trên 500 nhân sự', thuTuHienThi: 5 },

    // Nguồn Lead
    { loaiDanhMuc: 'NGUON_LEAD', maMuc: 'WEBSITE', tenMuc: 'Website công ty', thuTuHienThi: 1 },
    { loaiDanhMuc: 'NGUON_LEAD', maMuc: 'GIOI_THIEU', tenMuc: 'Người quen giới thiệu (Referral)', thuTuHienThi: 2 },
    { loaiDanhMuc: 'NGUON_LEAD', maMuc: 'HOI_THAO', tenMuc: 'Sự kiện / Hội thảo triển lãm', thuTuHienThi: 3 },
    { loaiDanhMuc: 'NGUON_LEAD', maMuc: 'MANG_XA_HOI', tenMuc: 'Mạng xã hội (Facebook, LinkedIn)', thuTuHienThi: 4 },
    { loaiDanhMuc: 'NGUON_LEAD', maMuc: 'COLD_CALL', tenMuc: 'Gọi điện thoại tiếp cận (Cold Call)', thuTuHienThi: 5 },
    { loaiDanhMuc: 'NGUON_LEAD', maMuc: 'DOI_TAC', tenMuc: 'Kênh đối tác phân phối', thuTuHienThi: 6 },

    // Loại hoạt động
    { loaiDanhMuc: 'LOAI_HOAT_DONG', maMuc: 'CUOC_GOI', tenMuc: 'Cuộc gọi điện thoại', thuTuHienThi: 1 },
    { loaiDanhMuc: 'LOAI_HOAT_DONG', maMuc: 'CUOC_GAP', tenMuc: 'Cuộc gặp trực tiếp', thuTuHienThi: 2 },
    { loaiDanhMuc: 'LOAI_HOAT_DONG', maMuc: 'EMAIL', tenMuc: 'Gửi thư điện tử (Email)', thuTuHienThi: 3 },
    { loaiDanhMuc: 'LOAI_HOAT_DONG', maMuc: 'GHI_CHU', tenMuc: 'Ghi chú nội bộ', thuTuHienThi: 4 },
    { loaiDanhMuc: 'LOAI_HOAT_DONG', maMuc: 'NHIEM_VU', tenMuc: 'Công việc cần làm (Task)', thuTuHienThi: 5 },
  ];

  for (const dm of danhMucData) {
    await prisma.danhMucDungChung.upsert({
      where: {
        loaiDanhMuc_maMuc: {
          loaiDanhMuc: dm.loaiDanhMuc,
          maMuc: dm.maMuc,
        },
      },
      update: dm,
      create: dm,
    });
  }
  console.log('✓ Seeded DanhMucDungChung');

  // 8. LÝ DO THẮNG THUA
  const lyDoData = [
    { loai: LoaiLyDo.THANG, noiDung: 'Giá cả cạnh tranh và chính sách ưu đãi tốt', thuTu: 1 },
    { loai: LoaiLyDo.THANG, noiDung: 'Tính năng sản phẩm đáp ứng xuất sắc nhu cầu', thuTu: 2 },
    { loai: LoaiLyDo.THANG, noiDung: 'Đội ngũ tư vấn nhiệt tình, phản hồi nhanh', thuTu: 3 },
    { loai: LoaiLyDo.THANG, noiDung: 'Uy tín thương hiệu và năng lực triển khai đã được kiểm chứng', thuTu: 4 },
    { loai: LoaiLyDo.THUA, noiDung: 'Giá quá cao so với ngân sách của khách hàng', thuTu: 1 },
    { loai: LoaiLyDo.THUA, noiDung: 'Thiếu tính năng đặc thù mà khách hàng yêu cầu', thuTu: 2 },
    { loai: LoaiLyDo.THUA, noiDung: 'Khách hàng hoãn hoặc hủy bỏ kế hoạch triển khai', thuTu: 3 },
    { loai: LoaiLyDo.THUA, noiDung: 'Khách hàng chọn giải pháp của đối thủ cạnh tranh', thuTu: 4 },
  ];

  for (const ld of lyDoData) {
    const existing = await prisma.lyDoThangThua.findFirst({
      where: { loai: ld.loai, noiDung: ld.noiDung },
    });
    if (!existing) {
      await prisma.lyDoThangThua.create({ data: ld });
    }
  }
  console.log('✓ Seeded LyDoThangThua');

  // 9. ĐỐI THỦ CẠNH TRANH
  const doiThuData = [
    {
      tenDoiThu: 'Base CRM',
      diemManh: 'Hệ sinh thái phong phú, nhiều ứng dụng quản trị tích hợp',
      diemYeu: 'Giao diện nhiều thao tác, tùy biến theo ngành nghề chưa sâu',
      moTa: 'Đối thủ phổ biến trong phân khúc doanh nghiệp vừa và nhỏ.',
    },
    {
      tenDoiThu: 'FastWork CRM',
      diemManh: 'Kết hợp mạnh mẽ với chấm công định vị và quản lý công việc',
      diemYeu: 'Tính năng quản lý pipeline bán hàng và báo giá chưa tối ưu',
      moTa: 'Phù hợp doanh nghiệp dịch vụ kỹ thuật, giám sát hiện trường.',
    },
    {
      tenDoiThu: 'Amis CRM (MISA)',
      diemManh: 'Đồng bộ hóa mượt mà với phần mềm kế toán MISA',
      diemYeu: 'Thiết kế cổ điển, quy trình phê duyệt chưa thực sự linh hoạt',
      moTa: 'Được nhiều kế toán đề xuất do thói quen dùng MISA.',
    },
  ];

  for (const dt of doiThuData) {
    await prisma.doiThu.upsert({
      where: { tenDoiThu: dt.tenDoiThu },
      update: dt,
      create: dt,
    });
  }
  console.log('✓ Seeded DoiThu');

  console.log('--- SEED COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export enum VaiTroEnum {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  TEAM_LEAD = 'TEAM_LEAD',
  SALES_REP = 'SALES_REP',
  MARKETING = 'MARKETING',
  CUST_SUCCESS = 'CUST_SUCCESS',
  ACCOUNTANT = 'ACCOUNTANT',
}

export interface NguoiDungHienTai {
  id: string;
  email: string;
  hoTen: string;
  soDienThoai?: string;
  avatarUrl?: string;
  chuKyEmail?: string;
  trangThai?: string;
  roles: string[];
  nhomKinhDoanhId?: string;
  tenNhomKinhDoanh?: string;
  nhomKinhDoanh?: {
    id: string;
    maNhom: string;
    tenNhom: string;
    khuVuc?: string;
    truongNhom?: string;
  } | null;
}

export interface SanPham {
  id: string;
  maSanPham: string;
  tenSanPham: string;
  loaiSanPham: 'MOT_LAN' | 'THUE_BAO';
  donViTinh: string;
  giaNiemYet: number;
  giaSan: number;
  giaVon?: number; // Chỉ có khi Director/Admin
  trangThai: 'DANG_KINH_DOANH' | 'NGUNG_KINH_DOANH';
  moTa?: string;
  createdAt: string;
}

export interface GiaiDoanPipeline {
  id: string;
  maGiaiDoan: string;
  tenGiaiDoan: string;
  thuTu: number;
  xacSuatThang: number;
  dieuKienBatBuoc?: string;
  kichHoat: boolean;
}

export interface LyDoThangThua {
  id: string;
  loai: 'THANG' | 'THUA';
  noiDung: string;
  thuTu: number;
  kichHoat: boolean;
}

export interface DoiThu {
  id: string;
  tenDoiThu: string;
  diemManh?: string;
  diemYeu?: string;
  moTa?: string;
}

export interface DanhMucDungChung {
  id: string;
  loaiDanhMuc: string;
  maMuc: string;
  tenMuc: string;
  thuTuHienThi: number;
  kichHoat: boolean;
}

export interface NhomKinhDoanh {
  id: string;
  maNhom: string;
  tenNhom: string;
  nhomChaId?: string;
  khuVucId?: string;
  truongNhomId?: string;
  khuVuc?: { id: string; tenKhuVuc: string };
  truongNhom?: { id: string; hoTen: string; email?: string };
  thanhVien?: any[];
  nhomCon?: NhomKinhDoanh[];
  soLuongThanhVien?: number;
}

export interface KhuVuc {
  id: string;
  maKhuVuc: string;
  tenKhuVuc: string;
  moTa?: string;
}

export interface NhatKyHeThong {
  id: string;
  nguoiThucHienId?: string;
  loaiDoiTuong: string;
  doiTuongId?: string;
  hanhDong: string;
  giaTriTruoc?: any;
  giaTriSau?: any;
  createdAt: string;
  nguoiThucHien?: {
    id: string;
    hoTen: string;
    email: string;
  };
}

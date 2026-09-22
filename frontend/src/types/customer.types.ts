export type TrangThaiKhachHang = 'TIEM_NANG' | 'DANG_GIAO_DICH' | 'KHACH_HANG' | 'NGUNG_HOP_TAC';

export type VaiTroQuyetDinh = 'NGUOI_QUYET_DINH' | 'NGUOI_ANH_HUONG' | 'NGUOI_DUNG_CUOI' | 'NGUOI_CAN_TRO';

export interface NguoiLienHe {
  id: string;
  khachHangId: string;
  hoTen: string;
  chucDanh?: string | null;
  email?: string | null;
  soDienThoai?: string | null;
  vaiTroQuyetDinh: VaiTroQuyetDinh;
  laDauMoiChinh: boolean;
  ghiChu?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KhachHang {
  id: string;
  maKhachHang: string;
  tenCongTy: string;
  maSoThue?: string | null;
  nganhNghe?: string | null;
  quyMo?: string | null;
  website?: string | null;
  diaChi?: string | null;
  tinhThanh?: string | null;
  quocGia?: string;
  nguoiSoHuuId: string;
  nhomKinhDoanhId?: string | null;
  trangThai: TrangThaiKhachHang;
  moTa?: string | null;
  daGopVaoId?: string | null;
  createdAt: string;
  updatedAt: string;
  nguoiSoHuu?: {
    id: string;
    hoTen: string;
    email: string;
  };
  nhomKinhDoanh?: {
    id: string;
    tenNhom: string;
  };
  nguoiLienHe?: NguoiLienHe[];
  _count?: {
    nguoiLienHe: number;
    coHoi: number;
    hoatDong?: number;
  };
}

export interface Customer360Data {
  thongTinChung: KhachHang;
  nguoiLienHe: NguoiLienHe[];
  coHoiDangMo: any[];
  coHoiDaDong: any[];
  thongKe: {
    tongGiaTriDaKy: number;
    tongGiaTriCoHoiMo: number;
    tongSoLienHe: number;
    tongSoCoHoi: number;
    tongSoHoatDong: number;
  };
  dongThoiGian: {
    items: any[];
    total: number;
    page: number;
    limit: number;
  };
  hieuNang: {
    thoiGianTruyVanMs: number;
    datMucTieu1500ms: boolean;
  };
}

export interface FilterKhachHangParams {
  tuKhoa?: string;
  trangThai?: TrangThaiKhachHang;
  nganhNghe?: string;
  quyMo?: string;
  nguoiSoHuuId?: string;
  page?: number;
  limit?: number;
}

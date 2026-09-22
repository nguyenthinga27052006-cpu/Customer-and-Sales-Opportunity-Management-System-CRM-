export type TrangThaiCoHoi = 'DANG_XU_LY' | 'DONG_THANG' | 'DONG_THUA';

export interface GiaiDoanPipeline {
  id: string;
  maGiaiDoan: string;
  tenGiaiDoan: string;
  thuTu: number;
  xacSuatThang: number;
  soNgayDinhTre: number;
  dieuKienBatBuoc?: string | null;
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
  diemManh?: string | null;
  diemYeu?: string | null;
  moTa?: string | null;
}

export interface CoHoiSanPham {
  id: string;
  coHoiId: string;
  sanPhamId: string;
  soLuong: number;
  donGia: number;
  chietKhauPhanTram: number;
  chietKhauSoTien: number;
  thanhTien: number;
  soKyThueBao?: number | null;
  giaTriNam?: number | null;
  ghiChu?: string | null;
  sanPham: {
    id: string;
    maSanPham: string;
    tenSanPham: string;
    loaiSanPham: 'MOT_LAN' | 'THUE_BAO';
    donViTinh: string;
    giaNiemYet: number;
  };
}

export interface LichSuChuyenGiaiDoan {
  id: string;
  coHoiId: string;
  giaiDoanTruocId?: string | null;
  giaiDoanSauId: string;
  giaTriTruoc?: number | null;
  giaTriSau?: number | null;
  ngayChotTruoc?: string | null;
  ngayChotSau?: string | null;
  lyDoChuyen?: string | null;
  ghiDeDieuKien: boolean;
  createdAt: string;
  giaiDoanTruoc?: { id: string; tenGiaiDoan: string } | null;
  giaiDoanSau: { id: string; tenGiaiDoan: string };
  nguoiThucHien: { id: string; hoTen: string };
}

export interface CoHoi {
  id: string;
  maCoHoi: string;
  tenCoHoi: string;
  khachHangId: string;
  nguoiLienHeId?: string | null;
  leadId?: string | null;
  giaiDoanId: string;
  nhomKinhDoanhId?: string | null;
  nguoiSoHuuId: string;
  giaTriDuKien: number;
  xacSuat: number;
  ghiChuXacSuat?: string | null;
  duBaoGiaTri: number;
  ngayKyDuKien?: string | null;
  nguonCoHoi?: string | null;
  moTa?: string | null;
  trangThai: TrangThaiCoHoi;
  giaTriThucTe?: number | null;
  ngayDongThucTe?: string | null;
  lyDoThangThuaId?: string | null;
  doiThuId?: string | null;
  ghiChuDong?: string | null;
  ngayHoatDongCuoi?: string | null;
  laDinhTre: boolean;
  createdAt: string;
  updatedAt: string;
  khachHang: {
    id: string;
    maKhachHang: string;
    tenCongTy: string;
    website?: string | null;
    diaChi?: string | null;
  };
  nguoiLienHe?: {
    id: string;
    hoTen: string;
    soDienThoai?: string | null;
    email?: string | null;
    chucDanh?: string | null;
  } | null;
  giaiDoan: GiaiDoanPipeline;
  nguoiSoHuu: {
    id: string;
    hoTen: string;
    email: string;
    soDienThoai?: string | null;
    avatarUrl?: string | null;
  };
  nhomKinhDoanh?: {
    id: string;
    tenNhom: string;
  } | null;
  lyDoThangThua?: LyDoThangThua | null;
  doiThu?: DoiThu | null;
  sanPhamCoHoi?: CoHoiSanPham[];
  lichSuChuyenGiaiDoan?: LichSuChuyenGiaiDoan[];
}

export interface KanbanCard {
  id: string;
  maCoHoi: string;
  tenCoHoi: string;
  giaiDoanId: string;
  giaTriDuKien: number;
  xacSuat: number;
  duBaoGiaTri: number;
  ngayKyDuKien?: string | null;
  laDinhTre: boolean;
  trangThai: TrangThaiCoHoi;
  nguoiSoHuuId: string;
  khachHang: {
    id: string;
    tenCongTy: string;
    maKhachHang: string;
  };
  nguoiSoHuu: {
    id: string;
    hoTen: string;
    avatarUrl?: string | null;
  };
}

export interface KanbanColumn {
  giaiDoan: GiaiDoanPipeline;
  soLuong: number;
  tongGiaTri: number;
  coHoi: KanbanCard[];
}

export interface KanbanData {
  tongSoCoHoi: number;
  tongGiaTriPipeline: number;
  columns: KanbanColumn[];
}

export interface ForecastSummary {
  soLuongCoHoi: number;
  tongGiaTriPipeline: number;
  duBaoTrongSo: number;
  thucTeDaChot: number;
  chiTieu: number;
  tiLeHoanThanh: number;
  tiLeDuBao: number;
}

export interface ForecastReport {
  nam: number;
  thoiDiemTinhToan: string;
  thangNay: ForecastSummary & { thang: number };
  thangSau: ForecastSummary & { thang: number };
  quyNay: ForecastSummary & { quy: number };
  theoNhanVien: Array<{
    nguoiDungId: string;
    hoTen: string;
    nhomKinhDoanh: string;
    tongPipeline: number;
    duBaoTrongSo: number;
    thucTeDaChot: number;
    soLuongCoHoi: number;
  }>;
  theoNhom: Array<{
    nhomKinhDoanhId: string;
    tenNhom: string;
    tongPipeline: number;
    duBaoTrongSo: number;
    thucTeDaChot: number;
    soLuongCoHoi: number;
  }>;
}

export interface FilterCoHoiParams {
  tuKhoa?: string;
  giaiDoanId?: string;
  trangThai?: TrangThaiCoHoi;
  nguoiSoHuuId?: string;
  laDinhTre?: boolean;
  tuNgay?: string;
  denNgay?: string;
  page?: number;
  limit?: number;
}

export type LoaiHoatDong = 'GOI_DIEN' | 'GAP_MAT' | 'EMAIL' | 'GHI_CHU' | 'CONG_VIEC';
export type MucDoUuTien = 'THAP' | 'TRUNG_BINH' | 'CAO' | 'KHAN_CAP';
export type TrangThaiCongViec = 'CHUA_HOAN_THANH' | 'HOAN_THANH' | 'HOAN_HUY';

export interface HoatDong {
  id: string;
  loaiHoatDong: LoaiHoatDong | string;
  tieuDe: string;
  noiDung?: string | null;
  khachHangId?: string | null;
  nguoiLienHeId?: string | null;
  coHoiId?: string | null;
  leadId?: string | null;
  nguoiThucHienId?: string | null;
  thoiGian: string;
  thoiLuongPhut?: number | null;
  diaDiem?: string | null;
  ketQua?: string | null;
  hanHoanThanh?: string | null;
  trangThaiCongViec?: TrangThaiCongViec | string | null;
  mucDoUuTien?: MucDoUuTien | string | null;
  nguoiDuocGiaoId?: string | null;
  ngayHoanThanh?: string | null;
  lyDoHoanHuy?: string | null;
  laQuaHan?: boolean;
  createdAt: string;
  nguoiThucHien?: {
    id: string;
    hoTen: string;
    avatarUrl?: string | null;
  } | null;
  nguoiDuocGiao?: {
    id: string;
    hoTen: string;
    avatarUrl?: string | null;
  } | null;
  nguoiLienHe?: {
    id: string;
    hoTen: string;
    soDienThoai?: string | null;
  } | null;
  khachHang?: {
    id: string;
    tenCongTy: string;
    maKhachHang?: string;
  } | null;
  coHoi?: {
    id: string;
    tenCoHoi: string;
    maCoHoi?: string;
  } | null;
}

export interface CalendarEvent {
  id: string;
  loai: 'CUOC_GAP' | 'CONG_VIEC';
  tieuDe: string;
  noiDung?: string | null;
  batDau: string;
  ketThuc: string;
  thoiLuongPhut: number;
  diaDiem?: string | null;
  trangThai?: string | null;
  mucDoUuTien?: string | null;
  nguoiPhuTrach?: {
    id: string;
    hoTen: string;
    avatarUrl?: string | null;
  } | null;
  khachHang?: {
    id: string;
    tenCongTy: string;
  } | null;
  coHoi?: {
    id: string;
    tenCoHoi: string;
  } | null;
  mauSac: string;
}

export interface CalendarResponse {
  muiGio: string;
  tongSoSuKien: number;
  suKien: CalendarEvent[];
}

export interface ThongKeHoatDongItem {
  nguoiDungId: string;
  hoTen: string;
  tongSo: number;
  cuocGoi: number;
  cuocGap: number;
  email: number;
  ghiChu: number;
}

export interface ThongKeQuaHanResponse {
  tongSoViecQuaHan: number;
  thoiDiemKiemTra: string;
  danhSachThanhVien: Array<{
    nguoiDungId: string;
    hoTen: string;
    email: string;
    soViecQuaHan: number;
  }>;
}

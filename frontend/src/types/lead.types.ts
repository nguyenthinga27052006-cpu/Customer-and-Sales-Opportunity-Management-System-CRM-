export type TrangThaiLead = 'MOI' | 'CHO_TIEP_NHAN' | 'DANG_CHAM_SOC' | 'TU_CHOI' | 'DA_CHUYEN_DOI' | 'KHONG_TIEM_NANG';

export type PhanLoaiLead = 'NONG' | 'AM' | 'LANH';

export type LoaiPhanBo = 'KHU_VUC' | 'NGANH_NGHE' | 'ROUND_ROBIN';

export interface Lead {
  id: string;
  maLead: string;
  hoTen: string;
  email?: string | null;
  soDienThoai?: string | null;
  congTy?: string | null;
  chucDanh?: string | null;
  nhuCauQuanTam?: string | null;
  nguonLead: string;
  nganhNghe?: string | null;
  quyMo?: string | null;
  khuVucId?: string | null;
  nguoiSoHuuId?: string | null;
  nhomKinhDoanhId?: string | null;
  trangThai: TrangThaiLead;
  phanLoai: PhanLoaiLead;
  diemTiemNang: number;
  lyDoTuChoi?: string | null;
  khachHangGoiYId?: string | null;
  khachHangChuyenDoiId?: string | null;
  coHoiChuyenDoiId?: string | null;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  firstContactAt?: string | null;
  slaDeadline?: string | null;
  quaHanSla: boolean;
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
  khuVuc?: {
    id: string;
    tenKhuVuc: string;
  };
  khachHangChuyenDoi?: {
    id: string;
    maKhachHang: string;
    tenCongTy: string;
  };
  coHoiChuyenDoi?: {
    id: string;
    maCoHoi: string;
    tenCoHoi: string;
  };
  chiTietDiem?: {
    tenQuyTac: string;
    tieuChi: string;
    giaTri: string;
    diem: number;
  }[];
  lichSuPhanBo?: any[];
  hoatDong?: any[];
}

export interface FilterLeadParams {
  tuKhoa?: string;
  trangThai?: TrangThaiLead;
  phanLoai?: PhanLoaiLead;
  nguonLead?: string;
  nguoiSoHuuId?: string;
  trongHangDoi?: boolean;
  quaHanSla?: boolean;
  tuNgay?: string;
  denNgay?: string;
  page?: number;
  limit?: number;
}

export interface ScoringRule {
  id: string;
  tenQuyTac: string;
  tieuChi: string;
  toanTu: string;
  giaTri: string;
  diem: number;
  thuTu: number;
  kichHoat: boolean;
  createdAt: string;
}

export interface AssignmentRule {
  id: string;
  tenQuyTac: string;
  thuTuUuTien: number;
  loaiQuyTac: LoaiPhanBo;
  dieuKien?: any;
  nguoiNhanId?: string | null;
  danhSachNguoiDungIds?: string[] | null;
  chiSoHienTai: number;
  kichHoat: boolean;
}

export interface WebFormEmbedConfig {
  id: string;
  maForm: string;
  tenForm: string;
  tieuDe?: string | null;
  moTa?: string | null;
  nguonLeadMacDinh: string;
  mauButtonText: string;
  mauMauChuDao: string;
  kichHoat: boolean;
}

import api from './api';
import {
  HoatDong,
  CalendarResponse,
  ThongKeHoatDongItem,
  ThongKeQuaHanResponse,
} from '../types/activity.types';

export const activityService = {
  // Lấy danh sách hoạt động tương tác
  async layDanhSach(params?: any): Promise<{
    duLieu: HoatDong[];
    items: HoatDong[];
    tongSo: number;
    total: number;
    trangHienTai: number;
    page: number;
    soLuongMoiTrang: number;
    limit: number;
    tongSoTrang: number;
    totalPages: number;
  }> {
    const res = await api.get('/hoat-dong', { params });
    const d = res.data;
    const items = d.duLieu || d.items || [];
    const total = d.tongSo ?? d.total ?? items.length;
    const totalPages = d.tongSoTrang ?? d.totalPages ?? 1;
    const page = d.trangHienTai ?? d.page ?? 1;
    const limit = d.soLuongMoiTrang ?? d.limit ?? 15;
    return {
      duLieu: items,
      items,
      tongSo: total,
      total,
      trangHienTai: page,
      page,
      soLuongMoiTrang: limit,
      limit,
      tongSoTrang: totalPages,
      totalPages,
    };
  },

  // Tạo hoạt động mới (gọi điện, gặp mặt, email, ghi chú)
  async taoHoatDong(data: any): Promise<HoatDong> {
    const res = await api.post('/hoat-dong', data);
    return res.data;
  },

  // Chi tiết hoạt động
  async layChiTiet(id: string): Promise<HoatDong> {
    const res = await api.get(`/hoat-dong/${id}`);
    return res.data;
  },

  // Cập nhật hoạt động
  async capNhat(id: string, data: any): Promise<HoatDong> {
    const res = await api.put(`/hoat-dong/${id}`, data);
    return res.data;
  },

  // Xóa hoạt động
  async xoa(id: string): Promise<{ thanhCong: boolean; thongDiep: string }> {
    const res = await api.delete(`/hoat-dong/${id}`);
    return res.data;
  },

  // Timeline tương tác của Khách hàng 360
  async layTimelineKhachHang(khachHangId: string): Promise<HoatDong[]> {
    const res = await api.get(`/hoat-dong/timeline/khach-hang/${khachHangId}`);
    return res.data;
  },

  // Timeline tương tác của một Cơ hội
  async layTimelineCoHoi(coHoiId: string): Promise<HoatDong[]> {
    const res = await api.get(`/hoat-dong/timeline/co-hoi/${coHoiId}`);
    return res.data;
  },

  // Lấy dòng thời gian chung cho Cơ hội hoặc Khách hàng
  async layDongThoiGian(params: { coHoiId?: string; khachHangId?: string; limit?: number }): Promise<{ items: HoatDong[] }> {
    if (params.coHoiId) {
      const items = await this.layTimelineCoHoi(params.coHoiId);
      return { items };
    }
    if (params.khachHangId) {
      const items = await this.layTimelineKhachHang(params.khachHangId);
      return { items };
    }
    const res = await this.layDanhSach(params);
    return { items: res.items };
  },

  // Thống kê hoạt động
  async thongKeHoatDong(params?: { tuNgay?: string; denNgay?: string; nhomId?: string }): Promise<ThongKeHoatDongItem[]> {
    const res = await api.get('/hoat-dong/thong-ke', { params });
    return res.data;
  },

  // --- CÔNG VIỆC (TASK) ---
  async layDanhSachCongViec(params?: any): Promise<{
    duLieu: HoatDong[];
    items: HoatDong[];
    tongSo: number;
    total: number;
    trangHienTai: number;
    page: number;
    soLuongMoiTrang: number;
    limit: number;
    tongSoTrang: number;
    totalPages: number;
  }> {
    const res = await api.get('/cong-viec', { params });
    const d = res.data;
    const items = d.duLieu || d.items || [];
    const total = d.tongSo ?? d.total ?? items.length;
    const totalPages = d.tongSoTrang ?? d.totalPages ?? 1;
    const page = d.trangHienTai ?? d.page ?? 1;
    const limit = d.soLuongMoiTrang ?? d.limit ?? 15;
    return {
      duLieu: items,
      items,
      tongSo: total,
      total,
      trangHienTai: page,
      page,
      soLuongMoiTrang: limit,
      limit,
      tongSoTrang: totalPages,
      totalPages,
    };
  },

  async taoCongViec(data: any): Promise<HoatDong> {
    const res = await api.post('/cong-viec', data);
    return res.data;
  },

  async capNhatCongViec(id: string, data: any): Promise<HoatDong> {
    const res = await api.put(`/cong-viec/${id}`, data);
    return res.data;
  },

  async doiTrangThaiCongViec(id: string, data: { trangThaiCongViec: string; lyDoHoanHuy?: string }): Promise<HoatDong> {
    const res = await api.patch(`/cong-viec/${id}/trang-thai`, data);
    return res.data;
  },

  async xoaCongViec(id: string): Promise<{ thanhCong: boolean; thongDiep: string }> {
    const res = await api.delete(`/cong-viec/${id}`);
    return res.data;
  },

  async thongKeQuaHan(): Promise<ThongKeQuaHanResponse> {
    const res = await api.get('/cong-viec/thong-ke/qua-han');
    return res.data;
  },

  // --- LỊCH LÀM VIỆC (CALENDAR) ---
  async layLichLamViec(params?: {
    tuNgay?: string;
    denNgay?: string;
    xemTeam?: boolean;
    nguoiDungId?: string;
  }): Promise<CalendarResponse> {
    const res = await api.get('/lich-lam-viec', { params });
    return res.data;
  },
};

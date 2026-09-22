import api from './api';
import {
  KhachHang,
  Customer360Data,
  FilterKhachHangParams,
  NguoiLienHe,
} from '../types/customer.types';

export const customerService = {
  // Lấy danh sách khách hàng
  async layDanhSach(params: FilterKhachHangParams): Promise<{
    items: KhachHang[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await api.get('/khach-hang', { params });
    return res.data;
  },

  // Lấy chi tiết khách hàng
  async layChiTiet(id: string): Promise<KhachHang> {
    const res = await api.get(`/khach-hang/${id}`);
    return res.data;
  },

  // Tạo mới khách hàng
  async taoKhachHang(data: any): Promise<KhachHang> {
    const res = await api.post('/khach-hang', data);
    return res.data;
  },

  // Cập nhật khách hàng
  async capNhatKhachHang(id: string, data: any): Promise<KhachHang> {
    const res = await api.put(`/khach-hang/${id}`, data);
    return res.data;
  },

  // Xóa khách hàng
  async xoaKhachHang(id: string): Promise<any> {
    const res = await api.delete(`/khach-hang/${id}`);
    return res.data;
  },

  // Lấy Customer 360
  async layCustomer360(id: string, pageActivity: number = 1, limitActivity: number = 50): Promise<Customer360Data> {
    const res = await api.get(`/khach-hang/${id}/360`, {
      params: { pageActivity, limitActivity },
    });
    return res.data;
  },

  // Phát hiện khách hàng trùng lặp
  async phatHienTrungLap(params: { maSoThue?: string; tenCongTy?: string; website?: string }): Promise<KhachHang[]> {
    const res = await api.get('/khach-hang/duplicates/detect', { params });
    return res.data;
  },

  // Gộp 2 khách hàng
  async gopKhachHang(data: { khachHangGocId: string; khachHangGopId: string; ghiChu?: string }): Promise<any> {
    const res = await api.post('/khach-hang/merge', data);
    return res.data;
  },

  // --- NGƯỜI LIÊN HỆ ---

  // Lấy danh sách người liên hệ của khách hàng
  async layDanhSachLienHe(khachHangId: string): Promise<NguoiLienHe[]> {
    const res = await api.get(`/khach-hang/${khachHangId}/nguoi-lien-he`);
    return res.data;
  },

  // Thêm người liên hệ
  async taoNguoiLienHe(khachHangId: string, data: any): Promise<NguoiLienHe> {
    const res = await api.post(`/khach-hang/${khachHangId}/nguoi-lien-he`, data);
    return res.data;
  },

  // Cập nhật người liên hệ
  async capNhatNguoiLienHe(id: string, data: any): Promise<NguoiLienHe> {
    const res = await api.put(`/nguoi-lien-he/${id}`, data);
    return res.data;
  },

  // Xóa người liên hệ
  async xoaNguoiLienHe(id: string): Promise<any> {
    const res = await api.delete(`/nguoi-lien-he/${id}`);
    return res.data;
  },

  // Chuyển người liên hệ sang khách hàng khác
  async chuyenKhachHangChoLienHe(id: string, data: { khachHangMoiId: string; lyDo?: string }): Promise<any> {
    const res = await api.post(`/nguoi-lien-he/${id}/chuyen-khach-hang`, data);
    return res.data;
  },
};

import api from './api';
import {
  CoHoi,
  KanbanData,
  ForecastReport,
  CoHoiSanPham,
  GiaiDoanPipeline,
  LyDoThangThua,
  DoiThu,
} from '../types/opportunity.types';

export const opportunityService = {
  // Lấy danh sách cơ hội
  async layDanhSach(params?: any): Promise<{
    duLieu: CoHoi[];
    items: CoHoi[];
    tongSo: number;
    total: number;
    trangHienTai: number;
    page: number;
    soLuongMoiTrang: number;
    limit: number;
    tongSoTrang: number;
    totalPages: number;
  }> {
    const res = await api.get('/co-hoi', { params });
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

  // Lấy dữ liệu Kanban
  async layKanban(params?: any): Promise<KanbanData> {
    const res = await api.get('/co-hoi/kanban', { params });
    return res.data;
  },

  // Lấy chi tiết cơ hội 360
  async layChiTiet(id: string): Promise<CoHoi> {
    const res = await api.get(`/co-hoi/${id}`);
    return res.data;
  },

  // Tạo mới cơ hội
  async taoMoi(data: any): Promise<CoHoi> {
    const res = await api.post('/co-hoi', data);
    return res.data;
  },

  // Cập nhật cơ hội
  async capNhat(id: string, data: any): Promise<CoHoi> {
    const res = await api.put(`/co-hoi/${id}`, data);
    return res.data;
  },

  // Xóa cơ hội
  async xoa(id: string): Promise<{ thanhCong: boolean; thongDiep: string }> {
    const res = await api.delete(`/co-hoi/${id}`);
    return res.data;
  },

  // Chuyển giai đoạn Kanban
  async chuyenGiaiDoan(id: string, data: { giaiDoanId: string; lyDoChuyen?: string; ghiDeDieuKien?: boolean }): Promise<CoHoi> {
    const res = await api.post(`/co-hoi/${id}/stage`, data);
    return res.data;
  },

  // Đóng Thắng
  async dongThang(id: string, data: { giaTriThucTe: number; ngayDongThucTe: string; ghiChuDong?: string }): Promise<CoHoi> {
    const res = await api.post(`/co-hoi/${id}/won`, data);
    return res.data;
  },

  // Đóng Thua
  async dongThua(id: string, data: { lyDoThangThuaId: string; doiThuId?: string; ghiChuDong?: string }): Promise<CoHoi> {
    const res = await api.post(`/co-hoi/${id}/lost`, data);
    return res.data;
  },

  // Mở lại cơ hội đã đóng
  async moLai(id: string, data: { lyDoMoLai: string }): Promise<CoHoi> {
    const res = await api.post(`/co-hoi/${id}/reopen`, data);
    return res.data;
  },

  // Bàn giao sở hữu
  async banGiao(id: string, data: { nguoiSoHuuMoiId: string; lyDoBanGiao: string }): Promise<CoHoi> {
    const res = await api.post(`/co-hoi/${id}/handover`, data);
    return res.data;
  },

  // --- SẢN PHẨM TRONG CƠ HỘI ---
  async laySanPham(id: string): Promise<CoHoiSanPham[]> {
    const res = await api.get(`/co-hoi/${id}/san-pham`);
    return res.data;
  },

  async themSanPham(id: string, data: any): Promise<{ lineItem: CoHoiSanPham; tongGiaTriCoHoi: number; duBaoGiaTri: number }> {
    const res = await api.post(`/co-hoi/${id}/san-pham`, data);
    return res.data;
  },

  async capNhatSanPham(id: string, itemId: string, data: any): Promise<{ lineItem: CoHoiSanPham; tongGiaTriCoHoi: number; duBaoGiaTri: number }> {
    const res = await api.put(`/co-hoi/${id}/san-pham/${itemId}`, data);
    return res.data;
  },

  async xoaSanPham(id: string, itemId: string): Promise<{ thanhCong: boolean; tongGiaTriCoHoi: number; duBaoGiaTri: number }> {
    const res = await api.delete(`/co-hoi/${id}/san-pham/${itemId}`);
    return res.data;
  },

  // --- FORECAST ---
  async layForecast(nam?: number): Promise<ForecastReport> {
    const res = await api.get('/co-hoi/forecast/report', { params: { nam } });
    return res.data;
  },
  async layBaoCaoDuBao(nam?: number): Promise<ForecastReport> {
    return this.layForecast(nam);
  },

  // --- DANH MỤC PIPELINE & METADATA ---
  async layGiaiDoan(): Promise<GiaiDoanPipeline[]> {
    const res = await api.get('/giai-doan');
    return res.data;
  },
  async layDanhSachGiaiDoan(): Promise<GiaiDoanPipeline[]> {
    return this.layGiaiDoan();
  },

  async layLyDoThangThua(loai?: string): Promise<LyDoThangThua[]> {
    const res = await api.get('/giai-doan/ly-do', { params: { loai } });
    return res.data;
  },

  async layDoiThu(): Promise<DoiThu[]> {
    const res = await api.get('/giai-doan/doi-thu');
    return res.data;
  },

  async danhGiaDinhTre(): Promise<any> {
    const res = await api.post('/co-hoi/danh-gia-dinh-tre');
    return res.data;
  },
  async kiemTraDinhTre(): Promise<any> {
    return this.danhGiaDinhTre();
  },
  async layDuLieuKanban(params?: any): Promise<KanbanData> {
    return this.layKanban(params);
  },
  async xoaCoHoi(id: string): Promise<any> {
    return this.xoa(id);
  },
  async xoaSanPhamKhoiCoHoi(id: string, itemId: string): Promise<any> {
    return this.xoaSanPham(id, itemId);
  },
  async moLaiCoHoi(id: string, lyDoMoLai: string): Promise<CoHoi> {
    return this.moLai(id, { lyDoMoLai });
  },
};

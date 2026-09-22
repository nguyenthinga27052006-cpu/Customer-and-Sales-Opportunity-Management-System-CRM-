import api from './api';
import {
  Lead,
  FilterLeadParams,
  ScoringRule,
  AssignmentRule,
  WebFormEmbedConfig,
} from '../types/lead.types';

export const leadService = {
  // Lấy danh sách Lead
  async layDanhSach(params: FilterLeadParams): Promise<{
    items: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await api.get('/lead', { params });
    return res.data;
  },

  // Lấy chi tiết Lead
  async layChiTiet(id: string): Promise<Lead> {
    const res = await api.get(`/lead/${id}`);
    return res.data;
  },

  // Tạo Lead thủ công
  async taoLead(data: any): Promise<Lead> {
    const res = await api.post('/lead', data);
    return res.data;
  },

  // Cập nhật Lead
  async capNhatLead(id: string, data: any): Promise<Lead> {
    const res = await api.put(`/lead/${id}`, data);
    return res.data;
  },

  // Tiếp nhận Lead (Accept)
  async tiepNhanLead(id: string): Promise<Lead> {
    const res = await api.post(`/lead/${id}/accept`);
    return res.data;
  },

  // Từ chối Lead (Reject)
  async tuChoiLead(id: string, lyDo: string): Promise<Lead> {
    const res = await api.post(`/lead/${id}/reject`, { lyDo });
    return res.data;
  },

  // Phân bổ thủ công từ Queue
  async phanBoThuCong(id: string, nguoiNhanId: string, lyDo?: string): Promise<Lead> {
    const res = await api.post(`/lead/${id}/assign`, { nguoiNhanId, lyDo });
    return res.data;
  },

  // Chuyển đổi Lead sang Customer + Contact + Opportunity
  async chuyenDoiLead(id: string, data: any): Promise<any> {
    const res = await api.post(`/lead/${id}/convert`, data);
    return res.data;
  },

  // Kiểm tra trùng lặp Lead & Customer gợi ý
  async kiemTraTrungLap(params: { email?: string; soDienThoai?: string; congTy?: string }): Promise<{
    leads: Lead[];
    suggestedCustomer: any;
  }> {
    const res = await api.get('/lead/duplicates/check', { params });
    return res.data;
  },

  // Xem trước file Excel
  async xemTruocExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/lead/excel/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Xác nhận Import các dòng hợp lệ
  async xacNhanImportExcel(validRows: any[]): Promise<any> {
    const res = await api.post('/lead/excel/confirm', { validRows });
    return res.data;
  },

  // --- CẤU HÌNH CHẤM ĐIỂM ---

  async layCauHinhChamDiem(): Promise<any> {
    const res = await api.get('/lead-scoring/config');
    return res.data;
  },

  async capNhatCauHinhChamDiem(data: any): Promise<any> {
    const res = await api.put('/lead-scoring/config', data);
    return res.data;
  },

  async layQuyTacChamDiem(): Promise<ScoringRule[]> {
    const res = await api.get('/lead-scoring/rules');
    return res.data;
  },

  async taoQuyTacChamDiem(data: any): Promise<ScoringRule> {
    const res = await api.post('/lead-scoring/rules', data);
    return res.data;
  },

  async capNhatQuyTacChamDiem(id: string, data: any): Promise<ScoringRule> {
    const res = await api.put(`/lead-scoring/rules/${id}`, data);
    return res.data;
  },

  async xoaQuyTacChamDiem(id: string): Promise<any> {
    const res = await api.delete(`/lead-scoring/rules/${id}`);
    return res.data;
  },

  // --- CẤU HÌNH PHÂN BỔ ---

  async layQuyTacPhanBo(): Promise<AssignmentRule[]> {
    const res = await api.get('/lead-assignment/rules');
    return res.data;
  },

  async taoQuyTacPhanBo(data: any): Promise<AssignmentRule> {
    const res = await api.post('/lead-assignment/rules', data);
    return res.data;
  },

  async capNhatQuyTacPhanBo(id: string, data: any): Promise<AssignmentRule> {
    const res = await api.put(`/lead-assignment/rules/${id}`, data);
    return res.data;
  },

  async xoaQuyTacPhanBo(id: string): Promise<any> {
    const res = await api.delete(`/lead-assignment/rules/${id}`);
    return res.data;
  },

  // --- WEB FORM EMBED ---

  async layDanhSachWebForm(): Promise<WebFormEmbedConfig[]> {
    const res = await api.get('/web-form-embed');
    return res.data;
  },

  async taoWebForm(data: any): Promise<WebFormEmbedConfig> {
    const res = await api.post('/web-form-embed', data);
    return res.data;
  },

  async capNhatWebForm(id: string, data: any): Promise<WebFormEmbedConfig> {
    const res = await api.put(`/web-form-embed/${id}`, data);
    return res.data;
  },

  async submitPublicLead(data: any): Promise<any> {
    const res = await api.post('/lead-public/submit', data);
    return res.data;
  },
};

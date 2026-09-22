import React, { useState, useEffect } from 'react';
import { Lead } from '../../types/lead.types';
import { leadService } from '../../services/lead.service';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead?: Lead | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lead,
}) => {
  const isEditing = !!lead;

  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    congTy: '',
    chucDanh: '',
    nhuCauQuanTam: '',
    nguonLead: 'WEBSITE',
    nganhNghe: 'CONG_NGHE',
    quyMo: 'TREN_100_NV',
  });

  const [duplicateCheck, setDuplicateCheck] = useState<{
    leads: any[];
    suggestedCustomer: any;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setFormData({
        hoTen: lead.hoTen || '',
        email: lead.email || '',
        soDienThoai: lead.soDienThoai || '',
        congTy: lead.congTy || '',
        chucDanh: lead.chucDanh || '',
        nhuCauQuanTam: lead.nhuCauQuanTam || '',
        nguonLead: lead.nguonLead || 'WEBSITE',
        nganhNghe: lead.nganhNghe || 'CONG_NGHE',
        quyMo: lead.quyMo || 'TREN_100_NV',
      });
    } else {
      setFormData({
        hoTen: '',
        email: '',
        soDienThoai: '',
        congTy: '',
        chucDanh: '',
        nhuCauQuanTam: '',
        nguonLead: 'WEBSITE',
        nganhNghe: 'CONG_NGHE',
        quyMo: 'TREN_100_NV',
      });
    }
    setDuplicateCheck(null);
    setError(null);
  }, [lead, isOpen]);

  // Live duplicate check khi người dùng nhập email hoặc SĐT
  const handleBlurDuplicateCheck = async () => {
    if (!formData.email && !formData.soDienThoai) return;
    try {
      const res = await leadService.kiemTraTrungLap({
        email: formData.email,
        soDienThoai: formData.soDienThoai,
        congTy: formData.congTy,
      });
      if (res.leads.length > 0 || res.suggestedCustomer) {
        setDuplicateCheck(res);
      } else {
        setDuplicateCheck(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    if (!formData.nguonLead) {
      setError('Nguồn Lead là bắt buộc (Source = REQUIRED)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && lead) {
        await leadService.capNhatLead(lead.id, formData);
      } else {
        await leadService.taoLead(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi lưu Lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? `Chỉnh sửa Lead: ${lead.maLead}` : 'Thêm mới Lead tiềm năng (S4-02)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động chấm điểm tiềm năng và phân loại nhiệt độ
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Duplicate warning & customer suggestion */}
        {duplicateCheck && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Phát hiện thông tin tương tự trong hệ thống:
            </div>
            {duplicateCheck.suggestedCustomer && (
              <div>
                💡 Khách hàng hiện có: <strong>{duplicateCheck.suggestedCustomer.tenCongTy}</strong> ({duplicateCheck.suggestedCustomer.maKhachHang})
              </div>
            )}
            {duplicateCheck.leads.length > 0 && (
              <div>
                👥 Trùng thông tin với {duplicateCheck.leads.length} Lead khác.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.hoTen}
                onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                placeholder="VD: Nguyễn Tiến Đạt"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nguồn Lead <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.nguonLead}
                onChange={(e) => setFormData({ ...formData, nguonLead: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
              >
                <option value="WEBSITE">Website (Form đăng ký)</option>
                <option value="REFERRAL">Giới thiệu (Khách quen / Đối tác)</option>
                <option value="HOTLINE">Hotline / Tổng đài</option>
                <option value="EVENT">Hội thảo / Triển lãm</option>
                <option value="EXCEL_IMPORT">Nhập từ Excel</option>
                <option value="FACEBOOK_ADS">Quảng cáo Facebook/Google</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                onBlur={handleBlurDuplicateCheck}
                placeholder="0933112233"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={handleBlurDuplicateCheck}
                placeholder="dat.nguyen@company.vn"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Công ty / Cơ quan</label>
              <input
                type="text"
                value={formData.congTy}
                onChange={(e) => setFormData({ ...formData, congTy: e.target.value })}
                placeholder="VD: Công ty Phần mềm ABC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chức vụ</label>
              <input
                type="text"
                value={formData.chucDanh}
                onChange={(e) => setFormData({ ...formData, chucDanh: e.target.value })}
                placeholder="VD: Trưởng phòng Mua hàng"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngành nghề</label>
              <select
                value={formData.nganhNghe}
                onChange={(e) => setFormData({ ...formData, nganhNghe: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="CONG_NGHE">Công nghệ thông tin (+20đ)</option>
                <option value="TAI_CHINH">Tài chính - Ngân hàng (+20đ)</option>
                <option value="Y_TE_DUOC">Y tế - Dược phẩm</option>
                <option value="BAN_LE">Bán lẻ</option>
                <option value="SAN_XUAT">Sản xuất</option>
                <option value="KHAC">Ngành khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quy mô nhân sự</label>
              <select
                value={formData.quyMo}
                onChange={(e) => setFormData({ ...formData, quyMo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="DUOI_50_NV">Dưới 50 nhân sự</option>
                <option value="50_100_NV">50 - 100 nhân sự</option>
                <option value="TREN_100_NV">Trên 100 nhân sự (+15đ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nhu cầu quan tâm</label>
            <textarea
              rows={2}
              value={formData.nhuCauQuanTam}
              onChange={(e) => setFormData({ ...formData, nhuCauQuanTam: e.target.value })}
              placeholder="VD: Khách hàng cần báo giá gói CRM Enterprise cho 100 nhân sự..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật Lead' : 'Tạo Lead & Chấm điểm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

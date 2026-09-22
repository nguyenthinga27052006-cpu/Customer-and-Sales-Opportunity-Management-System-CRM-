import React, { useState, useEffect } from 'react';
import { NguoiLienHe, VaiTroQuyetDinh } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  khachHangId: string;
  contact?: NguoiLienHe | null;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  khachHangId,
  contact,
}) => {
  const isEditing = !!contact;

  const [formData, setFormData] = useState({
    hoTen: '',
    chucDanh: '',
    email: '',
    soDienThoai: '',
    vaiTroQuyetDinh: 'NGUOI_DUNG_CUOI' as VaiTroQuyetDinh,
    laDauMoiChinh: false,
    ghiChu: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setFormData({
        hoTen: contact.hoTen || '',
        chucDanh: contact.chucDanh || '',
        email: contact.email || '',
        soDienThoai: contact.soDienThoai || '',
        vaiTroQuyetDinh: contact.vaiTroQuyetDinh || 'NGUOI_DUNG_CUOI',
        laDauMoiChinh: contact.laDauMoiChinh || false,
        ghiChu: contact.ghiChu || '',
      });
    } else {
      setFormData({
        hoTen: '',
        chucDanh: '',
        email: '',
        soDienThoai: '',
        vaiTroQuyetDinh: 'NGUOI_DUNG_CUOI',
        laDauMoiChinh: false,
        ghiChu: '',
      });
    }
    setError(null);
  }, [contact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen.trim()) {
      setError('Họ và tên người liên hệ không được để trống');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && contact) {
        await customerService.capNhatNguoiLienHe(contact.id, formData);
      } else {
        await customerService.taoNguoiLienHe(khachHangId, formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi lưu người liên hệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Chỉnh sửa người liên hệ' : 'Thêm người liên hệ mới (Contact)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Định danh vai trò mua hàng và thông tin liên lạc chính xác
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.hoTen}
              onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
              placeholder="VD: Nguyễn Văn Quyết"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chức danh</label>
              <input
                type="text"
                value={formData.chucDanh}
                onChange={(e) => setFormData({ ...formData, chucDanh: e.target.value })}
                placeholder="VD: Giám đốc CNTT"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="VD: quyet.nv@company.vn"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vai trò trong quyết định mua hàng
            </label>
            <select
              value={formData.vaiTroQuyetDinh}
              onChange={(e) => setFormData({ ...formData, vaiTroQuyetDinh: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="NGUOI_QUYET_DINH">Người quyết định (Decision Maker)</option>
              <option value="NGUOI_ANH_HUONG">Người ảnh hưởng (Influencer)</option>
              <option value="NGUOI_DUNG_CUOI">Người dùng cuối (End-User)</option>
              <option value="NGUOI_CAN_TRO">Người cản trở (Blocker)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <input
              type="checkbox"
              id="laDauMoiChinh"
              checked={formData.laDauMoiChinh}
              onChange={(e) => setFormData({ ...formData, laDauMoiChinh: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="laDauMoiChinh" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Đánh dấu là Đầu mối liên hệ chính của doanh nghiệp
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú</label>
            <textarea
              rows={2}
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              placeholder="Ghi chú sở thích, thói quen liên lạc..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm người liên hệ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

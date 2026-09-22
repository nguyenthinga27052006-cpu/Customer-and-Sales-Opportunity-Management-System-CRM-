import React, { useState, useEffect } from 'react';
import { KhachHang, TrangThaiKhachHang } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: KhachHang | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
}) => {
  const isEditing = !!customer;

  const [formData, setFormData] = useState({
    tenCongTy: '',
    maSoThue: '',
    nganhNghe: 'CONG_NGHE',
    quyMo: 'TREN_100_NV',
    website: '',
    diaChi: '',
    tinhThanh: '',
    trangThai: 'TIEM_NANG' as TrangThaiKhachHang,
    moTa: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        tenCongTy: customer.tenCongTy || '',
        maSoThue: customer.maSoThue || '',
        nganhNghe: customer.nganhNghe || 'CONG_NGHE',
        quyMo: customer.quyMo || 'TREN_100_NV',
        website: customer.website || '',
        diaChi: customer.diaChi || '',
        tinhThanh: customer.tinhThanh || '',
        trangThai: customer.trangThai || 'TIEM_NANG',
        moTa: customer.moTa || '',
      });
    } else {
      setFormData({
        tenCongTy: '',
        maSoThue: '',
        nganhNghe: 'CONG_NGHE',
        quyMo: 'TREN_100_NV',
        website: '',
        diaChi: '',
        tinhThanh: '',
        trangThai: 'TIEM_NANG',
        moTa: '',
      });
    }
    setError(null);
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenCongTy.trim()) {
      setError('Tên công ty không được để trống');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && customer) {
        await customerService.capNhatKhachHang(customer.id, formData);
      } else {
        await customerService.taoKhachHang(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi lưu thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Chỉnh sửa thông tin khách hàng' : 'Thêm mới khách hàng doanh nghiệp'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? `Mã khách hàng: ${customer.maKhachHang}` : 'Nhập thông tin chi tiết và MST doanh nghiệp'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên công ty / Doanh nghiệp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.tenCongTy}
              onChange={(e) => setFormData({ ...formData, tenCongTy: e.target.value })}
              placeholder="VD: Công ty Cổ phần Công nghệ VNPT Solutions"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mã số thuế (MST)
              </label>
              <input
                type="text"
                value={formData.maSoThue}
                onChange={(e) => setFormData({ ...formData, maSoThue: e.target.value })}
                placeholder="VD: 0101234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Trạng thái khách hàng
              </label>
              <select
                value={formData.trangThai}
                onChange={(e) => setFormData({ ...formData, trangThai: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="TIEM_NANG">Tiềm năng (Lead/Prospect)</option>
                <option value="DANG_GIAO_DICH">Đang giao dịch (Negotiating)</option>
                <option value="KHACH_HANG">Khách hàng chính thức (Won)</option>
                <option value="NGUNG_HOP_TAC">Ngừng hợp tác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngành nghề
              </label>
              <select
                value={formData.nganhNghe}
                onChange={(e) => setFormData({ ...formData, nganhNghe: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="CONG_NGHE">Công nghệ thông tin</option>
                <option value="TAI_CHINH">Tài chính - Ngân hàng</option>
                <option value="Y_TE_DUOC">Y tế - Dược phẩm</option>
                <option value="BAN_LE">Bán lẻ & Thương mại</option>
                <option value="SAN_XUAT">Sản xuất - Công nghiệp</option>
                <option value="BAT_DONG_SAN">Bất động sản</option>
                <option value="GIAO_DUC">Giáo dục - Đào tạo</option>
                <option value="KHAC">Ngành nghề khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quy mô nhân sự
              </label>
              <select
                value={formData.quyMo}
                onChange={(e) => setFormData({ ...formData, quyMo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="DUOI_50_NV">Dưới 50 nhân sự</option>
                <option value="50_100_NV">50 - 100 nhân sự</option>
                <option value="TREN_100_NV">Trên 100 nhân sự (Doanh nghiệp lớn)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tỉnh / Thành phố
              </label>
              <input
                type="text"
                value={formData.tinhThanh}
                onChange={(e) => setFormData({ ...formData, tinhThanh: e.target.value })}
                placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Địa chỉ chi tiết
            </label>
            <input
              type="text"
              value={formData.diaChi}
              onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              placeholder="Số nhà, đường, quận/huyện..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mô tả / Ghi chú
            </label>
            <textarea
              rows={3}
              value={formData.moTa}
              onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
              placeholder="Ghi chú thêm về yêu cầu đặc thù hoặc lưu ý chăm sóc..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="animate-spin text-xs">⏳</span>}
              {isEditing ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

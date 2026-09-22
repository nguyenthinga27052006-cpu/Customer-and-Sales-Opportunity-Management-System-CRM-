import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { opportunityService } from '../../services/opportunity.service';
import { CoHoiSanPham } from '../../types/opportunity.types';

interface OpportunityProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunityId: string;
  item?: CoHoiSanPham | null;
}

export const OpportunityProductModal: React.FC<OpportunityProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunityId,
  item,
}) => {
  const isEditing = !!item;

  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    sanPhamId: '',
    soLuong: 1,
    donGia: 0,
    chietKhauPhanTram: 0,
    chietKhauSoTien: 0,
    soKyThueBao: 1,
    ghiChu: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load danh mục sản phẩm
  useEffect(() => {
    if (!isOpen) return;

    api.get('/san-pham').then((res) => {
      setProducts(res.data || []);
      if (!item && res.data?.length > 0) {
        const first = res.data[0];
        setFormData({
          sanPhamId: first.id,
          soLuong: 1,
          donGia: Number(first.giaNiemYet) || 0,
          chietKhauPhanTram: 0,
          chietKhauSoTien: 0,
          soKyThueBao: first.loaiSanPham === 'THUE_BAO' ? 12 : 1,
          ghiChu: '',
        });
      }
    });

    if (item) {
      setFormData({
        sanPhamId: item.sanPhamId,
        soLuong: item.soLuong || 1,
        donGia: Number(item.donGia) || 0,
        chietKhauPhanTram: Number(item.chietKhauPhanTram) || 0,
        chietKhauSoTien: Number(item.chietKhauSoTien) || 0,
        soKyThueBao: item.soKyThueBao || 1,
        ghiChu: item.ghiChu || '',
      });
    }
  }, [isOpen, item]);

  const selectedProduct = products.find((p) => p.id === formData.sanPhamId);

  const handleProductChange = (spId: string) => {
    const sp = products.find((p) => p.id === spId);
    if (sp) {
      setFormData((prev) => ({
        ...prev,
        sanPhamId: spId,
        donGia: Number(sp.giaNiemYet) || 0,
        soKyThueBao: sp.loaiSanPham === 'THUE_BAO' ? 12 : 1,
      }));
    }
  };

  // Tính thành tiền
  const isSubscription = selectedProduct?.loaiSanPham === 'THUE_BAO';
  const basePrice = formData.soLuong * formData.donGia * (isSubscription ? formData.soKyThueBao : 1);
  const discountAmount = formData.chietKhauPhanTram > 0
    ? (basePrice * formData.chietKhauPhanTram) / 100
    : formData.chietKhauSoTien;
  const lineTotal = Math.max(basePrice - discountAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sanPhamId) {
      setError('Vui lòng chọn sản phẩm');
      return;
    }
    if (formData.soLuong <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && item) {
        await opportunityService.capNhatSanPham(opportunityId, item.id, {
          ...formData,
          chietKhauSoTien: discountAmount,
        });
      } else {
        await opportunityService.themSanPham(opportunityId, {
          ...formData,
          chietKhauSoTien: discountAmount,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.thongDiep || err.message || 'Lỗi thêm sản phẩm';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Cập nhật sản phẩm cơ hội' : 'Thêm sản phẩm vào cơ hội (S5-03)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn sản phẩm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Sản phẩm từ danh mục <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={isEditing}
              value={formData.sanPhamId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.maSanPham} - {p.tenSanPham} ({new Intl.NumberFormat('vi-VN').format(p.giaNiemYet)} đ/{p.donViTinh})
                </option>
              ))}
            </select>
          </div>

          {/* Số lượng & Đơn giá */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Số lượng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.soLuong}
                onChange={(e) => setFormData({ ...formData, soLuong: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Đơn giá (VND)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={formData.donGia}
                onChange={(e) => setFormData({ ...formData, donGia: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          {/* Nếu là sản phẩm thuê bao: Số kỳ thuê bao */}
          {isSubscription && (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Sản phẩm thuê bao ({selectedProduct?.donViTinh})
                </span>
                <span className="text-xs font-mono text-blue-700 dark:text-blue-400">
                  Giá trị theo năm: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.soLuong * formData.donGia * 12)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-600 dark:text-slate-400">Số tháng/kỳ:</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.soKyThueBao}
                  onChange={(e) => setFormData({ ...formData, soKyThueBao: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-center"
                />
                <span className="text-xs text-slate-500">tháng</span>
              </div>
            </div>
          )}

          {/* Chiết khấu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Chiết khấu (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.chietKhauPhanTram}
                onChange={(e) => setFormData({ ...formData, chietKhauPhanTram: Number(e.target.value), chietKhauSoTien: 0 })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tiền chiết khấu (VND)
              </label>
              <input
                type="text"
                disabled
                value={new Intl.NumberFormat('vi-VN').format(discountAmount)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-mono"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ghi chú dòng sản phẩm
            </label>
            <input
              type="text"
              placeholder="VD: Bao gồm bảo hành mở rộng 12 tháng..."
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Thành tiền tổng kết */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span>Thành tiền dòng này:</span>
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lineTotal)}
            </span>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-colors"
            >
              {loading ? 'Đang tính...' : isEditing ? 'Lưu sản phẩm' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Phone, Users, Mail, FileText, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { activityService } from '../../services/activity.service';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultKhachHangId?: string;
  defaultCoHoiId?: string;
  defaultNguoiLienHeId?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultKhachHangId,
  defaultCoHoiId,
  defaultNguoiLienHeId,
}) => {
  const [formData, setFormData] = useState({
    loaiHoatDong: 'GOI_DIEN',
    tieuDe: '',
    noiDung: '',
    thoiGian: new Date().toISOString().slice(0, 16),
    thoiLuongPhut: 15,
    diaDiem: '',
    ketQua: '',
    khachHangId: defaultKhachHangId || '',
    coHoiId: defaultCoHoiId || '',
    nguoiLienHeId: defaultNguoiLienHeId || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        loaiHoatDong: 'GOI_DIEN',
        tieuDe: '',
        noiDung: '',
        thoiGian: new Date().toISOString().slice(0, 16),
        thoiLuongPhut: 15,
        diaDiem: '',
        ketQua: '',
        khachHangId: defaultKhachHangId || '',
        coHoiId: defaultCoHoiId || '',
        nguoiLienHeId: defaultNguoiLienHeId || '',
      });
      setError(null);
    }
  }, [isOpen, defaultKhachHangId, defaultCoHoiId, defaultNguoiLienHeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tieuDe.trim()) {
      setError('Vui lòng nhập tiêu đề hoạt động');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await activityService.taoHoatDong({
        ...formData,
        thoiGian: new Date(formData.thoiGian).toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.thongDiep || err.message || 'Lỗi ghi nhận hoạt động';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activityTypes = [
    { id: 'GOI_DIEN', label: 'Cuộc gọi', icon: Phone, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' },
    { id: 'GAP_MAT', label: 'Cuộc gặp', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-300' },
    { id: 'EMAIL', label: 'Email', icon: Mail, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300' },
    { id: 'GHI_CHU', label: 'Ghi chú', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ghi nhận hoạt động tương tác (S6-05)
            </h3>
            <p className="text-xs text-slate-500">Lưu lại cuộc gọi, buổi họp, email hoặc ghi chú tư vấn</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Type Selector */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-4 gap-2">
            {activityTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.loaiHoatDong === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, loaiHoatDong: type.id })}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? `${type.color} ring-2 ring-blue-500/20 shadow-sm`
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề hoạt động <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                formData.loaiHoatDong === 'GOI_DIEN'
                  ? 'VD: Gọi điện tư vấn nhu cầu triển khai CRM...'
                  : formData.loaiHoatDong === 'GAP_MAT'
                  ? 'VD: Họp demo sản phẩm trực tiếp tại văn phòng...'
                  : 'VD: Tóm tắt trao đổi...'
              }
              value={formData.tieuDe}
              onChange={(e) => setFormData({ ...formData, tieuDe: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Thời điểm & Thời lượng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Thời điểm</span>
              </label>
              <input
                type="datetime-local"
                value={formData.thoiGian}
                onChange={(e) => setFormData({ ...formData, thoiGian: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Thời lượng (phút)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={formData.thoiLuongPhut}
                onChange={(e) => setFormData({ ...formData, thoiLuongPhut: parseInt(e.target.value, 10) || 15 })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-center"
              />
            </div>
          </div>

          {/* Địa điểm (nếu là cuộc gặp) */}
          {(formData.loaiHoatDong === 'GAP_MAT' || formData.loaiHoatDong === 'CUOC_GAP') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Địa điểm / Link phòng họp</span>
              </label>
              <input
                type="text"
                placeholder="VD: Văn phòng khách hàng - Tầng 8 hoặc link Google Meet / Zoom..."
                value={formData.diaDiem}
                onChange={(e) => setFormData({ ...formData, diaDiem: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Kết quả trao đổi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Kết quả đạt được</span>
            </label>
            <input
              type="text"
              placeholder="VD: Khách hàng đồng ý nhận báo giá, hẹn demo thứ Sáu..."
              value={formData.ketQua}
              onChange={(e) => setFormData({ ...formData, ketQua: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Nội dung chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nội dung trao đổi chi tiết
            </label>
            <textarea
              rows={3}
              placeholder="Ghi lại các ý chính, yêu cầu của khách hàng, phản hồi về giá hoặc tính năng..."
              value={formData.noiDung}
              onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
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
              {loading ? 'Đang lưu...' : 'Lưu hoạt động'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

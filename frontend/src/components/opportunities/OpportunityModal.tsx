import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Target, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { CoHoi, GiaiDoanPipeline } from '../../types/opportunity.types';
import { opportunityService } from '../../services/opportunity.service';
import { customerService } from '../../services/customer.service';
import { KhachHang } from '../../types/customer.types';

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity?: CoHoi | null;
  defaultCustomerId?: string;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity,
  defaultCustomerId,
}) => {
  const isEditing = !!opportunity;

  const [formData, setFormData] = useState({
    tenCoHoi: '',
    khachHangId: '',
    nguoiLienHeId: '',
    giaiDoanId: '',
    giaTriDuKien: 0,
    xacSuat: 10,
    ghiChuXacSuat: '',
    ngayKyDuKien: '',
    nguonCoHoi: 'WEBSITE',
    moTa: '',
  });

  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [stages, setStages] = useState<GiaiDoanPipeline[]>([]);
  const [selectedCustomerContacts, setSelectedCustomerContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load danh mục khách hàng và giai đoạn
  useEffect(() => {
    if (!isOpen) return;

    const loadMeta = async () => {
      try {
        const [custList, stageList] = await Promise.all([
          customerService.layDanhSach({ limit: 100 }),
          opportunityService.layGiaiDoan(),
        ]);
        setCustomers(custList.items || []);
        setStages(stageList || []);

        if (opportunity) {
          setFormData({
            tenCoHoi: opportunity.tenCoHoi || '',
            khachHangId: opportunity.khachHangId || '',
            nguoiLienHeId: opportunity.nguoiLienHeId || '',
            giaiDoanId: opportunity.giaiDoanId || '',
            giaTriDuKien: Number(opportunity.giaTriDuKien) || 0,
            xacSuat: opportunity.xacSuat || 10,
            ghiChuXacSuat: opportunity.ghiChuXacSuat || '',
            ngayKyDuKien: opportunity.ngayKyDuKien ? opportunity.ngayKyDuKien.split('T')[0] : '',
            nguonCoHoi: opportunity.nguonCoHoi || 'WEBSITE',
            moTa: opportunity.moTa || '',
          });
        } else {
          const firstStage = stageList[0];
          // Default close date 30 days from now
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);

          setFormData({
            tenCoHoi: '',
            khachHangId: defaultCustomerId || (custList.items?.[0]?.id || ''),
            nguoiLienHeId: '',
            giaiDoanId: firstStage ? firstStage.id : '',
            giaTriDuKien: 0,
            xacSuat: firstStage ? firstStage.xacSuatThang : 10,
            ghiChuXacSuat: '',
            ngayKyDuKien: futureDate.toISOString().split('T')[0],
            nguonCoHoi: 'WEBSITE',
            moTa: '',
          });
        }
      } catch (err: any) {
        console.error('Lỗi nạp danh mục:', err);
      }
    };

    loadMeta();
  }, [isOpen, opportunity, defaultCustomerId]);

  // Load người liên hệ khi đổi khách hàng
  useEffect(() => {
    if (!formData.khachHangId) {
      setSelectedCustomerContacts([]);
      return;
    }

    const c = customers.find((item) => item.id === formData.khachHangId);
    if (c) {
      customerService.layChiTiet(c.id).then((detail) => {
        setSelectedCustomerContacts(detail.nguoiLienHe || []);
      });
    }
  }, [formData.khachHangId, customers]);

  // Tự động gán xác suất khi chọn giai đoạn (nếu chưa sửa tay)
  const handleStageChange = (stageId: string) => {
    const st = stages.find((s) => s.id === stageId);
    setFormData((prev) => ({
      ...prev,
      giaiDoanId: stageId,
      xacSuat: st ? st.xacSuatThang : prev.xacSuat,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenCoHoi.trim()) {
      setError('Vui lòng nhập tên cơ hội bán hàng');
      return;
    }
    if (!formData.khachHangId) {
      setError('Vui lòng chọn khách hàng liên kết');
      return;
    }
    if (!formData.giaiDoanId) {
      setError('Vui lòng chọn giai đoạn pipeline');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && opportunity) {
        await opportunityService.capNhat(opportunity.id, formData);
      } else {
        await opportunityService.taoMoi(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.thongDiep || err.message || 'Lỗi lưu cơ hội bán hàng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const duBao = (formData.giaTriDuKien * formData.xacSuat) / 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? `Cập nhật cơ hội: ${opportunity?.maCoHoi}` : 'Thêm mới cơ hội bán hàng (S5-01)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gắn cơ hội với khách hàng, quản lý giai đoạn và dự báo doanh thu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start space-x-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tên cơ hội */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên cơ hội bán hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Triển khai phần mềm CRM gói Doanh Nghiệp..."
              value={formData.tenCoHoi}
              onChange={(e) => setFormData({ ...formData, tenCoHoi: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Khách hàng & Người liên hệ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Khách hàng <span className="text-red-500">*</span></span>
              </label>
              <select
                required
                disabled={isEditing}
                value={formData.khachHangId}
                onChange={(e) => setFormData({ ...formData, khachHangId: e.target.value, nguoiLienHeId: '' })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.maKhachHang} - {c.tenCongTy}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Người liên hệ chính</span>
              </label>
              <select
                value={formData.nguoiLienHeId}
                onChange={(e) => setFormData({ ...formData, nguoiLienHeId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn đầu mối --</option>
                {selectedCustomerContacts.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.hoTen} {ct.chucDanh ? `(${ct.chucDanh})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Giai đoạn & Ngày dự kiến chốt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Giai đoạn Pipeline <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={isEditing}
                value={formData.giaiDoanId}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn giai đoạn --</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.thuTu}. {s.tenGiaiDoan} ({s.xacSuatThang}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Ngày dự kiến chốt</span>
              </label>
              <input
                type="date"
                value={formData.ngayKyDuKien}
                onChange={(e) => setFormData({ ...formData, ngayKyDuKien: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Giá trị dự kiến & Xác suất thắng */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Giá trị dự kiến ban đầu (VND)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  disabled={isEditing} // Nếu đang edit, giá trị được tính tự động từ sản phẩm
                  value={formData.giaTriDuKien}
                  onChange={(e) => setFormData({ ...formData, giaTriDuKien: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75"
                />
                {isEditing && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    * Giá trị cơ hội được tự động đồng bộ từ chi tiết các dòng sản phẩm (S5-03).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Xác suất thắng ({formData.xacSuat}%)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.xacSuat}
                    onChange={(e) => setFormData({ ...formData, xacSuat: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 w-12 text-right">
                    {formData.xacSuat}%
                  </span>
                </div>
              </div>
            </div>

            {/* Weighted Forecast Summary */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Dự báo doanh số theo trọng số (Forecast = Giá trị × Xác suất):
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(duBao)}
              </span>
            </div>
          </div>

          {/* Ghi chú xác suất & Nguồn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ghi chú điều chỉnh xác suất
              </label>
              <input
                type="text"
                placeholder="VD: Khách hàng đã duyệt ngân sách nội bộ..."
                value={formData.ghiChuXacSuat}
                onChange={(e) => setFormData({ ...formData, ghiChuXacSuat: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nguồn cơ hội
              </label>
              <select
                value={formData.nguonCoHoi}
                onChange={(e) => setFormData({ ...formData, nguonCoHoi: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="WEBSITE">Website công ty</option>
                <option value="GIOI_THIEU">Khách quen giới thiệu</option>
                <option value="HOI_THAO">Sự kiện / Triển lãm</option>
                <option value="COLD_CALL">Tiếp cận trực tiếp (Outbound)</option>
                <option value="DOI_TAC">Kênh đối tác</option>
                <option value="LEAD_CHUYEN_DOI">Chuyển đổi từ Lead</option>
              </select>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết nhu cầu & yêu cầu kỹ thuật
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú về quy mô dự án, các yêu cầu đặc biệt hoặc mốc thời gian khách kỳ vọng..."
              value={formData.moTa}
              onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
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
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo cơ hội'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

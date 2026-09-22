import React, { useState, useEffect } from 'react';
import { X, Trophy, XCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { CoHoi, LyDoThangThua, DoiThu } from '../../types/opportunity.types';
import { opportunityService } from '../../services/opportunity.service';

interface OpportunityCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: CoHoi;
  defaultMode?: 'WON' | 'LOST';
}

export const OpportunityCloseModal: React.FC<OpportunityCloseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity,
  defaultMode = 'WON',
}) => {
  const [mode, setMode] = useState<'WON' | 'LOST'>(defaultMode);

  // Won form
  const [wonData, setWonData] = useState({
    giaTriThucTe: Number(opportunity?.giaTriDuKien) || 0,
    ngayDongThucTe: new Date().toISOString().split('T')[0],
    ghiChuDong: '',
  });

  // Lost form
  const [lostData, setLostData] = useState({
    lyDoThangThuaId: '',
    doiThuId: '',
    ghiChuDong: '',
  });

  const [reasons, setReasons] = useState<LyDoThangThua[]>([]);
  const [competitors, setCompetitors] = useState<DoiThu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(defaultMode);
    if (opportunity) {
      setWonData({
        giaTriThucTe: Number(opportunity.giaTriDuKien) || 0,
        ngayDongThucTe: new Date().toISOString().split('T')[0],
        ghiChuDong: '',
      });
    }
  }, [defaultMode, opportunity]);

  useEffect(() => {
    if (!isOpen) return;

    opportunityService.layLyDoThangThua('THUA').then((data) => {
      setReasons(data || []);
      if (data?.length > 0) {
        setLostData((prev) => ({ ...prev, lyDoThangThuaId: data[0].id }));
      }
    });

    opportunityService.layDoiThu().then((data) => {
      setCompetitors(data || []);
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'WON') {
        if (wonData.giaTriThucTe < 0) {
          setError('Giá trị chốt thực tế không được âm');
          setLoading(false);
          return;
        }
        await opportunityService.dongThang(opportunity.id, wonData);
      } else {
        if (!lostData.lyDoThangThuaId) {
          setError('Bắt buộc chọn lý do thua thầu (S5-05)');
          setLoading(false);
          return;
        }
        await opportunityService.dongThua(opportunity.id, lostData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.thongDiep || err.message || 'Lỗi xử lý đóng cơ hội';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-all">
        {/* Header with Mode Switcher */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Đóng Cơ Hội Bán Hàng (S5-05)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{opportunity.maCoHoi} - {opportunity.tenCoHoi}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 p-1">
          <button
            type="button"
            onClick={() => setMode('WON')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'WON'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>ĐÓNG THẮNG (WON)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('LOST')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'LOST'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>ĐÓNG THUA (LOST)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'WON' ? (
            <>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                🎉 Xin chúc mừng! Đóng thắng cơ hội sẽ chuyển trạng thái sang <b>Đóng Thắng</b>, tính doanh số thực tế cho nhân viên phụ trách và khóa chỉnh sửa dữ liệu.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Giá trị chốt thực tế (VND) <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  step="100000"
                  value={wonData.giaTriThucTe}
                  onChange={(e) => setWonData({ ...wonData, giaTriThucTe: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ngày ký hợp đồng thực tế <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="date"
                  required
                  value={wonData.ngayDongThucTe}
                  onChange={(e) => setWonData({ ...wonData, ngayDongThucTe: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ghi chú thắng thầu / Các điều khoản cam kết thêm
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú chi tiết về hợp đồng, lý do thành công..."
                  value={wonData.ghiChuDong}
                  onChange={(e) => setWonData({ ...wonData, ghiChuDong: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300">
                ⚠️ Đóng Thua bắt buộc phải ghi lại lý do thua để công ty đúc kết bài học kinh nghiệm và phân tích thị trường (S5-05).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Lý do thua thầu <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={lostData.lyDoThangThuaId}
                  onChange={(e) => setLostData({ ...lostData, lyDoThangThuaId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                >
                  <option value="">-- Chọn lý do thua --</option>
                  {reasons.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.noiDung}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Đối thủ cạnh tranh thắng thầu (nếu có)
                </label>
                <select
                  value={lostData.doiThuId}
                  onChange={(e) => setLostData({ ...lostData, doiThuId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">-- Không xác định đối thủ --</option>
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tenDoiThu} {c.moTa ? `(${c.moTa})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ghi chú chi tiết lý do thất bại / Phản hồi của khách
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Khách hàng cho rằng giá cao hơn 20% so với giải pháp Base CRM..."
                  value={lostData.ghiChuDong}
                  onChange={(e) => setLostData({ ...lostData, ghiChuDong: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                />
              </div>
            </>
          )}

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
              className={`px-5 py-2 text-sm font-bold rounded-xl text-white shadow-md transition-colors ${
                mode === 'WON'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
              } disabled:opacity-50`}
            >
              {loading ? 'Đang lưu...' : mode === 'WON' ? 'Xác nhận Đóng Thắng' : 'Xác nhận Đóng Thua'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

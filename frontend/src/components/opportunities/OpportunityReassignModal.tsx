import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { opportunityService } from '../../services/opportunity.service';
import { CoHoi } from '../../types/opportunity.types';

interface OpportunityReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: CoHoi;
}

export const OpportunityReassignModal: React.FC<OpportunityReassignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [nguoiMoiId, setNguoiMoiId] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    api.get('/nguoi-dung').then((res) => {
      setUsers(res.data?.duLieu || res.data?.items || res.data || []);
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nguoiMoiId) {
      setError('Vui lòng chọn nhân viên tiếp nhận cơ hội');
      return;
    }
    if (!lyDo.trim()) {
      setError('Vui lòng nhập lý do bàn giao cơ hội (S5-08)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await opportunityService.banGiao(opportunity.id, {
        nguoiSoHuuMoiId: nguoiMoiId,
        lyDoBanGiao: lyDo,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.thongDiep || err.message || 'Lỗi bàn giao cơ hội';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bàn giao / Phân bổ lại (S5-08)
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

          <div className="text-xs text-slate-600 dark:text-slate-400">
            Người sở hữu hiện tại: <b>{opportunity.nguoiSoHuu.hoTen}</b>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Chọn nhân sự tiếp nhận mới <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={nguoiMoiId}
              onChange={(e) => setNguoiMoiId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Chọn nhân sự --</option>
              {users
                .filter((u) => u.id !== opportunity.nguoiSoHuuId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.hoTen} ({u.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Lý do bàn giao (Bắt buộc) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="VD: Phân bổ lại do phụ trách địa bàn mới, người cũ nghỉ phép dài hạn..."
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
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
              className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20 transition-colors"
            >
              {loading ? 'Đang chuyển...' : 'Xác nhận bàn giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

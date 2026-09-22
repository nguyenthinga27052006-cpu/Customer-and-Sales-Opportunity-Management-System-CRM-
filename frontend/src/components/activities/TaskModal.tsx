import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, AlertCircle, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { activityService } from '../../services/activity.service';
import { HoatDong } from '../../types/activity.types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: HoatDong | null;
  defaultKhachHangId?: string;
  defaultCoHoiId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task,
  defaultKhachHangId,
  defaultCoHoiId,
}) => {
  const isEditing = !!task;

  // Default due date tomorrow at 17:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0);

  const [formData, setFormData] = useState({
    tieuDe: '',
    noiDung: '',
    hanHoanThanh: tomorrow.toISOString().slice(0, 16),
    mucDoUuTien: 'TRUNG_BINH',
    nguoiDuocGiaoId: '',
    khachHangId: defaultKhachHangId || '',
    coHoiId: defaultCoHoiId || '',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    api.get('/nguoi-dung').then((res) => {
      setUsers(res.data?.duLieu || res.data?.items || res.data || []);
    });

    if (task) {
      setFormData({
        tieuDe: task.tieuDe || '',
        noiDung: task.noiDung || '',
        hanHoanThanh: task.hanHoanThanh ? task.hanHoanThanh.slice(0, 16) : tomorrow.toISOString().slice(0, 16),
        mucDoUuTien: (task.mucDoUuTien as string) || 'TRUNG_BINH',
        nguoiDuocGiaoId: task.nguoiDuocGiaoId || '',
        khachHangId: task.khachHangId || defaultKhachHangId || '',
        coHoiId: task.coHoiId || defaultCoHoiId || '',
      });
    } else {
      setFormData({
        tieuDe: '',
        noiDung: '',
        hanHoanThanh: tomorrow.toISOString().slice(0, 16),
        mucDoUuTien: 'TRUNG_BINH',
        nguoiDuocGiaoId: '',
        khachHangId: defaultKhachHangId || '',
        coHoiId: defaultCoHoiId || '',
      });
    }
  }, [isOpen, task, defaultKhachHangId, defaultCoHoiId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tieuDe.trim()) {
      setError('Vui lòng nhập tiêu đề công việc');
      return;
    }
    if (!formData.hanHoanThanh) {
      setError('Vui lòng chọn hạn hoàn thành');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && task) {
        await activityService.capNhatCongViec(task.id, {
          ...formData,
          hanHoanThanh: new Date(formData.hanHoanThanh).toISOString(),
        });
      } else {
        await activityService.taoCongViec({
          ...formData,
          hanHoanThanh: new Date(formData.hanHoanThanh).toISOString(),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.thongDiep || err.message || 'Lỗi lưu công việc';
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
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Cập nhật công việc' : 'Tạo việc cần làm (Task - S6-06)'}
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

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Gửi báo giá chiết khấu 5% cho khách hàng..."
              value={formData.tieuDe}
              onChange={(e) => setFormData({ ...formData, tieuDe: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Hạn hoàn thành & Mức ưu tiên */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Hạn chót <span className="text-red-500">*</span></span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.hanHoanThanh}
                onChange={(e) => setFormData({ ...formData, hanHoanThanh: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Mức ưu tiên
              </label>
              <select
                value={formData.mucDoUuTien}
                onChange={(e) => setFormData({ ...formData, mucDoUuTien: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              >
                <option value="THAP">Thấp</option>
                <option value="TRUNG_BINH">Trung bình</option>
                <option value="CAO">Cao (Quan trọng)</option>
                <option value="KHAN_CAP">Khẩn cấp 🔥</option>
              </select>
            </div>
          </div>

          {/* Người được giao (Assignee) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Giao việc cho nhân sự (Mặc định: Tôi)</span>
            </label>
            <select
              value={formData.nguoiDuocGiaoId}
              onChange={(e) => setFormData({ ...formData, nguoiDuocGiaoId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Chính tôi (Người tạo) --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.hoTen} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nội dung mô tả việc cần làm
            </label>
            <textarea
              rows={3}
              placeholder="Chi tiết công việc, các tài liệu cần chuẩn bị..."
              value={formData.noiDung}
              onChange={(e) => setFormData({ ...formData, noiDung: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
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
              className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-colors"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu công việc' : 'Tạo việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

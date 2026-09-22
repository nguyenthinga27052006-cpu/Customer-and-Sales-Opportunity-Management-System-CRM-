import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  Building,
  Target,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Edit2,
  Trash2,
  RefreshCw,
  Users
} from 'lucide-react';
import { HoatDong, MucDoUuTien, TrangThaiCongViec, ThongKeQuaHanResponse } from '../types/activity.types';
import { activityService } from '../services/activity.service';
import { TaskModal } from '../components/activities/TaskModal';

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<HoatDong[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overdue stats (S6-09)
  const [overdueStats, setOverdueStats] = useState<ThongKeQuaHanResponse | null>(null);

  // Filters
  const [filters, setFilters] = useState<{
    trangThaiCongViec?: TrangThaiCongViec | string;
    mucDoUuTien?: MucDoUuTien | string;
    tuKhoa: string;
    chiLayQuaHan?: boolean;
    page: number;
    limit: number;
  }>({
    trangThaiCongViec: 'CHUA_HOAN_THANH',
    mucDoUuTien: undefined,
    tuKhoa: '',
    chiLayQuaHan: undefined,
    page: 1,
    limit: 15,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HoatDong | null>(null);

  // User role check
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const isTeamLead = userRoles.some((r) => ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(r));

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activityService.layDanhSachCongViec(filters);
      setTasks(res.items || res.duLieu || []);
      setTotal(res.total || res.tongSo || 0);
      setTotalPages(res.totalPages || res.tongSoTrang || 1);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueStats = async () => {
    try {
      const data = await activityService.thongKeQuaHan();
      setOverdueStats(data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê quá hạn:', err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filters.page, filters.trangThaiCongViec, filters.mucDoUuTien, filters.chiLayQuaHan]);

  useEffect(() => {
    loadOverdueStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    loadTasks();
  };

  const handleToggleComplete = async (task: HoatDong) => {
    const isCompleted = task.trangThaiCongViec === 'HOAN_THANH';
    const newStatus = isCompleted ? 'CHUA_HOAN_THANH' : 'HOAN_THANH';

    try {
      await activityService.doiTrangThaiCongViec(task.id, {
        trangThaiCongViec: newStatus,
      });
      loadTasks();
      loadOverdueStats();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi cập nhật trạng thái việc');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${title}"?`)) return;
    try {
      await activityService.xoaCongViec(id);
      loadTasks();
      loadOverdueStats();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi xóa công việc');
    }
  };

  const getPriorityBadge = (priority?: string | null) => {
    switch (priority) {
      case 'KHAN_CAP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Khẩn cấp</span>;
      case 'CAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Cao</span>;
      case 'TRUNG_BINH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">Trung bình</span>;
      case 'THAP':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">Thấp</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Nhiệm vụ & Công việc (Tasks)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi deadline, giao việc cho thành viên và kiểm soát cảnh báo quá hạn thời gian thực (S6-06, S6-09)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/calendar')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            Lịch làm việc
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Giao việc mới
          </button>
        </div>
      </div>

      {/* S6-09 Server-side Overdue Alert Banner */}
      {overdueStats && overdueStats.tongSoViecQuaHan > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                Cảnh báo: Có {overdueStats.tongSoViecQuaHan} công việc đã quá hạn xử lý!
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                Vui lòng kiểm tra và hoàn thành hoặc liên hệ khách hàng để dời hạn deadline.
              </p>
            </div>
          </div>

          <button
            onClick={() => setFilters({ ...filters, chiLayQuaHan: !filters.chiLayQuaHan, page: 1 })}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filters.chiLayQuaHan
                ? 'bg-rose-600 text-white'
                : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
            }`}
          >
            {filters.chiLayQuaHan ? 'Hiển thị tất cả' : 'Lọc chỉ việc quá hạn'}
          </button>
        </div>
      )}

      {/* Overdue Team Breakdown for Team Lead (S6-09) */}
      {isTeamLead && overdueStats && overdueStats.danhSachThanhVien?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" />
              Tổng hợp việc trễ hạn theo nhân viên (Chế độ Trưởng nhóm):
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {overdueStats.danhSachThanhVien.map((mem) => (
              <div
                key={mem.nguoiDungId}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">{mem.hoTen}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                  {mem.soViecQuaHan} việc
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.tuKhoa}
              onChange={(e) => setFilters({ ...filters, tuKhoa: e.target.value })}
              placeholder="Tìm theo tiêu đề nhiệm vụ, nội dung..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.trangThaiCongViec || ''}
              onChange={(e) =>
                setFilters({ ...filters, trangThaiCongViec: e.target.value || undefined, page: 1 })
              }
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="CHUA_HOAN_THANH">Chưa hoàn thành</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
              <option value="HOAN_HUY">Đã hoãn / hủy</option>
            </select>

            <select
              value={filters.mucDoUuTien || ''}
              onChange={(e) =>
                setFilters({ ...filters, mucDoUuTien: e.target.value || undefined, page: 1 })
              }
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">Mọi mức ưu tiên</option>
              <option value="KHAN_CAP">Khẩn cấp</option>
              <option value="CAO">Cao</option>
              <option value="TRUNG_BINH">Trung bình</option>
              <option value="THAP">Thấp</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
              Lọc
            </button>
          </div>
        </form>
      </div>

      {/* Task List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Đang tải danh sách nhiệm vụ...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <CheckSquare className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không có công việc nào</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bạn đã xử lý hết nhiệm vụ hoặc chưa có đầu việc nào được giao
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Xong</th>
                  <th className="py-3 px-4">Tiêu đề nhiệm vụ</th>
                  <th className="py-3 px-4">Hạn hoàn thành (Deadline)</th>
                  <th className="py-3 px-4 text-center">Ưu tiên</th>
                  <th className="py-3 px-4">Khách hàng / Cơ hội</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {tasks.map((task) => {
                  const isDone = task.trangThaiCongViec === 'HOAN_THANH';
                  const isOverdue = task.laQuaHan;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                        isDone ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleComplete(task)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-slate-900 dark:text-slate-100 ${
                              isDone ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.tieuDe}
                          </span>
                          {isOverdue && !isDone && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                              Trễ hạn
                            </span>
                          )}
                        </div>
                        {task.noiDung && (
                          <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5 max-w-sm">
                            {task.noiDung}
                          </p>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 font-mono">
                        {task.hanHoanThanh ? (
                          <div
                            className={
                              isOverdue && !isDone
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-600 dark:text-slate-300'
                            }
                          >
                            <div>{new Date(task.hanHoanThanh).toLocaleDateString('vi-VN')}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(task.hanHoanThanh).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Không đặt hạn</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center">
                        {getPriorityBadge(task.mucDoUuTien)}
                      </td>

                      {/* Customer / Opportunity */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {task.khachHang && (
                          <div
                            onClick={() => navigate(`/customers/${task.khachHangId}`)}
                            className="font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 cursor-pointer flex items-center gap-1 truncate max-w-[160px]"
                          >
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{task.khachHang.tenCongTy}</span>
                          </div>
                        )}
                        {task.coHoi && (
                          <div
                            onClick={() => navigate(`/opportunities/${task.coHoiId}`)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 mt-0.5 truncate max-w-[160px]"
                          >
                            <Target className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{task.coHoi.tenCoHoi}</span>
                          </div>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.nguoiDuocGiao?.hoTen || 'Chưa giao'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id, task.tieuDe)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị {tasks.length} / {total} nhiệm vụ
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-3 py-1.5 font-bold">
                {filters.page} / {totalPages}
              </span>
              <button
                disabled={filters.page === totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingTask(null);
          loadTasks();
          loadOverdueStats();
        }}
        task={editingTask}
      />
    </div>
  );
};

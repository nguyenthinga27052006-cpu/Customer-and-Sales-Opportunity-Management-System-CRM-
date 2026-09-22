import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Plus,
  Search,
  Filter,
  Phone,
  Users,
  Mail,
  FileText,
  Clock,
  Calendar,
  Building,
  Target,
  User,
  Trash2,
  Edit2,
  BarChart2,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { HoatDong, LoaiHoatDong, ThongKeHoatDongItem } from '../types/activity.types';
import { activityService } from '../services/activity.service';
import { ActivityModal } from '../components/activities/ActivityModal';

export const ActivityListPage: React.FC = () => {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<HoatDong[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Statistics state (S8-11)
  const [stats, setStats] = useState<ThongKeHoatDongItem[]>([]);
  const [showStats, setShowStats] = useState(false);

  // Filters
  const [filters, setFilters] = useState<{
    loaiHoatDong?: LoaiHoatDong | string;
    tuKhoa: string;
    page: number;
    limit: number;
  }>({
    loaiHoatDong: undefined,
    tuKhoa: '',
    page: 1,
    limit: 15,
  });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activityService.layDanhSach(filters);
      setActivities(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải danh sách hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await activityService.thongKeHoatDong();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê hoạt động:', err);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [filters.page, filters.loaiHoatDong]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    loadActivities();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hoạt động "${title}"?`)) return;
    try {
      await activityService.xoa(id);
      loadActivities();
      loadStats();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi xóa hoạt động');
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'GOI_DIEN':
      case 'CUOC_GOI':
        return {
          label: 'Cuộc gọi',
          icon: Phone,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'GAP_MAT':
      case 'CUOC_GAP':
        return {
          label: 'Cuộc gặp',
          icon: Users,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'EMAIL':
        return {
          label: 'Email',
          icon: Mail,
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'GHI_CHU':
      default:
        return {
          label: 'Ghi chú',
          icon: FileText,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Nhật ký Hoạt động tương tác (Activities)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận mọi cuộc gọi, cuộc gặp, email trao đổi và ghi chú bán hàng với khách hàng (S6-05)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border shadow-xs transition flex items-center gap-1.5 ${
              showStats
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            {showStats ? 'Ẩn thống kê' : 'Thống kê thành viên (S8-11)'}
          </button>

          <button
            onClick={() => navigate('/calendar')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            Xem Lịch
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Ghi hoạt động mới
          </button>
        </div>
      </div>

      {/* Statistics Section (S8-11) */}
      {showStats && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Thống kê tần suất hoạt động theo nhân viên
            </h3>
            <span className="text-xs text-slate-400">Tổng số thành viên: {stats.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((item) => (
              <div
                key={item.nguoiDungId}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                    {item.hoTen}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {item.tongSo} hoạt động
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center text-[11px] pt-1">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg">
                    <Phone className="w-3 h-3 mx-auto text-emerald-600 mb-0.5" />
                    <span className="font-bold text-emerald-700">{item.cuocGoi}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg">
                    <Users className="w-3 h-3 mx-auto text-blue-600 mb-0.5" />
                    <span className="font-bold text-blue-700">{item.cuocGap}</span>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-lg">
                    <Mail className="w-3 h-3 mx-auto text-indigo-600 mb-0.5" />
                    <span className="font-bold text-indigo-700">{item.email}</span>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg">
                    <FileText className="w-3 h-3 mx-auto text-amber-600 mb-0.5" />
                    <span className="font-bold text-amber-700">{item.ghiChu}</span>
                  </div>
                </div>
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
              placeholder="Tìm theo tiêu đề, nội dung, khách hàng..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filters.loaiHoatDong || ''}
              onChange={(e) =>
                setFilters({ ...filters, loaiHoatDong: e.target.value || undefined, page: 1 })
              }
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả loại hoạt động</option>
              <option value="GOI_DIEN">Cuộc gọi</option>
              <option value="GAP_MAT">Cuộc gặp</option>
              <option value="EMAIL">Email</option>
              <option value="GHI_CHU">Ghi chú</option>
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

      {/* Activities Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Đang tải danh sách hoạt động...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs">{error}</div>
        ) : activities.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Không có hoạt động nào được ghi nhận
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hãy ghi lại cuộc gọi, cuộc gặp hoặc email trao đổi với khách hàng
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Loại & Tiêu đề</th>
                  <th className="py-3 px-4">Khách hàng / Cơ hội</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Địa điểm / Chi tiết</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {activities.map((act) => {
                  const cfg = getActivityBadge(act.loaiHoatDong);
                  const Icon = cfg.icon;

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${cfg.className}`}
                            title={cfg.label}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {act.tieuDe}
                            </div>
                            {act.noiDung && (
                              <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5 max-w-sm">
                                {act.noiDung}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {act.khachHang && (
                          <div
                            onClick={() => navigate(`/customers/${act.khachHangId}`)}
                            className="font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 cursor-pointer flex items-center gap-1 truncate max-w-[170px]"
                          >
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{act.khachHang.tenCongTy}</span>
                          </div>
                        )}
                        {act.coHoi && (
                          <div
                            onClick={() => navigate(`/opportunities/${act.coHoiId}`)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 mt-0.5 truncate max-w-[170px]"
                          >
                            <Target className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{act.coHoi.tenCoHoi}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        <div>{new Date(act.thoiGian).toLocaleDateString('vi-VN')}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(act.thoiGian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {act.thoiLuongPhut ? ` (${act.thoiLuongPhut}p)` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {act.diaDiem ? (
                          <span className="truncate max-w-[150px] inline-block">{act.diaDiem}</span>
                        ) : act.ketQua ? (
                          <span className="text-emerald-600 text-[11px] truncate max-w-[150px] inline-block">
                            Kết quả: {act.ketQua}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.nguoiThucHien?.hoTen || 'Hệ thống'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDelete(act.id, act.tieuDe)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Xóa hoạt động"
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
              Hiển thị {activities.length} / {total} hoạt động
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

      {/* Activity Modal */}
      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadActivities();
          loadStats();
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  AlertTriangle,
  ChevronRight,
  User,
  Building,
  TrendingUp,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { CoHoi, FilterCoHoiParams, GiaiDoanPipeline, TrangThaiCoHoi } from '../types/opportunity.types';
import { opportunityService } from '../services/opportunity.service';
import { OpportunityModal } from '../components/opportunities/OpportunityModal';
import { OpportunityCloseModal } from '../components/opportunities/OpportunityCloseModal';

export const OpportunityListPage: React.FC = () => {
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<CoHoi[]>([]);
  const [stages, setStages] = useState<GiaiDoanPipeline[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterCoHoiParams>({
    tuKhoa: '',
    giaiDoanId: undefined,
    trangThai: undefined,
    laDinhTre: undefined,
    page: 1,
    limit: 15,
  });

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<CoHoi | null>(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closingOpportunity, setClosingOpportunity] = useState<CoHoi | null>(null);
  const [closeMode, setCloseMode] = useState<'WON' | 'LOST'>('WON');
  const [runningStalledCheck, setRunningStalledCheck] = useState(false);

  // User role check
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const canManage = userRoles.some((r) => ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(r));

  const loadStages = async () => {
    try {
      const data = await opportunityService.layDanhSachGiaiDoan();
      setStages(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách giai đoạn:', err);
    }
  };

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await opportunityService.layDanhSach(filters);
      setOpportunities(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải danh sách cơ hội');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [filters.page, filters.giaiDoanId, filters.trangThai, filters.laDinhTre]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    loadOpportunities();
  };

  const handleRunStalledCheck = async () => {
    try {
      setRunningStalledCheck(true);
      const res = await opportunityService.kiemTraDinhTre();
      alert(`Đã kiểm tra xong: Cập nhật ${res.soLuongDinhTre} cơ hội đình trệ.`);
      loadOpportunities();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi quét cơ hội đình trệ');
    } finally {
      setRunningStalledCheck(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cơ hội "${name}"?`)) return;
    try {
      await opportunityService.xoaCoHoi(id);
      loadOpportunities();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi xóa cơ hội');
    }
  };

  const formatVND = (val?: number | null) => {
    if (val === undefined || val === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: TrangThaiCoHoi) => {
    switch (status) {
      case 'DONG_THANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Thắng (Won)
          </span>
        );
      case 'DONG_THUA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Thua (Lost)
          </span>
        );
      case 'DANG_XU_LY':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Đang xử lý
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Quản lý Cơ hội bán hàng (Opportunities)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi phễu bán hàng, quy trình chốt hợp đồng, dự báo doanh thu và cảnh báo đình trệ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/opportunities/kanban')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Kanban className="w-4 h-4 text-blue-600" />
            Xem Kanban
          </button>

          <button
            onClick={() => navigate('/forecast')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Dự báo doanh số
          </button>

          {canManage && (
            <button
              onClick={handleRunStalledCheck}
              disabled={runningStalledCheck}
              className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl shadow-xs transition flex items-center gap-1.5"
              title="Quét các cơ hội không có hoạt động quá số ngày quy định"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningStalledCheck ? 'animate-spin' : ''}`} />
              Quét đình trệ
            </button>
          )}

          <button
            onClick={() => {
              setEditingOpportunity(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm cơ hội mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.tuKhoa}
              onChange={(e) => setFilters({ ...filters, tuKhoa: e.target.value })}
              placeholder="Tìm theo tên cơ hội, mã cơ hội, tên khách hàng..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={filters.giaiDoanId || ''}
              onChange={(e) => setFilters({ ...filters, giaiDoanId: e.target.value || undefined, page: 1 })}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả giai đoạn</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.tenGiaiDoan} ({st.xacSuatThang}%)
                </option>
              ))}
            </select>

            <select
              value={filters.trangThai || ''}
              onChange={(e) =>
                setFilters({ ...filters, trangThai: (e.target.value as TrangThaiCoHoi) || undefined, page: 1 })
              }
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DANG_XU_LY">Đang xử lý</option>
              <option value="DONG_THANG">Thắng (Won)</option>
              <option value="DONG_THUA">Thua (Lost)</option>
            </select>

            <select
              value={filters.laDinhTre === undefined ? '' : filters.laDinhTre ? 'true' : 'false'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  laDinhTre: e.target.value === '' ? undefined : e.target.value === 'true',
                  page: 1,
                })
              }
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">Tất cả tiến độ</option>
              <option value="true">⚠️ Bị đình trệ</option>
              <option value="false">Bình thường</option>
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

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Đang tải danh sách cơ hội...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs">
            {error}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy cơ hội bán hàng nào</h3>
            <p className="text-xs text-slate-500 mt-1">Hãy tạo cơ hội mới để bắt đầu theo dõi đường ống bán hàng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã & Tên cơ hội</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Giai đoạn</th>
                  <th className="py-3 px-4 text-right">Giá trị dự kiến</th>
                  <th className="py-3 px-4 text-center">Xác suất</th>
                  <th className="py-3 px-4 text-right">Dự báo trọng số</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Người phụ trách</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {opp.laDinhTre && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded border border-amber-300"
                            title="Cơ hội bị đình trệ: Không có hoạt động trong thời gian quy định"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Đình trệ
                          </span>
                        )}
                        <div>
                          <div className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            {opp.tenCoHoi}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {opp.maCoHoi}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-[160px]">{opp.khachHang.tenCongTy}</span>
                      </div>
                      {opp.nguoiLienHe && (
                        <div className="text-[11px] text-slate-400 ml-5 truncate max-w-[150px]">
                          {opp.nguoiLienHe.hoTen}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {opp.giaiDoan.tenGiaiDoan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100">
                      {formatVND(opp.giaTriDuKien)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {opp.xacSuat}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatVND(opp.duBaoGiaTri)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(opp.trangThai)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.nguoiSoHuu.hoTen}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/opportunities/${opp.id}`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {opp.trangThai === 'DANG_XU_LY' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingOpportunity(opp);
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setClosingOpportunity(opp);
                                setCloseMode('WON');
                                setCloseModalOpen(true);
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Chốt Thắng (Won)"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setClosingOpportunity(opp);
                                setCloseMode('LOST');
                                setCloseModalOpen(true);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Đóng Thua (Lost)"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(opp.id, opp.tenCoHoi)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Xóa cơ hội"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị {opportunities.length} / {total} cơ hội
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-3 py-1.5 font-bold">
                {filters.page} / {totalPages}
              </span>
              <button
                disabled={filters.page === totalPages}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Modal (Create / Edit) */}
      <OpportunityModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingOpportunity(null);
        }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingOpportunity(null);
          loadOpportunities();
        }}
        opportunity={editingOpportunity}
      />

      {/* Close Modal (Won / Lost) */}
      {closingOpportunity && (
        <OpportunityCloseModal
          isOpen={closeModalOpen}
          onClose={() => {
            setCloseModalOpen(false);
            setClosingOpportunity(null);
          }}
          onSuccess={() => {
            setCloseModalOpen(false);
            setClosingOpportunity(null);
            loadOpportunities();
          }}
          opportunity={closingOpportunity}
          defaultMode={closeMode}
        />
      )}
    </div>
  );
};

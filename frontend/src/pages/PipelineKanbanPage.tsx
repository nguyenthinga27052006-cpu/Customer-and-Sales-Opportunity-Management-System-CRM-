import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  ListFilter,
  Plus,
  TrendingUp,
  RefreshCw,
  Search,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { KanbanData } from '../types/opportunity.types';
import { opportunityService } from '../services/opportunity.service';
import { KanbanColumn } from '../components/opportunities/KanbanColumn';
import { OpportunityModal } from '../components/opportunities/OpportunityModal';

export const PipelineKanbanPage: React.FC = () => {
  const navigate = useNavigate();

  const [kanbanData, setKanbanData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Override dialog state for S5-04
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    opportunityId: string;
    targetStageId: string;
    errorMessage: string;
    reason: string;
  }>({
    isOpen: false,
    opportunityId: '',
    targetStageId: '',
    errorMessage: '',
    reason: '',
  });

  // User role check
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const canOverride = userRoles.some((r) => ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(r));

  const loadKanban = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunityService.layDuLieuKanban();
      setKanbanData(data);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải bảng Kanban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKanban();
  }, []);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('opportunityId', cardId);
  };

  const handleDrop = async (opportunityId: string, targetStageId: string) => {
    try {
      await opportunityService.chuyenGiaiDoan(opportunityId, {
        giaiDoanId: targetStageId,
      });
      // Refresh kanban
      await loadKanban();
    } catch (err: any) {
      const errMsg = err.userFriendlyMessage || err.message || 'Không thể chuyển giai đoạn';
      // If error mentions mandatory condition and user can override
      if (canOverride && (errMsg.includes('Điều kiện bắt buộc') || errMsg.includes('hoạt động') || errMsg.includes('cuộc gặp'))) {
        setOverrideModal({
          isOpen: true,
          opportunityId,
          targetStageId,
          errorMessage: errMsg,
          reason: '',
        });
      } else {
        alert(errMsg);
      }
    }
  };

  const handleConfirmOverride = async () => {
    if (!overrideModal.reason.trim()) {
      alert('Vui lòng nhập lý do ghi đè quy trình!');
      return;
    }
    try {
      await opportunityService.chuyenGiaiDoan(overrideModal.opportunityId, {
        giaiDoanId: overrideModal.targetStageId,
        ghiDeDieuKien: true,
        lyDoChuyen: `[GHI ĐÈ BỞI QUẢN LÝ]: ${overrideModal.reason}`,
      });
      setOverrideModal({ isOpen: false, opportunityId: '', targetStageId: '', errorMessage: '', reason: '' });
      await loadKanban();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi ghi đè chuyển giai đoạn');
    }
  };

  const formatVND = (val?: number | null) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Filter columns and cards by search query
  const filteredColumns = kanbanData?.columns.map((col) => {
    if (!searchQuery.trim()) return col;
    const q = searchQuery.toLowerCase();
    const filteredCards = col.coHoi.filter(
      (c) =>
        c.tenCoHoi.toLowerCase().includes(q) ||
        c.maCoHoi.toLowerCase().includes(q) ||
        c.khachHang.tenCongTy.toLowerCase().includes(q) ||
        c.nguoiSoHuu.hoTen.toLowerCase().includes(q)
    );
    return {
      ...col,
      soLuong: filteredCards.length,
      tongGiaTri: filteredCards.reduce((acc, c) => acc + (c.giaTriDuKien || 0), 0),
      coHoi: filteredCards,
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Đường ống bán hàng (Pipeline Kanban)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{kanbanData?.tongSoCoHoi || 0}</strong> cơ hội | Tổng giá trị:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {formatVND(kanbanData?.tongGiaTriPipeline)}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc thẻ trên bảng..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48"
            />
          </div>

          <button
            onClick={() => navigate('/opportunities')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            Xem dạng bảng
          </button>

          <button
            onClick={loadKanban}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Tải lại bảng"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo cơ hội
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col">
        {loading && !kanbanData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Đang tải bảng Kanban phễu bán hàng...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-500 text-xs">
            {error}
          </div>
        ) : (
          <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-2">
            {filteredColumns && filteredColumns.length > 0 ? (
              filteredColumns.map((col) => (
                <KanbanColumn
                  key={col.giaiDoan.id}
                  column={col}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                />
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Chưa có cấu hình giai đoạn Pipeline nào
              </div>
            )}
          </div>
        )}
      </div>

      {/* Override Dialog Modal */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-2.5 text-amber-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ghi đè điều kiện giai đoạn (Manager Override)
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Cảnh báo quy trình bắt buộc:</p>
              <p>{overrideModal.errorMessage}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lý do cho phép nhảy giai đoạn (Bắt buộc):
              </label>
              <textarea
                value={overrideModal.reason}
                onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                placeholder="Nhập lý do đặc cách hoặc chỉ đạo quản lý..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideModal({ isOpen: false, opportunityId: '', targetStageId: '', errorMessage: '', reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs"
              >
                Xác nhận ghi đè
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Opportunity Modal */}
      <OpportunityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadKanban();
        }}
      />
    </div>
  );
};

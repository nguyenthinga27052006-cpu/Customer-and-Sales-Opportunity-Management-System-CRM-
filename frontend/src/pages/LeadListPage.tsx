import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead, FilterLeadParams, TrangThaiLead, PhanLoaiLead } from '../types/lead.types';
import { leadService } from '../services/lead.service';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadImportModal } from '../components/leads/LeadImportModal';
import { LeadRejectModal } from '../components/leads/LeadRejectModal';
import { LeadConvertModal } from '../components/leads/LeadConvertModal';

export const LeadListPage: React.FC = () => {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterLeadParams>({
    tuKhoa: '',
    trangThai: undefined,
    phanLoai: undefined,
    nguonLead: '',
    trongHangDoi: false,
    quaHanSla: undefined,
    page: 1,
    limit: 10,
  });

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Reject / Convert modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetLead, setRejectTargetLead] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertTargetLead, setConvertTargetLead] = useState<Lead | null>(null);

  // Current user info
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const canManageRules = userRoles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r));

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadService.layDanhSach(filters);
      setLeads(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải danh sách Lead');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filters.page, filters.trangThai, filters.phanLoai, filters.trongHangDoi, filters.quaHanSla]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    loadLeads();
  };

  const handleAccept = async (lead: Lead) => {
    try {
      await leadService.tiepNhanLead(lead.id);
      loadLeads();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi tiếp nhận Lead');
    }
  };

  const getTemperatureBadge = (temperature: PhanLoaiLead, score: number) => {
    switch (temperature) {
      case 'NONG':
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-xs font-black flex items-center gap-1 shadow-sm w-fit">
            <span>🔥 NÓNG</span>
            <span className="text-[11px] font-mono opacity-80">({score}đ)</span>
          </span>
        );
      case 'AM':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <span>☀️ ẤM</span>
            <span className="text-[11px] font-mono opacity-80">({score}đ)</span>
          </span>
        );
      case 'LANH':
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
            <span>❄️ LẠNH</span>
            <span className="text-[11px] font-mono opacity-70">({score}đ)</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: TrangThaiLead, quaHanSla: boolean) => {
    if (quaHanSla && status === 'CHO_TIEP_NHAN') {
      return (
        <span className="px-2.5 py-1 bg-red-500 text-white font-extrabold rounded-full text-[11px] animate-pulse flex items-center gap-1 shadow-sm">
          <span>⚠️</span> QUÁ HẠN SLA
        </span>
      );
    }

    switch (status) {
      case 'MOI':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">Mới</span>;
      case 'CHO_TIEP_NHAN':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">Chờ tiếp nhận</span>;
      case 'DANG_CHAM_SOC':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">Đang chăm sóc</span>;
      case 'DA_CHUYEN_DOI':
        return <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">✓ Đã chuyển đổi</span>;
      case 'TU_CHOI':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium">Đã từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lead Tiềm Năng & Phân Bổ (EP-04)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình khép kín: Tạo Lead → Chấm điểm tự động → Phân bổ SLA → Tiếp nhận → Chuyển đổi Khách hàng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManageRules && (
            <button
              onClick={() => navigate('/leads-config')}
              className="px-3.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>⚙️</span> Cấu hình Rules
            </button>
          )}

          <button
            onClick={() => navigate('/leads-webform')}
            className="px-3.5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>🌐</span> Mã nhúng Web Form
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>📥</span> Nhập Excel
          </button>

          <button
            onClick={() => { setEditingLead(null); setModalOpen(true); }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Tạo Lead mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.tuKhoa}
              onChange={(e) => setFilters({ ...filters, tuKhoa: e.target.value })}
              placeholder="Tìm theo họ tên, email, SĐT, công ty hoặc mã LEAD..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filters.phanLoai || ''}
              onChange={(e) => setFilters({ ...filters, phanLoai: (e.target.value as any) || undefined, page: 1 })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="">Tất cả nhiệt độ</option>
              <option value="NONG">🔥 Nóng (&gt;= 50đ)</option>
              <option value="AM">☀️ Ấm (&gt;= 25đ)</option>
              <option value="LANH">❄️ Lạnh (&lt; 25đ)</option>
            </select>

            <select
              value={filters.trangThai || ''}
              onChange={(e) => setFilters({ ...filters, trangThai: (e.target.value as any) || undefined, page: 1 })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="MOI">Mới</option>
              <option value="CHO_TIEP_NHAN">Chờ tiếp nhận</option>
              <option value="DANG_CHAM_SOC">Đang chăm sóc</option>
              <option value="DA_CHUYEN_DOI">Đã chuyển đổi</option>
              <option value="TU_CHOI">Đã từ chối</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.trongHangDoi}
                onChange={(e) => setFilters({ ...filters, trongHangDoi: e.target.checked, page: 1 })}
                className="w-3.5 h-3.5 rounded text-blue-600"
              />
              <span>Hàng đợi (Queue)</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2 bg-red-50/60 border border-red-200 rounded-xl text-xs font-semibold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.quaHanSla === true}
                onChange={(e) => setFilters({ ...filters, quaHanSla: e.target.checked ? true : undefined, page: 1 })}
                className="w-3.5 h-3.5 rounded text-red-600"
              />
              <span>Quá hạn SLA ⚠️</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Lọc
            </button>
          </div>
        </form>
      </div>

      {/* Main Lead Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
            <p>Đang tải danh sách Lead...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50/50">
            <p className="text-xs font-semibold">⚠️ {error}</p>
            <button onClick={loadLeads} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs">Thử lại</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl mb-2 block">🎯</span>
            <h4 className="text-base font-bold text-slate-800">Không tìm thấy Lead nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không có dữ liệu phù hợp với điều kiện tìm kiếm hoặc hàng đợi đang trống.
            </p>
            <button
              onClick={() => { setEditingLead(null); setModalOpen(true); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              + Tạo Lead mới ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Khách hàng / Mã Lead</th>
                  <th className="py-3.5 px-4">Nhiệt độ & Điểm</th>
                  <th className="py-3.5 px-4">Nguồn Lead</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Người phụ trách</th>
                  <th className="py-3.5 px-4">Thời hạn SLA</th>
                  <th className="py-3.5 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/leads/${l.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {l.hoTen}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {l.congTy ? `${l.congTy} • ` : ''}
                        <span className="font-mono text-slate-400">{l.maLead}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getTemperatureBadge(l.phanLoai, l.diemTiemNang)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {l.nguonLead}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(l.trangThai, l.quaHanSla)}
                    </td>

                    <td className="py-3.5 px-4">
                      {l.nguoiSoHuu ? (
                        <div>
                          <div className="font-medium text-slate-800">{l.nguoiSoHuu.hoTen}</div>
                          <div className="text-[11px] text-slate-400">{l.nhomKinhDoanh?.tenNhom || ''}</div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[10px]">
                          Hàng đợi (Chưa gán)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {l.slaDeadline ? (
                        <div className={`font-mono text-[11px] ${l.quaHanSla ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {new Date(l.slaDeadline).toLocaleString('vi-VN')}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Tiếp nhận cho Sales nếu đang Chờ tiếp nhận */}
                        {l.trangThai === 'CHO_TIEP_NHAN' && (
                          <>
                            <button
                              onClick={() => handleAccept(l)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm"
                              title="Tiếp nhận Lead"
                            >
                              Nhận
                            </button>
                            <button
                              onClick={() => { setRejectTargetLead(l); setRejectModalOpen(true); }}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-semibold"
                              title="Từ chối Lead"
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                        {/* Nút Chuyển đổi thành Khách hàng nếu đang chăm sóc */}
                        {l.trangThai === 'DANG_CHAM_SOC' && (
                          <button
                            onClick={() => { setConvertTargetLead(l); setConvertModalOpen(true); }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm flex items-center gap-1"
                            title="Chuyển đổi sang Khách hàng & Cơ hội"
                          >
                            <span>🚀</span> Chuyển đổi
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/leads/${l.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Xem chi tiết"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Hiển thị <strong>{leads.length}</strong> trên tổng số <strong>{total}</strong> Lead
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 font-medium"
            >
              Trước
            </button>
            <span className="font-semibold text-slate-700">Trang {filters.page} / {totalPages || 1}</span>
            <button
              disabled={filters.page === totalPages || totalPages === 0}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 font-medium"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadLeads}
        lead={editingLead}
      />

      <LeadImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadLeads}
      />

      <LeadRejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSuccess={loadLeads}
        leadId={rejectTargetLead?.id || ''}
        leadName={rejectTargetLead?.hoTen || ''}
      />

      <LeadConvertModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        onSuccess={loadLeads}
        lead={convertTargetLead}
      />
    </div>
  );
};

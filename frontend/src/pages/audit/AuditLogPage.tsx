import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { NhatKyHeThong } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<NhatKyHeThong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination (Story S2-04)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loaiDoiTuong, setLoaiDoiTuong] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  // Selected detail modal
  const [selectedLog, setSelectedLog] = useState<NhatKyHeThong | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/audit-log', {
        params: {
          page,
          limit: 20,
          loaiDoiTuong: loaiDoiTuong || undefined,
          tuNgay: tuNgay || undefined,
          denNgay: denNgay || undefined,
        },
      });
      setLogs(res.data.duLieu);
      setTotalPages(res.data.tongSoTrang || 1);
      setTotal(res.data.tongSo || 0);
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, loaiDoiTuong, tuNgay, denNgay]);

  const targetTypeLabels: Record<string, string> = {
    NGUOI_DUNG: 'Người dùng & Tài khoản',
    VAI_TRO: 'Vai trò & Quyền hạn',
    SAN_PHAM: 'Sản phẩm & Giá niêm yết',
    QUYEN_SO_HUU: 'Bàn giao Quyền sở hữu',
    CHIET_KHAU: 'Chiết khấu & Phê duyệt',
    CHI_TIEU: 'Chỉ tiêu Doanh số (KPI)',
  };

  const actionLabels: Record<string, { label: string; color: string }> = {
    TAO: { label: 'Tạo mới', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SUA: { label: 'Chỉnh sửa', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    XOA: { label: 'Xóa', color: 'bg-red-50 text-red-700 border-red-200' },
    KHOA: { label: 'Khóa tài khoản', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    BAN_GIAO: { label: 'Bàn giao dữ liệu', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
          Nhật ký Thay đổi Dữ liệu Nhạy cảm (Audit Log)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Story [S2-04]: Ghi vết người thực hiện, thời điểm, giá trị trước và sau khi thay đổi chiết khấu, chỉ tiêu, quyền sở hữu dữ liệu hoặc vai trò người dùng.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Loại đối tượng</label>
            <select
              value={loaiDoiTuong}
              onChange={(e) => {
                setLoaiDoiTuong(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
            >
              <option value="">-- Tất cả đối tượng --</option>
              {Object.entries(targetTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => {
                setTuNgay(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => {
                setDenNgay(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Đang tải nhật ký..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="Chưa có bản ghi nhật ký nào"
            description="Mọi thay đổi nhạy cảm trên hệ thống sẽ được tự động ghi lại tại đây."
            icon={History}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Thời điểm</th>
                  <th className="px-5 py-3.5">Người thực hiện</th>
                  <th className="px-5 py-3.5">Đối tượng tác động</th>
                  <th className="px-5 py-3.5">Hành động</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const actionInfo = actionLabels[log.hanhDong] || {
                    label: log.hanhDong,
                    color: 'bg-slate-100 text-slate-700',
                  };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {log.nguoiThucHien?.hoTen || 'Hệ thống'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.nguoiThucHien?.email || ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        {targetTypeLabels[log.loaiDoiTuong] || log.loaiDoiTuong}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${actionInfo.color}`}
                        >
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem so sánh</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-800">{logs.length}</span> /{' '}
            <span className="font-semibold text-slate-800">{total}</span> sự kiện
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Trang {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal showing Before vs After diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Chi tiết Thay đổi: {targetTypeLabels[selectedLog.loaiDoiTuong] || selectedLog.loaiDoiTuong}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thực hiện bởi: {selectedLog.nguoiThucHien?.hoTen || 'Hệ thống'} vào lúc{' '}
                  {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              {/* Giá trị Trước */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-600 mb-2 uppercase tracking-wider text-[11px]">
                  Giá trị Trước khi sửa:
                </h4>
                {selectedLog.giaTriTruoc ? (
                  <pre className="text-[11px] font-mono whitespace-pre-wrap bg-white p-3 rounded-lg border text-slate-700 overflow-x-auto">
                    {JSON.stringify(selectedLog.giaTriTruoc, null, 2)}
                  </pre>
                ) : (
                  <span className="text-slate-400 italic">Không có dữ liệu (Bản ghi mới)</span>
                )}
              </div>

              {/* Giá trị Sau */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2 uppercase tracking-wider text-[11px]">
                  Giá trị Sau khi sửa:
                </h4>
                {selectedLog.giaTriSau ? (
                  <pre className="text-[11px] font-mono whitespace-pre-wrap bg-white p-3 rounded-lg border text-blue-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.giaTriSau, null, 2)}
                  </pre>
                ) : (
                  <span className="text-slate-400 italic">Không có</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

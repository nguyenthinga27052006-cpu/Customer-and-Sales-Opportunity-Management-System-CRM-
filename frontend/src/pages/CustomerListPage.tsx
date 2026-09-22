import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KhachHang, FilterKhachHangParams, TrangThaiKhachHang } from '../types/customer.types';
import { customerService } from '../services/customer.service';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerMergeModal } from '../components/customers/CustomerMergeModal';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterKhachHangParams>({
    tuKhoa: '',
    trangThai: undefined,
    nganhNghe: '',
    quyMo: '',
    page: 1,
    limit: 10,
  });

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<KhachHang | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTargetCustomer, setMergeTargetCustomer] = useState<KhachHang | null>(null);

  // User role check from localStorage
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const canMerge = userRoles.some((r) => ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(r));

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customerService.layDanhSach(filters);
      setCustomers(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [filters.page, filters.trangThai, filters.nganhNghe, filters.quyMo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    loadCustomers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"?`)) return;
    try {
      await customerService.xoaKhachHang(id);
      loadCustomers();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi xóa khách hàng');
    }
  };

  const getStatusBadge = (status: TrangThaiKhachHang) => {
    switch (status) {
      case 'KHACH_HANG':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">Khách hàng chính thức</span>;
      case 'DANG_GIAO_DICH':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">Đang giao dịch</span>;
      case 'TIEM_NANG':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">Tiềm năng</span>;
      case 'NGUNG_HOP_TAC':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">Ngừng hợp tác</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ sơ Khách hàng (Customer)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tập trung toàn bộ doanh nghiệp, mã số thuế, người liên hệ và chế độ Customer 360
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canMerge && (
            <button
              onClick={() => {
                setMergeTargetCustomer(null);
                setMergeModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <span>🔄</span> Gộp khách hàng trùng
            </button>
          )}
          <button
            onClick={() => {
              setEditingCustomer(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <span>+</span> Thêm khách hàng mới
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.tuKhoa}
              onChange={(e) => setFilters({ ...filters, tuKhoa: e.target.value })}
              placeholder="Tìm kiếm theo Tên công ty, Mã KH, Mã số thuế, hoặc SĐT liên hệ..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.trangThai || ''}
              onChange={(e) => setFilters({ ...filters, trangThai: (e.target.value as any) || undefined, page: 1 })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="TIEM_NANG">Tiềm năng</option>
              <option value="DANG_GIAO_DICH">Đang giao dịch</option>
              <option value="KHACH_HANG">Khách hàng chính thức</option>
              <option value="NGUNG_HOP_TAC">Ngừng hợp tác</option>
            </select>

            <select
              value={filters.nganhNghe || ''}
              onChange={(e) => setFilters({ ...filters, nganhNghe: e.target.value, page: 1 })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
            >
              <option value="">Tất cả ngành nghề</option>
              <option value="CONG_NGHE">Công nghệ</option>
              <option value="TAI_CHINH">Tài chính - Ngân hàng</option>
              <option value="Y_TE_DUOC">Y tế - Dược phẩm</option>
              <option value="BAN_LE">Bán lẻ</option>
              <option value="SAN_XUAT">Sản xuất</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Lọc kết quả
            </button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-medium">Đang tải danh sách khách hàng...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50/50">
            <p className="text-sm font-semibold">⚠️ {error}</p>
            <button
              onClick={loadCustomers}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium"
            >
              Thử lại
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl mb-2 block">🏢</span>
            <h4 className="text-base font-bold text-slate-800">Không tìm thấy khách hàng nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không có dữ liệu phù hợp với điều kiện tìm kiếm hoặc bạn chưa được phân quyền phụ trách khách hàng này.
            </p>
            <button
              onClick={() => { setEditingCustomer(null); setModalOpen(true); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              + Tạo khách hàng mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Doanh nghiệp / Mã KH</th>
                  <th className="py-3.5 px-4">Mã số thuế</th>
                  <th className="py-3.5 px-4">Đầu mối chính</th>
                  <th className="py-3.5 px-4">Ngành / Quy mô</th>
                  <th className="py-3.5 px-4">Người sở hữu</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Dữ liệu</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const primaryContact = c.nguoiLienHe?.[0];
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {c.tenCongTy}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {c.maKhachHang} {c.tinhThanh ? `• ${c.tinhThanh}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {c.maSoThue || <span className="text-slate-300 font-sans italic">Chưa có</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        {primaryContact ? (
                          <div>
                            <div className="font-medium text-slate-900">{primaryContact.hoTen}</div>
                            <div className="text-slate-400 text-[11px]">{primaryContact.soDienThoai || primaryContact.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">Chưa có</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{c.nganhNghe || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{c.quyMo || ''}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.nguoiSoHuu?.hoTen || 'Chưa gán'}</div>
                        <div className="text-[11px] text-slate-400">{c.nhomKinhDoanh?.tenNhom || ''}</div>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(c.trangThai)}</td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span title="Số liên hệ">👤 {c._count?.nguoiLienHe || 0}</span>
                          <span title="Số cơ hội">💼 {c._count?.coHoi || 0}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/customers/${c.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem Customer 360"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => {
                              setEditingCustomer(c);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            ✏️
                          </button>
                          {canMerge && (
                            <button
                              onClick={() => {
                                setMergeTargetCustomer(c);
                                setMergeModalOpen(true);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Gộp khách hàng này"
                            >
                              🔄
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(c.id, c.tenCongTy)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa khách hàng"
                          >
                            🗑️
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Hiển thị <strong>{customers.length}</strong> trên tổng số <strong>{total}</strong> khách hàng
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors font-medium"
            >
              Trước
            </button>
            <span className="font-semibold text-slate-700">
              Trang {filters.page} / {totalPages || 1}
            </span>
            <button
              disabled={filters.page === totalPages || totalPages === 0}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors font-medium"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadCustomers}
        customer={editingCustomer}
      />

      <CustomerMergeModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        onSuccess={loadCustomers}
        initialCustomer={mergeTargetCustomer}
      />
    </div>
  );
};

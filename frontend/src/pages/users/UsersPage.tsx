import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { VaiTroEnum } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Phân trang & Tìm kiếm (Story S1-08: Mặc định 20 dòng)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tuKhoa, setTuKhoa] = useState('');
  const [locVaiTro, setLocVaiTro] = useState('');
  const [locTrangThai, setLocTrangThai] = useState('');
  const [locNhom, setLocNhom] = useState('');

  // Modal Thêm người dùng
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    nhomKinhDoanhId: '',
    roleCodes: ['SALES_REP'],
  });
  const [addLoading, setAddLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal Sửa người dùng
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    hoTen: '',
    soDienThoai: '',
    nhomKinhDoanhId: '',
    trangThai: 'HOAT_DONG',
    roleCodes: [] as string[],
  });
  const [editLoading, setEditLoading] = useState(false);

  // Modal Khóa & Bàn giao (Story S1-10)
  const [handoverUser, setHandoverUser] = useState<any>(null);
  const [nguoiTiepNhanId, setNguoiTiepNhanId] = useState('');
  const [lyDoBanGiao, setLyDoBanGiao] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/nguoi-dung', {
        params: {
          page,
          limit: 20, // AC S1-08: mặc định 20 dòng
          tuKhoa: tuKhoa || undefined,
          vaiTro: locVaiTro || undefined,
          trangThai: locTrangThai || undefined,
          nhomKinhDoanhId: locNhom || undefined,
        },
      });
      setUsers(res.data.duLieu);
      setTotalPages(res.data.tongSoTrang || 1);
      setTotal(res.data.tongSo || 0);
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/nhom-kinh-doanh/danh-sach');
      setTeams(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUsers();
  }, [page, locVaiTro, locTrangThai, locNhom]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const allRoles = [
    { code: VaiTroEnum.ADMIN, label: 'Quản trị hệ thống (Admin)' },
    { code: VaiTroEnum.DIRECTOR, label: 'Giám đốc kinh doanh (Director)' },
    { code: VaiTroEnum.TEAM_LEAD, label: 'Trưởng nhóm kinh doanh (Team Lead)' },
    { code: VaiTroEnum.SALES_REP, label: 'Nhân viên kinh doanh (Sales Rep)' },
    { code: VaiTroEnum.MARKETING, label: 'Nhân viên Marketing' },
    { code: VaiTroEnum.CUST_SUCCESS, label: 'Chăm sóc khách hàng (Customer Success)' },
    { code: VaiTroEnum.ACCOUNTANT, label: 'Kế toán (Accountant)' },
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (addForm.roleCodes.includes(VaiTroEnum.TEAM_LEAD) && !addForm.nhomKinhDoanhId) {
      setModalError('Người giữ vai trò Trưởng nhóm (TEAM_LEAD) bắt buộc phải chọn Nhóm kinh doanh');
      return;
    }

    setAddLoading(true);
    try {
      const res = await api.post('/nguoi-dung', addForm);
      setSuccess(res.data.thongDiep);
      setShowAddModal(false);
      setAddForm({
        hoTen: '',
        email: '',
        soDienThoai: '',
        nhomKinhDoanhId: '',
        roleCodes: ['SALES_REP'],
      });
      fetchUsers();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Không thể tạo tài khoản');
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({
      hoTen: u.hoTen,
      soDienThoai: u.soDienThoai || '',
      nhomKinhDoanhId: u.nhomKinhDoanh?.id || '',
      trangThai: u.trangThai,
      roleCodes: u.roles || [],
    });
    setModalError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setEditLoading(true);
    try {
      const res = await api.put(`/nguoi-dung/${editingUser.id}`, editForm);
      setSuccess(res.data.thongDiep);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Cập nhật tài khoản thất bại');
    } finally {
      setEditLoading(false);
    }
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!nguoiTiepNhanId) {
      setModalError('Bắt buộc phải chọn người tiếp nhận bàn giao trước khi khóa');
      return;
    }

    setHandoverLoading(true);
    try {
      const res = await api.post(`/nguoi-dung/${handoverUser.id}/khoa-va-ban-giao`, {
        nguoiTiepNhanId,
        lyDo: lyDoBanGiao,
      });
      setSuccess(res.data.thongDiep);
      setHandoverUser(null);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Khóa tài khoản và bàn giao thất bại');
    } finally {
      setHandoverLoading(false);
    }
  };

  const activeUsersForHandover = users.filter(
    (u) => u.id !== handoverUser?.id && u.trangThai === 'HOAT_DONG',
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Quản trị Người dùng & Tài khoản
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách nhân sự, phân quyền vai trò và phân bổ vào cây tổ chức nhóm kinh doanh.
          </p>
        </div>

        {currentUser?.roles.includes(VaiTroEnum.ADMIN) && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setModalError('');
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản mới</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar (Story S1-08: Tìm theo tên, email; lọc theo vai trò và trạng thái) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo họ tên, email, số điện thoại..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={locVaiTro}
              onChange={(e) => {
                setLocVaiTro(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700"
            >
              <option value="">-- Tất cả vai trò --</option>
              {allRoles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={locTrangThai}
              onChange={(e) => {
                setLocTrangThai(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="HOAT_DONG">Đang hoạt động</option>
              <option value="DA_KHOA">Đã khóa</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={locNhom}
              onChange={(e) => {
                setLocNhom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700"
            >
              <option value="">-- Tất cả nhóm --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tenNhom}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Đang tải danh sách người dùng..." />
        ) : users.length === 0 ? (
          <EmptyState
            title="Không tìm thấy người dùng phù hợp"
            description="Thử thay đổi bộ lọc tìm kiếm hoặc thêm mới tài khoản nhân sự."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Họ tên & Email</th>
                  <th className="px-5 py-3.5">Số điện thoại</th>
                  <th className="px-5 py-3.5">Vai trò (Roles)</th>
                  <th className="px-5 py-3.5">Nhóm kinh doanh</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                          {u.hoTen?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{u.hoTen}</div>
                          <div className="text-slate-400 text-[11px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {u.soDienThoai || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {u.nhomKinhDoanh?.tenNhom || (
                        <span className="text-slate-400 italic">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.trangThai === 'HOAT_DONG' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {currentUser?.roles.includes(VaiTroEnum.ADMIN) && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {u.trangThai === 'HOAT_DONG' && u.id !== currentUser.id && (
                            <button
                              onClick={() => {
                                setHandoverUser(u);
                                setNguoiTiepNhanId('');
                                setLyDoBanGiao('');
                                setModalError('');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Khóa tài khoản và bàn giao dữ liệu"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-800">{users.length}</span> /{' '}
            <span className="font-semibold text-slate-800">{total}</span> tài khoản (Mặc định 20 dòng/trang)
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

      {/* Modal: Thêm người dùng mới (Story S1-08) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Thêm tài khoản người dùng mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={addForm.hoTen}
                  onChange={(e) => setAddForm({ ...addForm, hoTen: e.target.value })}
                  placeholder="Ví dụ: Lê Thị Lan"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email công ty * (Không được trùng)</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="lan.le@crm.vn"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại Việt Nam (10 số)</label>
                <input
                  type="tel"
                  value={addForm.soDienThoai}
                  onChange={(e) => setAddForm({ ...addForm, soDienThoai: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhóm kinh doanh trực thuộc</label>
                <select
                  value={addForm.nhomKinhDoanhId}
                  onChange={(e) => setAddForm({ ...addForm, nhomKinhDoanhId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="">-- Chưa gán nhóm --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tenNhom}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Trưởng nhóm (TEAM_LEAD) bắt buộc phải thuộc một nhóm kinh doanh.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Gán vai trò (Có thể chọn nhiều vai trò - S1-09)</label>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {allRoles.map((r) => {
                    const isChecked = addForm.roleCodes.includes(r.code);
                    return (
                      <label key={r.code} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAddForm({ ...addForm, roleCodes: [...addForm.roleCodes, r.code] });
                            } else {
                              setAddForm({
                                ...addForm,
                                roleCodes: addForm.roleCodes.filter((c) => c !== r.code),
                              });
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">{r.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-800 text-[11px]">
                Mật khẩu tạm thời mặc định cho tài khoản mới là: <strong className="font-mono">Password@123</strong>. Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {addLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa người dùng */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Chỉnh sửa tài khoản: {editingUser.hoTen}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editForm.hoTen}
                  onChange={(e) => setEditForm({ ...editForm, hoTen: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={editForm.soDienThoai}
                  onChange={(e) => setEditForm({ ...editForm, soDienThoai: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhóm kinh doanh</label>
                <select
                  value={editForm.nhomKinhDoanhId}
                  onChange={(e) => setEditForm({ ...editForm, nhomKinhDoanhId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="">-- Chưa gán nhóm --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tenNhom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={editForm.trangThai}
                  onChange={(e) => setEditForm({ ...editForm, trangThai: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="HOAT_DONG">Đang hoạt động</option>
                  <option value="DA_KHOA">Đã khóa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Gán vai trò</label>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {allRoles.map((r) => {
                    const isChecked = editForm.roleCodes.includes(r.code);
                    const isSelfAdmin = editingUser.id === currentUser?.id && r.code === VaiTroEnum.ADMIN;
                    return (
                      <label key={r.code} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isSelfAdmin}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({ ...editForm, roleCodes: [...editForm.roleCodes, r.code] });
                            } else {
                              setEditForm({
                                ...editForm,
                                roleCodes: editForm.roleCodes.filter((c) => c !== r.code),
                              });
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="font-medium text-slate-700">
                          {r.label} {isSelfAdmin && '(Không thể tự thu hồi quyền Admin của chính mình - S1-09)'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Khóa tài khoản & Bàn giao dữ liệu (Story S1-10) */}
      {handoverUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-red-600">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800">Khóa tài khoản & Bàn giao</h3>
              </div>
              <button onClick={() => setHandoverUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Bạn đang thực hiện khóa tài khoản của <strong>{handoverUser.hoTen}</strong>. Theo quy tắc Story S1-10, bạn <strong>bắt buộc phải chỉ định người tiếp nhận</strong> để toàn bộ khách hàng và cơ hội không bị mất chủ sở hữu.
            </p>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleHandoverSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn người tiếp nhận bàn giao *
                </label>
                <select
                  required
                  value={nguoiTiepNhanId}
                  onChange={(e) => setNguoiTiepNhanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none bg-white text-slate-800"
                >
                  <option value="">-- Chọn nhân sự tiếp nhận dữ liệu --</option>
                  {activeUsersForHandover.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.hoTen} ({u.email}) - {u.roles?.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do bàn giao & ghi chú audit log
                </label>
                <textarea
                  rows={2}
                  value={lyDoBanGiao}
                  onChange={(e) => setLyDoBanGiao(e.target.value)}
                  placeholder="Ví dụ: Nhân viên chuyển công tác / nghỉ việc theo thỏa thuận..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={handoverLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 shadow-md shadow-red-500/20"
                >
                  {handoverLoading ? 'Đang xử lý...' : 'Xác nhận Khóa & Bàn giao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Network,
  Plus,
  MapPin,
  User,
  Users,
  ChevronRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { VaiTroEnum, NhomKinhDoanh, KhuVuc } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const OrganizationPage: React.FC = () => {
  const { isDirectorOrAdmin } = useAuth();
  const [treeData, setTreeData] = useState<NhomKinhDoanh[]>([]);
  const [flatTeams, setFlatTeams] = useState<any[]>([]);
  const [regions, setRegions] = useState<KhuVuc[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);

  const [teamForm, setTeamForm] = useState({
    maNhom: '',
    tenNhom: '',
    nhomChaId: '',
    khuVucId: '',
    truongNhomId: '',
  });

  const [regionForm, setRegionForm] = useState({
    maKhuVuc: '',
    tenKhuVuc: '',
    moTa: '',
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [treeRes, flatRes, regRes, usersRes] = await Promise.all([
        api.get('/nhom-kinh-doanh/cay-to-chuc'),
        api.get('/nhom-kinh-doanh/danh-sach'),
        api.get('/nhom-kinh-doanh/khu-vuc'),
        api.get('/nguoi-dung', { params: { limit: 100 } }),
      ]);
      setTreeData(treeRes.data);
      setFlatTeams(flatRes.data);
      setRegions(regRes.data);
      setUsers(usersRes.data.duLieu || []);
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể tải cơ cấu tổ chức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitLoading(true);
    try {
      if (editingTeam) {
        await api.put(`/nhom-kinh-doanh/${editingTeam.id}`, teamForm);
        setSuccess('Cập nhật nhóm kinh doanh thành công');
      } else {
        await api.post('/nhom-kinh-doanh', teamForm);
        setSuccess('Thêm nhóm kinh doanh mới thành công');
      }
      setShowTeamModal(false);
      setEditingTeam(null);
      fetchData();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thao tác nhóm thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitLoading(true);
    try {
      await api.post('/nhom-kinh-doanh/khu-vuc', regionForm);
      setSuccess('Thêm khu vực địa lý mới thành công');
      setShowRegionModal(false);
      setRegionForm({ maKhuVuc: '', tenKhuVuc: '', moTa: '' });
      fetchData();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thêm khu vực thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${name}"?`)) return;
    try {
      const res = await api.delete(`/nhom-kinh-doanh/${id}`);
      setSuccess(res.data.thongDiep);
      fetchData();
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Xóa nhóm thất bại');
    }
  };

  const renderTeamNode = (team: NhomKinhDoanh, level: number = 0) => {
    return (
      <div key={team.id} className="space-y-3">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            level === 0
              ? 'bg-gradient-to-r from-blue-900 to-indigo-950 text-white border-blue-800 shadow-md'
              : 'bg-white text-slate-800 border-slate-200/80 shadow-sm ml-6'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  level === 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm leading-tight">{team.tenNhom}</h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      level === 0 ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {team.maNhom}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                  {/* Khu vực */}
                  <div className={`flex items-center space-x-1 ${level === 0 ? 'text-blue-200' : 'text-slate-500'}`}>
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{team.khuVuc?.tenKhuVuc || 'Toàn quốc'}</span>
                  </div>

                  {/* Trưởng nhóm */}
                  <div className={`flex items-center space-x-1 ${level === 0 ? 'text-blue-200' : 'text-slate-500'}`}>
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Trưởng nhóm: <strong>{team.truongNhom?.hoTen || 'Chưa chỉ định'}</strong>
                    </span>
                  </div>

                  {/* Số lượng thành viên */}
                  <div className={`flex items-center space-x-1 ${level === 0 ? 'text-blue-200' : 'text-slate-500'}`}>
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{team.soLuongThanhVien || team.thanhVien?.length || 0} nhân sự</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions for Director / Admin */}
            {isDirectorOrAdmin() && (
              <div className="flex items-center space-x-1 self-end sm:self-center">
                <button
                  onClick={() => {
                    setEditingTeam(team);
                    setTeamForm({
                      maNhom: team.maNhom,
                      tenNhom: team.tenNhom,
                      nhomChaId: team.nhomChaId || '',
                      khuVucId: team.khuVucId || '',
                      truongNhomId: team.truongNhomId || '',
                    });
                    setShowTeamModal(true);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    level === 0 ? 'hover:bg-blue-800 text-blue-200' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  title="Chỉnh sửa nhóm"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {level > 0 && (
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.tenNhom)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      level === 0 ? 'hover:bg-red-800 text-red-200' : 'hover:bg-red-50 text-red-500'
                    }`}
                    title="Xóa nhóm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members list if present */}
          {team.thanhVien && team.thanhVien.length > 0 && (
            <div className={`mt-3 pt-3 border-t text-xs ${level === 0 ? 'border-blue-800/80 text-blue-100' : 'border-slate-100 text-slate-600'}`}>
              <div className="font-semibold text-[11px] uppercase tracking-wider mb-1 opacity-70">
                Thành viên trực thuộc:
              </div>
              <div className="flex flex-wrap gap-2">
                {team.thanhVien.map((m: any) => (
                  <span
                    key={m.id}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 ${
                      level === 0 ? 'bg-blue-800/70 text-white' : 'bg-slate-50 text-slate-700 border border-slate-200/60'
                    }`}
                  >
                    <span>{m.hoTen}</span>
                    <span className="text-[10px] opacity-60">({m.vaiTro?.[0]?.vaiTro?.maVaiTro || 'SALES'})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Render child teams recursively */}
        {team.nhomCon && team.nhomCon.length > 0 && (
          <div className="space-y-3 pl-3 border-l-2 border-slate-200 ml-4">
            {team.nhomCon.map((child) => renderTeamNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Cơ cấu Tổ chức & Cây Nhóm Kinh Doanh
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Story [S2-06]: Sơ đồ cây phân cấp quyết định phạm vi dữ liệu (Data Scope) mà Trưởng nhóm và nhân viên nhìn thấy.
          </p>
        </div>

        {isDirectorOrAdmin() && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowRegionModal(true);
                setModalError('');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Thêm khu vực</span>
            </button>
            <button
              onClick={() => {
                setEditingTeam(null);
                setTeamForm({
                  maNhom: '',
                  tenNhom: '',
                  nhomChaId: '',
                  khuVucId: '',
                  truongNhomId: '',
                });
                setShowTeamModal(true);
                setModalError('');
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhóm kinh doanh</span>
            </button>
          </div>
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

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Regions Quick Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Khu vực địa lý đã khai báo:
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {regions.map((reg) => (
            <div
              key={reg.id}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-semibold text-slate-700">{reg.tenKhuVuc}</span>
              <span className="text-[10px] text-slate-400 font-mono">({reg.maKhuVuc})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Tree */}
      <div className="space-y-4">
        {loading ? (
          <LoadingSpinner text="Đang tải sơ đồ cơ cấu tổ chức..." />
        ) : treeData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            Chưa có nhóm kinh doanh nào được thiết lập.
          </div>
        ) : (
          treeData.map((rootTeam) => renderTeamNode(rootTeam, 0))
        )}
      </div>

      {/* Modal: Thêm / Sửa Nhóm kinh doanh */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingTeam ? 'Chỉnh sửa nhóm kinh doanh' : 'Thêm nhóm kinh doanh mới'}
              </h3>
              <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-3.5 mt-4 text-xs">
              {!editingTeam && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã định danh nhóm *</label>
                  <input
                    type="text"
                    required
                    value={teamForm.maNhom}
                    onChange={(e) => setTeamForm({ ...teamForm, maNhom: e.target.value.toUpperCase() })}
                    placeholder="Ví dụ: TEAM_DN"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên nhóm kinh doanh *</label>
                <input
                  type="text"
                  required
                  value={teamForm.tenNhom}
                  onChange={(e) => setTeamForm({ ...teamForm, tenNhom: e.target.value })}
                  placeholder="Ví dụ: Phòng Kinh Doanh Đà Nẵng"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhóm cha (phân cấp cây)</label>
                <select
                  value={teamForm.nhomChaId}
                  onChange={(e) => setTeamForm({ ...teamForm, nhomChaId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="">-- Là nhóm gốc cao nhất (Khối kinh doanh) --</option>
                  {flatTeams
                    .filter((t) => !editingTeam || t.id !== editingTeam.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tenNhom} ({t.maNhom})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khu vực địa lý</label>
                <select
                  value={teamForm.khuVucId}
                  onChange={(e) => setTeamForm({ ...teamForm, khuVucId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="">-- Chưa gắn khu vực --</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.tenKhuVuc} ({reg.maKhuVuc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ định Trưởng nhóm (Team Lead)</label>
                <select
                  value={teamForm.truongNhomId}
                  onChange={(e) => setTeamForm({ ...teamForm, truongNhomId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.hoTen} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {submitLoading ? 'Đang lưu...' : editingTeam ? 'Cập nhật nhóm' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Khu vực địa lý */}
      {showRegionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Thêm khu vực địa lý mới</h3>
              <button onClick={() => setShowRegionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRegion} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã khu vực *</label>
                <input
                  type="text"
                  required
                  value={regionForm.maKhuVuc}
                  onChange={(e) => setRegionForm({ ...regionForm, maKhuVuc: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: KV_TN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên khu vực *</label>
                <input
                  type="text"
                  required
                  value={regionForm.tenKhuVuc}
                  onChange={(e) => setRegionForm({ ...regionForm, tenKhuVuc: e.target.value })}
                  placeholder="Ví dụ: Tây Nguyên"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={regionForm.moTa}
                  onChange={(e) => setRegionForm({ ...regionForm, moTa: e.target.value })}
                  placeholder="Ví dụ: Lâm Đồng, Đắk Lắk, Gia Lai..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {submitLoading ? 'Đang thêm...' : 'Lưu khu vực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

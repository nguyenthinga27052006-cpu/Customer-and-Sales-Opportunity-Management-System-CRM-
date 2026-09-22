import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { SanPham, VaiTroEnum } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const ProductsPage: React.FC = () => {
  const { isDirectorOrAdmin } = useAuth();
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [tuKhoa, setTuKhoa] = useState('');
  const [loaiSanPham, setLoaiSanPham] = useState('');
  const [trangThai, setTrangThai] = useState('');

  // Modal Thêm / Sửa
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SanPham | null>(null);
  const [form, setForm] = useState({
    maSanPham: '',
    tenSanPham: '',
    loaiSanPham: 'THUE_BAO' as 'MOT_LAN' | 'THUE_BAO',
    donViTinh: 'User / Tháng',
    giaNiemYet: 0,
    giaSan: 0,
    giaVon: 0,
    moTa: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/san-pham', {
        params: {
          tuKhoa: tuKhoa || undefined,
          loaiSanPham: loaiSanPham || undefined,
          trangThai: trangThai || undefined,
        },
      });
      setProducts(res.data);
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [loaiSanPham, trangThai]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      maSanPham: '',
      tenSanPham: '',
      loaiSanPham: 'THUE_BAO',
      donViTinh: 'User / Tháng',
      giaNiemYet: 100000,
      giaSan: 80000,
      giaVon: 40000,
      moTa: '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: SanPham) => {
    setEditingProduct(p);
    setForm({
      maSanPham: p.maSanPham,
      tenSanPham: p.tenSanPham,
      loaiSanPham: p.loaiSanPham,
      donViTinh: p.donViTinh,
      giaNiemYet: Number(p.giaNiemYet),
      giaSan: Number(p.giaSan),
      giaVon: p.giaVon !== undefined ? Number(p.giaVon) : 0,
      moTa: p.moTa || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (form.giaSan > form.giaNiemYet) {
      setModalError('Giá sàn (ngưỡng duyệt chiết khấu) không được lớn hơn Giá niêm yết');
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingProduct) {
        await api.put(`/san-pham/${editingProduct.id}`, form);
        setSuccess('Cập nhật sản phẩm & bảng giá thành công');
      } else {
        await api.post('/san-pham', form);
        setSuccess('Thêm sản phẩm mới vào danh mục chuẩn thành công');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thao tác sản phẩm thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDiscontinue = async (p: SanPham) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển sản phẩm "${p.tenSanPham}" sang trạng thái Ngừng kinh doanh?`)) return;
    try {
      const res = await api.delete(`/san-pham/${p.id}`);
      setSuccess(res.data.thongDiep);
      fetchProducts();
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể ngừng kinh doanh sản phẩm');
    }
  };

  const formatVND = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Danh mục Sản phẩm & Bảng giá Niêm yết
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Story [S2-05]: Bảng giá chuẩn phục vụ việc lập Báo giá và kiểm soát ngưỡng chiết khấu tự động.
          </p>
        </div>

        {isDirectorOrAdmin() && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm mới</span>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo mã hoặc tên sản phẩm..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <select
              value={loaiSanPham}
              onChange={(e) => setLoaiSanPham(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700"
            >
              <option value="">-- Tất cả hình thức --</option>
              <option value="THUE_BAO">Thuê bao định kỳ</option>
              <option value="MOT_LAN">Một lần</option>
            </select>
          </div>

          <div>
            <select
              value={trangThai}
              onChange={(e) => setTrangThai(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="DANG_KINH_DOANH">Đang kinh doanh</option>
              <option value="NGUNG_KINH_DOANH">Ngừng kinh doanh</option>
            </select>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Đang tải danh mục sản phẩm..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="Chưa có sản phẩm nào"
            description="Bắt đầu khai báo danh mục sản phẩm và bảng giá niêm yết để nhân viên kinh doanh có thể tạo báo giá."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Mã & Tên sản phẩm</th>
                  <th className="px-5 py-3.5">Loại hình</th>
                  <th className="px-5 py-3.5">Đơn vị tính</th>
                  <th className="px-5 py-3.5 text-right">Giá niêm yết</th>
                  <th className="px-5 py-3.5 text-right">Giá sàn (Tối thiểu)</th>
                  {isDirectorOrAdmin() && (
                    <th className="px-5 py-3.5 text-right bg-amber-50/50 text-amber-900">
                      Giá vốn (Bảo mật)
                    </th>
                  )}
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="font-bold text-slate-800">{p.tenSanPham}</div>
                        <div className="text-[11px] font-mono text-blue-600">{p.maSanPham}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {p.loaiSanPham === 'THUE_BAO' ? 'Thuê bao' : 'Một lần'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.donViTinh}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                      {formatVND(Number(p.giaNiemYet))}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-rose-600">
                      {formatVND(Number(p.giaSan))}
                    </td>
                    {isDirectorOrAdmin() && (
                      <td className="px-5 py-3.5 text-right font-semibold text-amber-700 bg-amber-50/30">
                        {p.giaVon !== undefined ? (
                          formatVND(Number(p.giaVon))
                        ) : (
                          <span className="text-slate-400 italic">Ẩn</span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      {p.trangThai === 'DANG_KINH_DOANH' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang kinh doanh
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Ngừng kinh doanh
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {isDirectorOrAdmin() && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Sửa sản phẩm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {p.trangThai === 'DANG_KINH_DOANH' && (
                            <button
                              onClick={() => handleDiscontinue(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              title="Ngừng kinh doanh an toàn"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Modal: Thêm / Sửa Sản phẩm */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingProduct ? 'Chỉnh sửa sản phẩm & bảng giá' : 'Thêm sản phẩm mới vào bảng giá'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
              {!editingProduct && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={form.maSanPham}
                    onChange={(e) => setForm({ ...form, maSanPham: e.target.value })}
                    placeholder="Ví dụ: CRM-SaaS-VIP"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={form.tenSanPham}
                  onChange={(e) => setForm({ ...form, tenSanPham: e.target.value })}
                  placeholder="Ví dụ: Gói phần mềm CRM VIP"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại sản phẩm</label>
                  <select
                    value={form.loaiSanPham}
                    onChange={(e) => setForm({ ...form, loaiSanPham: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="THUE_BAO">Dịch vụ thuê bao</option>
                    <option value="MOT_LAN">Sản phẩm một lần</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    value={form.donViTinh}
                    onChange={(e) => setForm({ ...form, donViTinh: e.target.value })}
                    placeholder="User / Tháng, Gói..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.giaNiemYet}
                    onChange={(e) => setForm({ ...form, giaNiemYet: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá sàn (VNĐ) * <span className="text-rose-500">(Ngưỡng duyệt chiết khấu)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.giaSan}
                    onChange={(e) => setForm({ ...form, giaSan: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-rose-600"
                  />
                </div>
              </div>

              {isDirectorOrAdmin() && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-bold mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Giá vốn sản phẩm (Chỉ Giám đốc / Admin thấy)</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={form.giaVon}
                    onChange={(e) => setForm({ ...form, giaVon: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-amber-900 bg-white"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    Nhân viên kinh doanh và các vai trò khác tuyệt đối không thể xem trường giá vốn này.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={2}
                  value={form.moTa}
                  onChange={(e) => setForm({ ...form, moTa: e.target.value })}
                  placeholder="Mô tả các tính năng cốt lõi của sản phẩm..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {submitLoading ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

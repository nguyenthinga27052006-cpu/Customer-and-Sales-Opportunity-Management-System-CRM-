import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
  Building2,
  Flame,
  CalendarCheck,
} from 'lucide-react';
import api from '../../services/api';
import { DanhMucDungChung } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const GeneralSettingsPage: React.FC = () => {
  const [catalogs, setCatalogs] = useState<DanhMucDungChung[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('NGANH_NGHE');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal thêm mục
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    maMuc: '',
    tenMuc: '',
    thuTuHienThi: 1,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const categoryConfigs = [
    { key: 'NGANH_NGHE', label: 'Ngành nghề Khách hàng', icon: Briefcase, desc: 'Lĩnh vực hoạt động kinh doanh của khách hàng' },
    { key: 'QUY_MO', label: 'Quy mô Doanh nghiệp', icon: Building2, desc: 'Số lượng nhân sự của doanh nghiệp khách hàng' },
    { key: 'NGUON_LEAD', label: 'Nguồn Lead (Kênh tiếp cận)', icon: Flame, desc: 'Nguồn gốc khách hàng tiềm năng đến từ đâu' },
    { key: 'LOAI_HOAT_DONG', label: 'Loại Hoạt động Sales', icon: CalendarCheck, desc: 'Các hình thức tương tác (gọi điện, gặp mặt, email...)' },
  ];

  const fetchCatalogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/danh-muc');
      setCatalogs(res.data);
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const currentItems = catalogs.filter((c) => c.loaiDanhMuc === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitLoading(true);
    try {
      await api.post('/danh-muc', {
        loaiDanhMuc: selectedCategory,
        maMuc: form.maMuc,
        tenMuc: form.tenMuc,
        thuTuHienThi: Number(form.thuTuHienThi),
      });
      setSuccess('Thêm mục danh mục thành công');
      setShowModal(false);
      setForm({ maMuc: '', tenMuc: '', thuTuHienThi: currentItems.length + 1 });
      fetchCatalogs();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thêm mục thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mục "${name}"?`)) return;
    try {
      await api.delete(`/danh-muc/${id}`);
      setSuccess('Xóa mục thành công');
      fetchCatalogs();
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể xóa mục đang được sử dụng');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
          Danh mục Dùng chung Toàn hệ thống
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Story [S2-07]: Chuẩn hóa tên gọi các trường dữ liệu dùng chung (nguồn lead, ngành nghề, quy mô, hoạt động) để đồng bộ báo cáo tổng hợp.
        </p>
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

      {/* Layout: Sidebar tabs on left, Content on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Selector */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-1.5 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Loại danh mục
          </h3>
          {categoryConfigs.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <cat.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                <div>
                  <div className="text-xs font-bold leading-none">{cat.label}</div>
                  <div className={`text-[11px] mt-1 leading-tight ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content list */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {categoryConfigs.find((c) => c.key === selectedCategory)?.label}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tổng số {currentItems.length} mục đang được cấu hình
              </p>
            </div>
            <button
              onClick={() => {
                setForm({
                  maMuc: '',
                  tenMuc: '',
                  thuTuHienThi: currentItems.length + 1,
                });
                setShowModal(true);
                setModalError('');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mục mới</span>
            </button>
          </div>

          {loading ? (
            <LoadingSpinner text="Đang tải danh mục..." />
          ) : (
            <div className="divide-y divide-slate-100">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-slate-500 flex items-center justify-center text-[11px]">
                      {item.thuTuHienThi}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800">{item.tenMuc}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-2">({item.maMuc})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id, item.tenMuc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xóa mục"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm mục */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Thêm mục mới</h3>
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

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã mục (viết liền, không dấu) *</label>
                <input
                  type="text"
                  required
                  value={form.maMuc}
                  onChange={(e) => setForm({ ...form, maMuc: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: LOGISTICS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên mục hiển thị *</label>
                <input
                  type="text"
                  required
                  value={form.tenMuc}
                  onChange={(e) => setForm({ ...form, tenMuc: e.target.value })}
                  placeholder="Ví dụ: Vận tải & Logistics"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thứ tự hiển thị *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.thuTuHienThi}
                  onChange={(e) => setForm({ ...form, thuTuHienThi: Number(e.target.value) })}
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
                  {submitLoading ? 'Đang lưu...' : 'Lưu mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

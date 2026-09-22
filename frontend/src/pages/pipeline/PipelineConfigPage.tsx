import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  Percent,
  Edit2,
  Trash2,
  Trophy,
  XCircle,
  Swords,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api';
import { GiaiDoanPipeline, LyDoThangThua, DoiThu } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const PipelineConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'reasons' | 'competitors'>('pipeline');

  // Pipeline Data
  const [stages, setStages] = useState<GiaiDoanPipeline[]>([]);
  const [reasons, setReasons] = useState<LyDoThangThua[]>([]);
  const [competitors, setCompetitors] = useState<DoiThu[]>([]);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal Giai Đoạn
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<GiaiDoanPipeline | null>(null);
  const [stageForm, setStageForm] = useState({
    maGiaiDoan: '',
    tenGiaiDoan: '',
    thuTu: 1,
    xacSuatThang: 10,
    dieuKienBatBuoc: '',
  });

  // Modal Lý do
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonForm, setReasonForm] = useState({
    loai: 'THANG' as 'THANG' | 'THUA',
    noiDung: '',
    thuTu: 1,
  });

  // Modal Đối thủ
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [competitorForm, setCompetitorForm] = useState({
    tenDoiThu: '',
    diemManh: '',
    diemYeu: '',
    moTa: '',
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [stgRes, rsnRes, compRes] = await Promise.all([
        api.get('/giai-doan/pipeline'),
        api.get('/giai-doan/ly-do'),
        api.get('/giai-doan/doi-thu'),
      ]);
      setStages(stgRes.data);
      setReasons(rsnRes.data);
      setCompetitors(compRes.data);
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Không thể tải dữ liệu cấu hình pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitLoading(true);
    try {
      if (editingStage) {
        await api.put(`/giai-doan/pipeline/${editingStage.id}`, stageForm);
        setSuccess('Cập nhật giai đoạn pipeline thành công');
      } else {
        await api.post('/giai-doan/pipeline', stageForm);
        setSuccess('Thêm giai đoạn pipeline mới thành công');
      }
      setShowStageModal(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thao tác giai đoạn thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitLoading(true);
    try {
      await api.post('/giai-doan/ly-do', reasonForm);
      setSuccess('Thêm lý do thắng/thua thành công');
      setShowReasonModal(false);
      setReasonForm({ loai: 'THANG', noiDung: '', thuTu: 1 });
      fetchData();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thêm lý do thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteReason = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa lý do này?')) return;
    try {
      await api.delete(`/giai-doan/ly-do/${id}`);
      setSuccess('Xóa lý do thành công');
      fetchData();
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Xóa lý do thất bại');
    }
  };

  const handleCompetitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitLoading(true);
    try {
      await api.post('/giai-doan/doi-thu', competitorForm);
      setSuccess('Thêm đối thủ cạnh tranh thành công');
      setShowCompetitorModal(false);
      setCompetitorForm({ tenDoiThu: '', diemManh: '', diemYeu: '', moTa: '' });
      fetchData();
    } catch (err: any) {
      setModalError(err.userFriendlyMessage || 'Thêm đối thủ thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCompetitor = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đối thủ "${name}"?`)) return;
    try {
      await api.delete(`/giai-doan/doi-thu/${id}`);
      setSuccess('Xóa đối thủ thành công');
      fetchData();
    } catch (err: any) {
      setError(err.userFriendlyMessage || 'Xóa đối thủ thất bại');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
          Cấu hình Pipeline, Lý do Thắng/Thua & Đối thủ
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Story [S2-09] & [S2-10]: Chuỗi giai đoạn pipeline xác định tỷ lệ dự báo doanh số (Weighted Forecast) và dữ liệu đóng thương vụ.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'pipeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Giai đoạn Pipeline ({stages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reasons')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'reasons'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Lý do Thắng / Thua ({reasons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('competitors')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'competitors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Đối thủ Cạnh tranh ({competitors.length})</span>
        </button>
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

      {loading ? (
        <LoadingSpinner text="Đang tải cấu hình..." />
      ) : (
        <>
          {/* TAB 1: PIPELINE STAGES */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Chuỗi giai đoạn theo thứ tự phễu bán hàng (từ tiếp cận đến chốt hợp đồng):
                </span>
                <button
                  onClick={() => {
                    setEditingStage(null);
                    setStageForm({
                      maGiaiDoan: '',
                      tenGiaiDoan: '',
                      thuTu: stages.length + 1,
                      xacSuatThang: 50,
                      dieuKienBatBuoc: '',
                    });
                    setShowStageModal(true);
                    setModalError('');
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm giai đoạn mới</span>
                </button>
              </div>

              <div className="space-y-3">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {stage.thuTu}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-800">{stage.tenGiaiDoan}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{stage.maGiaiDoan}</span>
                        </div>
                        {stage.dieuKienBatBuoc ? (
                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Điều kiện rời: {stage.dieuKienBatBuoc}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic mt-1">
                            Không có điều kiện bắt buộc
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold flex items-center space-x-1">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{stage.xacSuatThang}% thắng</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingStage(stage);
                          setStageForm({
                            maGiaiDoan: stage.maGiaiDoan,
                            tenGiaiDoan: stage.tenGiaiDoan,
                            thuTu: stage.thuTu,
                            xacSuatThang: stage.xacSuatThang,
                            dieuKienBatBuoc: stage.dieuKienBatBuoc || '',
                          });
                          setShowStageModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WIN / LOSS REASONS */}
          {activeTab === 'reasons' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowReasonModal(true);
                    setModalError('');
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm lý do mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lý do Thắng */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm pb-3 border-b border-slate-100">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    <span>Lý do Thắng thương vụ (Won Reasons)</span>
                  </div>
                  <div className="space-y-2">
                    {reasons
                      .filter((r) => r.loai === 'THANG')
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-800 font-medium">{r.noiDung}</span>
                          <button
                            onClick={() => handleDeleteReason(r.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Lý do Thua */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm pb-3 border-b border-slate-100">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Lý do Thua thương vụ (Lost Reasons)</span>
                  </div>
                  <div className="space-y-2">
                    {reasons
                      .filter((r) => r.loai === 'THUA')
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-800 font-medium">{r.noiDung}</span>
                          <button
                            onClick={() => handleDeleteReason(r.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPETITORS */}
          {activeTab === 'competitors' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Danh sách đối thủ cạnh tranh trên thị trường:
                </span>
                <button
                  onClick={() => {
                    setShowCompetitorModal(true);
                    setModalError('');
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm đối thủ mới</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {competitors.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-slate-800">{comp.tenDoiThu}</h4>
                        <button
                          onClick={() => handleDeleteCompetitor(comp.id, comp.tenDoiThu)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{comp.moTa || 'Chưa có mô tả'}</p>
                    </div>

                    <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                      <div>
                        <span className="font-semibold text-emerald-700 block">Điểm mạnh:</span>
                        <span className="text-slate-600">{comp.diemManh || '—'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-rose-700 block">Điểm yếu:</span>
                        <span className="text-slate-600">{comp.diemYeu || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Giai đoạn */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingStage ? 'Chỉnh sửa giai đoạn pipeline' : 'Thêm giai đoạn pipeline mới'}
              </h3>
              <button onClick={() => setShowStageModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleStageSubmit} className="space-y-3.5 mt-4 text-xs">
              {!editingStage && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã giai đoạn *</label>
                  <input
                    type="text"
                    required
                    value={stageForm.maGiaiDoan}
                    onChange={(e) => setStageForm({ ...stageForm, maGiaiDoan: e.target.value.toUpperCase() })}
                    placeholder="Ví dụ: GD_03_DEMO"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên giai đoạn *</label>
                <input
                  type="text"
                  required
                  value={stageForm.tenGiaiDoan}
                  onChange={(e) => setStageForm({ ...stageForm, tenGiaiDoan: e.target.value })}
                  placeholder="Ví dụ: Đề xuất giải pháp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ tự hiển thị *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={stageForm.thuTu}
                    onChange={(e) => setStageForm({ ...stageForm, thuTu: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Xác suất thắng (%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={stageForm.xacSuatThang}
                    onChange={(e) => setStageForm({ ...stageForm, xacSuatThang: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điều kiện bắt buộc để rời giai đoạn</label>
                <textarea
                  rows={2}
                  value={stageForm.dieuKienBatBuoc}
                  onChange={(e) => setStageForm({ ...stageForm, dieuKienBatBuoc: e.target.value })}
                  placeholder="Ví dụ: Đã có ít nhất 1 cuộc gặp và khách xác nhận biên bản nhu cầu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {submitLoading ? 'Đang lưu...' : 'Lưu giai đoạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Lý do */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Thêm lý do thắng/thua</h3>
              <button onClick={() => setShowReasonModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleReasonSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại kết quả</label>
                <select
                  value={reasonForm.loai}
                  onChange={(e) => setReasonForm({ ...reasonForm, loai: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                >
                  <option value="THANG">Thắng thương vụ (Won)</option>
                  <option value="THUA">Thua thương vụ (Lost)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung lý do *</label>
                <textarea
                  rows={2}
                  required
                  value={reasonForm.noiDung}
                  onChange={(e) => setReasonForm({ ...reasonForm, noiDung: e.target.value })}
                  placeholder="Ví dụ: Giá cả cạnh tranh, Khách hàng hoãn dự án..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReasonModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {submitLoading ? 'Đang lưu...' : 'Lưu lý do'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Đối thủ */}
      {showCompetitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Thêm đối thủ cạnh tranh mới</h3>
              <button onClick={() => setShowCompetitorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCompetitorSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đối thủ *</label>
                <input
                  type="text"
                  required
                  value={competitorForm.tenDoiThu}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, tenDoiThu: e.target.value })}
                  placeholder="Ví dụ: Odoo CRM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm mạnh chính</label>
                <textarea
                  rows={2}
                  value={competitorForm.diemManh}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, diemManh: e.target.value })}
                  placeholder="Ví dụ: Mã nguồn mở, nhiều module quản trị ERP..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm yếu chính</label>
                <textarea
                  rows={2}
                  value={competitorForm.diemYeu}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, diemYeu: e.target.value })}
                  placeholder="Ví dụ: Chi phí triển khai cao, khó tùy biến sâu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompetitorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {submitLoading ? 'Đang lưu...' : 'Lưu đối thủ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

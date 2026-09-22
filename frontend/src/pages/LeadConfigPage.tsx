import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScoringRule, AssignmentRule } from '../types/lead.types';
import { leadService } from '../services/lead.service';

export const LeadConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scoring' | 'assignment'>('scoring');

  // Scoring config & rules state
  const [config, setConfig] = useState({
    nguongNong: 50,
    nguongAm: 25,
    thoiGianSlaGio: 24,
  });
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);

  // Assignment rules state
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);

  // Modal new rule state
  const [newScoringRuleOpen, setNewScoringRuleOpen] = useState(false);
  const [newScoringRule, setNewScoringRule] = useState({
    tenQuyTac: '',
    tieuChi: 'NGANH_NGHE',
    giaTri: '',
    diem: 15,
  });

  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cfg, sRules, aRules] = await Promise.all([
        leadService.layCauHinhChamDiem(),
        leadService.layQuyTacChamDiem(),
        leadService.layQuyTacPhanBo(),
      ]);
      setConfig(cfg);
      setScoringRules(sRules);
      setAssignmentRules(aRules);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      await leadService.capNhatCauHinhChamDiem(config);
      setMessage('Đã lưu cấu hình ngưỡng nhiệt độ và thời hạn SLA thành công!');
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      alert(e.userFriendlyMessage || e.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateScoringRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScoringRule.tenQuyTac || !newScoringRule.giaTri) return;
    try {
      await leadService.taoQuyTacChamDiem(newScoringRule);
      setNewScoringRuleOpen(false);
      setNewScoringRule({ tenQuyTac: '', tieuChi: 'NGANH_NGHE', giaTri: '', diem: 15 });
      loadAll();
    } catch (e: any) {
      alert(e.userFriendlyMessage || e.message || 'Lỗi khi tạo quy tắc');
    }
  };

  const handleDeleteScoringRule = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quy tắc chấm điểm này?')) return;
    try {
      await leadService.xoaQuyTacChamDiem(id);
      loadAll();
    } catch (e: any) {
      alert(e.userFriendlyMessage || e.message || 'Lỗi khi xóa quy tắc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình Quy Tắc Lead (Scoring & Assignment)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dành riêng cho Giám đốc kinh doanh (Director) và Quản trị viên (Admin) thiết lập quy chuẩn tự động hóa
          </p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
        >
          ← Quay lại Lead
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <span>✓</span> {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('scoring')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'scoring' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          🎯 Chấm điểm & Ngưỡng nhiệt độ (Lead Scoring)
        </button>
        <button
          onClick={() => setActiveTab('assignment')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'assignment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          🔀 Chiến lược phân bổ (Assignment Rules)
        </button>
      </div>

      {/* TAB 1: SCORING CONFIG */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          {/* Ngưỡng nhiệt độ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🌡️</span> Cấu hình Ngưỡng nhiệt độ & SLA tiếp nhận
            </h3>
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Ngưỡng Lead NÓNG (Điểm &gt;=)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={config.nguongNong}
                  onChange={(e) => setConfig({ ...config, nguongNong: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-red-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Ngưỡng Lead ẤM (Điểm &gt;=)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={config.nguongAm}
                  onChange={(e) => setConfig({ ...config, nguongAm: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Thời hạn SLA tiếp nhận (Giờ)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={config.thoiGianSlaGio}
                  onChange={(e) => setConfig({ ...config, thoiGianSlaGio: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  {savingConfig ? 'Đang lưu...' : 'Lưu cấu hình ngưỡng'}
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách tiêu chí chấm điểm */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh mục quy tắc cộng điểm (Rules)</h3>
                <p className="text-[11px] text-slate-400">Tự động đối chiếu khi Lead được tạo mới hoặc cập nhật dữ liệu</p>
              </div>
              <button
                onClick={() => setNewScoringRuleOpen(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700"
              >
                + Thêm quy tắc
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tên quy tắc</th>
                  <th className="py-3 px-4">Tiêu chí</th>
                  <th className="py-3 px-4">Giá trị so khớp</th>
                  <th className="py-3 px-4 text-center">Điểm cộng</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoringRules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.tenQuyTac}</td>
                    <td className="py-3 px-4 text-slate-600">{r.tieuChi}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{r.giaTri}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">+{r.diem}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteScoringRule(r.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENT RULES */}
      {activeTab === 'assignment' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chiến lược Phân bổ tự động (S4-06)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nguyên tắc: <strong>First matching rule wins</strong>. Khớp quy tắc ưu tiên cao hơn sẽ phân bổ ngay, nếu không khớp sẽ chuyển về Hàng đợi.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {assignmentRules.map((ar) => (
              <div key={ar.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {ar.thuTuUuTien}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{ar.tenQuyTac}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full">
                      {ar.loaiQuyTac}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 pl-8">
                    Điều kiện: <span className="font-mono text-slate-700">{JSON.stringify(ar.dieuKien || {})}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                  Đang hoạt động
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Scoring Rule */}
      {newScoringRuleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Thêm mới quy tắc chấm điểm</h3>
            <form onSubmit={handleCreateScoringRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên quy tắc</label>
                <input
                  type="text"
                  required
                  value={newScoringRule.tenQuyTac}
                  onChange={(e) => setNewScoringRule({ ...newScoringRule, tenQuyTac: e.target.value })}
                  placeholder="VD: Khách từ ngành Bất động sản"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu chí</label>
                <select
                  value={newScoringRule.tieuChi}
                  onChange={(e) => setNewScoringRule({ ...newScoringRule, tieuChi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="NGANH_NGHE">Ngành nghề</option>
                  <option value="QUY_MO">Quy mô</option>
                  <option value="NGUON_LEAD">Nguồn Lead</option>
                  <option value="MUC_DO_QUAN_TAM">Mức độ quan tâm</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giá trị khớp</label>
                <input
                  type="text"
                  required
                  value={newScoringRule.giaTri}
                  onChange={(e) => setNewScoringRule({ ...newScoringRule, giaTri: e.target.value })}
                  placeholder="VD: BAT_DONG_SAN"
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm cộng</label>
                <input
                  type="number"
                  required
                  value={newScoringRule.diem}
                  onChange={(e) => setNewScoringRule({ ...newScoringRule, diem: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setNewScoringRuleOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Tạo quy tắc</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

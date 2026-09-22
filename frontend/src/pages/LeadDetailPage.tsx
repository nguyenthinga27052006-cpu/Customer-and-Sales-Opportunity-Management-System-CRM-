import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lead } from '../types/lead.types';
import { leadService } from '../services/lead.service';
import { LeadRejectModal } from '../components/leads/LeadRejectModal';
import { LeadConvertModal } from '../components/leads/LeadConvertModal';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [rejectOpen, setRejectOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const loadLead = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await leadService.layChiTiet(id);
      setLead(res);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải thông tin chi tiết Lead');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id]);

  const handleAccept = async () => {
    if (!lead) return;
    try {
      await leadService.tiepNhanLead(lead.id);
      loadLead();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi tiếp nhận Lead');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
        <p>Đang tải chi tiết hồ sơ Lead...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-red-200">
        <span className="text-3xl mb-2 block">⚠️</span>
        <h3 className="text-base font-bold text-slate-900">Không tìm thấy thông tin</h3>
        <p className="text-xs text-red-600 mt-1">{error || 'Lead không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md flex-shrink-0 ${lead.phanLoai === 'NONG' ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' : lead.phanLoai === 'AM' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'}`}>
              {lead.phanLoai === 'NONG' ? '🔥' : lead.phanLoai === 'AM' ? '☀️' : '❄️'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900">{lead.hoTen}</h1>
                <span className="font-mono text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full">
                  {lead.maLead}
                </span>
                {lead.quaHanSla && lead.trangThai === 'CHO_TIEP_NHAN' && (
                  <span className="px-2.5 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full animate-pulse">
                    ⚠️ QUÁ HẠN SLA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Công ty: <strong className="text-slate-800">{lead.congTy || 'Chưa cập nhật'}</strong> • Nguồn: <strong className="text-blue-700 font-semibold">{lead.nguonLead}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/leads')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              ← Danh sách
            </button>

            {lead.trangThai === 'CHO_TIEP_NHAN' && (
              <>
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  ✓ Tiếp nhận Lead (Accept)
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold"
                >
                  ✕ Từ chối Lead
                </button>
              </>
            )}

            {lead.trangThai === 'DANG_CHAM_SOC' && (
              <button
                onClick={() => setConvertOpen(true)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <span>🚀</span> Chuyển đổi thành Khách hàng & Cơ hội (S4-08)
              </button>
            )}

            {lead.trangThai === 'DA_CHUYEN_DOI' && (
              <span className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold">
                ✓ Đã chuyển đổi thành công (Read-only)
              </span>
            )}
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Điểm tiềm năng (S4-05)</span>
            <span className="text-lg font-black text-slate-900">{lead.diemTiemNang} điểm ({lead.phanLoai})</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Trạng thái</span>
            <span className="text-base font-bold text-blue-700">{lead.trangThai}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Người phụ trách</span>
            <span className="text-sm font-bold text-slate-800">{lead.nguoiSoHuu?.hoTen || 'Hàng đợi (Queue)'}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">Thời hạn SLA phản hồi</span>
            <span className={`text-xs font-mono font-bold ${lead.quaHanSla ? 'text-red-600' : 'text-slate-700'}`}>
              {lead.slaDeadline ? new Date(lead.slaDeadline).toLocaleString('vi-VN') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Thông tin chi tiết + Bảng điểm */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin liên hệ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Thông tin liên hệ & Nhu cầu</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-1">Số điện thoại:</span>
                <span className="font-mono font-bold text-slate-800">{lead.soDienThoai || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Email:</span>
                <span className="font-medium text-slate-800">{lead.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Ngành nghề:</span>
                <span className="font-medium text-slate-800">{lead.nganhNghe || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Quy mô doanh nghiệp:</span>
                <span className="font-medium text-slate-800">{lead.quyMo || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Nhu cầu quan tâm:</span>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 font-medium">
                {lead.nhuCauQuanTam || 'Chưa ghi nhận nhu cầu cụ thể.'}
              </p>
            </div>

            {lead.lyDoTuChoi && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
                <span className="font-bold block">Lý do từ chối trước đó:</span>
                <span>{lead.lyDoTuChoi}</span>
              </div>
            )}
          </div>

          {/* S4-05: Bảng điểm chi tiết (Scoring Breakdown) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <span>🎯</span> Bảng phân tích điểm tiềm năng (Scoring Breakdown)
              </h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                Tổng: {lead.diemTiemNang} điểm
              </span>
            </div>

            {lead.chiTietDiem && lead.chiTietDiem.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Tiêu chí</th>
                    <th className="py-2 px-3">Quy tắc so khớp</th>
                    <th className="py-2 px-3 text-right">Điểm cộng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lead.chiTietDiem.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.tieuChi}</td>
                      <td className="py-2 px-3 text-slate-600">{item.tenQuyTac} ({item.giaTri})</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">+{item.diem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-400 italic">Chưa khớp quy tắc tính điểm đặc biệt nào.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Lịch sử phân bổ & Hoạt động */}
        <div className="space-y-6 text-xs">
          {/* Lịch sử phân bổ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Lịch sử phân bổ (S4-06)</h3>
            {lead.lichSuPhanBo && lead.lichSuPhanBo.length > 0 ? (
              <div className="space-y-3 divide-y divide-slate-100">
                {lead.lichSuPhanBo.map((ls: any) => (
                  <div key={ls.id} className="pt-2.5 first:pt-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{ls.nguoiDuocPhanBo?.hoTen || 'Hàng đợi'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(ls.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Loại: <strong>{ls.loaiPhanBo}</strong> {ls.quyTac ? `• Quy tắc: ${ls.quyTac.tenQuyTac}` : ''}
                    </div>
                    {ls.lyDo && <div className="text-[11px] text-slate-600 italic mt-0.5">"{ls.lyDo}"</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">Chưa có lịch sử phân bổ.</p>
            )}
          </div>

          {/* Dòng thời gian hoạt động */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Dòng thời gian tương tác</h3>
            {lead.hoatDong && lead.hoatDong.length > 0 ? (
              <div className="space-y-3">
                {lead.hoatDong.map((act: any) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{act.tieuDe}</span>
                      <span className="text-[10px] text-slate-400">{new Date(act.thoiGian).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    {act.noiDung && <p className="text-slate-600 text-[11px]">{act.noiDung}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">Chưa có ghi nhận hoạt động.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeadRejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSuccess={loadLead}
        leadId={lead.id}
        leadName={lead.hoTen}
      />

      <LeadConvertModal
        isOpen={convertOpen}
        onClose={() => setConvertOpen(false)}
        onSuccess={loadLead}
        lead={lead}
      />
    </div>
  );
};

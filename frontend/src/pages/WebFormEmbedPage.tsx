import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebFormEmbedConfig } from '../types/lead.types';
import { leadService } from '../services/lead.service';

export const WebFormEmbedPage: React.FC = () => {
  const navigate = useNavigate();

  const [forms, setForms] = useState<WebFormEmbedConfig[]>([]);
  const [selectedForm, setSelectedForm] = useState<WebFormEmbedConfig | null>(null);

  // Live Test Form inputs
  const [testData, setTestData] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    congTy: '',
    nhuCauQuanTam: '',
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadForms = async () => {
    try {
      const list = await leadService.layDanhSachWebForm();
      setForms(list);
      if (list.length > 0) {
        setSelectedForm(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    try {
      setTestStatus('loading');
      setTestMessage(null);

      const res = await leadService.submitPublicLead({
        maForm: selectedForm.maForm,
        ...testData,
      });

      setTestStatus('success');
      setTestMessage(res.message);
      setTestData({ hoTen: '', email: '', soDienThoai: '', congTy: '', nhuCauQuanTam: '' });
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.userFriendlyMessage || err.message || 'Lỗi gửi form');
    }
  };

  const getEmbedSnippet = () => {
    if (!selectedForm) return '';
    return `<iframe 
  src="${window.location.origin}/lead-public/form/${selectedForm.maForm}"
  width="100%" 
  height="480" 
  frameborder="0" 
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
</iframe>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mã Nhúng Web Lead Form (S4-01)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nhúng form đăng ký tư vấn vào Website công ty hoặc Landing Page để tự động thu thập và phân bổ khách hàng tiềm năng
          </p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
        >
          ← Quay lại Lead
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Cấu hình mã nhúng & code snippet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">1. Chọn mẫu Form tích hợp</h3>
            <div className="space-y-2">
              {forms.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedForm(f)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedForm?.id === f.id ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{f.tenForm}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">Mã: {f.maForm} • Nguồn: {f.nguonLeadMacDinh}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                    Kích hoạt
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedForm && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">2. Đoạn mã nhúng HTML iframe</h3>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  {copied ? '✓ Đã sao chép!' : '📋 Sao chép mã'}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {getEmbedSnippet()}
              </pre>
              <p className="text-[11px] text-slate-400 mt-2">
                * Dán đoạn mã này vào bất kỳ trang web WordPress, React, HTML nào. Form đã tích hợp sẵn cơ chế chống bot spam và IP Rate Limit 5 request/phút.
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Live Interactive Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Xem trước trực quan (Live Test)</span>
              <h3 className="text-base font-bold text-slate-900">{selectedForm?.tieuDe || 'Đăng ký tư vấn giải pháp'}</h3>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {testMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-medium ${testStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {testStatus === 'success' ? '✓ ' : '⚠️ '} {testMessage}
            </div>
          )}

          <form onSubmit={handleTestSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={testData.hoTen}
                onChange={(e) => setTestData({ ...testData, hoTen: e.target.value })}
                placeholder="VD: Hoàng Minh Châu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={testData.soDienThoai}
                  onChange={(e) => setTestData({ ...testData, soDienThoai: e.target.value })}
                  placeholder="0988776655"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData({ ...testData, email: e.target.value })}
                  placeholder="chau.hm@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên công ty / Doanh nghiệp</label>
              <input
                type="text"
                value={testData.congTy}
                onChange={(e) => setTestData({ ...testData, congTy: e.target.value })}
                placeholder="VD: Công ty TNHH An Phát"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nhu cầu quan tâm</label>
              <textarea
                rows={2}
                value={testData.nhuCauQuanTam}
                onChange={(e) => setTestData({ ...testData, nhuCauQuanTam: e.target.value })}
                placeholder="VD: Cần demo tính năng phân bổ lead tự động..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={testStatus === 'loading'}
              style={{ backgroundColor: selectedForm?.mauMauChuDao || '#2563eb' }}
              className="w-full py-2.5 text-white font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {testStatus === 'loading' ? 'Đang gửi...' : selectedForm?.mauButtonText || 'Gửi liên hệ ngay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

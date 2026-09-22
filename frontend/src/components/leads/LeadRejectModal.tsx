import React, { useState } from 'react';
import { leadService } from '../../services/lead.service';

interface LeadRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: string;
  leadName: string;
}

export const LeadRejectModal: React.FC<LeadRejectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  leadName,
}) => {
  const [lyDo, setLyDo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      setError('Lý do từ chối Lead là bắt buộc (Reason = REQUIRED)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await leadService.tuChoiLead(leadId, lyDo.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi từ chối Lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
          <div>
            <h3 className="text-base font-bold text-red-950 flex items-center gap-2">
              <span>🚫</span> Từ chối tiếp nhận Lead (S4-07)
            </h3>
            <p className="text-xs text-red-800/80 mt-0.5">
              Lead sẽ được chuyển về Hàng đợi để phân bổ lại cho Sales khác
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600">
            Bạn đang từ chối xử lý khách hàng tiềm năng: <strong className="text-slate-900">{leadName}</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder="VD: Không liên lạc được số điện thoại, không đúng phân khúc khách hàng, khách đã ký hợp đồng với đơn vị khác..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !lyDo.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Xác nhận từ chối Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

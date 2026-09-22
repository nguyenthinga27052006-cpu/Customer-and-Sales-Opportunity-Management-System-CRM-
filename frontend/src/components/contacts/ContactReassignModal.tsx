import React, { useState } from 'react';
import { NguoiLienHe, KhachHang } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';

interface ContactReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact: NguoiLienHe | null;
}

export const ContactReassignModal: React.FC<ContactReassignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contact,
}) => {
  const [searchKw, setSearchKw] = useState('');
  const [searchResults, setSearchResults] = useState<KhachHang[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<KhachHang | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const handleSearch = async (kw: string) => {
    setSearchKw(kw);
    if (!kw.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await customerService.layDanhSach({ tuKhoa: kw, limit: 5 });
      // Lọc bỏ công ty hiện tại
      setSearchResults(res.items.filter((c) => c.id !== contact.khachHangId));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) {
      setError('Vui lòng chọn khách hàng mới');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await customerService.chuyenKhachHangChoLienHe(contact.id, {
        khachHangMoiId: selectedTarget.id,
        lyDo,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi chuyển người liên hệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chuyển người liên hệ sang công ty khác
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Áp dụng khi nhân sự chuyển công tác. Toàn bộ lịch sử hoạt động được bảo toàn.
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
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900">
            Đang chuyển người liên hệ: <strong>{contact.hoTen}</strong> ({contact.chucDanh || 'N/A'})
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tìm và chọn công ty mới tiếp nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={searchKw}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Nhập tên hoặc mã số thuế công ty mới..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searching && <div className="text-xs text-slate-400 mt-1">Đang tìm...</div>}
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-slate-100 max-h-36 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                {searchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedTarget(c);
                      setSearchResults([]);
                      setSearchKw(c.tenCongTy);
                    }}
                    className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.tenCongTy}</div>
                      <div className="text-slate-500">Mã: {c.maKhachHang} | MST: {c.maSoThue || 'N/A'}</div>
                    </div>
                    <span className="text-blue-600 font-medium">Chọn</span>
                  </div>
                ))}
              </div>
            )}
            {selectedTarget && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center justify-between">
                <span>✓ Đã chọn: <strong>{selectedTarget.tenCongTy}</strong></span>
                <button type="button" onClick={() => setSelectedTarget(null)} className="text-red-500 hover:text-red-700">Đổi</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lý do chuyển công tác</label>
            <input
              type="text"
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder="VD: Thay đổi công ty, chuyển sang đơn vị thành viên..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              disabled={loading || !selectedTarget}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang chuyển...' : 'Xác nhận chuyển'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

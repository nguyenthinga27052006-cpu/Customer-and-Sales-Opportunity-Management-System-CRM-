import React, { useState, useEffect } from 'react';
import { KhachHang } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';

interface CustomerMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCustomer?: KhachHang | null;
}

export const CustomerMergeModal: React.FC<CustomerMergeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomer,
}) => {
  const [customerA, setCustomerA] = useState<KhachHang | null>(null);
  const [customerB, setCustomerB] = useState<KhachHang | null>(null);
  const [masterTarget, setMasterTarget] = useState<'A' | 'B'>('A');
  const [ghiChu, setGhiChu] = useState('');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<KhachHang[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'A' | 'B' | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomer) {
      setCustomerA(initialCustomer);
      setCustomerB(null);
      setMasterTarget('A');
    }
  }, [initialCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (kw: string) => {
    setSearchKeyword(kw);
    if (!kw.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await customerService.layDanhSach({ tuKhoa: kw, limit: 5 });
      setSearchResults(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCustomer = (c: KhachHang) => {
    if (selectingFor === 'A') {
      setCustomerA(c);
    } else if (selectingFor === 'B') {
      setCustomerB(c);
    }
    setSelectingFor(null);
    setSearchKeyword('');
    setSearchResults([]);
  };

  const masterCustomer = masterTarget === 'A' ? customerA : customerB;
  const secondaryCustomer = masterTarget === 'A' ? customerB : customerA;

  const handleMerge = async () => {
    if (!masterCustomer || !secondaryCustomer) {
      setError('Vui lòng chọn đầy đủ 2 khách hàng để thực hiện gộp');
      return;
    }

    if (masterCustomer.id === secondaryCustomer.id) {
      setError('Khách hàng chính và phụ không được trùng nhau');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await customerService.gopKhachHang({
        khachHangGocId: masterCustomer.id,
        khachHangGopId: secondaryCustomer.id,
        ghiChu: ghiChu || 'Gộp khách hàng trùng lặp',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi gộp khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h3 className="text-lg font-bold text-amber-950 flex items-center gap-2">
              <span>🔄</span> Phát hiện và gộp khách hàng trùng lặp (S3-04)
            </h3>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Chỉ dành cho Trưởng nhóm kinh doanh trở lên. Giữ nguyên toàn bộ liên hệ, cơ hội và lịch sử tương tác.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Đối chiếu so sánh 2 khách hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột A */}
            <div className={`p-4 rounded-xl border-2 transition-all ${masterTarget === 'A' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Khách hàng A</span>
                {customerA && (
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 cursor-pointer">
                    <input
                      type="radio"
                      name="masterTarget"
                      checked={masterTarget === 'A'}
                      onChange={() => setMasterTarget('A')}
                    />
                    <span>Chọn làm Master</span>
                  </label>
                )}
              </div>

              {customerA ? (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-sm text-slate-900">{customerA.tenCongTy}</div>
                  <div className="text-slate-500">Mã KH: <span className="font-mono text-slate-700">{customerA.maKhachHang}</span></div>
                  <div className="text-slate-500">MST: <span className="font-mono font-medium text-slate-800">{customerA.maSoThue || 'N/A'}</span></div>
                  <div className="text-slate-500">Người sở hữu: <span className="text-slate-800 font-medium">{customerA.nguoiSoHuu?.hoTen || 'N/A'}</span></div>
                  <div className="text-slate-500">Dữ liệu hiện có: <span className="text-slate-800 font-medium">{customerA._count?.nguoiLienHe || 0} liên hệ, {customerA._count?.coHoi || 0} cơ hội</span></div>
                  <button
                    type="button"
                    onClick={() => { setSelectingFor('A'); setSearchKeyword(''); }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Thay đổi khách hàng A
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <button
                    type="button"
                    onClick={() => { setSelectingFor('A'); setSearchKeyword(''); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Chọn khách hàng A
                  </button>
                </div>
              )}
            </div>

            {/* Cột B */}
            <div className={`p-4 rounded-xl border-2 transition-all ${masterTarget === 'B' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Khách hàng B</span>
                {customerB && (
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 cursor-pointer">
                    <input
                      type="radio"
                      name="masterTarget"
                      checked={masterTarget === 'B'}
                      onChange={() => setMasterTarget('B')}
                    />
                    <span>Chọn làm Master</span>
                  </label>
                )}
              </div>

              {customerB ? (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-sm text-slate-900">{customerB.tenCongTy}</div>
                  <div className="text-slate-500">Mã KH: <span className="font-mono text-slate-700">{customerB.maKhachHang}</span></div>
                  <div className="text-slate-500">MST: <span className="font-mono font-medium text-slate-800">{customerB.maSoThue || 'N/A'}</span></div>
                  <div className="text-slate-500">Người sở hữu: <span className="text-slate-800 font-medium">{customerB.nguoiSoHuu?.hoTen || 'N/A'}</span></div>
                  <div className="text-slate-500">Dữ liệu hiện có: <span className="text-slate-800 font-medium">{customerB._count?.nguoiLienHe || 0} liên hệ, {customerB._count?.coHoi || 0} cơ hội</span></div>
                  <button
                    type="button"
                    onClick={() => { setSelectingFor('B'); setSearchKeyword(''); }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Thay đổi khách hàng B
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <button
                    type="button"
                    onClick={() => { setSelectingFor('B'); setSearchKeyword(''); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Chọn khách hàng B
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal popup tìm kiếm chọn khách hàng */}
          {selectingFor && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Tìm kiếm khách hàng {selectingFor}:</span>
                <button onClick={() => setSelectingFor(null)} className="text-xs text-slate-500 hover:text-slate-700">Đóng</button>
              </div>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Nhập tên công ty hoặc mã số thuế..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searching && <div className="text-xs text-slate-400 mt-2">Đang tìm kiếm...</div>}
              {searchResults.length > 0 && (
                <div className="mt-2 divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white rounded-lg border border-slate-200">
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between"
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
            </div>
          )}

          {/* Xem trước kết quả gộp (Preview) */}
          {masterCustomer && secondaryCustomer && (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>📋</span> Xem trước kết quả sau khi gộp:
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                <li>
                  Khách hàng chính giữ lại: <strong>{masterCustomer.tenCongTy}</strong> ({masterCustomer.maKhachHang}).
                </li>
                <li>
                  Khách hàng phụ: <strong>{secondaryCustomer.tenCongTy}</strong> sẽ được chuyển trạng thái <em>Ngừng hợp tác</em> và liên kết vào khách hàng chính.
                </li>
                <li>
                  Chuyển giao <strong>{secondaryCustomer._count?.nguoiLienHe || 0}</strong> người liên hệ và <strong>{secondaryCustomer._count?.coHoi || 0}</strong> cơ hội bán hàng sang khách hàng chính.
                </li>
                <li>
                  Toàn bộ lịch sử hoạt động và ghi chú tương tác được bảo toàn đầy đủ.
                </li>
              </ul>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do hoặc ghi chú gộp
            </label>
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: Doanh nghiệp đổi tên hoặc sáp nhập chi nhánh..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleMerge}
              disabled={loading || !masterCustomer || !secondaryCustomer}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="animate-spin text-xs">⏳</span>}
              Xác nhận gộp khách hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

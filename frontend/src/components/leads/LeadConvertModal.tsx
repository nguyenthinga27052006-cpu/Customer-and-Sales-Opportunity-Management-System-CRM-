import React, { useState, useEffect } from 'react';
import { Lead } from '../../types/lead.types';
import { leadService } from '../../services/lead.service';
import { customerService } from '../../services/customer.service';
import { KhachHang } from '../../types/customer.types';

interface LeadConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead: Lead | null;
}

export const LeadConvertModal: React.FC<LeadConvertModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lead,
}) => {
  const [tenCoHoi, setTenCoHoi] = useState('');
  const [giaTriDuKien, setGiaTriDuKien] = useState<number>(50000000);
  const [ngayKyDuKien, setNgayKyDuKien] = useState('');
  const [customerMode, setCustomerMode] = useState<'create' | 'reuse'>('create');
  const [tenCongTy, setTenCongTy] = useState('');
  const [maSoThue, setMaSoThue] = useState('');

  const [searchCustKw, setSearchCustKw] = useState('');
  const [custResults, setCustResults] = useState<KhachHang[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<KhachHang | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setTenCoHoi(`Cơ hội cung cấp giải pháp cho ${lead.congTy || lead.hoTen}`);
      setTenCongTy(lead.congTy || `Công ty của ${lead.hoTen}`);
      setGiaTriDuKien(50000000);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setNgayKyDuKien(d.toISOString().split('T')[0]);

      if (lead.khachHangGoiYId) {
        setCustomerMode('reuse');
        // Tải thông tin khách hàng gợi ý
        customerService.layChiTiet(lead.khachHangGoiYId).then((c) => {
          setSelectedCustomer(c);
        }).catch(() => {});
      } else {
        setCustomerMode('create');
        setSelectedCustomer(null);
      }
    }
    setError(null);
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSearchCustomer = async (kw: string) => {
    setSearchCustKw(kw);
    if (!kw.trim()) {
      setCustResults([]);
      return;
    }
    try {
      const res = await customerService.layDanhSach({ tuKhoa: kw, limit: 5 });
      setCustResults(res.items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenCoHoi.trim()) {
      setError('Tên cơ hội bán hàng không được để trống');
      return;
    }

    if (customerMode === 'reuse' && !selectedCustomer) {
      setError('Vui lòng chọn khách hàng có sẵn');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await leadService.chuyenDoiLead(lead.id, {
        tenCoHoi: tenCoHoi.trim(),
        giaTriDuKien: Number(giaTriDuKien) || 0,
        ngayKyDuKien: ngayKyDuKien || undefined,
        khachHangHienCoId: customerMode === 'reuse' ? selectedCustomer?.id : undefined,
        tenCongTy: customerMode === 'create' ? tenCongTy.trim() : undefined,
        maSoThue: customerMode === 'create' ? maSoThue.trim() : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Chuyển đổi Lead thất bại và đã tự động rollback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <span>🚀</span> Chuyển đổi Lead sang Khách hàng & Cơ hội (S4-08)
            </h3>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              Giao dịch toàn vẹn: Tự động tạo Customer + Contact + Opportunity và bảo toàn lịch sử
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
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-center justify-between">
            <div>
              Khách hàng tiềm năng: <strong className="text-slate-900">{lead.hoTen}</strong> ({lead.maLead})
            </div>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
              {lead.phanLoai} ({lead.diemTiemNang} điểm)
            </span>
          </div>

          {/* Chọn tạo mới hay tái sử dụng Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Hồ sơ Doanh nghiệp (Customer)</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border-2 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all ${customerMode === 'create' ? 'border-blue-600 bg-blue-50/20 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                <input
                  type="radio"
                  name="custMode"
                  checked={customerMode === 'create'}
                  onChange={() => setCustomerMode('create')}
                />
                <span>Tạo Khách hàng mới</span>
              </label>

              <label className={`p-3 rounded-xl border-2 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all ${customerMode === 'reuse' ? 'border-blue-600 bg-blue-50/20 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                <input
                  type="radio"
                  name="custMode"
                  checked={customerMode === 'reuse'}
                  onChange={() => setCustomerMode('reuse')}
                />
                <span>Gắn vào KH có sẵn</span>
              </label>
            </div>
          </div>

          {customerMode === 'create' ? (
            <div className="space-y-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tên công ty mới</label>
                <input
                  type="text"
                  required
                  value={tenCongTy}
                  onChange={(e) => setTenCongTy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mã số thuế (nếu có)</label>
                <input
                  type="text"
                  value={maSoThue}
                  onChange={(e) => setMaSoThue(e.target.value)}
                  placeholder="0101234567"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200">
              <label className="block text-xs font-medium text-slate-700">Tìm kiếm khách hàng có sẵn:</label>
              <input
                type="text"
                value={searchCustKw}
                onChange={(e) => handleSearchCustomer(e.target.value)}
                placeholder="Nhập tên hoặc MST khách hàng..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {custResults.length > 0 && (
                <div className="divide-y divide-slate-100 max-h-32 overflow-y-auto bg-white rounded-lg border border-slate-200">
                  {custResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustResults([]);
                        setSearchCustKw(c.tenCongTy);
                      }}
                      className="p-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-800">{c.tenCongTy}</span>
                      <span className="text-blue-600 font-medium">Chọn</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center justify-between">
                  <span>✓ Đã chọn: <strong>{selectedCustomer.tenCongTy}</strong></span>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="text-red-500 hover:text-red-700">Đổi</button>
                </div>
              )}
            </div>
          )}

          {/* Thông tin Cơ hội bán hàng (Opportunity) */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-700">Thông tin Cơ hội bán hàng (Opportunity)</label>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Tên cơ hội bán hàng <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={tenCoHoi}
                onChange={(e) => setTenCoHoi(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Giá trị dự kiến (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={giaTriDuKien}
                  onChange={(e) => setGiaTriDuKien(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Ngày dự kiến chốt</label>
                <input
                  type="date"
                  value={ngayKyDuKien}
                  onChange={(e) => setNgayKyDuKien(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
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
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="animate-spin text-xs">⏳</span>}
              Xác nhận chuyển đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

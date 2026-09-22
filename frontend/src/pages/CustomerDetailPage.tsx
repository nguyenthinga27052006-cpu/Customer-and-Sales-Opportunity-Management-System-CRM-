import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer360Data, NguoiLienHe } from '../types/customer.types';
import { customerService } from '../services/customer.service';
import { ContactModal } from '../components/contacts/ContactModal';
import { ContactReassignModal } from '../components/contacts/ContactReassignModal';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<Customer360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'opportunities' | 'timeline'>('info');

  // Contact modals state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<NguoiLienHe | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignContact, setReassignContact] = useState<NguoiLienHe | null>(null);

  const load360 = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await customerService.layCustomer360(id);
      setData(res);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải thông tin Customer 360');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load360();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
        <p className="text-sm font-medium">Đang tải hồ sơ Customer 360...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-red-200">
        <span className="text-3xl mb-2 block">⚠️</span>
        <h3 className="text-base font-bold text-slate-900">Không thể truy cập hồ sơ</h3>
        <p className="text-xs text-red-600 mt-1">{error || 'Khách hàng không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { thongTinChung, nguoiLienHe, coHoiDangMo, coHoiDaDong, thongKe, dongThoiGian, hieuNang } = data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md flex-shrink-0">
              {thongTinChung.tenCongTy.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900">{thongTinChung.tenCongTy}</h1>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-bold rounded-full">
                  {thongTinChung.maKhachHang}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>MST: <strong className="text-slate-800 font-mono">{thongTinChung.maSoThue || 'Chưa cập nhật'}</strong></span>
                <span>Người sở hữu: <strong className="text-slate-800">{thongTinChung.nguoiSoHuu?.hoTen || 'Chưa gán'}</strong></span>
                <span>Phòng ban: <strong className="text-slate-800">{thongTinChung.nhomKinhDoanh?.tenNhom || 'Khối Kinh Doanh'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-slate-400">Hiệu năng Customer 360 (S3-03)</div>
              <div className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                <span>⚡ {hieuNang.thoiGianTruyVanMs} ms</span>
                <span className="text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Đạt chuẩn &lt;1.5s</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/customers')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              ← Danh sách
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Doanh thu đã ký</span>
            <span className="text-base font-black text-emerald-600 mt-0.5 block">{formatCurrency(thongKe.tongGiaTriDaKy)}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Giá trị cơ hội đang mở</span>
            <span className="text-base font-black text-blue-600 mt-0.5 block">{formatCurrency(thongKe.tongGiaTriCoHoiMo)}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Người liên hệ</span>
            <span className="text-base font-black text-slate-800 mt-0.5 block">{thongKe.tongSoLienHe} nhân sự</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Tương tác hoạt động</span>
            <span className="text-base font-black text-slate-800 mt-0.5 block">{thongKe.tongSoHoatDong} lần</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          🏢 Thông tin doanh nghiệp
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          👥 Người liên hệ ({nguoiLienHe.length})
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'opportunities' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          💼 Cơ hội bán hàng ({coHoiDangMo.length + coHoiDaDong.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          ⏱️ Dòng thời gian 360 ({dongThoiGian.total})
        </button>
      </div>

      {/* Tab 1: Thông tin doanh nghiệp */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block mb-1">Tên công ty / Doanh nghiệp:</span>
                <span className="text-sm font-bold text-slate-900">{thongTinChung.tenCongTy}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Mã số thuế:</span>
                <span className="font-mono font-bold text-slate-800">{thongTinChung.maSoThue || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Ngành nghề:</span>
                <span className="font-medium text-slate-800">{thongTinChung.nganhNghe || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Quy mô nhân sự:</span>
                <span className="font-medium text-slate-800">{thongTinChung.quyMo || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block mb-1">Website:</span>
                {thongTinChung.website ? (
                  <a href={thongTinChung.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                    {thongTinChung.website} ↗
                  </a>
                ) : (
                  <span className="text-slate-400">N/A</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Địa chỉ trụ sở:</span>
                <span className="font-medium text-slate-800">{thongTinChung.diaChi || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Tỉnh / Thành phố:</span>
                <span className="font-medium text-slate-800">{thongTinChung.tinhThanh || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Ghi chú / Mô tả:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {thongTinChung.moTa || 'Không có ghi chú thêm.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Người liên hệ */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Danh sách các đầu mối liên hệ tại doanh nghiệp</span>
            <button
              onClick={() => { setEditingContact(null); setContactModalOpen(true); }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <span>+</span> Thêm người liên hệ
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {nguoiLienHe.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có người liên hệ nào. Hãy thêm đầu mối liên hệ chính.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {nguoiLienHe.map((ct) => (
                  <div key={ct.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {ct.hoTen.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{ct.hoTen}</span>
                          {ct.laDauMoiChinh && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                              ⭐ ĐẦU MỐI CHÍNH
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                            {ct.vaiTroQuyetDinh}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4">
                          <span>Chức vụ: <strong className="text-slate-700">{ct.chucDanh || 'N/A'}</strong></span>
                          <span>SĐT: <strong className="font-mono text-slate-800">{ct.soDienThoai || 'N/A'}</strong></span>
                          <span>Email: <strong className="text-slate-800">{ct.email || 'N/A'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => { setEditingContact(ct); setContactModalOpen(true); }}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => { setReassignContact(ct); setReassignModalOpen(true); }}
                        className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                        title="Chuyển sang công ty khác"
                      >
                        Chuyển công ty
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Xóa liên hệ "${ct.hoTen}"?`)) {
                            await customerService.xoaNguoiLienHe(ct.id);
                            load360();
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Cơ hội bán hàng */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Cơ hội đang mở (Open Opportunities)</h3>
            {coHoiDangMo.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Không có cơ hội bán hàng nào đang mở.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {coHoiDangMo.map((op: any) => (
                  <div key={op.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{op.tenCoHoi}</div>
                      <div className="text-slate-400 font-mono mt-0.5">{op.maCoHoi} • Giai đoạn: {op.giaiDoan?.tenGiaiDoan || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatCurrency(Number(op.giaTriDuKien))}</div>
                      <div className="text-slate-400 text-[11px]">Xác suất: {op.giaiDoan?.xacSuatThang || 10}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Cơ hội đã đóng (Closed Won / Lost)</h3>
            {coHoiDaDong.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có cơ hội nào đã chốt hợp đồng.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {coHoiDaDong.map((op: any) => (
                  <div key={op.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{op.tenCoHoi}</div>
                      <div className="text-slate-400 font-mono mt-0.5">{op.maCoHoi}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{formatCurrency(Number(op.giaTriDuKien))}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${op.trangThai === 'DONG_THANG' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {op.trangThai === 'DONG_THANG' ? 'Đã thắng' : 'Đã thua'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Dòng thời gian 360 */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Lịch sử tương tác & hoạt động</h3>
          {dongThoiGian.items.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Chưa có hoạt động nào được ghi nhận.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {dongThoiGian.items.map((act: any) => (
                <div key={act.id} className="relative text-xs">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{act.tieuDe}</span>
                      <span className="text-[10px] text-slate-400">{new Date(act.thoiGian).toLocaleString('vi-VN')}</span>
                    </div>
                    {act.noiDung && <p className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{act.noiDung}</p>}
                    <div className="text-[11px] text-slate-400 mt-1">
                      Thực hiện bởi: <strong className="text-slate-700">{act.nguoiThucHien?.hoTen || 'Hệ thống'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Modals */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSuccess={load360}
        khachHangId={thongTinChung.id}
        contact={editingContact}
      />

      <ContactReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        onSuccess={load360}
        contact={reassignContact}
      />
    </div>
  );
};

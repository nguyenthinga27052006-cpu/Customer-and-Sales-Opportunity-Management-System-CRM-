import React, { useState } from 'react';
import { leadService } from '../../services/lead.service';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeadImportModal: React.FC<LeadImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Errors, 3: Success Result
  const [file, setFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setError('Chỉ chấp nhận file định dạng Excel (.xlsx, .xls) hoặc .csv');
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }
      setFile(f);
      setError(null);
    }
  };

  const handleUploadPreview = async () => {
    if (!file) {
      setError('Vui lòng chọn file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await leadService.xemTruocExcel(file);
      setPreviewResult(res);
      setStep(2);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi phân tích file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult || !previewResult.validRowsToImport || previewResult.validRowsToImport.length === 0) {
      setError('Không có dòng dữ liệu hợp lệ nào để import');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await leadService.xacNhanImportExcel(previewResult.validRowsToImport);
      setImportResult(res);
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Lỗi khi import dữ liệu vào hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span> Nhập dữ liệu Lead từ Excel / CSV (S4-02)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy trình 4 bước: Tải lên → Xác thực → Xem trước & Báo lỗi dòng → Xác nhận nhập
            </p>
          </div>
          <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="p-6">
          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <span className="text-4xl block mb-2">📁</span>
                <p className="text-xs font-semibold text-slate-700">Kéo thả file vào đây hoặc bấm để chọn file</p>
                <p className="text-[11px] text-slate-400 mt-1">Định dạng hỗ trợ: .xlsx, .xls, .csv (Tối đa 5MB)</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-bold block">💡 Quy chuẩn dữ liệu đầu vào:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800">
                  <li>Cột <strong>Họ tên</strong> và <strong>Nguồn Lead</strong> là bắt buộc (Source = REQUIRED).</li>
                  <li>Cột hỗ trợ: Họ tên, Nguồn Lead, Email, Số điện thoại, Công ty, Chức danh, Ngành nghề, Quy mô, Nhu cầu quan tâm.</li>
                  <li>Hệ thống sẽ tự động quét trùng lặp với Lead đã có trong CSDL.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUploadPreview}
                  disabled={loading || !file}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <span className="animate-spin text-xs">⏳</span>}
                  Tải lên & Phân tích dữ liệu
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Row Errors */}
          {step === 2 && previewResult && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng số dòng</span>
                  <span className="text-lg font-black text-slate-900">{previewResult.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Hợp lệ</span>
                  <span className="text-lg font-black text-emerald-700">{previewResult.validRowsCount}</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <span className="text-[10px] text-red-700 font-bold uppercase block">Lỗi dữ liệu</span>
                  <span className="text-lg font-black text-red-700">{previewResult.invalidRowsCount}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Trùng lặp</span>
                  <span className="text-lg font-black text-amber-800">{previewResult.duplicateRowsCount}</span>
                </div>
              </div>

              {/* Bảng lỗi chi tiết */}
              {previewResult.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 text-xs font-bold text-red-900 border-b border-red-200 flex items-center justify-between">
                    <span>Chi tiết các dòng bị lỗi ({previewResult.errors.length} lỗi):</span>
                    <span className="text-[10px] text-red-600 font-normal">Các dòng lỗi sẽ bị bỏ qua khi import</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Dòng</th>
                          <th className="py-2 px-3">Cột</th>
                          <th className="py-2 px-3">Nguyên nhân</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewResult.errors.map((err: any, idx: number) => (
                          <tr key={idx} className="hover:bg-red-50/40">
                            <td className="py-1.5 px-3 font-mono font-bold text-red-700">Dòng {err.row}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-800">{err.column}</td>
                            <td className="py-1.5 px-3 text-red-600">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Dữ liệu mẫu hợp lệ sẽ được import */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                ✓ Sẵn sàng import <strong>{previewResult.validRowsCount}</strong> dòng hợp lệ. Mỗi dòng sẽ tự động được chấm điểm tiềm năng và phân bổ theo rule.
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  ← Chọn file khác
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={loading || previewResult.validRowsCount === 0}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <span className="animate-spin text-xs">⏳</span>}
                    Xác nhận Import {previewResult.validRowsCount} Lead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Kết quả thành công */}
          {step === 3 && importResult && (
            <div className="text-center py-6 space-y-4">
              <span className="text-5xl block">🎉</span>
              <h4 className="text-base font-bold text-slate-900">Import dữ liệu thành công!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Đã thêm thành công <strong>{importResult.soDongThanhCong}</strong> Lead vào hệ thống. Các Lead mới đã được tự động chấm điểm và phân bổ vào hàng đợi hoặc chuyên viên kinh doanh.
              </p>
              <button
                type="button"
                onClick={resetModal}
                className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

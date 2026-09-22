import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Calendar,
  Users,
  Building2,
  RefreshCw,
  ArrowUpRight,
  PieChart,
  Percent,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { ForecastReport, ForecastSummary } from '../types/opportunity.types';
import { opportunityService } from '../services/opportunity.service';

export const ForecastReportPage: React.FC = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState<ForecastReport | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activePeriod, setActivePeriod] = useState<'month' | 'nextMonth' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForecast = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunityService.layForecast(year);
      setReport(data);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải báo cáo dự báo doanh số');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(selectedYear);
  }, [selectedYear]);

  const formatVND = (val?: number | null) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getActiveSummary = (): (ForecastSummary & { label: string }) | null => {
    if (!report) return null;
    if (activePeriod === 'month') {
      return { ...report.thangNay, label: `Tháng ${report.thangNay.thang}/${report.nam}` };
    }
    if (activePeriod === 'nextMonth') {
      return { ...report.thangSau, label: `Tháng ${report.thangSau.thang}/${report.nam}` };
    }
    return { ...report.quyNay, label: `Quý ${report.quyNay.quy}/${report.nam}` };
  };

  const currentSummary = getActiveSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Báo cáo Dự báo Doanh số (Weighted Forecast)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mô hình dự báo doanh thu dựa trên trọng số xác suất giai đoạn (S5-06) và chỉ tiêu doanh số
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadForecast(selectedYear)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Làm mới báo cáo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActivePeriod('month')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activePeriod === 'month'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tháng này {report?.thangNay?.thang ? `(T${report.thangNay.thang})` : ''}
          </button>
          <button
            onClick={() => setActivePeriod('nextMonth')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activePeriod === 'nextMonth'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tháng sau {report?.thangSau?.thang ? `(T${report.thangSau.thang})` : ''}
          </button>
          <button
            onClick={() => setActivePeriod('quarter')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activePeriod === 'quarter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Quý này {report?.quyNay?.quy ? `(Quý ${report.quyNay.quy})` : ''}
          </button>
        </div>

        {report?.thoiDiemTinhToan && (
          <div className="text-[11px] text-slate-400 px-3 hidden md:block">
            Cập nhật: {new Date(report.thoiDiemTinhToan).toLocaleString('vi-VN')}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Đang tính toán dự báo doanh thu...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-500 text-xs bg-rose-50 rounded-2xl border border-rose-200">
          {error}
        </div>
      ) : currentSummary ? (
        <div className="space-y-6">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pipeline Total */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Tổng giá trị Pipeline</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                {formatVND(currentSummary.tongGiaTriPipeline)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span>{currentSummary.soLuongCoHoi} cơ hội dự kiến chốt</span>
              </div>
            </div>

            {/* Weighted Forecast */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Dự báo có trọng số (Forecast)</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                {formatVND(currentSummary.duBaoTrongSo)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Kỳ vọng đạt được: <strong>{currentSummary.tiLeDuBao}%</strong> chỉ tiêu
              </div>
            </div>

            {/* Closed Won Actual */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Thực tế đã chốt (Closed Won)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {formatVND(currentSummary.thucTeDaChot)}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                Đã hoàn thành: {currentSummary.tiLeHoanThanh}%
              </div>
            </div>

            {/* Sales Target */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Chỉ tiêu doanh số (Target)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                {formatVND(currentSummary.chiTieu)}
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(currentSummary.tiLeHoanThanh, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Rep Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Dự báo theo Nhân viên kinh doanh
                </h3>
              </div>

              {!report.theoNhanVien || report.theoNhanVien.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu theo nhân viên</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Nhân viên</th>
                        <th className="py-2.5 px-3 text-center">Cơ hội</th>
                        <th className="py-2.5 px-3 text-right">Tổng Pipeline</th>
                        <th className="py-2.5 px-3 text-right">Dự báo (Forecast)</th>
                        <th className="py-2.5 px-3 text-right">Đã chốt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.theoNhanVien.map((nv) => (
                        <tr key={nv.nguoiDungId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            <div>{nv.hoTen}</div>
                            <div className="text-[10px] text-slate-400">{nv.nhomKinhDoanh}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{nv.soLuongCoHoi}</td>
                          <td className="py-3 px-3 text-right font-mono">{formatVND(nv.tongPipeline)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {formatVND(nv.duBaoTrongSo)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatVND(nv.thucTeDaChot)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sales Team Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Dự báo theo Nhóm bán hàng (Team)
                </h3>
              </div>

              {!report.theoNhom || report.theoNhom.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu theo nhóm</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Tên nhóm</th>
                        <th className="py-2.5 px-3 text-center">Cơ hội</th>
                        <th className="py-2.5 px-3 text-right">Tổng Pipeline</th>
                        <th className="py-2.5 px-3 text-right">Dự báo (Forecast)</th>
                        <th className="py-2.5 px-3 text-right">Đã chốt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.theoNhom.map((nhom) => (
                        <tr key={nhom.nhomKinhDoanhId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            {nhom.tenNhom}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">{nhom.soLuongCoHoi}</td>
                          <td className="py-3 px-3 text-right font-mono">{formatVND(nhom.tongPipeline)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {formatVND(nhom.duBaoTrongSo)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatVND(nhom.thucTeDaChot)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

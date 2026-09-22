import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  RotateCcw,
  Package,
  Activity,
  History,
  FileText,
  Lock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { CoHoi, CoHoiSanPham, GiaiDoanPipeline, TrangThaiCoHoi } from '../types/opportunity.types';
import { HoatDong } from '../types/activity.types';
import { opportunityService } from '../services/opportunity.service';
import { activityService } from '../services/activity.service';
import { OpportunityModal } from '../components/opportunities/OpportunityModal';
import { OpportunityCloseModal } from '../components/opportunities/OpportunityCloseModal';
import { OpportunityReassignModal } from '../components/opportunities/OpportunityReassignModal';
import { OpportunityProductModal } from '../components/opportunities/OpportunityProductModal';
import { ActivityModal } from '../components/activities/ActivityModal';
import { TaskModal } from '../components/activities/TaskModal';
import { ActivityTimeline } from '../components/activities/ActivityTimeline';

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState<CoHoi | null>(null);
  const [stages, setStages] = useState<GiaiDoanPipeline[]>([]);
  const [timeline, setTimeline] = useState<HoatDong[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 'products' | 'timeline' | 'history' | 'info'
  const [activeTab, setActiveTab] = useState<'products' | 'timeline' | 'history' | 'info'>('products');

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeMode, setCloseMode] = useState<'WON' | 'LOST'>('WON');
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CoHoiSanPham | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // User role check
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const canReopen = userRoles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r));
  const canReassign = userRoles.some((r) => ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(r));

  const isClosed = opportunity?.trangThai === 'DONG_THANG' || opportunity?.trangThai === 'DONG_THUA';

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [oppData, stageList] = await Promise.all([
        opportunityService.layChiTiet(id),
        opportunityService.layDanhSachGiaiDoan(),
      ]);
      setOpportunity(oppData);
      setStages(stageList);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải chi tiết cơ hội');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    if (!id) return;
    try {
      setLoadingTimeline(true);
      const res = await activityService.layDongThoiGian({ coHoiId: id, limit: 50 });
      setTimeline(res.items || []);
    } catch (err) {
      console.error('Lỗi khi tải timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadData();
    loadTimeline();
  }, [id]);

  const handleStageClick = async (targetStageId: string) => {
    if (!opportunity || isClosed) return;
    if (targetStageId === opportunity.giaiDoanId) return;

    try {
      await opportunityService.chuyenGiaiDoan(opportunity.id, {
        giaiDoanId: targetStageId,
      });
      await loadData();
      await loadTimeline();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi chuyển giai đoạn');
    }
  };

  const handleReopen = async () => {
    if (!opportunity) return;
    const lyDo = window.prompt('Nhập lý do mở lại cơ hội bán hàng:');
    if (!lyDo || !lyDo.trim()) return;

    try {
      await opportunityService.moLaiCoHoi(opportunity.id, lyDo);
      await loadData();
      await loadTimeline();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi mở lại cơ hội');
    }
  };

  const handleDeleteProduct = async (itemId: string) => {
    if (!opportunity || isClosed) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi cơ hội?')) return;
    try {
      await opportunityService.xoaSanPhamKhoiCoHoi(opportunity.id, itemId);
      await loadData();
    } catch (err: any) {
      alert(err.userFriendlyMessage || err.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const formatVND = (val?: number | null) => {
    if (val === undefined || val === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Đang tải chi tiết cơ hội bán hàng...</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-rose-500 text-sm font-semibold">{error || 'Không tìm thấy cơ hội'}</p>
        <button
          onClick={() => navigate('/opportunities')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/opportunities')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                {opportunity.maCoHoi}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {opportunity.tenCoHoi}
              </h1>
              {opportunity.laDinhTre && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Đình trệ
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span
                onClick={() => navigate(`/customers/${opportunity.khachHangId}`)}
                className="hover:text-blue-600 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {opportunity.khachHang.tenCongTy}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Phụ trách: <strong>{opportunity.nguoiSoHuu.hoTen}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isClosed ? (
            <>
              <button
                onClick={() => setActivityModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4 text-blue-600" />
                Ghi hoạt động
              </button>

              <button
                onClick={() => setTaskModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-indigo-600" />
                Giao việc
              </button>

              {canReassign && (
                <button
                  onClick={() => setReassignModalOpen(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
                  title="Bàn giao cơ hội cho nhân viên khác (S5-08)"
                >
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  Bàn giao
                </button>
              )}

              <button
                onClick={() => setEditModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Edit2 className="w-4 h-4 text-slate-500" />
                Sửa
              </button>

              <button
                onClick={() => {
                  setCloseMode('WON');
                  setCloseModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Chốt Thắng (Won)
              </button>

              <button
                onClick={() => {
                  setCloseMode('LOST');
                  setCloseModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Đóng Thua (Lost)
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Đã khóa (Chỉ xem)
              </span>

              {canReopen && (
                <button
                  onClick={handleReopen}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl border border-blue-200 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Mở lại cơ hội
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Stepper Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tiến trình giai đoạn Pipeline:
          </span>
          {isClosed && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                opportunity.trangThai === 'DONG_THANG'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {opportunity.trangThai === 'DONG_THANG' ? 'Đã Chốt Thắng (Won)' : 'Đã Đóng Thua (Lost)'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {stages.map((stage, idx) => {
            const isCurrent = stage.id === opportunity.giaiDoanId && !isClosed;
            const isPassed =
              stages.findIndex((s) => s.id === opportunity.giaiDoanId) > idx ||
              opportunity.trangThai === 'DONG_THANG';

            return (
              <button
                key={stage.id}
                disabled={isClosed}
                onClick={() => handleStageClick(stage.id)}
                className={`p-2.5 rounded-xl text-left border transition relative overflow-hidden ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : isPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                } ${isClosed ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-0.5">
                  <span>Bước {idx + 1}</span>
                  <span>{stage.xacSuatThang}%</span>
                </div>
                <div className="text-xs font-bold truncate">{stage.tenGiaiDoan}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI & Metric Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Giá trị dự kiến</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatVND(opportunity.giaTriDuKien)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Tự động tính từ dòng sản phẩm
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Xác suất chốt</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {opportunity.xacSuat}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {opportunity.ghiChuXacSuat || 'Theo giai đoạn hiện tại'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Dự báo trọng số (Forecast)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatVND(opportunity.duBaoGiaTri)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            = Giá trị × {opportunity.xacSuat}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ngày dự kiến ký</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
            {opportunity.ngayKyDuKien
              ? new Date(opportunity.ngayKyDuKien).toLocaleDateString('vi-VN')
              : 'Chưa xác định'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {opportunity.trangThai === 'DONG_THANG' && opportunity.giaTriThucTe
              ? `Thực tế: ${formatVND(opportunity.giaTriThucTe)}`
              : opportunity.nguonCoHoi || 'Nguồn: Không rõ'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Sản phẩm & Dịch vụ ({opportunity.sanPhamCoHoi?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Dòng thời gian hoạt động ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Lịch sử giai đoạn ({opportunity.lichSuChuyenGiaiDoan?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Chi tiết & Đối thủ
        </button>
      </div>

      {/* Tab Contents */}

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Danh sách sản phẩm / gói dịch vụ trong cơ hội
              </h3>
              <p className="text-xs text-slate-400">
                Giá trị cơ hội được tính tự động từ tổng thành tiền các dòng bên dưới
              </p>
            </div>

            {!isClosed && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm sản phẩm
              </button>
            )}
          </div>

          {!opportunity.sanPhamCoHoi || opportunity.sanPhamCoHoi.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed rounded-xl">
              <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs">Chưa có sản phẩm nào trong cơ hội bán hàng này</p>
              {!isClosed && (
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  className="mt-3 px-3 py-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  + Thêm sản phẩm ngay
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3">Loại</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-center">Chiết khấu</th>
                    <th className="py-2.5 px-3 text-right">Kỳ thuê bao</th>
                    <th className="py-2.5 px-3 text-right font-bold">Thành tiền</th>
                    {!isClosed && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {opportunity.sanPhamCoHoi.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">
                        <div>{item.sanPham.tenSanPham}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.sanPham.maSanPham}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.sanPham.loaiSanPham === 'THUE_BAO' ? 'Thuê bao (SaaS)' : 'Bán một lần'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatVND(item.donGia)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {item.soLuong} {item.sanPham.donViTinh}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.chietKhauPhanTram > 0 ? (
                          <span className="text-amber-600 font-bold">
                            {item.chietKhauPhanTram}% ({formatVND(item.chietKhauSoTien)})
                          </span>
                        ) : (
                          <span className="text-slate-400">0%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {item.sanPham.loaiSanPham === 'THUE_BAO' && item.soKyThueBao
                          ? `${item.soKyThueBao} tháng`
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatVND(item.thanhTien)}
                      </td>
                      {!isClosed && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(item);
                                setProductModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
          <ActivityTimeline activities={timeline} loading={loadingTimeline} />
        </div>
      )}

      {/* TAB 3: STAGE HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Lịch sử thay đổi giai đoạn và kiểm toán (Audit Trail)
          </h3>

          {!opportunity.lichSuChuyenGiaiDoan || opportunity.lichSuChuyenGiaiDoan.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có bản ghi thay đổi giai đoạn nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Từ giai đoạn</th>
                    <th className="py-2.5 px-3">Sang giai đoạn</th>
                    <th className="py-2.5 px-3">Người thực hiện</th>
                    <th className="py-2.5 px-3">Ghi chú / Ghi đè</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {opportunity.lichSuChuyenGiaiDoan.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                        {log.giaiDoanTruoc?.tenGiaiDoan || '(Khởi tạo)'}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {log.giaiDoanSau?.tenGiaiDoan}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-200">
                        {log.nguoiThucHien?.hoTen}
                      </td>
                      <td className="py-3 px-3">
                        {log.ghiDeDieuKien && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold mr-1.5">
                            Ghi đè quản lý
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-400">
                          {log.lyDoChuyen || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GENERAL INFO & COMPETITOR */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-2">
              Thông tin Khách hàng & Đầu mối
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tên doanh nghiệp:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {opportunity.khachHang.tenCongTy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mã khách hàng:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {opportunity.khachHang.maKhachHang}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Người liên hệ chính:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {opportunity.nguoiLienHe?.hoTen || 'Chưa chọn'}
                </span>
              </div>
              {opportunity.nguoiLienHe?.soDienThoai && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-mono text-blue-600">{opportunity.nguoiLienHe.soDienThoai}</span>
                </div>
              )}
              {opportunity.nguoiLienHe?.email && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-700 dark:text-slate-300">{opportunity.nguoiLienHe.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b pb-2">
              Thông tin Thắng / Thua & Đối thủ
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái hiện tại:</span>
                <span className="font-bold">{opportunity.trangThai}</span>
              </div>
              {opportunity.lyDoThangThua && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Lý do thắng/thua:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {opportunity.lyDoThangThua.noiDung}
                  </span>
                </div>
              )}
              {opportunity.doiThu && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Đối thủ cạnh tranh:</span>
                  <span className="font-semibold text-rose-600">{opportunity.doiThu.tenDoiThu}</span>
                </div>
              )}
              {opportunity.ghiChuDong && (
                <div className="pt-2 border-t text-slate-600 dark:text-slate-400">
                  <strong>Ghi chú chốt:</strong> {opportunity.ghiChuDong}
                </div>
              )}
              {opportunity.moTa && (
                <div className="pt-2 border-t text-slate-600 dark:text-slate-400">
                  <strong>Mô tả cơ hội:</strong> {opportunity.moTa}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <OpportunityModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false);
          loadData();
        }}
        opportunity={opportunity}
      />

      <OpportunityCloseModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onSuccess={() => {
          setCloseModalOpen(false);
          loadData();
          loadTimeline();
        }}
        opportunity={opportunity}
        defaultMode={closeMode}
      />

      <OpportunityReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        onSuccess={() => {
          setReassignModalOpen(false);
          loadData();
          loadTimeline();
        }}
        opportunity={opportunity}
      />

      <OpportunityProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={() => {
          setProductModalOpen(false);
          loadData();
        }}
        opportunityId={opportunity.id}
        item={editingProduct}
      />

      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSuccess={() => {
          setActivityModalOpen(false);
          loadData();
          loadTimeline();
        }}
        defaultCoHoiId={opportunity.id}
        defaultKhachHangId={opportunity.khachHangId}
        defaultNguoiLienHeId={opportunity.nguoiLienHeId || undefined}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={() => {
          setTaskModalOpen(false);
          loadData();
          loadTimeline();
        }}
        defaultCoHoiId={opportunity.id}
        defaultKhachHangId={opportunity.khachHangId}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  Network,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { VaiTroEnum } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user, isDirectorOrAdmin } = useAuth();
  const [stats, setStats] = useState({
    usersCount: 0,
    productsCount: 0,
    teamsCount: 0,
    stagesCount: 0,
  });

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const [usersRes, prodsRes, teamsRes, stagesRes] = await Promise.all([
          api.get('/nguoi-dung', { params: { limit: 1 } }),
          api.get('/san-pham'),
          api.get('/nhom-kinh-doanh/danh-sach'),
          api.get('/giai-doan/pipeline'),
        ]);
        setStats({
          usersCount: usersRes.data.tongSo || 0,
          productsCount: prodsRes.data.length || 0,
          teamsCount: teamsRes.data.length || 0,
          stagesCount: stagesRes.data.length || 0,
        });
      } catch (e) {}
    };

    fetchQuickStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sprint 1 Nền tảng • EP-01 & EP-02 Hoàn tất</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.hoTen}!
          </h1>
          <p className="text-slate-300 text-xs lg:text-sm mt-2 leading-relaxed">
            Hệ thống CRM đã được kích hoạt phân quyền nghiêm ngặt theo vai trò{' '}
            <strong className="text-white">({user?.roles?.join(', ')})</strong> và phạm vi dữ liệu{' '}
            <strong className="text-emerald-400 font-semibold">
              {isDirectorOrAdmin() ? 'Toàn bộ dữ liệu (ALL_DATA)' : user?.roles.includes(VaiTroEnum.TEAM_LEAD) ? 'Dữ liệu nhóm (TEAM_DATA)' : 'Dữ liệu của tôi (MY_DATA)'}
            </strong>.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nhân sự / Tài khoản
            </span>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.usersCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">7 Vai trò chuẩn</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sản phẩm & Dịch vụ
            </span>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.productsCount}</div>
            <span className="text-[11px] text-blue-600 font-medium">Có bảng giá niêm yết</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nhóm kinh doanh
            </span>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.teamsCount}</div>
            <span className="text-[11px] text-purple-600 font-medium">Cấu trúc cây tổ chức</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Network className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Giai đoạn Pipeline
            </span>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.stagesCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Đã cài đặt xác suất</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GitBranch className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Lối tắt chức năng nền tảng (Sprint 1)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/users"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                Quản trị Tài khoản & Phân quyền
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Xem danh sách nhân viên, gán vai trò, gán nhóm và bàn giao dữ liệu khi nghỉ việc.
            </p>
          </Link>

          <Link
            to="/products"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                Danh mục Sản phẩm & Giá niêm yết
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý bảng giá chuẩn, giá sàn duyệt chiết khấu và giá vốn bảo mật.
            </p>
          </Link>

          <Link
            to="/pipeline"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                Cấu hình Pipeline & Thắng/Thua
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thiết lập chuỗi giai đoạn bán hàng, tỷ lệ % thắng và lý do thắng thua.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

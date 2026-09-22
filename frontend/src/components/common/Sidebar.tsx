import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  Target,
  Sliders,
  Globe,
  Users,
  Network,
  Package,
  GitBranch,
  Settings,
  History,
  ShieldCheck,
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Kanban,
  TrendingUp,
  Activity,
  CheckSquare,
  Calendar,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { VaiTroEnum } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasAnyRole, isDirectorOrAdmin } = useAuth();

  const navItems = [
    {
      title: 'Tổng quan (Dashboard)',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: 'Khách hàng (Customer)',
      to: '/customers',
      icon: Building2,
      show: true,
    },
    {
      title: 'Lead Tiềm năng',
      to: '/leads',
      icon: Target,
      show: true,
    },
    {
      title: 'Cơ hội bán hàng',
      to: '/opportunities',
      icon: Briefcase,
      show: true,
    },
    {
      title: 'Đường ống Kanban',
      to: '/opportunities/kanban',
      icon: Kanban,
      show: true,
    },
    {
      title: 'Dự báo Doanh số',
      to: '/forecast',
      icon: TrendingUp,
      show: true,
    },
    {
      title: 'Nhật ký Hoạt động',
      to: '/activities',
      icon: Activity,
      show: true,
    },
    {
      title: 'Nhiệm vụ & Deadline',
      to: '/tasks',
      icon: CheckSquare,
      show: true,
    },
    {
      title: 'Lịch làm việc',
      to: '/calendar',
      icon: Calendar,
      show: true,
    },
    {
      title: 'Quản trị Người dùng',
      to: '/users',
      icon: Users,
      show: hasAnyRole([VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR, VaiTroEnum.TEAM_LEAD]),
    },
    {
      title: 'Cơ cấu Tổ chức',
      to: '/organization',
      icon: Network,
      show: hasAnyRole([VaiTroEnum.ADMIN, VaiTroEnum.DIRECTOR, VaiTroEnum.TEAM_LEAD]),
    },
    {
      title: 'Sản phẩm & Bảng giá',
      to: '/products',
      icon: Package,
      show: true,
    },
    {
      title: 'Cấu hình Pipeline',
      to: '/pipeline',
      icon: GitBranch,
      show: isDirectorOrAdmin(),
    },
    {
      title: 'Cấu hình Rules Lead',
      to: '/leads-config',
      icon: Sliders,
      show: isDirectorOrAdmin(),
    },
    {
      title: 'Mã nhúng Web Form',
      to: '/leads-webform',
      icon: Globe,
      show: true,
    },
    {
      title: 'Danh mục dùng chung',
      to: '/settings/catalogs',
      icon: Settings,
      show: isDirectorOrAdmin(),
    },
    {
      title: 'Nhật ký Hệ thống',
      to: '/audit-logs',
      icon: History,
      show: isDirectorOrAdmin(),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                CRM PRO
              </span>
              <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase">
                Enterprise
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Snapshot (Story S1-06) */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phân quyền hoạt động</span>
          </div>
          <div className="font-semibold text-slate-200 truncate">{user?.hoTen}</div>
          <div className="text-[11px] text-blue-400 font-medium truncate mt-0.5">
            {user?.roles?.join(' • ')}
          </div>
          {user?.tenNhomKinhDoanh && (
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Nhóm: {user.tenNhomKinhDoanh}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          CRM Platform v1.0.0 • Sprint 1
        </div>
      </aside>
    </>
  );
};

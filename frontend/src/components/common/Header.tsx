import React, { useState } from 'react';
import { Menu, LogOut, User as UserIcon, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block text-xs font-medium text-slate-500">
          Hệ thống Quản lý Khách hàng & Cơ hội Bán hàng
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center space-x-4">
        {/* Role badge */}
        <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>{user?.roles?.[0] || 'User'}</span>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-slate-800 leading-none">
                {user?.hoTen || 'Người dùng'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-none">
                {user?.email}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                  <p className="text-sm font-semibold text-slate-800">{user?.hoTen}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Hồ sơ cá nhân & Đổi mật khẩu</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2.5"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Đăng xuất an toàn</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

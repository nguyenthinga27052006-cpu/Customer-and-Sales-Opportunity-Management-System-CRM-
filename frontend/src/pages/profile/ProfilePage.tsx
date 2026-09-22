import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Mail, Shield, FileText, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [hoTen, setHoTen] = useState(user?.hoTen || '');
  const [soDienThoai, setSoDienThoai] = useState(user?.soDienThoai || '');
  const [chuKyEmail, setChuKyEmail] = useState(user?.chuKyEmail || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Đổi mật khẩu modal/state
  const [matKhauHienTai, setMatKhauHienTai] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    // Kiểm tra định dạng SĐT Việt Nam (Story S2-02)
    if (soDienThoai && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(soDienThoai)) {
      setProfileError('Số điện thoại phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.put('/nguoi-dung/ho-so', {
        hoTen,
        soDienThoai,
        chuKyEmail,
      });
      setProfileSuccess(res.data.thongDiep);
      await refreshProfile();
    } catch (err: any) {
      setProfileError(err.userFriendlyMessage || 'Cập nhật hồ sơ thất bại');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (matKhauMoi !== xacNhanMatKhau) {
      setPwdError('Mật khẩu mới và mật khẩu xác nhận không khớp');
      return;
    }

    if (matKhauMoi.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(matKhauMoi)) {
      setPwdError('Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và chữ số');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.post('/auth/doi-mat-khau', {
        matKhauHienTai,
        matKhauMoi,
      });
      setPwdSuccess(res.data.thongDiep);
      setMatKhauHienTai('');
      setMatKhauMoi('');
      setXacNhanMatKhau('');
    } catch (err: any) {
      setPwdError(err.userFriendlyMessage || 'Đổi mật khẩu thất bại');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
          Hồ sơ Cá nhân & Bảo mật
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin liên hệ, chữ ký báo giá và mật khẩu tài khoản của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User summary card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20 mb-3">
            {user?.hoTen ? user.hoTen.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="text-base font-bold text-slate-800">{user?.hoTen}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

          <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-3 text-left text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Vai trò hệ thống:</span>
              <span className="font-semibold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50">
                {user?.roles?.join(', ')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Nhóm kinh doanh:</span>
              <span className="font-semibold text-slate-700">
                {user?.tenNhomKinhDoanh || 'Khối chung'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Trạng thái:</span>
              <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Đang hoạt động</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Update Profile & Change Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Cập nhật hồ sơ (Story S2-02) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-5">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Thông tin cá nhân & Chữ ký email
              </h3>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại Việt Nam (10 số: 09, 08, 07, 05, 03)
                  </label>
                  <input
                    type="tel"
                    value={soDienThoai}
                    onChange={(e) => setSoDienThoai(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email công ty (Không thể tự thay đổi)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chữ ký email (xuất hiện tự động khi gửi báo giá / email cho khách hàng)
                </label>
                <textarea
                  rows={3}
                  value={chuKyEmail}
                  onChange={(e) => setChuKyEmail(e.target.value)}
                  placeholder="Ví dụ: Chuyên viên tư vấn giải pháp CRM • Mobile: 0901234567 • Công ty Cổ phần Giải pháp Công nghệ"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
                >
                  {profileLoading ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
                </button>
              </div>
            </form>
          </div>

          {/* Form Đổi mật khẩu (Story S1-04) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-5">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Đổi mật khẩu tài khoản
              </h3>
            </div>

            {pwdSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  value={matKhauHienTai}
                  onChange={(e) => setMatKhauHienTai(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu mới (tối thiểu 8 ký tự, chữ + số)
                  </label>
                  <input
                    type="password"
                    required
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    value={xacNhanMatKhau}
                    onChange={(e) => setXacNhanMatKhau(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
                >
                  {pwdLoading ? 'Đang đổi mật khẩu...' : 'Xác nhận đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

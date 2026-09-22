import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Briefcase, Lock, Mail, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<any>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, matKhau);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.userFriendlyMessage || 'Thông tin tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/quen-mat-khau', { email: forgotEmail });
      setForgotResult(res.data);
    } catch (err: any) {
      setForgotResult({
        thanhCong: false,
        thongDiep: err.userFriendlyMessage || 'Không thể xử lý yêu cầu đặt lại mật khẩu',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // Nút đăng nhập nhanh cho môi trường Demo/Pilot
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setMatKhau('Password@123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          CRM Enterprise
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Hệ thống Quản lý Khách hàng và Cơ hội Bán hàng
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Email công ty
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@crm.vn"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotResult(null);
                    setForgotEmail(email);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Tài khoản mẫu thử nghiệm (Mật khẩu: Password@123)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@crm.vn')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 text-center truncate"
              >
                👑 Quản trị (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('director@crm.vn')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 text-center truncate"
              >
                👔 Giám đốc (Director)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('lead_hn@crm.vn')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 text-center truncate"
              >
                💼 Trưởng nhóm HN
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sales_hn1@crm.vn')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 text-center truncate"
              >
                🎯 Nhân viên Sales HN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (Story S1-03) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Khôi phục mật khẩu
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập email tài khoản của bạn. Hệ thống sẽ tạo liên kết đặt lại mật khẩu an toàn có hiệu lực trong 30 phút.
            </p>

            {forgotResult ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 text-blue-800 text-xs">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{forgotResult.thongDiep}</span>
                  </div>
                  {forgotResult.demoResetToken && (
                    <div className="mt-3 p-2 bg-white rounded border border-blue-200 text-slate-800">
                      <span className="font-semibold block text-[10px] text-slate-500 uppercase">Mã Token Demo (môi trường dev):</span>
                      <code className="text-xs break-all text-blue-700 font-mono">
                        {forgotResult.demoResetToken}
                      </code>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Đóng
                  </button>
                  {forgotResult.demoResetToken && (
                    <button
                      onClick={() => {
                        setShowForgotModal(false);
                        navigate(`/reset-password?token=${forgotResult.demoResetToken}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Đi tới trang đặt lại mật khẩu
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email công ty
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="sales_hn1@crm.vn"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {forgotLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

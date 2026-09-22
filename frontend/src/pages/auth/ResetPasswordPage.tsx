import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Key, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (matKhauMoi !== xacNhanMatKhau) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    if (matKhauMoi.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(matKhauMoi)) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và chữ số');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/dat-lai-mat-khau', {
        token,
        matKhauMoi,
      });
      setMessage(res.data.thongDiep);
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.userFriendlyMessage || 'Mã token không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-2">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Đặt lại mật khẩu mới</h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhập mã token xác thực và thiết lập mật khẩu an toàn mới cho tài khoản của bạn.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-sm">{message}</p>
                <p className="mt-1 text-emerald-700">Mọi phiên đăng nhập cũ đã được thu hồi an toàn.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Đăng nhập ngay với mật khẩu mới
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã Token đặt lại
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Dán mã token 64 ký tự vào đây"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới (tối thiểu 8 ký tự, có chữ và số)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md disabled:opacity-50 transition-colors"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang Đăng nhập</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

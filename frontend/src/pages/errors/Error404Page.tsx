import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

export const Error404Page: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
        404 — Không tìm thấy trang
      </h1>
      <p className="text-xs lg:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
        Đường dẫn bạn yêu cầu không tồn tại trên hệ thống hoặc đã được di chuyển sang địa chỉ mới.
      </p>
      <div className="flex items-center space-x-3 mt-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </button>
      </div>
    </div>
  );
};

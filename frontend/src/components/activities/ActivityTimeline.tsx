import React, { useState } from 'react';
import { Phone, Users, Mail, FileText, CheckSquare, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { HoatDong } from '../../types/activity.types';

interface ActivityTimelineProps {
  activities: HoatDong[];
  loading?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, loading = false }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = activities.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.loaiHoatDong === filterType;
  });

  const getActivityConfig = (type: string) => {
    switch (type) {
      case 'GOI_DIEN':
      case 'CUOC_GOI':
        return {
          label: 'Cuộc gọi',
          icon: Phone,
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        };
      case 'GAP_MAT':
      case 'CUOC_GAP':
        return {
          label: 'Cuộc gặp',
          icon: Users,
          iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
        };
      case 'EMAIL':
        return {
          label: 'Email',
          icon: Mail,
          iconBg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
          badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        };
      case 'GHI_CHU':
        return {
          label: 'Ghi chú',
          icon: FileText,
          iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        };
      case 'CONG_VIEC':
        return {
          label: 'Công việc',
          icon: CheckSquare,
          iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
          badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
        };
      default:
        return {
          label: 'Hoạt động',
          icon: Clock,
          iconBg: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-800',
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        };
    }
  };

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return `${d.toLocaleDateString('vi-VN')} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'GOI_DIEN', label: 'Cuộc gọi' },
          { id: 'GAP_MAT', label: 'Cuộc gặp' },
          { id: 'EMAIL', label: 'Email' },
          { id: 'GHI_CHU', label: 'Ghi chú' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Đang tải timeline tương tác...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Chưa có hoạt động tương tác nào được ghi nhận.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filtered.map((item) => {
            const config = getActivityConfig(item.loaiHoatDong);
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-0 w-5 h-5 rounded-full border flex items-center justify-center ${config.iconBg}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                </div>

                {/* Content card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${config.badge}`}>
                        {config.label}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.tieuDe}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                      {formatTime(item.thoiGian)}
                    </span>
                  </div>

                  {/* Body note */}
                  {item.noiDung && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed">
                      {item.noiDung}
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    {item.thoiLuongPhut ? (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.thoiLuongPhut} phút</span>
                      </span>
                    ) : null}

                    {item.diaDiem ? (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.diaDiem}</span>
                      </span>
                    ) : null}

                    {item.ketQua ? (
                      <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Kết quả: {item.ketQua}</span>
                      </span>
                    ) : null}

                    <span className="ml-auto font-medium text-slate-700 dark:text-slate-300">
                      bởi {item.nguoiThucHien?.hoTen || 'Hệ thống'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, Building2, User } from 'lucide-react';
import { KanbanCard as KanbanCardType } from '../../types/opportunity.types';

interface KanbanCardProps {
  card: KanbanCardType;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, onDragStart }) => {
  const navigate = useNavigate();

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const isPastDue = () => {
    if (!card.ngayKyDuKien) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(card.ngayKyDuKien) < today;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => navigate(`/opportunities/${card.id}`)}
      className={`group relative p-3.5 rounded-xl bg-white dark:bg-slate-900 border transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-0.5 ${
        card.laDinhTre
          ? 'border-amber-400/80 dark:border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-blue-400/70 dark:hover:border-blue-500/70'
      }`}
    >
      {/* Top row: Code + Stalled badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {card.maCoHoi}
        </span>

        {/* Story [S5-07]: Cảnh báo đình trệ */}
        {card.laDinhTre && (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>Đình trệ</span>
          </span>
        )}
      </div>

      {/* Opportunity Title */}
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {card.tenCoHoi}
      </h4>

      {/* Customer Name */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3 truncate">
        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{card.khachHang.tenCongTy}</span>
      </div>

      {/* Value & Forecast */}
      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3">
        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
          {formatVND(Number(card.giaTriDuKien))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          <span>Dự báo ({card.xacSuat}%):</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatVND(Number(card.duBaoGiaTri))}
          </span>
        </div>
      </div>

      {/* Footer: Close Date + Owner */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        {card.ngayKyDuKien ? (
          <div
            className={`flex items-center space-x-1 ${
              isPastDue() ? 'text-red-500 font-medium' : ''
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{formatDate(card.ngayKyDuKien)}</span>
          </div>
        ) : (
          <span className="text-slate-400 italic">Chưa hẹn ngày</span>
        )}

        <div className="flex items-center space-x-1.5" title={card.nguoiSoHuu.hoTen}>
          {card.nguoiSoHuu.avatarUrl ? (
            <img
              src={card.nguoiSoHuu.avatarUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold">
              {card.nguoiSoHuu.hoTen.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-xs truncate max-w-[80px]">{card.nguoiSoHuu.hoTen}</span>
        </div>
      </div>
    </div>
  );
};

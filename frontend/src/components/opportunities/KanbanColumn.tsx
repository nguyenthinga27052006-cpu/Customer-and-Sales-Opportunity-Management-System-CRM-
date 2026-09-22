import React, { useState } from 'react';
import { KanbanColumn as KanbanColumnType } from '../../types/opportunity.types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDrop: (opportunityId: string, stageId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onDragStart,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropInternal = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('opportunityId');
    if (cardId) {
      onDrop(cardId, column.giaiDoan.id);
    }
  };

  // Color bar by stage index
  const getStageHeaderColor = (thuTu: number) => {
    switch (thuTu) {
      case 1:
        return 'bg-blue-500';
      case 2:
        return 'bg-indigo-500';
      case 3:
        return 'bg-violet-500';
      case 4:
        return 'bg-amber-500';
      case 5:
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropInternal}
      className={`flex flex-col flex-shrink-0 w-80 max-h-full rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border transition-all duration-200 ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
          : 'border-slate-200 dark:border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2 truncate">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStageHeaderColor(
                column.giaiDoan.thuTu,
              )}`}
            />
            <h3
              className="text-sm font-bold text-slate-900 dark:text-white truncate"
              title={column.giaiDoan.tenGiaiDoan}
            >
              {column.giaiDoan.tenGiaiDoan}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {column.soLuong}
          </span>
        </div>

        {/* Stage probability and total column value */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>Xác suất: {column.giaiDoan.xacSuatThang}%</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200 font-mono text-[11px]">
            {formatVND(column.tongGiaTri)}
          </span>
        </div>
      </div>

      {/* Card List Area */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[150px] max-h-[calc(100vh-280px)]">
        {column.coHoi.length === 0 ? (
          <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-400">
            Kéo cơ hội vào đây
          </div>
        ) : (
          column.coHoi.map((card) => (
            <KanbanCard key={card.id} card={card} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
};

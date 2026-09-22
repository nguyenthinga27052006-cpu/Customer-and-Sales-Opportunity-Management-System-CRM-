import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Building,
  Target,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CalendarEvent } from '../../types/activity.types';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  viewMode: 'day' | 'week' | 'month';
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  onAddEvent?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  onSelectEvent,
  onAddEvent
}) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Date Navigation Helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Format header title
  const getHeaderTitle = () => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    if (viewMode === 'month') {
      return `${months[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'day') {
      return `${currentDate.getDate()} ${months[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
    }
    // Week view: Find start and end of week (Monday to Sunday)
    const day = currentDate.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return `${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}, ${sunday.getFullYear()}`;
  };

  // Helper to parse event date safely
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Event item pill
  const renderEventPill = (event: CalendarEvent) => {
    const isMeeting = event.loai === 'CUOC_GAP';
    const startTime = new Date(event.batDau).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div
        key={event.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEvent(event);
          if (onSelectEvent) onSelectEvent(event);
        }}
        className="px-2 py-1 rounded text-xs font-medium cursor-pointer truncate transition shadow-xs flex items-center gap-1 mb-1 border"
        style={{
          backgroundColor: `${event.mauSac}18`,
          borderColor: `${event.mauSac}50`,
          color: event.mauSac || '#2563eb'
        }}
        title={`${startTime} - ${event.tieuDe}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: event.mauSac || '#2563eb' }}
        />
        <span className="font-semibold">{startTime}</span>
        <span className="truncate">{event.tieuDe}</span>
      </div>
    );
  };

  // --- MONTH VIEW ---
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Days in week: Monday (1) to Sunday (0 -> 7)
    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Treat Sunday as 7

    const daysFromPrevMonth = startDayOfWeek - 1;
    const totalDaysInMonth = lastDay.getDate();

    const calendarCells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month filler
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      calendarCells.push({ date: d, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      calendarCells.push({ date: d, isCurrentMonth: true });
    }
    // Next month filler to make multiple of 7
    const remaining = 7 - (calendarCells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        calendarCells.push({ date: d, isCurrentMonth: false });
      }
    }

    const today = new Date();

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 py-2.5">
          <div>Thứ 2</div>
          <div>Thứ 3</div>
          <div>Thứ 4</div>
          <div>Thứ 5</div>
          <div>Thứ 6</div>
          <div className="text-amber-600 dark:text-amber-400">Thứ 7</div>
          <div className="text-rose-600 dark:text-rose-400">Chủ nhật</div>
        </div>

        {/* Cells Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
          {calendarCells.map((cell, idx) => {
            const isToday = isSameDay(cell.date, today);
            const dayEvents = events.filter((ev) => isSameDay(new Date(ev.batDau), cell.date));

            return (
              <div
                key={idx}
                onClick={() => onAddEvent && onAddEvent(cell.date.toISOString().split('T')[0])}
                className={`min-h-[110px] p-2 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer flex flex-col ${
                  !cell.isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayEvents.length} việc
                    </span>
                  )}
                </div>

                {/* Event list */}
                <div className="flex-1 overflow-y-auto max-h-[85px] space-y-1 scrollbar-thin">
                  {dayEvents.slice(0, 3).map((ev) => renderEventPill(ev))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium pl-1">
                      + {dayEvents.length - 3} sự kiện khác
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- WEEK VIEW ---
  const renderWeekView = () => {
    const day = currentDate.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diffToMonday);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }

    const today = new Date();
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700">
          {weekDays.map((wDate, idx) => {
            const isToday = isSameDay(wDate, today);
            const dayEvents = events.filter((ev) => isSameDay(new Date(ev.batDau), wDate));

            return (
              <div key={idx} className="min-h-[480px] flex flex-col">
                {/* Header */}
                <div
                  className={`p-3 text-center border-b border-slate-200 dark:border-slate-700 ${
                    isToday ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {dayNames[idx]}
                  </div>
                  <div
                    className={`mt-1 text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {wDate.getDate()}
                  </div>
                </div>

                {/* Events list */}
                <div className="p-2 flex-1 space-y-2 overflow-y-auto bg-white dark:bg-slate-900">
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-300 dark:text-slate-600">
                      Không có lịch
                    </div>
                  ) : (
                    dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="p-2 rounded-lg border text-left cursor-pointer transition hover:shadow-md"
                        style={{
                          backgroundColor: `${ev.mauSac}12`,
                          borderColor: `${ev.mauSac}40`
                        }}
                      >
                        <div className="flex items-center justify-between text-xs font-bold" style={{ color: ev.mauSac }}>
                          <span>
                            {new Date(ev.batDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] px-1 rounded bg-white dark:bg-slate-800">
                            {ev.loai === 'CUOC_GAP' ? 'Cuộc gặp' : 'Công việc'}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 line-clamp-2">
                          {ev.tieuDe}
                        </div>
                        {ev.diaDiem && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{ev.diaDiem}</span>
                          </div>
                        )}
                        {ev.khachHang && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{ev.khachHang.tenCongTy}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- DAY VIEW ---
  const renderDayView = () => {
    const dayEvents = events.filter((ev) => isSameDay(new Date(ev.batDau), currentDate));
    // Sort by start time
    dayEvents.sort((a, b) => new Date(a.batDau).getTime() - new Date(b.batDau).getTime());

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Lịch làm việc trong ngày
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng số: {dayEvents.length} sự kiện & nhiệm vụ
            </p>
          </div>
          {onAddEvent && (
            <button
              onClick={() => onAddEvent(currentDate.toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
            >
              + Tạo mới
            </button>
          )}
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-sm">Không có lịch làm việc hoặc công việc nào trong ngày này</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition hover:shadow-md"
                style={{
                  backgroundColor: `${ev.mauSac}08`,
                  borderColor: `${ev.mauSac}40`
                }}
              >
                <div
                  className="w-2.5 self-stretch rounded-full"
                  style={{ backgroundColor: ev.mauSac }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${ev.mauSac}20`,
                          color: ev.mauSac
                        }}
                      >
                        {ev.loai === 'CUOC_GAP' ? 'Cuộc gặp' : 'Nhiệm vụ'}
                      </span>
                      {ev.mucDoUuTien && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {ev.mucDoUuTien}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(ev.batDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(ev.ketThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {ev.tieuDe}
                  </h4>

                  {ev.noiDung && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {ev.noiDung}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {ev.diaDiem && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {ev.diaDiem}
                      </span>
                    )}
                    {ev.khachHang && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {ev.khachHang.tenCongTy}
                      </span>
                    )}
                    {ev.coHoi && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Target className="w-3.5 h-3.5" />
                        {ev.coHoi.tenCoHoi}
                      </span>
                    )}
                    {ev.nguoiPhuTrach && (
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 ml-auto">
                        <User className="w-3.5 h-3.5" />
                        {ev.nguoiPhuTrach.hoTen}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Hôm nay
          </button>
          <div className="flex items-center">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 ml-2">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => onViewModeChange('day')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ngày
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              viewMode === 'month'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Quick Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: selectedEvent.mauSac || '#2563eb' }}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {selectedEvent.loai === 'CUOC_GAP' ? 'Cuộc gặp' : 'Nhiệm vụ'}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {selectedEvent.tieuDe}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(selectedEvent.batDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(selectedEvent.ketThuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' ('}
                    {new Date(selectedEvent.batDau).toLocaleDateString('vi-VN')}
                    {')'}
                  </span>
                </div>
              </div>

              {selectedEvent.noiDung && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedEvent.noiDung}
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {selectedEvent.diaDiem && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedEvent.diaDiem}</span>
                  </div>
                )}
                {selectedEvent.khachHang && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedEvent.khachHang.tenCongTy}</span>
                  </div>
                )}
                {selectedEvent.coHoi && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Target className="w-4 h-4 shrink-0" />
                    <span>{selectedEvent.coHoi.tenCoHoi}</span>
                  </div>
                )}
                {selectedEvent.nguoiPhuTrach && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Phụ trách: <strong>{selectedEvent.nguoiPhuTrach.hoTen}</strong></span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

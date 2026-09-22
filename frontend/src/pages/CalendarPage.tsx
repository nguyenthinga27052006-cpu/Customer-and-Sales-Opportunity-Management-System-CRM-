import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Users,
  User,
  Clock,
  RefreshCw,
  Phone,
  CheckSquare
} from 'lucide-react';
import { CalendarEvent } from '../types/activity.types';
import { activityService } from '../services/activity.service';
import { CalendarView } from '../components/calendar/CalendarView';
import { ActivityModal } from '../components/activities/ActivityModal';
import { TaskModal } from '../components/activities/TaskModal';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [xemTeam, setXemTeam] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // User role check
  const userJson = localStorage.getItem('crm_user');
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const userRoles: string[] = currentUser?.roles || [];
  const canViewTeam = userRoles.some((r) => ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(r));

  // Calculate start and end date range depending on currentDate and viewMode
  const getRangeForQuery = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Fetch 1 month before to 1 month after to ensure all grid cells have data
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month + 2, 0, 23, 59, 59);

    return {
      tuNgay: start.toISOString(),
      denNgay: end.toISOString(),
    };
  };

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const range = getRangeForQuery();
      const res = await activityService.layLichLamViec({
        ...range,
        xemTeam: canViewTeam ? xemTeam : false,
      });
      setEvents(res.suKien || []);
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Không thể tải lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
  }, [currentDate.getFullYear(), currentDate.getMonth(), xemTeam]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Lịch làm việc & Nhiệm vụ (Calendar)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp lịch họp khách hàng và thời hạn công việc (Múi giờ Asia/Ho_Chi_Minh) (S6-07)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Team toggle for Team Leads */}
          {canViewTeam && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setXemTeam(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  !xemTeam
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Cá nhân
              </button>
              <button
                onClick={() => setXemTeam(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  xemTeam
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Toàn đội (Team)
              </button>
            </div>
          )}

          <button
            onClick={loadCalendarEvents}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Làm mới lịch"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setActivityModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            Lên lịch họp
          </button>

          <button
            onClick={() => setTaskModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo công việc
          </button>
        </div>
      </div>

      {/* Calendar View Component */}
      <CalendarView
        events={events}
        currentDate={currentDate}
        onDateChange={(newDate) => setCurrentDate(newDate)}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        onAddEvent={(dateStr) => {
          setActivityModalOpen(true);
        }}
      />

      {/* Modals */}
      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSuccess={() => {
          setActivityModalOpen(false);
          loadCalendarEvents();
        }}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={() => {
          setTaskModalOpen(false);
          loadCalendarEvents();
        }}
      />
    </div>
  );
};

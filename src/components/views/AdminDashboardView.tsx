import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Users,
  Brain,
  Crown,
  DollarSign,
  Send,
  Sparkles,
  Activity,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell
} from 'lucide-react';
import { Api } from '../../services/api';
import { AdminStats } from '../../types';

export const AdminDashboardView: React.FC = () => {
  const { user, language, setView, triggerHaptic } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAr = language === 'ar';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await Api.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load admin telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    try {
      await Api.sendAdminBroadcast(broadcastTitle, broadcastMsg);
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMsg('');
      triggerHaptic('success');
      setTimeout(() => setBroadcastSuccess(false), 3000);
      loadStats();
    } catch (err) {
      console.error('Error broadcasting notification', err);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await Api.updateAdminRole('persona_admin_secret_2026', targetUserId, newRole);
      triggerHaptic('medium');
      loadStats();
    } catch (e) {
      console.error('Error modifying user role', e);
    }
  };

  if (loading || !stats) {
    return (
      <div className="py-20 text-center text-zinc-400 text-xs">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        {isAr ? 'جاري تحميل لوحة التحكم المركزية...' : 'Loading Admin Command Center...'}
      </div>
    );
  }

  const filteredUsers = stats.users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.id.includes(searchQuery)
  );

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#20202E]">
        <button
          onClick={() => setView('home')}
          className="p-2 rounded-xl bg-[#161622] border border-[#252535] text-zinc-300 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
        >
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{isAr ? 'الرئيسية' : 'Back'}</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">{isAr ? 'منطقة المشرفين' : 'Admin Security Zone'}</span>
          <h1 className="text-xs font-bold text-white">{isAr ? 'لوحة القيادة المركزية' : 'Platform Telemetry'}</h1>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333]">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>{isAr ? 'المستخدمون' : 'Total Users'}</span>
            <Users className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">{stats.totalUsers}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">{stats.activeUsers24h} {isAr ? 'نشط اليوم' : 'active 24h'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333]">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>{isAr ? 'التحليلات' : 'Analyses'}</span>
            <Brain className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">{stats.completedAnalyses}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{isAr ? 'مكتملة' : 'completed'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333]">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>{isAr ? 'المشتركون' : 'Premium'}</span>
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{stats.premiumUsers}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">${stats.revenueEst} {isAr ? 'تقديري' : 'revenue'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333]">
          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
            <span>{isAr ? 'طلبات AI' : 'AI Calls'}</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">{stats.aiRequestsCount}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Gemini 3.7 Flash</div>
        </div>
      </div>

      {/* Broadcast Notification Module */}
      <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">
            {isAr ? 'بث إشعار جماعي لكافة المستخدمين' : 'Broadcast System Notification'}
          </h3>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-2.5">
          <input
            type="text"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder={isAr ? 'عنوان الإشعار (مثلاً: ميزة جديدة متاحة 🚀)' : 'Notification Title...'}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#0D0D14] border border-[#252535] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />

          <textarea
            rows={2}
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder={isAr ? 'نص الرسالة المنشورة في إشعارات المستخدمين...' : 'Notification body message...'}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#0D0D14] border border-[#252535] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />

          <div className="flex items-center justify-between pt-1">
            {broadcastSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> {isAr ? 'تم إرسال الإشعار لجميع المستخدمين بنجاح!' : 'Broadcast successfully sent!'}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500">{isAr ? 'سيصل الإشعار إلى صندوق التنبيهات' : 'Pushed to user notification center'}</span>
            )}

            <button
              type="submit"
              disabled={!broadcastTitle.trim() || !broadcastMsg.trim()}
              className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال الإشعار' : 'Broadcast'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User Management & Role Control */}
      <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">
              {isAr ? 'إدارة المستخدمين والصلاحيات' : 'User Directory & Access Control'}
            </h3>
          </div>
          <span className="text-xs text-zinc-500">{filteredUsers.length} users</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، المعرف، أو ID...' : 'Search by name, username or ID...'}
            className="w-full py-2 px-3 pl-9 rounded-xl bg-[#0D0D14] border border-[#252535] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="p-3 rounded-2xl bg-[#0F0F16] border border-[#20202E] flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{u.firstName} {u.lastName || ''}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">(@{u.username || 'user'})</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  ID: #{u.telegramId} • Level {u.level} ({u.xp} XP)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="py-1 px-2 rounded-lg bg-[#1C1C28] border border-[#2C2C3E] text-[11px] font-mono text-amber-300 focus:outline-none cursor-pointer"
                >
                  <option value="user">USER</option>
                  <option value="premium">PREMIUM</option>
                  <option value="moderator">MODERATOR</option>
                  <option value="admin">ADMIN</option>
                  <option value="super_admin">SUPER ADMIN</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">
            {isAr ? 'سجل العمليات والتدقيق الأمني' : 'System Audit Telemetry'}
          </h3>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {stats.recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-[#0F0F16] border border-[#20202E] text-[11px] font-mono flex items-center justify-between"
            >
              <div>
                <span className="text-purple-300 font-bold">[{log.action}]</span>{' '}
                <span className="text-zinc-400">{log.details}</span>
              </div>
              <span className="text-[9px] text-zinc-600 shrink-0 ml-2">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

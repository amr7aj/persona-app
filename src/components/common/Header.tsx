import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Bell, Shield, Globe, Award, Bot, ChevronRight, Check, Target, Settings } from 'lucide-react';
import { NotificationsDrawer } from './NotificationsDrawer';

export const Header: React.FC = () => {
  const { user, language, setLanguage, unreadNotifsCount, currentView, setView } = useApp();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const isAr = language === 'ar';

  return (
    <header id="persona-main-header" className="sticky top-0 z-40 w-full bg-[#0B0B0F]/90 backdrop-blur-md border-b border-[#1F1F28] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-purple-500/30 to-violet-600/30 border border-amber-500/30 flex items-center justify-center shadow-sm shadow-purple-900/20">
            <Sparkles className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-wider text-white">PERSONA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">
                AI CORE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-none">
              {isAr ? 'منصة الذكاء الشخصي' : 'Personality Intelligence'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Goals Tracker Direct Access */}
          <button
            id="header-goals-btn"
            onClick={() => setView('goals')}
            title={isAr ? 'أهدافي والتوجيه اليومي' : 'Personal Goals Tracker'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              currentView === 'goals'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-[#18181F] text-zinc-300 border-[#272733] hover:border-amber-500/40'
            }`}
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline font-medium text-xs">{isAr ? 'الأهداف' : 'Goals'}</span>
          </button>

          {/* Bot Simulator Access */}
          <button
            id="header-bot-sim-btn"
            onClick={() => setView('bot')}
            title={isAr ? 'محاكي بوت تيليجرام' : 'Telegram Bot Simulator'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              currentView === 'bot'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-[#18181F] text-zinc-300 border-[#272733] hover:border-zinc-500'
            }`}
          >
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline font-medium text-xs">Bot</span>
          </button>

          {/* Admin Access (if admin or clickable) */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <button
              id="header-admin-btn"
              onClick={() => setView('admin')}
              className={`p-2 rounded-lg border transition-all ${
                currentView === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#18181F] text-zinc-400 border-[#272733] hover:text-amber-300'
              }`}
              title={isAr ? 'لوحة الإدارة' : 'Admin Panel'}
            >
              <Shield className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Language Toggle */}
          <button
            id="header-lang-btn"
            onClick={() => setLanguage(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18181F] border border-[#272733] hover:border-zinc-500 text-xs text-zinc-200 transition-colors font-medium"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Settings Access */}
          <button
            id="header-settings-btn"
            onClick={() => setView('settings')}
            title={isAr ? 'الإعدادات الاحترافية' : 'Settings'}
            className={`p-2 rounded-lg border transition-all ${
              currentView === 'settings'
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-sm'
                : 'bg-[#18181F] text-zinc-300 border-[#272733] hover:border-purple-500/40 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <button
            id="header-notif-btn"
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-lg bg-[#18181F] border border-[#272733] hover:border-zinc-500 text-zinc-300 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <NotificationsDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </header>
  );
};

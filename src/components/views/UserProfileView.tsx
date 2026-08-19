import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Crown,
  Globe,
  Award,
  Gift,
  LogOut,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Share2,
  Users,
  LogIn,
  Key,
  Mail,
  Zap,
  Settings
} from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';

export const UserProfileView: React.FC = () => {
  const {
    user,
    latestReport,
    language,
    setLanguage,
    openPremiumModal,
    openShareModal,
    setView,
    startAssessment,
    logout
  } = useApp();

  const isAr = language === 'ar';

  const isPremiumUser = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'super_admin';
  const archetype = latestReport?.archetype || ARCHETYPES[latestReport?.archetypeId || 'strategic-builder'];

  return (
    <div id="user-profile-view" className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Profile Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#181826] via-[#14141E] to-[#101017] border border-[#2A2A3E] space-y-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.firstName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/40 shadow-lg"
            />
            {isPremiumUser && (
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-black shadow">
                <Crown className="w-3.5 h-3.5 fill-black" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  {user?.firstName} {user?.lastName || ''}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              @{user?.username || 'user'} • #{user?.telegramId || user?.id}
            </p>
            {user?.email && (
              <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-[#9061F9]" />
                <span>{user.email}</span>
              </p>
            )}

            <div className="text-[11px] text-amber-400 font-semibold mt-1">
              {archetype ? (isAr ? archetype.nameAr : archetype.nameEn) : (isAr ? 'لم يُكتشف النمط بعد' : 'Not analyzed yet')}
            </div>
          </div>
        </div>

        {/* Level and XP progress */}
        <div className="p-4 rounded-2xl bg-[#0D0D14] border border-[#20202E] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isAr ? `المستوى ${user?.level || 1}` : `Level ${user?.level || 1}`}</span>
            </span>
            <span className="font-mono text-zinc-400">
              {user?.xp || 100} / {(user?.level || 1) * 200} XP
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#181824] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400"
              style={{ width: `${Math.min(100, (((user?.xp || 100) % 200) / 200) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Account Switcher & Auth Portal */}
      <div className="grid grid-cols-2 gap-3">
        <button
          id="btn-switch-account"
          onClick={() => setView('auth')}
          className="p-3.5 rounded-2xl bg-[#18181F] hover:bg-white/5 border border-white/10 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#A4CAFE]" />
            <div className="text-start">
              <div className="text-xs font-bold text-white">{isAr ? 'تبديل الحساب' : 'Switch Account'}</div>
              <div className="text-[10px] text-[#9CA3AF]">{isAr ? 'تسجيل دخول أو ضيف' : 'Login / Guest'}</div>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-[#9CA3AF] ${isAr ? 'rotate-180' : ''}`} />
        </button>

        <button
          id="btn-retest-mode"
          onClick={() => startAssessment('full')}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-[#7E3AF2]/30 to-[#9061F9]/30 border border-[#9061F9]/40 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-300" />
            <div className="text-start">
              <div className="text-xs font-bold text-white">{isAr ? 'إعادة التقييم 2026' : 'Retake Test'}</div>
              <div className="text-[10px] text-amber-300/80">{isAr ? 'أسئلة محدثة جديدة' : 'Fresh questions'}</div>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-[#9061F9] ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 3. Premium Upgrade Banner */}
      {!isPremiumUser && (
        <div
          onClick={openPremiumModal}
          className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-950/40 to-amber-500/20 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 shadow-md">
              <Crown className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="font-bold text-xs text-white">
                {isAr ? 'الترقية إلى PERSONA Premium' : 'Upgrade to PERSONA Premium'}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isAr ? 'افتح تحليلات الحميمية والعلاقات والذكاء الاصطناعي الكامل' : 'Unlock full intimacy, relationship & AI reports'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
        </div>
      )}

      {/* 4. Settings & Actions List */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-sm text-white">
          {isAr ? 'إعدادات المنصة والتخصيص' : 'Platform Preferences'}
        </h3>

        {/* Dedicated Professional Settings Portal */}
        <div
          onClick={() => setView('settings')}
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#1A162B] to-amber-500/10 border border-purple-500/40 hover:border-purple-400 flex items-center justify-between cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{isAr ? 'الإعدادات الاحترافية الشاملة' : 'Professional Settings'}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">PRO</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {isAr ? 'المظهر، نبرة المدرب الذكي، التنبيهات، والخصوصية وتصدير البيانات' : 'Themes, AI coach tone, habits & export'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Language selector */}
        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-white">{isAr ? 'لغة الواجهة' : 'Language'}</span>
          </div>
          <div className="flex gap-1 bg-[#0E0E14] p-1 rounded-xl border border-[#222230]">
            <button
              onClick={() => setLanguage('ar')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                isAr ? 'bg-amber-400 text-black' : 'text-zinc-400'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                !isAr ? 'bg-amber-400 text-black' : 'text-zinc-400'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Referral portal */}
        <div
          onClick={() => setView('referrals')}
          className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] hover:border-[#383850] flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <Gift className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-semibold text-white">{isAr ? 'برنامج الإحالة والمكافآت' : 'Referral & Bonus Program'}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {isAr ? `كودك: ${user?.referralCode || 'PERSONA-7X92'}` : `Code: ${user?.referralCode || 'PERSONA-7X92'}`}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </div>

        {/* Telegram Bot Simulator Shortcut */}
        <div
          onClick={() => setView('bot')}
          className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] hover:border-[#383850] flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#A4CAFE]" />
            <span className="text-xs font-semibold text-white">
              {isAr ? 'المساعد الذكي التفاعلي (AI Coach)' : 'Interactive AI Bot & Coach'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </div>

        {/* Logout button */}
        <button
          id="btn-logout"
          onClick={logout}
          className="w-full p-4 rounded-2xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 flex items-center justify-between cursor-pointer transition-all text-xs font-semibold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-red-400" />
            <span>{isAr ? 'تسجيل الخروج من الحساب' : 'Sign Out'}</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-red-400/60 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 5. Privacy and Non-Diagnostic Notice */}
      <div className="p-4 rounded-2xl bg-[#111118] border border-[#20202E] flex items-start gap-3 text-zinc-400">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          {isAr
            ? 'تلتزم منصة PERSONA بأعلى معايير الخصوصية والأمان. لا يتم مشاركة إجاباتك إطلاقاً مع جهات خارجية، وتخضع لسياسة سرية صارمة.'
            : 'PERSONA strictly encrypts all response data under top-tier privacy standards. Your psychometric data is never shared with third parties.'}
        </p>
      </div>
    </div>
  );
};

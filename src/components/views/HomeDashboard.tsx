import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Heart,
  Users,
  Briefcase,
  Activity,
  Flame,
  Crown,
  ChevronRight,
  Share2,
  Award,
  RefreshCw,
  Gift,
  Calendar,
  Compass,
  MessageSquareText,
  Bot,
  Target,
  Zap
} from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';
import { CompatibilityMatcher } from '../tools/CompatibilityMatcher';
import { InteractivePersonalityRadar } from '../dashboard/InteractivePersonalityRadar';

export const HomeDashboard: React.FC = () => {
  const { user, latestReport, setView, openShareModal, openPremiumModal, language } = useApp();
  const isAr = language === 'ar';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isAr ? 'صباح الخير' : 'Good morning';
    if (hour < 18) return isAr ? 'مساء الخير' : 'Good afternoon';
    return isAr ? 'طاب مساؤك' : 'Good evening';
  };

  const archetype = latestReport
    ? latestReport.archetype || ARCHETYPES[latestReport.archetypeId]
    : ARCHETYPES['strategic-builder'];

  const isPremiumUser = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="pb-24 pt-4 px-4 max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* 1. Top Greeting & Level Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {getGreeting()}, {user?.firstName || 'Amr'} 👋
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isAr ? 'مرحباً بك في لوحة تحليلك الشخصي' : 'Welcome to your intelligence command center'}
          </p>
        </div>

        <div
          onClick={() => setView('profile')}
          className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-[#171720] border border-[#262638] cursor-pointer hover:border-amber-500/40 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
            {user?.level || 3}
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 leading-none">LVL {user?.level || 3}</div>
            <div className="text-[11px] font-bold text-amber-400 font-mono leading-none mt-0.5">
              {user?.xp || 450} XP
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Hero Card: Personality Blueprint or Empty State */}
      {latestReport ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181826] via-[#14141F] to-[#101017] border border-[#2A2A3E] p-5 shadow-xl">
          {/* Subtle decorative glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Card Top Label */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-[11px] text-zinc-300">
                {isAr ? 'النمط السلوكي المعتمد' : 'Verified Blueprint'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(latestReport.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Archetype Title & Tagline */}
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono font-semibold text-purple-400 tracking-wider uppercase">
                {isAr ? 'النمط القيادي' : 'Core Archetype'}
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {isAr ? archetype?.nameAr : archetype?.nameEn}
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {isAr ? archetype?.taglineAr : archetype?.taglineEn}
              </p>
            </div>

            {/* Score Ring / Badge */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0F0F16] border border-[#252535] shrink-0 min-w-[70px]">
              <span className="text-[10px] text-zinc-500 uppercase font-medium">{isAr ? 'المؤشر' : 'Index'}</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {latestReport.overallScore}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400">{isAr ? 'اكتمال بناء الملف الشخصي' : 'Profile Synthesis'}</span>
              <span className="text-amber-400 font-mono font-bold">{latestReport.overallScore}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0D0D14] overflow-hidden p-0.5 border border-[#20202E]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-amber-500 to-yellow-400 transition-all duration-1000"
                style={{ width: `${latestReport.overallScore}%` }}
              ></div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              id="view-full-analysis-btn"
              onClick={() => setView('results')}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
            >
              <span>{isAr ? 'عرض التحليل الشامل' : 'View Full Analysis'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="share-result-hero-btn"
              onClick={() => openShareModal(latestReport)}
              className="py-3 px-4 rounded-xl bg-[#1C1C29] hover:bg-[#252538] border border-[#2D2D42] text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'مشاركة النتيجة' : 'Share Result'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl bg-[#14141E] border border-dashed border-[#2C2C3D] p-7 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isAr ? 'ملفك الشخصي لم يُبنَ بعد' : 'Your personality profile is not yet synthesized'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {isAr
                ? 'ابدأ جلسة التحليل لاكتشاف نمط تفكيرك وعواطفك وعلاقاتك وتوليد تقرير الذكاء الاصطناعي الخاص بك.'
                : 'Take the multidimensional assessment to discover your archetype and unlock personalized AI intelligence.'}
            </p>
          </div>
          <button
            onClick={() => setView('analysis')}
            className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{isAr ? 'ابدأ جلسة التحليل الآن' : 'Begin Your Analysis'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Daily Reflection & Micro-Insight Prompt */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-[#151520] border border-purple-800/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
          <Compass className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-purple-300">
            {isAr ? 'تأمل اليوم في مسار نموك' : 'Daily Growth Reflection'}
          </div>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            {isAr
              ? '«القوة الحقيقية تبدأ عندما تدرك أن المشاعر ليست عوائق بل إشارات ترشدك لأولوياتك الحقيقية.»'
              : '"True emotional resilience awakens when you treat emotions not as obstacles, but as diagnostic signals."'}
          </p>
        </div>
      </div>

      {/* 4. Interactive Real-Time Personality Dimensions Radar Chart */}
      <InteractivePersonalityRadar />

      {/* 5. 24-Hour Growth Challenge Based on Weakest Dimension */}
      <div
        onClick={() => setView('growth')}
        className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#191529] to-indigo-950/40 border border-purple-600/40 flex items-center justify-between cursor-pointer hover:border-purple-500 transition-all shadow-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">{isAr ? 'تحدي النمو اليومي (24 ساعة)' : '24h Growth Challenge'}</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-500/20 text-emerald-300 font-mono">+60 XP</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {isAr ? 'تحدٍ سلوكي مخصص لعلاج أضعف أبعاد شخصيتك وتطويرها' : 'Actionable micro-challenge targeting your weakest vector'}
            </p>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-[#121217] border border-white/10 text-purple-300 group-hover:translate-x-1 transition-transform">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 6. Personal Goals & AI Check-in Prompt Banner */}
      <div
        onClick={() => setView('goals')}
        className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#181824] to-purple-600/15 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition-all shadow-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">{isAr ? 'الأهداف الحياتية ومتابعة الذكاء النفسي' : 'Personal Goals & AI Check-in'}</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-500/20 text-amber-300 font-mono">NEW</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {isAr ? 'تتبع عاداتك اليومية مع أسئلة تقييم سلوكية مصممة لنمطك' : 'Track lifestyle habits with psychological prompts'}
            </p>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-[#121217] border border-white/10 text-amber-300 group-hover:translate-x-1 transition-transform">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 6. Direct AI Coach Interaction Banner */}
      <div
        onClick={() => setView('bot')}
        className="p-4 rounded-3xl bg-gradient-to-r from-[#7E3AF2]/20 via-[#18181F] to-[#9061F9]/20 border border-[#9061F9]/40 flex items-center justify-between cursor-pointer hover:border-[#9061F9] transition-all shadow-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7E3AF2] to-[#9061F9] text-white flex items-center justify-center shadow-lg shadow-[#7E3AF2]/30 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">{isAr ? 'المساعد والمدرب السلوكي المباشر' : 'Live AI Behavioral Coach'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {isAr ? 'تحدث مع المدرب، اختبر مواقفك، واطلب توجيهات فورية' : 'Chat, test dilemmas, and get real-time guidance'}
            </p>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-[#121217] border border-white/10 text-amber-300 group-hover:translate-x-1 transition-transform">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 6. Archetype Compatibility & Chemistry Matcher */}
      <CompatibilityMatcher />

      {/* 7. Referral & Friend Invite Banner */}
      <div
        onClick={() => setView('referrals')}
        className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#161622] to-purple-600/10 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-white">
              {isAr ? 'ادعُ أصدقاءك واكسب +100 XP' : 'Invite Friends & Earn +100 XP'}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {isAr ? `كودك: ${user?.referralCode || 'PERSONA-7X92'}` : `Code: ${user?.referralCode || 'PERSONA-7X92'}`}
            </div>
          </div>
        </div>

        <span className="p-2 rounded-xl bg-[#20202E] text-amber-400">
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>

      {/* 6. Quick Retest CTA */}
      <div className="text-center pt-2">
        <button
          onClick={() => setView('analysis')}
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors py-2 px-4 rounded-xl hover:bg-white/5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
          <span>{isAr ? 'إعادة تقييم الشخصية وتحديث البيانات' : 'Retake Assessment & Update Profile'}</span>
        </button>
      </div>
    </div>
  );
};

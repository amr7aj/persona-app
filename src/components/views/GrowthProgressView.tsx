import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Api } from '../../services/api';
import { GrowthMetric } from '../../types';
import { GrowthChallengesSection } from './GrowthChallengesSection';

export const GrowthProgressView: React.FC = () => {
  const { user, latestReport, language, setView } = useApp();
  const [growthHistory, setGrowthHistory] = useState<GrowthMetric[]>([]);
  const isAr = language === 'ar';

  useEffect(() => {
    if (user) {
      Api.getUserGrowth(user.id).then(setGrowthHistory).catch(console.error);
    }
  }, [user]);

  const defaultBadges = [
    { id: 'self_aware', titleAr: 'الوعي الذاتي العميق', titleEn: 'Deep Self-Awareness', icon: '🧠', descAr: 'إتمام كافة محاور التقييم النفسي بنجاح.' },
    { id: 'goal_hunter', titleAr: 'صائد الأهداف', titleEn: 'Goal Hunter', icon: '🎯', descAr: 'تحديد مسار التطوير المهني بدقة 90%+.' },
    { id: 'completed_profile', titleAr: 'الملف المعتمد', titleEn: 'Certified Profile', icon: '🛡️', descAr: 'بناء خارطة الأبعاد التسعة وتوثيقها.' },
    { id: 'influencer', titleAr: 'السفير الملهم', titleEn: 'Growth Ambassador', icon: '💎', descAr: 'دعوة 3+ أصدقاء لمنصة PERSONA.' }
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Header */}
      <div>
        <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
          {isAr ? 'منظومة تتبع النضج السلوكي' : 'Longitudinal Behavioral Evolution'}
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
          {isAr ? 'تطورك ونموك الزمني' : 'Your Growth & Progress'}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {isAr ? 'تتبع كيف تطورت قراراتك واستقرارك العاطفي عبر السنين' : 'Track how your emotional regulation and focus evolve across time'}
        </p>
      </div>

      {/* 2. Featured 24-Hour Micro Growth Challenge Based on Weakest Dimension */}
      <GrowthChallengesSection />

      {/* 3. Timeline Comparison Card (2026 Evolution) */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-[#181826] via-[#14141E] to-[#101017] border border-[#2B2B3E] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              {isAr ? 'مقارنة النمو التراكمي (2026)' : 'Multi-Month Growth Delta'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            +14% Overall
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-[#0F0F16] border border-[#20202E] text-center">
            <div className="text-[10px] text-zinc-400">{isAr ? 'الانضباط' : 'Discipline'}</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">91%</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">+16% ↑</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#0F0F16] border border-[#20202E] text-center">
            <div className="text-[10px] text-zinc-400">{isAr ? 'الوعي العاطفي' : 'Emotional'}</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">85%</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">+15% ↑</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#0F0F16] border border-[#20202E] text-center">
            <div className="text-[10px] text-zinc-400">{isAr ? 'إدارة الضغوط' : 'Calmness'}</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">80%</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">+15% ↑</div>
          </div>
        </div>

        {/* Retest invitation */}
        <div className="p-3 rounded-2xl bg-[#171722] border border-[#252535] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>{isAr ? 'موعد التقييم الدوري القادم: بعد 30 يوماً' : 'Recommended re-assessment: in 30 days'}</span>
          </div>
          <button
            onClick={() => setView('analysis')}
            className="text-amber-400 font-bold hover:underline"
          >
            {isAr ? 'تقييم الآن' : 'Retest Now'}
          </button>
        </div>
      </div>

      {/* 3. Badges & Milestone Rewards Collection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              {isAr ? 'مجموعة الأوسمة والإنجازات' : 'Badges & Achievements'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 font-bold">
            {user?.badges?.length || 4} / 12
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {defaultBadges.map((b) => {
            const isUnlocked = user?.badges?.includes(b.id) ?? true;
            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-[#14141E] border-[#252538] text-white shadow-sm'
                    : 'bg-[#101016] border-[#1C1C26] text-zinc-600 opacity-60'
                }`}
              >
                <div className="text-2xl mb-1.5">{b.icon}</div>
                <div className="font-bold text-xs">
                  {isAr ? b.titleAr : b.titleEn}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 leading-snug">
                  {isAr ? b.descAr : b.descAr}
                </div>
                <div className="mt-2 text-[9px] font-mono font-semibold uppercase text-emerald-400">
                  {isUnlocked ? (isAr ? '✓ مكتمل' : '✓ Unlocked') : (isAr ? '🔒 مقفل' : '🔒 Locked')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

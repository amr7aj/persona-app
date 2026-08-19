import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Share2,
  Brain,
  Heart,
  Users,
  Briefcase,
  Activity,
  Flame,
  CheckCircle2,
  AlertCircle,
  Crown,
  ChevronRight,
  Shield,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';
import { RadarChart } from '../common/RadarChart';

export const ResultsView: React.FC = () => {
  const { latestReport, user, language, openShareModal, openPremiumModal, setView } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'domains' | 'growth'>('overview');

  const isAr = language === 'ar';
  const isPremiumUser = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'super_admin';

  if (!latestReport) {
    return (
      <div className="py-16 text-center space-y-4 px-4">
        <h2 className="text-lg font-bold text-white">
          {isAr ? 'لم يتم العثور على تقرير نشط' : 'No Active Assessment Found'}
        </h2>
        <button
          onClick={() => setView('analysis')}
          className="py-3 px-6 rounded-xl bg-amber-400 text-black font-bold text-xs"
        >
          {isAr ? 'بدء تحليل جديد' : 'Start Assessment'}
        </button>
      </div>
    );
  }

  const archetype = latestReport.archetype || ARCHETYPES[latestReport.archetypeId] || ARCHETYPES['strategic-builder'];
  const aiReport = latestReport.aiReport;

  const radarData = [
    { label: isAr ? 'العقل' : 'Mind', value: latestReport.domainScores.cognitive },
    { label: isAr ? 'المشاعر' : 'Emotion', value: latestReport.domainScores.emotional },
    { label: isAr ? 'المجتمع' : 'Social', value: latestReport.domainScores.social },
    { label: isAr ? 'الانضباط' : 'Discipline', value: latestReport.domainScores.behavioral },
    { label: isAr ? 'الدافعية' : 'Drive', value: latestReport.domainScores.motivation },
    { label: isAr ? 'الجسد' : 'Body', value: latestReport.domainScores.lifestyle },
    { label: isAr ? 'العلاقات' : 'Relation', value: latestReport.domainScores.relationships },
    { label: isAr ? 'الحميمية' : 'Intimacy', value: latestReport.domainScores.intimacy },
    { label: isAr ? 'المهنة' : 'Career', value: latestReport.domainScores.career },
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Main Hero Identity Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#181826] via-[#13131D] to-[#0E0E14] border border-[#2B2B3E] p-6 shadow-2xl overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Badge & Timestamp */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-[11px] text-zinc-300">
              {isAr ? 'الذكاء الشخصي المعتمد' : 'Verified Intelligence Blueprint'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">v{latestReport.version || '2026.1'}</span>
        </div>

        {/* Archetype Title */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono font-bold text-purple-400 tracking-wider uppercase">
              {isAr ? 'النمط السلوكي الرئيسي' : 'Core Archetype'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              {isAr ? archetype.nameAr : archetype.nameEn}
            </h1>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {isAr ? archetype.taglineAr : archetype.taglineEn}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0D0D14] border border-[#232333] shrink-0 min-w-[76px] shadow-inner">
            <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'المؤشر' : 'Index'}</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {latestReport.overallScore}%
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-4 rounded-2xl bg-[#111118]/80 border border-[#222230] text-xs text-zinc-300 leading-relaxed">
          {isAr ? archetype.descriptionAr : archetype.descriptionEn}
        </div>

        {/* Share & Export CTAs */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => openShareModal(latestReport)}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{isAr ? 'مشاركة بطاقة الشخصية' : 'Share Card'}</span>
          </button>

          <button
            onClick={() => setView('growth')}
            className="py-3 px-4 rounded-xl bg-[#1A1A26] hover:bg-[#252538] border border-[#2B2B3E] text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'مسار التطور' : 'Growth Radar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#12121A] border border-[#20202E]">
        {[
          { id: 'overview', labelAr: 'الملخص', labelEn: 'Summary' },
          { id: 'strengths', labelAr: 'السمات', labelEn: 'Traits' },
          { id: 'domains', labelAr: 'الأبعاد', labelEn: 'Domains' },
          { id: 'growth', labelAr: 'التوصيات', labelEn: 'Advice' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-[#1F1F2E] text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: OVERVIEW & GEMINI REPORT */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fade-in">
          {/* Executive Summary */}
          <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'الملخص التنفيذي للذكاء الاصطناعي' : 'Executive AI Synthesis'}
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {isAr
                ? aiReport?.executiveSummaryAr || archetype.descriptionAr
                : aiReport?.executiveSummaryEn || archetype.descriptionEn}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#0F0F16] border border-[#20202E] text-xs text-purple-300 italic">
              «{isAr ? aiReport?.finalProfileQuoteAr || archetype.taglineAr : aiReport?.finalProfileQuoteEn || archetype.taglineEn}»
            </div>
          </div>

          {/* Multidimensional Radar Chart */}
          <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] flex flex-col items-center text-center space-y-3">
            <div>
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'خارطة الأبعاد التسعة' : '9-Dimensional Radar Blueprint'}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isAr ? 'توزيع طاقتك النفسية وتوازنك السلوكي' : 'Psychological vector equilibrium'}
              </p>
            </div>

            <div className="py-2">
              <RadarChart data={radarData} size={270} highlightColor="#F59E0B" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRENGTHS & BLIND SPOTS */}
      {activeTab === 'strengths' && (
        <div className="space-y-4 animate-fade-in">
          {/* Strengths */}
          <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'أبرز نقاط القوة الطبيعية' : 'Primary Strengths'}
              </h3>
            </div>

            <div className="space-y-2">
              {(isAr ? aiReport?.strengthsAr || archetype.strengthsAr : aiReport?.strengthsEn || archetype.strengthsEn).map((str: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#181824] border border-[#252535] text-xs text-zinc-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blind Spots */}
          <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'النقاط العمياء وفرص النمو' : 'Blind Spots & Growth Vectors'}
              </h3>
            </div>

            <div className="space-y-2">
              {(isAr ? aiReport?.blindSpotsAr || archetype.blindSpotsAr : aiReport?.blindSpotsEn || archetype.blindSpotsEn).map((spot: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#181824] border border-[#252535] text-xs text-zinc-300">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    !
                  </div>
                  <span>{spot}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOMAINS */}
      {activeTab === 'domains' && (
        <div className="space-y-3 animate-fade-in">
          {[
            { id: 'mind', titleAr: 'العقل والتفكير التحليلي', titleEn: 'Cognition & Mind', score: latestReport.domainScores.cognitive, icon: <Brain className="w-4 h-4 text-violet-400" /> },
            { id: 'emotional', titleAr: 'الذكاء العاطفي والاستقرار', titleEn: 'Emotional Intelligence', score: latestReport.domainScores.emotional, icon: <Heart className="w-4 h-4 text-pink-400" /> },
            { id: 'social', titleAr: 'الذكاء الاجتماعي والحضور', titleEn: 'Social & Communication', score: latestReport.domainScores.social, icon: <Users className="w-4 h-4 text-sky-400" /> },
            { id: 'career', titleAr: 'العمل والريادة والمال', titleEn: 'Career & Ambition', score: latestReport.domainScores.career, icon: <Briefcase className="w-4 h-4 text-amber-400" /> },
            { id: 'lifestyle', titleAr: 'الجسد والطاقة الحيوية', titleEn: 'Body & Vitality', score: latestReport.domainScores.lifestyle, icon: <Activity className="w-4 h-4 text-emerald-400" /> },
            { id: 'intimacy', titleAr: 'الحميمية والتواصل العميق', titleEn: 'Intimacy & Connection', score: latestReport.domainScores.intimacy, icon: <Flame className="w-4 h-4 text-rose-400" />, isPremium: true },
          ].map((d) => (
            <div
              key={d.id}
              onClick={() => {
                if (d.isPremium && !isPremiumUser) {
                  openPremiumModal();
                } else {
                  setView('dimension', d.id);
                }
              }}
              className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] hover:border-[#383852] flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1C1C29]">{d.icon}</div>
                <div>
                  <div className="font-semibold text-xs text-white">
                    {isAr ? d.titleAr : d.titleEn}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {isAr ? `مؤشر التوازن: ${d.score}%` : `Equilibrium: ${d.score}%`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {d.isPremium && !isPremiumUser && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    PRO
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-amber-400">{d.score}%</span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: GROWTH & ADVICE */}
      {activeTab === 'growth' && (
        <div className="space-y-4 animate-fade-in">
          {/* Personalized Growth Advice */}
          <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'خطة النمو الشخصي المخصصة' : 'Actionable Growth Blueprint'}
              </h3>
            </div>

            <div className="space-y-2.5">
              {(isAr ? aiReport?.growthOpportunitiesAr || archetype.strengthsAr : aiReport?.growthOpportunitiesEn || archetype.strengthsEn).map((adv: string, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-[#171724] border border-[#252538] flex items-start gap-3 text-xs text-zinc-300 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stress Response Guidelines */}
          <div className="p-5 rounded-3xl bg-[#14141E] border border-[#232333] space-y-2">
            <h3 className="font-bold text-sm text-white">
              {isAr ? 'التعامل مع الضغوط والتحديات' : 'Stress Response Strategy'}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isAr ? aiReport?.stressPatternAr || archetype.stressResponseAr : aiReport?.stressPatternEn || archetype.stressResponseEn}
            </p>
          </div>
        </div>
      )}

      {/* 4. Retest & Action Buttons */}
      <div className="text-center pt-3 pb-6">
        <button
          onClick={() => setView('analysis')}
          className="text-xs text-zinc-400 hover:text-white py-2 px-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isAr ? '↺ إعادة الاختبار لتحديث التحليل' : '↺ Retake assessment to update profile'}
        </button>
      </div>
    </div>
  );
};

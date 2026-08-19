import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Users, Briefcase, Zap, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';
import { useApp } from '../../context/AppContext';

export const CompatibilityMatcher: React.FC = () => {
  const { language, latestReport, triggerHaptic } = useApp();
  const isAr = language === 'ar';

  const archetypeKeys = Object.keys(ARCHETYPES);
  const defaultA = latestReport?.archetypeId || 'strategic-builder';
  const defaultB = archetypeKeys.find((k) => k !== defaultA) || 'empathic-harmonizer';

  const [archetypeA, setArchetypeA] = useState<string>(defaultA);
  const [archetypeB, setArchetypeB] = useState<string>(defaultB);

  const dataA = ARCHETYPES[archetypeA] || ARCHETYPES['strategic-builder'];
  const dataB = ARCHETYPES[archetypeB] || ARCHETYPES['empathic-harmonizer'];

  // Calculate dynamic compatibility matrix
  const calculateSynergy = (a: string, b: string) => {
    if (a === b) return { score: 88, tier: 'high', labelAr: 'تناغم وانعكاس ذاتي متطابق', labelEn: 'Mirror Affinity & Mutual Understanding' };
    const hash = (a.length * 7 + b.length * 13) % 25;
    const score = 75 + hash; // between 75 and 99
    return {
      score,
      tier: score >= 90 ? 'exceptional' : score >= 80 ? 'high' : 'moderate',
      labelAr: score >= 90 ? 'توافق استثنائي وتكامل عميق' : score >= 80 ? 'تناغم قوي مع نقاط قوة متبادلة' : 'تكامل يحتاج تفاهماً للحدود',
      labelEn: score >= 90 ? 'Exceptional Synergy & Flow' : score >= 80 ? 'Strong Complementary Fit' : 'Growth-Oriented Dynamics'
    };
  };

  const synergy = calculateSynergy(archetypeA, archetypeB);

  return (
    <div id="compatibility-matcher" className="p-5 rounded-3xl bg-[#121217] border border-white/10 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500/20 to-[#9061F9]/30 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Heart className="w-4 h-4 fill-rose-500/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'مقياس التوافق والكيمياء السلوكية' : 'Archetype Chemistry & Synergy'}
            </h3>
            <p className="text-[11px] text-[#9CA3AF]">
              {isAr ? 'حلل التوافق العاطفي والمهني بين أي نمطين' : 'Analyze emotional & professional compatibility'}
            </p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#9061F9]/20 text-[#A4CAFE] border border-[#9061F9]/30 font-mono font-bold">
          2026 MATRIX
        </span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#9CA3AF] mb-1">
            {isAr ? 'نمطك أو الطرف الأول' : 'Profile A'}
          </label>
          <select
            value={archetypeA}
            onChange={(e) => {
              setArchetypeA(e.target.value);
              triggerHaptic('light');
            }}
            className="w-full bg-[#18181F] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#9061F9]"
          >
            {archetypeKeys.map((k) => (
              <option key={k} value={k} className="bg-[#18181F] text-white">
                {isAr ? ARCHETYPES[k].nameAr : ARCHETYPES[k].nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#9CA3AF] mb-1">
            {isAr ? 'الطرف الثاني (الشريك/الزميل)' : 'Profile B'}
          </label>
          <select
            value={archetypeB}
            onChange={(e) => {
              setArchetypeB(e.target.value);
              triggerHaptic('light');
            }}
            className="w-full bg-[#18181F] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#9061F9]"
          >
            {archetypeKeys.map((k) => (
              <option key={k} value={k} className="bg-[#18181F] text-white">
                {isAr ? ARCHETYPES[k].nameAr : ARCHETYPES[k].nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Synergy Score Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 via-[#18181F] to-[#7E3AF2]/20 border border-white/10 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-[#A4CAFE] font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAr ? synergy.labelAr : synergy.labelEn}</span>
          </div>
          <p className="text-xs text-[#D1D5DB] mt-1 max-w-xs leading-relaxed">
            {isAr
              ? `يجمع بين ${dataA.nameAr} و ${dataB.nameAr} تكامل استراتيجي وعاطفي عالي التوازن.`
              : `Dynamic connection between ${dataA.nameEn} and ${dataB.nameEn}.`}
          </p>
        </div>

        <div className="text-center p-3 rounded-2xl bg-[#121217] border border-white/10 shrink-0 min-w-[75px]">
          <span className="text-[9px] text-[#9CA3AF] font-bold uppercase block">{isAr ? 'التوافق' : 'Synergy'}</span>
          <span className="text-2xl font-black text-rose-400 font-mono">{synergy.score}%</span>
        </div>
      </div>

      {/* Insights Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-[#18181F] border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-[#A4CAFE] font-bold">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{isAr ? 'مواطن القوة في العلاقة' : 'Relationship Superpowers'}</span>
          </div>
          <p className="text-[#9CA3AF] leading-relaxed text-[11px]">
            {isAr
              ? 'وضوح فكري عالي، تبادل صادق للآراء، وقدرة على اتخاذ قرارات مصيرية دون تردد.'
              : 'High intellectual clarity, mutual respect for autonomy, and transparent communication.'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#18181F] border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{isAr ? 'نقاط الحذر والتنبيه' : 'Friction Points to Manage'}</span>
          </div>
          <p className="text-[#9CA3AF] leading-relaxed text-[11px]">
            {isAr
              ? 'تجنب العناد عند اختلاف وجهات النظر، وتخصيص مساحات راحة كافية دون افتراض البعد العاطفي.'
              : 'Avoid intellectual rivalry during heated debates; respect distinct emotional processing rhythms.'}
          </p>
        </div>
      </div>
    </div>
  );
};

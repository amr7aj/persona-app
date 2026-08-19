import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Brain, Check, Shield } from 'lucide-react';

export const LoadingAnalysisView: React.FC = () => {
  const { language, setView } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isAr = language === 'ar';

  const steps = [
    { ar: 'قراءة نمط الاستجابات والأوزان السلوكية...', en: 'Decoding response vectors & behavioral weights...' },
    { ar: 'معالجة مؤشرات الذكاء العاطفي والتفكير...', en: 'Calculating cognitive & emotional resilience indexes...' },
    { ar: 'مطابقة الأبعاد مع مصفوفة الـ 12 نمطاً قيادياً...', en: 'Matching vectors against the 12 Leadership Archetypes...' },
    { ar: 'توليد تقرير الذكاء الاصطناعي الشامل من Gemini...', en: 'Synthesizing Gemini Deep Intelligence Report...' },
    { ar: 'اكتمل بناء ملفك الشخصي بنجاح!', en: 'Personality Intelligence Blueprint Ready!' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-fade-in space-y-8">
      {/* Central Pulsing Core */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-36 h-36 rounded-full bg-purple-600/20 animate-ping pointer-events-none"></div>
        <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-pulse pointer-events-none"></div>

        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-700 via-violet-600 to-amber-500 p-0.5 shadow-2xl shadow-purple-950/60 flex items-center justify-center">
          <div className="w-full h-full bg-[#101018] rounded-[22px] flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
      </div>

      {/* Status Heading */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-amber-400 tracking-wider uppercase font-semibold">
          {isAr ? 'خوارزمية الذكاء الاصطناعي نشطة' : 'AI Engine Ingesting Vectors'}
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {isAr ? 'جاري بناء تقرير شخصيتك' : 'Synthesizing Your Intelligence Report'}
        </h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
          {isAr ? 'نقوم بتحليل الأبعاد التسعة وربطها بالأنماط النفسية الدقيقة' : 'Cross-analyzing 9 psychological dimensions with deterministic scoring'}
        </p>
      </div>

      {/* Sequential Milestones Checklist */}
      <div className="w-full bg-[#13131C] border border-[#222230] rounded-2xl p-4 space-y-3 text-left">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                isDone
                  ? 'text-emerald-400 font-medium'
                  : isCurrent
                  ? 'text-amber-300 font-semibold'
                  : 'text-zinc-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    : 'bg-[#1C1C26] text-zinc-600 border border-zinc-800'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              <span className="leading-tight">{isAr ? step.ar : step.en}</span>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
        <Shield className="w-3.5 h-3.5 text-zinc-600" />
        <span>{isAr ? 'التحليل غير تشخيصي ومبني لأغراض الوعي والتطوير الذاتي' : 'Assessment is non-diagnostic for self-reflection and growth'}</span>
      </div>
    </div>
  );
};

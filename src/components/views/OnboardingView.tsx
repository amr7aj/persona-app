import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, ShieldCheck, Check, BrainCircuit } from 'lucide-react';
import { Api } from '../../services/api';

export const OnboardingView: React.FC = () => {
  const { user, refreshUserData, setView, language, triggerHaptic } = useApp();
  const [step, setStep] = useState(1);
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    age: '25-34',
    gender: 'male',
    status: 'single',
    field: 'tech_business',
    sleepHours: '7-8',
    goals: ['self_mastery', 'career_growth']
  });

  const [submitting, setSubmitting] = useState(false);

  const toggleGoal = (goalKey: string) => {
    setFormData((prev) => {
      const exists = prev.goals.includes(goalKey);
      const newGoals = exists
        ? prev.goals.filter((g) => g !== goalKey)
        : [...prev.goals, goalKey];
      return { ...prev, goals: newGoals };
    });
    triggerHaptic('light');
  };

  const handleFinish = async (skip = false) => {
    if (!user) {
      setView('analysis');
      return;
    }
    try {
      setSubmitting(true);
      await Api.saveOnboarding(user.id, skip ? { skipped: true } : formData);
      await refreshUserData();
      triggerHaptic('success');
      setView('analysis');
    } catch (e) {
      console.error('Error saving onboarding', e);
      setView('analysis');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-4 max-w-md mx-auto animate-fade-in">
      {/* Step Indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-[#20202C]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-bold text-xs text-white">PERSONA Onboarding</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {isAr ? `الخطوة ${step} من 2` : `Step ${step} of 2`}
        </span>
      </div>

      {step === 1 ? (
        /* Step 1: Welcome & Vision */
        <div className="my-auto py-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-purple-600/30 to-violet-700/30 border border-amber-500/40 flex items-center justify-center mx-auto shadow-xl shadow-purple-950/40">
            <BrainCircuit className="w-10 h-10 text-amber-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isAr ? 'مرحباً بك في عالم فهم الذات' : 'Welcome to Deeper Self-Knowledge'}
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {isAr
                ? 'PERSONA ليس مجرد اختبار عادي، بل منظومة استخبارات نفسية وسلوكية تحلل أبعادك بدقة وتساعدك على اتخاذ قرارات متزنة في العمل، العلاقات، ونمط حياتك.'
                : 'PERSONA is a multi-dimensional psychological intelligence platform synthesizing your cognition, emotions, relationships, and habits.'}
            </p>
          </div>

          {/* Core Values Pillars */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="p-3 rounded-2xl bg-[#14141D] border border-[#232333]">
              <div className="text-amber-400 font-bold text-sm">9</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{isAr ? 'محاور تحليل' : 'Dimensions'}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#14141D] border border-[#232333]">
              <div className="text-purple-400 font-bold text-sm">12</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{isAr ? 'نمطاً قيادياً' : 'Archetypes'}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#14141D] border border-[#232333]">
              <div className="text-emerald-400 font-bold text-sm">100%</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{isAr ? 'خصوصية تامة' : 'Private'}</div>
            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Demographics and Growth Focus */
        <div className="my-auto py-4 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'تخصيص تجربة تحليلك' : 'Tailor Your Experience'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAr ? 'بيانات اختيارية تساعد الذكاء الاصطناعي على تقديم توصيات أدق' : 'Optional context to refine your personalized AI report'}
            </p>
          </div>

          {/* Age selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-300">
              {isAr ? 'الفئة العمرية' : 'Age Bracket'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['18-24', '25-34', '35-44', '45+'].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setFormData({ ...formData, age })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    formData.age === age
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-[#151520] border-[#252535] text-zinc-400'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* Growth Goals */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-300">
              {isAr ? 'أهدافك الأساسية من التحليل' : 'Primary Growth Goals'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'self_mastery', labelAr: 'فهم الذات والانضباط', labelEn: 'Self-Mastery' },
                { id: 'career_growth', labelAr: 'التطور المهني والقيادة', labelEn: 'Career & Leadership' },
                { id: 'emotional_balance', labelAr: 'الاتزان العاطفي', labelEn: 'Emotional Balance' },
                { id: 'relationships', labelAr: 'تحسين العلاقات والتواصل', labelEn: 'Relational Intelligence' }
              ].map((g) => {
                const selected = formData.goals.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                        : 'bg-[#151520] border-[#252535] text-zinc-400'
                    }`}
                  >
                    <span className="text-[11px] font-medium">{isAr ? g.labelAr : g.labelEn}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy badge */}
          <div className="p-3 rounded-xl bg-[#111118] border border-[#222230] flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isAr ? 'بياناتك مشفرة ولا تتم مشاركتها مع أي أطراف خارجية.' : 'Your data is strictly encrypted and never shared.'}</span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#20202C] space-y-2">
        {step === 1 ? (
          <button
            onClick={() => {
              setStep(2);
              triggerHaptic('medium');
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>{isAr ? 'متابعة' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={() => handleFinish(false)}
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>{isAr ? 'ابدأ جلسة التحليل الآن' : 'Start Assessment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFinish(true)}
              disabled={submitting}
              className="w-full py-2.5 text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {isAr ? 'تخطي والبدء مباشرة' : 'Skip and start directly'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Api } from '../../services/api';
import { GrowthChallenge } from '../../types';
import { ARCHETYPES } from '../../data/archetypesData';
import {
  Flame,
  Zap,
  Clock,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Award,
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  X,
  MessageSquareQuote,
  Shield,
  Lightbulb,
  Calendar
} from 'lucide-react';

interface Props {
  className?: string;
  onChallengeCompleted?: () => void;
}

export const GrowthChallengesSection: React.FC<Props> = ({ className, onChallengeCompleted }) => {
  const { user, latestReport, language, triggerHaptic, refreshUserData } = useApp();
  const isAr = language === 'ar';

  const [activeChallenge, setActiveChallenge] = useState<GrowthChallenge | null>(null);
  const [history, setHistory] = useState<GrowthChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRerolling, setIsRerolling] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 23, minutes: 59, seconds: 59 });

  // Completion Dialog
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
  const [reflectionNote, setReflectionNote] = useState<string>('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<{ xpEarned: number; aiFeedback: string } | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const archetype = latestReport?.archetype || (latestReport?.archetypeId ? ARCHETYPES[latestReport.archetypeId] : null);

  const fetchActiveChallenge = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await Api.getActiveChallenge(user.id);
      setActiveChallenge(res);
    } catch (err) {
      console.error('Error fetching active challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const res = await Api.getChallengeHistory(user.id);
      setHistory(res || []);
    } catch (err) {
      console.error('Error fetching challenge history:', err);
    }
  };

  useEffect(() => {
    fetchActiveChallenge();
    fetchHistory();
  }, [user?.id]);

  // 24-Hour Countdown Timer
  useEffect(() => {
    if (!activeChallenge?.expiresAt) return;

    const interval = setInterval(() => {
      const diff = new Date(activeChallenge.expiresAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeChallenge?.expiresAt]);

  const handleReroll = async () => {
    if (!user?.id) return;
    try {
      setIsRerolling(true);
      triggerHaptic('medium');
      const res = await Api.rerollChallenge(user.id);
      setActiveChallenge(res);
      triggerHaptic('success');
    } catch (err) {
      console.error('Failed to reroll challenge:', err);
    } finally {
      setIsRerolling(false);
    }
  };

  const handleCompleteSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id || !activeChallenge) return;

    try {
      setIsSubmittingCompletion(true);
      triggerHaptic('medium');
      const res = await Api.completeChallenge({
        userId: user.id,
        challengeId: activeChallenge.id,
        reflectionNote: reflectionNote.trim()
      });

      setActiveChallenge(res.challenge);
      setCompletionResult({
        xpEarned: res.xpEarned,
        aiFeedback: res.aiFeedback
      });

      // Update history list and user profile XP
      fetchHistory();
      if (refreshUserData) {
        refreshUserData();
      }
      if (onChallengeCompleted) {
        onChallengeCompleted();
      }
      triggerHaptic('heavy');
    } catch (err) {
      console.error('Failed to complete challenge:', err);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Active Challenge Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1435] via-[#161226] to-[#0F0D1A] border border-[#3E2968]/60 p-5 shadow-2xl space-y-4">
        {/* Subtle Decorative Glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges & 24h Timer Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isAr ? 'تحدي النمو (24 ساعة)' : '24h Growth Challenge'}</span>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">
              +{activeChallenge?.xpReward || 60} XP
            </span>
          </div>

          {/* Real-time Countdown Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-zinc-400 space-y-2">
            <div className="w-7 h-7 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">{isAr ? 'جاري تحليل أضعف الأبعاد وتجهيز التحدي المخصص...' : 'Analyzing weakest dimension & generating challenge...'}</p>
          </div>
        ) : activeChallenge ? (
          <div className="space-y-4">
            {/* Weakest Dimension Diagnosis Indicator */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    {isAr ? 'نقطة التطوير المكتشفة في شخصيتك:' : 'Target Development Vector:'}
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {isAr ? activeChallenge.dimensionNameAr : activeChallenge.dimensionNameEn}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-zinc-400">{isAr ? 'المستوى الحالي' : 'Score'}</div>
                <div className="text-xs font-black font-mono text-amber-400">
                  {activeChallenge.dimensionScore}%
                </div>
              </div>
            </div>

            {/* Challenge Title & Body */}
            <div>
              <h3 className="text-base font-black text-white tracking-tight leading-snug">
                {isAr ? activeChallenge.titleAr : activeChallenge.titleEn}
              </h3>
              <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                {isAr ? activeChallenge.descriptionAr : activeChallenge.descriptionEn}
              </p>
            </div>

            {/* Step by Step Action Blueprint */}
            {activeChallenge.actionStepsAr && activeChallenge.actionStepsAr.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#141022] border border-[#2D2248] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'خطوات التنفيذ اليومية (Micro Steps):' : 'Daily Action Blueprint:'}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {(isAr ? activeChallenge.actionStepsAr : activeChallenge.actionStepsEn).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scientific & Psychological Rationale */}
            {activeChallenge.scientificRationaleAr && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1 text-purple-400 font-bold text-[10px]">
                  <Brain className="w-3 h-3" />
                  <span>{isAr ? 'الأساس العلمي وتشكيل اللدونة العصبية:' : 'Behavioral Science Mechanism:'}</span>
                </div>
                <p className="leading-relaxed">
                  {isAr ? activeChallenge.scientificRationaleAr : activeChallenge.scientificRationaleEn}
                </p>
              </div>
            )}

            {/* Status Feedback or Action Buttons */}
            {activeChallenge.status === 'completed' ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-2 animate-fade-in">
                <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تم إتمام التحدي بنجاح وكسب المكافأة! 🌟' : 'Challenge Completed & XP Awarded!'}</span>
                </div>
                {activeChallenge.aiEvaluation && (
                  <p className="text-xs text-emerald-200/90 italic max-w-md mx-auto">
                    "{activeChallenge.aiEvaluation}"
                  </p>
                )}
                <div className="text-[10px] text-zinc-500 pt-1">
                  {isAr ? 'سيتوفر تحدٍ جديد بعد انتهاء دورة الـ 24 ساعة.' : 'A new challenge unlocks when the 24h cycle resets.'}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleReroll}
                  disabled={isRerolling}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1D172E] hover:bg-[#2A2142] border border-[#352852] text-zinc-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRerolling ? 'animate-spin' : ''}`} />
                  <span>{isAr ? 'تحدٍ بديل' : 'Reroll'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsCompleteModalOpen(true);
                    setReflectionNote('');
                    setCompletionResult(null);
                    triggerHaptic('medium');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'أتممت التحدي (تسجيل وكسب +XP)' : 'Complete & Claim XP'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-400">
            <p className="text-xs">{isAr ? 'لا يوجد تحدٍ نشط حالياً.' : 'No active challenge found.'}</p>
          </div>
        )}
      </div>

      {/* Challenge History Archive Button & Accordion */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-[#12101C] border border-[#231D35] p-3.5 space-y-3">
          <div
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between cursor-pointer text-xs text-zinc-300 hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-bold">
                {isAr ? `سجل التحديات السابقة (${history.filter((h) => h.status === 'completed').length})` : `Completed Challenges Archive (${history.filter((h) => h.status === 'completed').length})`}
              </span>
            </div>
            {showHistory ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
          </div>

          {showHistory && (
            <div className="space-y-2.5 pt-2 border-t border-white/5 animate-fade-in">
              {history.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#171424] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                      +{item.xpReward} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>{isAr ? `البعد: ${item.dimensionNameAr}` : `Dimension: ${item.dimensionNameEn}`}</span>
                    {item.completedAt && (
                      <span>• {new Date(item.completedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                    )}
                  </div>

                  {item.reflectionNote && (
                    <p className="text-[11px] text-zinc-300 italic bg-black/20 p-2 rounded-lg">
                      "{item.reflectionNote}"
                    </p>
                  )}

                  {item.aiEvaluation && (
                    <div className="text-[10px] text-purple-300 bg-purple-950/30 p-2 rounded-lg border border-purple-800/20">
                      <span className="font-bold text-amber-400 block mb-0.5">🤖 {isAr ? 'تقييم المدرب النفسي:' : 'AI Mentor Feedback:'}</span>
                      {item.aiEvaluation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* COMPLETION MODAL */}
      {/* ======================================================== */}
      {isCompleteModalOpen && activeChallenge && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#161226] border border-[#3E2A6B] p-6 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'توثيق إتمام تحدي النمو' : 'Complete 24h Challenge'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {isAr ? `مكافأة الإنجاز: +${activeChallenge.xpReward} XP` : `Reward: +${activeChallenge.xpReward} XP`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!completionResult ? (
              <form onSubmit={handleCompleteSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/30 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">
                    {isAr ? 'التحدي المكتمل:' : 'Completed Challenge:'}
                  </span>
                  <h4 className="text-xs font-bold text-white">
                    {isAr ? activeChallenge.titleAr : activeChallenge.titleEn}
                  </h4>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    {isAr ? 'ما الذي لاحظته أثناء تطبيق هذا التحدي؟ (ملاحظة ذاتية):' : 'What did you observe or feel during execution? (Self Reflection):'}
                  </label>
                  <textarea
                    rows={3}
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    placeholder={isAr ? 'مثال: شعرت بتردد في البداية ولكن عندما توقفت للتنفس شعرت بهدوء وتحكم أعلى...' : 'e.g. Felt initial hesitation, but stepping back gave me clarity...'}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A162B] border border-[#332554] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-[11px] text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isAr
                      ? 'سيقوم المدرب الذكي فورياً بتقييم ملاحظتك وتقديم رؤية نفسية تدعم مسار تطورك.'
                      : 'The AI coach will evaluate your reflection and provide immediate psychological feedback.'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCompleteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-zinc-300 text-xs font-medium cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCompletion || !reflectionNote.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingCompletion ? (isAr ? 'جاري التقييم...' : 'Evaluating...') : (isAr ? 'توثيق وكسب النقاط' : 'Submit & Claim XP')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">
                    {isAr ? `مبروك! كسبت +${completionResult.xpEarned} XP 🎯` : `Awesome! Earned +${completionResult.xpEarned} XP!`}
                  </h4>
                  <div className="mt-3 p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-left text-xs text-purple-200 leading-relaxed space-y-1">
                    <span className="font-bold text-amber-400 text-[11px] block">
                      🤖 {isAr ? 'تقييم ورؤية المدرب السلوكي المخصص:' : 'AI Psychological Evaluation:'}
                    </span>
                    <p>{completionResult.aiFeedback}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  {isAr ? 'رائع، شكراً' : 'Done'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

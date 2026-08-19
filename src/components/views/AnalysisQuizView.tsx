import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Shield,
  Layers,
  Clock,
  RotateCcw
} from 'lucide-react';
import { QUESTIONS } from '../../data/questionsData';
import { QuestionCategory, AssessmentMode } from '../../types';

export const AnalysisQuizView: React.FC = () => {
  const {
    questions: contextQuestions,
    submitAssessment,
    language,
    triggerHaptic,
    setView,
    assessmentMode,
    startAssessment
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, { optionId: string; value: number }>
  >({});
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);

  const isAr = language === 'ar';
  const questionsList = contextQuestions.length > 0 ? contextQuestions : QUESTIONS;
  const currentQuestion = questionsList[currentIndex] || questionsList[0];

  const totalQuestions = questionsList.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const getCategoryLabel = (category: QuestionCategory) => {
    const labels: Record<QuestionCategory, { ar: string; en: string; icon: string }> = {
      cognitive: { ar: 'العقل والتفكير والمنطق', en: 'Cognition & Logic', icon: '🧠' },
      emotional: { ar: 'الذكاء العاطفي والاستقرار', en: 'Emotional Intelligence', icon: '❤️' },
      social: { ar: 'التواصل والحضور الاجتماعي', en: 'Social Intelligence', icon: '👥' },
      behavioral: { ar: 'الانضباط والقرارات والعادات', en: 'Discipline & Habits', icon: '⚡' },
      motivation: { ar: 'الطموح والإنجاز والشغف', en: 'Ambition & Drive', icon: '🎯' },
      lifestyle: { ar: 'الجسد والطاقة ونمط الحياة', en: 'Body & Vitality', icon: '🌿' },
      relationships: { ar: 'العلاقات والأمان العاطفي', en: 'Relationships & Attachment', icon: '🧩' },
      intimacy: { ar: 'الحميمية والتواصل الناضج', en: 'Intimacy & Connection', icon: '🔥' },
      career: { ar: 'العمل والقيادة والمال', en: 'Career & Leadership', icon: '💼' }
    };
    return labels[category] || { ar: 'المحور العام', en: 'General', icon: '✨' };
  };

  const handleSelectOption = (optionId: string, value: number) => {
    triggerHaptic('light');
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { optionId, value }
    }));

    // Auto-advance after smooth delay
    setTimeout(() => {
      handleNext();
    }, 280);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalQuestions) {
      const nextCategory = questionsList[nextIndex].category;
      if (nextCategory !== currentQuestion.category) {
        const catInfo = getCategoryLabel(currentQuestion.category);
        setMilestoneMessage(
          isAr
            ? `✓ تم إنجاز محور: ${catInfo.ar} ${catInfo.icon}`
            : `✓ Completed: ${catInfo.en} ${catInfo.icon}`
        );
        setTimeout(() => setMilestoneMessage(null), 2000);
      }
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      triggerHaptic('light');
    } else {
      setView('home');
    }
  };

  const handleModeSwitch = async (newMode: AssessmentMode) => {
    triggerHaptic('medium');
    setSelectedAnswers({});
    setCurrentIndex(0);
    await startAssessment(newMode);
  };

  const handleFinish = async () => {
    const payloadAnswers = questionsList.map((q) => {
      const ans = selectedAnswers[q.id] || { optionId: 'opt_3', value: 3 };
      return {
        questionId: q.id,
        category: q.category,
        dimension: q.dimension,
        optionId: ans.optionId,
        value: ans.value
      };
    });

    try {
      await submitAssessment(payloadAnswers);
      setView('results');
    } catch (e) {
      console.error('Failed to submit assessment', e);
      setView('results');
    }
  };

  const currentSelection = selectedAnswers[currentQuestion.id];
  const catDetails = getCategoryLabel(currentQuestion.category);

  return (
    <div id="analysis-quiz-view" className="min-h-[90vh] flex flex-col justify-between py-3 px-4 max-w-lg mx-auto relative">
      {/* Milestone Toast */}
      <AnimatePresence>
        {milestoneMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-4 right-4 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-[#9061F9]/90 via-[#18181F] to-[#7E3AF2]/90 border border-[#9061F9]/50 text-white text-xs font-bold text-center shadow-2xl flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{milestoneMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="space-y-3 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button
            id="btn-quiz-back"
            onClick={handleBack}
            className="p-2 rounded-xl bg-[#121217] border border-white/5 text-[#9CA3AF] hover:text-white flex items-center gap-1 text-xs cursor-pointer transition-all"
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>

          {/* Mode Selector Pill */}
          <div className="flex bg-[#121217] p-0.5 rounded-xl border border-white/5 text-[11px]">
            <button
              onClick={() => handleModeSwitch('full')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                assessmentMode === 'full'
                  ? 'bg-[#7E3AF2] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {isAr ? 'الشامل 2026' : 'Full'}
            </button>
            <button
              onClick={() => handleModeSwitch('express')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                assessmentMode === 'express'
                  ? 'bg-amber-500 text-black'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{isAr ? 'سريع' : 'Fast'}</span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#A4CAFE]">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#121217] overflow-hidden p-0.5 border border-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#7E3AF2] via-[#9061F9] to-[#A4CAFE]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Main Question Card with Smooth AnimatePresence */}
      <div className="my-auto py-4 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: isAr ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isAr ? 15 : -15 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Category Banner */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181F] border border-[#9061F9]/30 text-white text-xs font-semibold">
                <span className="text-sm">{catDetails.icon}</span>
                <span>{isAr ? catDetails.ar : catDetails.en}</span>
              </div>

              {currentQuestion.isSensitive ? (
                <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'خصوصية مشفرة' : 'Encrypted'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                  <Clock className="w-3.5 h-3.5 text-[#9061F9]" />
                  <span>{isAr ? '~20 ثانية' : '~20 sec'}</span>
                </div>
              )}
            </div>

            {/* Dimension Title */}
            <div className="text-xs text-[#A4CAFE] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? currentQuestion.dimensionAr : currentQuestion.dimensionEn}</span>
            </div>

            {/* Question Prompt */}
            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {isAr ? currentQuestion.questionAr : currentQuestion.questionEn}
            </h2>

            {/* Options List */}
            <div className="space-y-2.5 pt-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = currentSelection?.optionId === opt.id;
                return (
                  <motion.div
                    key={opt.id}
                    id={`opt-choice-${idx}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectOption(opt.id, opt.value)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#7E3AF2]/30 to-[#9061F9]/30 border-[#9061F9] shadow-lg shadow-[#7E3AF2]/10 text-white'
                        : 'bg-[#18181F] border-white/5 hover:border-white/15 text-[#D1D5DB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#9061F9] text-white shadow-md'
                            : 'bg-[#121217] text-[#9CA3AF] group-hover:text-white'
                        }`}
                      >
                        {opt.value}
                      </div>
                      <span className="text-xs sm:text-sm font-medium leading-normal">
                        {isAr ? opt.labelAr : opt.labelEn}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#9061F9] bg-[#9061F9]'
                          : 'border-[#4B5563] bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#9CA3AF]">
        <button
          onClick={() => handleModeSwitch(assessmentMode)}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ترتيب الأسئلة' : 'Reshuffle Questions'}</span>
        </button>

        <button
          id="btn-quiz-next"
          onClick={handleNext}
          className="py-2.5 px-5 rounded-xl bg-[#7E3AF2] hover:bg-[#6C2BD9] text-white font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>
            {currentIndex === totalQuestions - 1
              ? (isAr ? 'إنهاء وحساب الذكاء الشخصي' : 'Finish & Calculate')
              : (isAr ? 'التالي' : 'Next')}
          </span>
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

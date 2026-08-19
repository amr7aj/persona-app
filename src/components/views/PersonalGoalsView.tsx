import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Api } from '../../services/api';
import { PersonalGoal, GoalCategory, GoalFrequency, GoalCheckIn } from '../../types';
import { ARCHETYPES } from '../../data/archetypesData';
import {
  Target,
  Plus,
  Flame,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  Zap,
  TrendingUp,
  Brain,
  Heart,
  Moon,
  Activity,
  Briefcase,
  ChevronRight,
  ChevronDown,
  X,
  MessageSquareQuote,
  ShieldCheck,
  Award
} from 'lucide-react';

export const PersonalGoalsView: React.FC = () => {
  const { user, latestReport, language, triggerHaptic, setView } = useApp();
  const isAr = language === 'ar';

  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [activeCheckInGoal, setActiveCheckInGoal] = useState<PersonalGoal | null>(null);

  // Form State for creating new goal
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<GoalCategory>('habits');
  const [newFrequency, setNewFrequency] = useState<GoalFrequency>('daily');
  const [newDaysPerWeek, setNewDaysPerWeek] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State for Check-in
  const [checkInStatus, setCheckInStatus] = useState<'completed' | 'progressed' | 'struggled'>('completed');
  const [checkInNote, setCheckInNote] = useState<string>('');
  const [checkInSubmitting, setCheckInSubmitting] = useState<boolean>(false);
  const [checkInResult, setCheckInResult] = useState<{ feedback?: string } | null>(null);

  // Expanded card logs
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [refreshingPromptId, setRefreshingPromptId] = useState<string | null>(null);

  const archetype = latestReport?.archetype || (latestReport?.archetypeId ? ARCHETYPES[latestReport.archetypeId] : null);

  const categories: Array<{ id: GoalCategory | 'all'; labelAr: string; labelEn: string; icon: React.ReactNode; color: string }> = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: <Target className="w-4 h-4" />, color: 'from-amber-500 to-purple-500' },
    { id: 'focus', labelAr: 'التركيز والعمل', labelEn: 'Focus', icon: <Zap className="w-4 h-4" />, color: 'from-blue-500 to-indigo-600' },
    { id: 'mindset', labelAr: 'الذهنية والهدوء', labelEn: 'Mindset', icon: <Brain className="w-4 h-4" />, color: 'from-purple-500 to-pink-500' },
    { id: 'vitality', labelAr: 'الصحة والنشاط', labelEn: 'Vitality', icon: <Activity className="w-4 h-4" />, color: 'from-emerald-500 to-teal-500' },
    { id: 'habits', labelAr: 'عادات يومية', labelEn: 'Habits', icon: <TrendingUp className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
    { id: 'relationships', labelAr: 'العلاقات والتواصل', labelEn: 'Relationships', icon: <Heart className="w-4 h-4" />, color: 'from-rose-500 to-red-500' },
    { id: 'career', labelAr: 'المسار والنمو', labelEn: 'Career', icon: <Briefcase className="w-4 h-4" />, color: 'from-cyan-500 to-blue-500' }
  ];

  const presets = [
    {
      titleAr: 'جلسة تركيز وتخطيط استراتيجي عميق 45 دقيقة',
      titleEn: '45-min Deep Focus & Strategic Planning Sprint',
      category: 'focus' as GoalCategory,
      frequency: 'daily' as GoalFrequency,
      days: 6
    },
    {
      titleAr: 'تهدئة التفكير والتأمل قبل النوم وتنظيم التوتر',
      titleEn: 'Evening Nervous System Wind-down & Mindful Reset',
      category: 'mindset' as GoalCategory,
      frequency: 'daily' as GoalFrequency,
      days: 5
    },
    {
      titleAr: 'حركة ونشاط بدني مستمر لرفع الطاقة الحيوية',
      titleEn: 'Physical Vitality & Movement Routine (30 min)',
      category: 'vitality' as GoalCategory,
      frequency: 'daily' as GoalFrequency,
      days: 5
    },
    {
      titleAr: 'تواصل إنساني واستماع واعي مع دائرة الثقة',
      titleEn: 'Authentic Deep Listening & Relationship Check-in',
      category: 'relationships' as GoalCategory,
      frequency: 'weekly' as GoalFrequency,
      days: 2
    },
    {
      titleAr: 'قراءة معرفية وتوسيع المدارك العقلية 30 دقيقة',
      titleEn: '30-minute Cognitive Expansion & Deep Reading',
      category: 'mindset' as GoalCategory,
      frequency: 'daily' as GoalFrequency,
      days: 5
    }
  ];

  const fetchGoals = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await Api.getUserGoals(user.id);
      setGoals(res || []);
    } catch (err) {
      console.error('Failed to load personal goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  const handleCreateGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id || !newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      triggerHaptic('medium');
      const created = await Api.createGoal({
        userId: user.id,
        title: newTitle.trim(),
        category: newCategory,
        targetFrequency: newFrequency,
        targetDaysPerWeek: newDaysPerWeek
      });
      setGoals((prev) => [created, ...prev]);
      setNewTitle('');
      setIsAddModalOpen(false);
      triggerHaptic('success');
    } catch (err) {
      console.error('Error creating goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (p: typeof presets[0]) => {
    setNewTitle(isAr ? p.titleAr : p.titleEn);
    setNewCategory(p.category);
    setNewFrequency(p.frequency);
    setNewDaysPerWeek(p.days);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.id) return;
    try {
      triggerHaptic('warning');
      await Api.deleteGoal(user.id, goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleRefreshAIPrompt = async (goalId: string) => {
    if (!user?.id) return;
    try {
      setRefreshingPromptId(goalId);
      triggerHaptic('light');
      const updated = await Api.refreshGoalAIPrompt(user.id, goalId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      triggerHaptic('success');
    } catch (err) {
      console.error('Failed to refresh AI prompt:', err);
    } finally {
      setRefreshingPromptId(null);
    }
  };

  const handleRecordCheckIn = async () => {
    if (!user?.id || !activeCheckInGoal) return;
    try {
      setCheckInSubmitting(true);
      triggerHaptic('medium');
      const res = await Api.recordGoalCheckIn({
        userId: user.id,
        goalId: activeCheckInGoal.id,
        status: checkInStatus,
        note: checkInNote
      });

      setGoals((prev) => prev.map((g) => (g.id === activeCheckInGoal.id ? res.goal : g)));
      setCheckInResult({ feedback: res.checkIn.aiFeedback });
      triggerHaptic('success');
    } catch (err) {
      console.error('Failed to record check in:', err);
    } finally {
      setCheckInSubmitting(false);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  const totalStreaks = goals.reduce((acc, curr) => acc + (curr.streak || 0), 0);
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((acc, curr) => acc + curr.progress, 0) / goals.length) : 0;

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-5 animate-fade-in font-sans">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1B4B]/70 via-[#13111C] to-[#0E0E14] border border-[#312E81]/50 p-5 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{isAr ? 'متتبع الأهداف السلوكية الذكي' : 'AI Lifestyle Goals Engine'}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isAr ? 'أهدافي والتوجيه اليومي' : 'Personal Growth Goals'}
            </h1>
            <p className="text-xs text-zinc-300 mt-1 max-w-md leading-relaxed">
              {isAr
                ? `تتبع أهدافك اليومية بدعم من المساعد النفسي الذي يصيغ لك أسئلة تقييم خاصة بنمطك "${archetype?.nameAr || 'الاستراتيجي'}" لمساعدتك على الاستمرار.`
                : `Track lifestyle habits reinforced by psychological check-in prompts tailored to your "${archetype?.nameEn || 'Strategic'}" blueprint.`}
            </p>
          </div>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              triggerHaptic('light');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 hover:scale-105 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'هدف جديد' : 'New Goal'}</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-[#181824]/80 border border-white/5 text-center">
            <div className="text-lg font-black text-white font-mono">{goals.length}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{isAr ? 'الأهداف النشطة' : 'Active Goals'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#181824]/80 border border-white/5 text-center">
            <div className="text-lg font-black text-amber-400 font-mono flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{totalStreaks}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{isAr ? 'أيام الاستمرار' : 'Total Streaks'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#181824]/80 border border-white/5 text-center">
            <div className="text-lg font-black text-emerald-400 font-mono">{avgProgress}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{isAr ? 'متوسط الإنجاز' : 'Avg Progress'}</div>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                triggerHaptic('light');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all text-xs font-medium cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold shadow-md shadow-purple-900/30'
                  : 'bg-[#14141E] text-zinc-400 border border-[#232333] hover:text-white hover:border-zinc-600'
              }`}
            >
              {cat.icon}
              <span>{isAr ? cat.labelAr : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Goals List */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">{isAr ? 'جاري استرجاع أهدافك وتوجيهات الذكاء الاصطناعي...' : 'Loading goals & AI reflections...'}</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#14141F] border border-[#252536] text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'لا توجد أهداف في هذا التصنيف حالياً' : 'No goals found in this category'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {isAr
                ? 'أضف أهدافك الحياتية لتبدأ في تلقي أسئلة التقييم والتوجيه السلوكي المخصص لشخصيتك.'
                : 'Create lifestyle goals to start receiving personalized psychological check-in prompts.'}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            {isAr ? 'إضافة هدف الآن' : 'Create First Goal'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const isExpanded = expandedGoalId === goal.id;
            const categoryMeta = categories.find((c) => c.id === goal.category) || categories[1];

            return (
              <div
                key={goal.id}
                className="rounded-3xl bg-[#14141F] border border-[#262638] hover:border-[#383852] p-5 transition-all shadow-xl space-y-4"
              >
                {/* Top Row: Category + Streak + Frequency */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1D1D2C] border border-[#2D2D42] text-[11px] font-semibold text-zinc-300">
                      {categoryMeta.icon}
                      <span>{isAr ? categoryMeta.labelAr : categoryMeta.labelEn}</span>
                    </span>

                    <span className="text-[10px] text-zinc-400 font-mono">
                      {goal.targetFrequency === 'daily'
                        ? isAr
                          ? `${goal.targetDaysPerWeek || 5} أيام / أسبوع`
                          : `${goal.targetDaysPerWeek || 5}d/week`
                        : isAr
                        ? 'أسبوعي'
                        : 'Weekly'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{goal.streak || 0} {isAr ? 'يوم' : 'd'}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title={isAr ? 'حذف الهدف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {goal.title}
                  </h3>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">{isAr ? 'التقدم الإجمالي' : 'Progress'}</span>
                    <span className="text-emerald-400 font-bold">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#20202E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.max(5, goal.progress)}%` }}
                    />
                  </div>
                </div>

                {/* AI Behavioral Check-In Prompt Box */}
                {goal.aiCheckInPrompt && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1B4B]/60 via-[#18162A]/70 to-[#12121D] border border-indigo-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                        <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                        <span>{isAr ? 'سؤال التقييم السلوكي من الذكاء الاصطناعي' : 'AI Psychological Check-In Prompt'}</span>
                      </div>

                      <button
                        onClick={() => handleRefreshAIPrompt(goal.id)}
                        disabled={refreshingPromptId === goal.id}
                        className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
                        title={isAr ? 'تجديد السؤال' : 'Refresh Question'}
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingPromptId === goal.id ? 'animate-spin text-purple-400' : ''}`} />
                        <span>{isAr ? 'تحديث' : 'Refresh'}</span>
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-white leading-relaxed">
                      "{isAr ? goal.aiCheckInPrompt.questionAr : goal.aiCheckInPrompt.questionEn}"
                    </p>

                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-zinc-300 space-y-1">
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                        <Sparkles className="w-3 h-3" />
                        <span>{isAr ? `توجيه خاص بنمطك (${archetype?.nameAr || 'الاستراتيجي'}):` : `Archetype Tip:`}</span>
                      </div>
                      <p className="leading-normal text-zinc-400">
                        {isAr ? goal.aiCheckInPrompt.archetypeTipAr : goal.aiCheckInPrompt.archetypeTipEn}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions & Check-in Button */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{isAr ? `السجل (${goal.checkIns?.length || 0})` : `History (${goal.checkIns?.length || 0})`}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setActiveCheckInGoal(goal);
                      setCheckInStatus('completed');
                      setCheckInNote('');
                      setCheckInResult(null);
                      triggerHaptic('medium');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-purple-900/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل تقييم اليوم' : 'Daily Check-in'}</span>
                  </button>
                </div>

                {/* Expanded Check-in History Logs */}
                {isExpanded && (
                  <div className="pt-3 border-t border-white/5 space-y-2.5 animate-fade-in">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      {isAr ? 'سجل الالتزام والملاحظات' : 'Check-in History & AI Reflections'}
                    </h4>

                    {(!goal.checkIns || goal.checkIns.length === 0) ? (
                      <p className="text-xs text-zinc-500 italic">
                        {isAr ? 'لم تقم بتسجيل أي تقييم بعد. اضغط "تسجيل تقييم اليوم" للبدء.' : 'No check-ins recorded yet.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {goal.checkIns.map((chk) => (
                          <div key={chk.id} className="p-3 rounded-xl bg-[#101018] border border-white/5 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`px-2 py-0.5 rounded font-semibold ${
                                chk.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : chk.status === 'progressed'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {chk.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed') : chk.status === 'progressed' ? (isAr ? 'تقدم جزئي' : 'Progressed') : (isAr ? 'صعوبة / وقفة' : 'Struggled')}
                              </span>
                              <span className="text-zinc-500 font-mono">
                                {new Date(chk.timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            {chk.note && (
                              <p className="text-xs text-zinc-300 italic">"{chk.note}"</p>
                            )}

                            {chk.aiFeedback && (
                              <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/30 text-[11px] text-purple-200">
                                <span className="font-bold text-amber-400 text-[10px] block">🤖 {isAr ? 'رؤية المدرب النفسي:' : 'AI Coach Reflection:'}</span>
                                {chk.aiFeedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Quick Coach Link */}
      <div
        onClick={() => setView('bot')}
        className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#161622] to-indigo-950/40 border border-purple-800/30 flex items-center justify-between cursor-pointer hover:border-purple-500/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-white">
              {isAr ? 'تريد استشارة أعمق حول عاداتك اليومية؟' : 'Need deep habit coaching?'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {isAr ? 'تحدث مباشرة مع المدرب السلوكي في شات البوت الذكي' : 'Chat with the AI behavioral mentor now'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-purple-400" />
      </div>

      {/* ======================================================== */}
      {/* ADD GOAL MODAL */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#14141F] border border-[#2B2B3E] p-6 space-y-5 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'إضافة هدف حياتي جديد' : 'Create New Lifestyle Goal'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Quick Picker */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 block">
                {isAr ? '⚡ قوالب مقترحة ملهمة:' : '⚡ Suggested Goal Presets:'}
              </span>
              <div className="grid grid-cols-1 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2.5 rounded-xl bg-[#191928] hover:bg-[#232338] border border-white/5 hover:border-purple-500/40 text-left transition-all flex items-center justify-between text-xs text-zinc-200 cursor-pointer"
                  >
                    <span className="font-medium">{isAr ? p.titleAr : p.titleEn}</span>
                    <span className="text-[10px] text-amber-400 font-mono shrink-0 ml-2">
                      {isAr ? 'اختيار' : 'Select'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  {isAr ? 'عنوان الهدف أو العادة' : 'Goal or Habit Title'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: قراءة 20 صفحة يومياً، رياضة 30 دقيقة...' : 'e.g. 30-min workout, 20-min reading...'}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1A1A28] border border-[#2F2F44] text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    {isAr ? 'المجال' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1A28] border border-[#2F2F44] text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="focus">{isAr ? 'التركيز والعمل' : 'Focus'}</option>
                    <option value="mindset">{isAr ? 'الذهنية والهدوء' : 'Mindset'}</option>
                    <option value="vitality">{isAr ? 'الصحة والنشاط' : 'Vitality'}</option>
                    <option value="habits">{isAr ? 'عادات يومية' : 'Habits'}</option>
                    <option value="relationships">{isAr ? 'العلاقات والتواصل' : 'Relationships'}</option>
                    <option value="career">{isAr ? 'المسار والنمو' : 'Career'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    {isAr ? 'أيام الاستهداف أسبوعياً' : 'Target Days/Week'}
                  </label>
                  <select
                    value={newDaysPerWeek}
                    onChange={(e) => setNewDaysPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1A28] border border-[#2F2F44] text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value={7}>{isAr ? '7 أيام (يومياً)' : '7 days (Daily)'}</option>
                    <option value={6}>{isAr ? '6 أيام' : '6 days'}</option>
                    <option value={5}>{isAr ? '5 أيام' : '5 days'}</option>
                    <option value={4}>{isAr ? '4 أيام' : '4 days'}</option>
                    <option value={3}>{isAr ? '3 أيام' : '3 days'}</option>
                    <option value={2}>{isAr ? 'يومان' : '2 days'}</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-[11px] text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isAr
                    ? 'سيقوم محرك الذكاء الاصطناعي فورياً بصياغة أسئلة متابعة وتوجيهات نفسية خاصة بنمطك.'
                    : 'The AI engine will automatically craft customized check-in prompts tailored to your archetype.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'حفظ وتفعيل التوجيه' : 'Save Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHECK-IN MODAL */}
      {/* ======================================================== */}
      {activeCheckInGoal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#14141F] border border-[#2B2B3E] p-6 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <div className="text-[11px] font-mono text-purple-400 font-bold uppercase">
                  {isAr ? 'تقييم ومتابعة الهدف' : 'Goal Check-in'}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeCheckInGoal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveCheckInGoal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Prompt Reference in Modal */}
            {activeCheckInGoal.aiCheckInPrompt && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs space-y-1">
                <span className="text-amber-400 font-bold text-[10px] block">
                  💡 {isAr ? 'سؤال التفكر اليومي:' : 'Daily Reflection Question:'}
                </span>
                <p className="text-white font-semibold leading-relaxed">
                  "{isAr ? activeCheckInGoal.aiCheckInPrompt.questionAr : activeCheckInGoal.aiCheckInPrompt.questionEn}"
                </p>
              </div>
            )}

            {!checkInResult ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">
                    {isAr ? 'كيف كان التزامك اليوم؟' : 'How was your commitment today?'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckInStatus('completed')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        checkInStatus === 'completed'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-[#181826] border-white/5 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-base">🌟</div>
                      <div className="text-xs mt-1">{isAr ? 'أنجزت بالكامل' : 'Completed'}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">+30 XP</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckInStatus('progressed')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        checkInStatus === 'progressed'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-[#181826] border-white/5 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-base">⚡</div>
                      <div className="text-xs mt-1">{isAr ? 'تقدم جزئي' : 'Progressed'}</div>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">+15 XP</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckInStatus('struggled')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        checkInStatus === 'struggled'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                          : 'bg-[#181826] border-white/5 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-base">🧘</div>
                      <div className="text-xs mt-1">{isAr ? 'واجهت صعوبة' : 'Struggled'}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{isAr ? 'وقفة ومراجعة' : 'Reset'}</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    {isAr ? 'ملاحظتك وتأملك (اختياري):' : 'Your Reflection Note (optional):'}
                  </label>
                  <textarea
                    rows={2}
                    value={checkInNote}
                    onChange={(e) => setCheckInNote(e.target.value)}
                    placeholder={isAr ? 'ما التحدي الذي واجهته أو الشعور الذي راودك؟' : 'What went well or what blocked you?'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A28] border border-[#2F2F44] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveCheckInGoal(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-zinc-300 text-xs font-medium cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRecordCheckIn}
                    disabled={checkInSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                  >
                    {checkInSubmitting ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'حفظ وتلقي توجيه الذكاء الاصطناعي' : 'Submit & Get AI Coach Feedback')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {isAr ? 'تم تسجيل التقييم وتحديث المسار بنجاح! 🎯' : 'Check-in Recorded Successfully!'}
                  </h4>
                  <div className="mt-3 p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-left text-xs text-purple-200 leading-relaxed space-y-1">
                    <span className="font-bold text-amber-400 text-[11px] block">
                      🤖 {isAr ? 'تحليل ورؤية المدرب السلوكي المخصص:' : 'AI Coach Psychological Insight:'}
                    </span>
                    <p>{checkInResult.feedback}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCheckInGoal(null)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  {isAr ? 'تم ومتابعة' : 'Done'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

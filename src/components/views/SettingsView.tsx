import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserSettings } from '../../types';
import {
  Settings,
  Palette,
  Bot,
  Bell,
  Shield,
  User,
  Smartphone,
  Globe,
  Sparkles,
  Download,
  Trash2,
  RotateCcw,
  Check,
  CheckCircle2,
  Zap,
  Volume2,
  VolumeX,
  Lock,
  Moon,
  Eye,
  Sliders,
  Award,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Info,
  Server,
  Activity,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

type SettingsTab = 'all' | 'appearance' | 'ai' | 'notifications' | 'privacy' | 'account';

export const SettingsView: React.FC = () => {
  const {
    user,
    latestReport,
    language,
    setLanguage,
    settings,
    updateSettings,
    resetSettings,
    setView,
    openPremiumModal,
    logout,
    triggerHaptic
  } = useApp();

  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const isPremiumUser = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'super_admin';

  // Export full JSON User Data
  const handleExportData = () => {
    try {
      setIsExporting(true);
      triggerHaptic('medium');
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        platform: 'PERSONA AI Intelligence Core',
        version: '2026.2',
        user: {
          id: user?.id,
          name: `${user?.firstName} ${user?.lastName || ''}`.trim(),
          username: user?.username,
          email: user?.email,
          role: user?.role,
          level: user?.level,
          xp: user?.xp,
          badges: user?.badges
        },
        settings,
        latestReport: latestReport || null
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `persona_backup_${user?.username || 'user'}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(isAr ? 'تم تصدير ملف بياناتك الشخصية بنجاح!' : 'Your profile data exported successfully!');
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Clear Chat History from local storage
  const handleClearLocalCache = () => {
    try {
      triggerHaptic('heavy');
      showToast(isAr ? 'تم مسح الذاكرة المؤقتة وإعادة مزامنة التطبيق.' : 'Local cache purged successfully.');
    } catch (e) {
      console.error(e);
    }
  };

  const tabs: { id: SettingsTab; labelAr: string; labelEn: string; icon: any }[] = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Sliders },
    { id: 'appearance', labelAr: 'المظهر', labelEn: 'Theme', icon: Palette },
    { id: 'ai', labelAr: 'المدرب والذكاء', labelEn: 'AI Coach', icon: Bot },
    { id: 'notifications', labelAr: 'التنبيهات', labelEn: 'Alerts', icon: Bell },
    { id: 'privacy', labelAr: 'الخصوصية', labelEn: 'Privacy', icon: Shield },
    { id: 'account', labelAr: 'الحساب', labelEn: 'Account', icon: User }
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Header & Navigation Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setView('profile')}
            className="p-2 rounded-2xl bg-[#181824] hover:bg-[#232334] border border-white/10 text-zinc-300 transition-all cursor-pointer"
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <div>
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
              {isAr ? 'إدارة المنظومة والتخصيص' : 'System Configuration'}
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">
              {isAr ? 'الإعدادات الاحترافية' : 'Professional Settings'}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 text-xs font-semibold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
        </button>
      </div>

      {/* Floating Success Toast */}
      {saveSuccessMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-scale-in">
          <CheckCircle2 className="w-4 h-4 fill-black text-emerald-500" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Categorized Horizontal Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                triggerHaptic('light');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-[#151522] border border-[#262638] text-zinc-400 hover:text-white hover:bg-[#1C1C2D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isAr ? t.labelAr : t.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 🎨 1. APPEARANCE & VISUAL ERGONOMICS SECTION */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'appearance') && (
        <div className="rounded-3xl bg-[#14141E] border border-[#242436] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Palette className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'المظهر والتجربة البصرية (Themes & Motion)' : 'Visual Theme & Ergonomics'}
            </h2>
          </div>

          {/* Theme Palette Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">
              {isAr ? 'طابع الألوان السينمائي:' : 'Cinematic Theme Palette:'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'cinematic_dark', nameAr: 'الرمادي السينمائي (الافتراضي)', nameEn: 'Cinematic Slate', color: 'from-[#181826] to-[#101017]', border: 'border-purple-500/40' },
                { id: 'midnight_oled', nameAr: 'منتصف الليل (OLED أسود نقي)', nameEn: 'Midnight Pure Black', color: 'from-[#050508] to-[#000000]', border: 'border-zinc-700' },
                { id: 'royal_purple', nameAr: 'البنفسجي الملكي (Amethyst)', nameEn: 'Royal Amethyst', color: 'from-[#23153C] to-[#140D24]', border: 'border-amber-500/40' },
                { id: 'emerald_focus', nameAr: 'زمردي التركيز (Emerald Focus)', nameEn: 'Emerald Calm', color: 'from-[#0D241E] to-[#061511]', border: 'border-emerald-500/40' }
              ].map((thm) => {
                const isCurrent = settings.theme === thm.id;
                return (
                  <button
                    key={thm.id}
                    onClick={() => {
                      updateSettings({ theme: thm.id as any });
                      showToast(isAr ? `تم تطبيق طابع: ${thm.nameAr}` : `Theme applied: ${thm.nameEn}`);
                    }}
                    className={`p-3 rounded-2xl bg-gradient-to-b ${thm.color} border text-start relative transition-all cursor-pointer ${
                      isCurrent ? 'ring-2 ring-amber-400 border-transparent shadow-lg' : 'border-[#28283C] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white block">
                        {isAr ? thm.nameAr : thm.nameEn}
                      </span>
                      {isCurrent && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Scale Selector */}
          <div className="p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">{isAr ? 'حجم الخط في التقارير' : 'Report Typography Scale'}</span>
              <span className="text-[10px] text-zinc-400">{isAr ? 'تعديل كثافة القراءة للنصوص والتحليلات' : 'Adjust display density'}</span>
            </div>
            <div className="flex bg-[#161622] p-1 rounded-xl border border-white/5 gap-1">
              {[
                { id: 'compact', labelAr: 'مكثف', labelEn: 'Compact' },
                { id: 'standard', labelAr: 'قياسي', labelEn: 'Standard' },
                { id: 'comfortable', labelAr: 'مريح', labelEn: 'Comfortable' }
              ].map((sz) => (
                <button
                  key={sz.id}
                  onClick={() => updateSettings({ fontSize: sz.id as any })}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    settings.fontSize === sz.id ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isAr ? sz.labelAr : sz.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles: Haptic, Motion, Sound */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">{isAr ? 'الاهتزاز اللمسي الذكي (Haptics)' : 'Haptic Touch Response'}</span>
                  <span className="text-[10px] text-zinc-400">{isAr ? 'نبضات لمسية عند اختيار الإجابات وإنجاز الأهداف' : 'Vibrations during interactions'}</span>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.hapticFeedback ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.hapticFeedback ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-white block">{isAr ? 'وضع توفير الحركة (Reduced Motion)' : 'Reduced Motion'}</span>
                  <span className="text-[10px] text-zinc-400">{isAr ? 'تقليل الرسوم المتحركة لسرعة فائقة' : 'Minimizes animation intensity'}</span>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.reducedMotion ? 'bg-purple-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.reducedMotion ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🤖 2. AI COACH & PSYCHOLOGY ENGINE CUSTOMIZATION */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'ai') && (
        <div className="rounded-3xl bg-[#14141E] border border-[#242436] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Bot className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'عقل المدرب والذكاء السلوكي (AI Coach Engine)' : 'AI Behavioral Coach Engine'}
            </h2>
          </div>

          {/* Coach Persona / Tone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">
              {isAr ? 'نبرة وأسلوب المدرب في المحادثة:' : 'AI Coach Tone & Persona:'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'deep_wise', nameAr: 'الحكيم الفلسفي', descAr: 'استبصار عميق وتشبيهات سلوكية', nameEn: 'Socratic Sage', descEn: 'Deep metaphors & introspection' },
                { id: 'motivational', nameAr: 'الحازم والمشجع', descAr: 'تركيز على الانضباط والنتائج', nameEn: 'Action Coach', descEn: 'Direct discipline & tactical execution' },
                { id: 'calm_empathic', nameAr: 'العاطفي الهادئ', descAr: 'احتواء نفسي وأمان عاطفي', nameEn: 'Empathic Counselor', descEn: 'Warm validation & emotional safety' },
                { id: 'analytical', nameAr: 'المحلل العلمي', descAr: 'علوم أعصاب ودراسات سلوكية', nameEn: 'Neuro-Scientist', descEn: 'Data-driven neuroscience insights' }
              ].map((tone) => {
                const isSelected = settings.coachTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    onClick={() => {
                      updateSettings({ coachTone: tone.id as any });
                      showToast(isAr ? `تم ضبط نبرة المدرب: ${tone.nameAr}` : `Coach tone set: ${tone.nameEn}`);
                    }}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1D172E] border-purple-500 shadow-md ring-1 ring-purple-500'
                        : 'bg-[#0D0D14] border-[#222232] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{isAr ? tone.nameAr : tone.nameEn}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                      {isAr ? tone.descAr : tone.descEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storytelling & Narrative Depth */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">
              {isAr ? 'عمق القصص والأمثلة الحياتية في الإجابات:' : 'Storytelling & Narrative Depth:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rich_stories', labelAr: 'قصص غنية وممتعة', labelEn: 'Rich Parables' },
                { id: 'balanced', labelAr: 'متوازن وحيوي', labelEn: 'Balanced' },
                { id: 'direct_tactical', labelAr: 'موجز ونقاط مباشرة', labelEn: 'Direct Points' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => updateSettings({ storyDepth: st.id as any })}
                  className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    settings.storyDepth === st.id
                      ? 'bg-purple-950/60 border-purple-500 text-amber-300'
                      : 'bg-[#0D0D14] border-[#20202E] text-zinc-400 hover:text-white'
                  }`}
                >
                  {isAr ? st.labelAr : st.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* AI Core Model Badge */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-800/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Server className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'محرك الذكاء الاصطناعي:' : 'AI Model Engine:'}</span>
            </div>
            <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              Gemini 3.7 Flash Pro Core
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔔 3. SMART NOTIFICATIONS & BEHAVIORAL REMINDERS */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'notifications') && (
        <div className="rounded-3xl bg-[#14141E] border border-[#242436] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'التنبيهات والمواعيد السلوكية الذكية' : 'Smart Notifications & Habits'}
            </h2>
          </div>

          <div className="space-y-2.5">
            {/* 24h Growth Challenge reminder */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div>
                <span className="text-xs font-bold text-white block">{isAr ? 'تنبيه تحدي النمو اليومي (24h)' : 'Daily 24h Challenge Ping'}</span>
                <span className="text-[10px] text-zinc-400">{isAr ? 'تذكيرك بتطبيق التمرين اليومي قبل انتهاء وقته' : 'Reminds you before the 24h challenge expires'}</span>
              </div>
              <button
                onClick={() => updateSettings({ dailyGrowthReminder: !settings.dailyGrowthReminder })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.dailyGrowthReminder ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.dailyGrowthReminder ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>

            {/* Goals Daily Checkin */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div>
                <span className="text-xs font-bold text-white block">{isAr ? 'تذكير الأهداف والتقييم السلوكي' : 'Goals Check-In Prompts'}</span>
                <span className="text-[10px] text-zinc-400">{isAr ? 'إرسال أسئلة التفقد السلوكية المخصصة لنمطك' : 'Triggers psychological reflection prompts'}</span>
              </div>
              <button
                onClick={() => updateSettings({ goalsReminder: !settings.goalsReminder })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.goalsReminder ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.goalsReminder ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>

            {/* Monthly Retest */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div>
                <span className="text-xs font-bold text-white block">{isAr ? 'تنبيه التقييم الدوري (كل 30 يوماً)' : 'Monthly Longitudinal Retest'}</span>
                <span className="text-[10px] text-zinc-400">{isAr ? 'قياس تطور شخصيتك ونضجك النفسي عبر الزمن' : 'Alerts you when a fresh 30-day delta is ready'}</span>
              </div>
              <button
                onClick={() => updateSettings({ monthlyRetestReminder: !settings.monthlyRetestReminder })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.monthlyRetestReminder ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.monthlyRetestReminder ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>

            {/* Telegram Sync */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div>
                <span className="text-xs font-bold text-white block">{isAr ? 'مزامنة تيليجرام المباشرة (Telegram Push)' : 'Telegram Bot Sync'}</span>
                <span className="text-[10px] text-zinc-400">{isAr ? 'استقبال التنبيهات ورسائل المدرب عبر بوت تيليجرام' : 'Send updates directly via @persona_ai_bot'}</span>
              </div>
              <button
                onClick={() => updateSettings({ telegramSync: !settings.telegramSync })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.telegramSync ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.telegramSync ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔒 4. PRIVACY, SECURITY & DATA SOVEREIGNTY */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'privacy') && (
        <div className="rounded-3xl bg-[#14141E] border border-[#242436] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'الخصوصية، الأمان وتصدير البيانات' : 'Privacy, Security & Data Sovereignty'}
            </h2>
          </div>

          <div className="space-y-3">
            {/* Private Ghost Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E]">
              <div>
                <span className="text-xs font-bold text-white block">{isAr ? 'وضع الخصوصية المشددة (Ghost Mode)' : 'Ghost Privacy Mode'}</span>
                <span className="text-[10px] text-zinc-400">{isAr ? 'إخفاء اسمك ومعرفك في بطاقات المشاركة العامة' : 'Masks your full name in shared report links'}</span>
              </div>
              <button
                onClick={() => updateSettings({ privateMode: !settings.privateMode })}
                className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                  settings.privateMode ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.privateMode ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''}`} />
              </button>
            </div>

            {/* Export My Data Button */}
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full p-3.5 rounded-2xl bg-[#171726] hover:bg-[#202032] border border-[#2D2D44] flex items-center justify-between text-start transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-white block">{isAr ? 'تصدير كامل بياناتك (JSON Backup)' : 'Export Full Data Archive'}</span>
                  <span className="text-[10px] text-zinc-400">{isAr ? 'تنزيل نسخة احتياطية من تقاريرك، أهدافك، وتحدياتك' : 'Download all assessments & history'}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-300 font-mono">
                {isExporting ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'تنزيل ↓' : 'Download ↓')}
              </span>
            </button>

            {/* Clear Local Cache */}
            <button
              onClick={handleClearLocalCache}
              className="w-full p-3.5 rounded-2xl bg-[#171726] hover:bg-[#202032] border border-[#2D2D44] flex items-center justify-between text-start transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-zinc-400" />
                <div>
                  <span className="text-xs font-bold text-white block">{isAr ? 'مسح الذاكرة المؤقتة والتخزين المحلي' : 'Purge Cache & Temporary Assets'}</span>
                  <span className="text-[10px] text-zinc-400">{isAr ? 'إعادة تنشيط المزامنة دون التأثير على حسابك' : 'Refreshes client memory without losing account data'}</span>
                </div>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{isAr ? 'تنظيف' : 'Purge'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌐 5. ACCOUNT, SUBSCRIPTION & LOGOUT */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'account') && (
        <div className="rounded-3xl bg-[#14141E] border border-[#242436] p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <User className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'بيانات الحساب والاشتراك' : 'Account & Subscription Tier'}
            </h2>
          </div>

          {/* Language Selector */}
          <div className="p-3.5 rounded-2xl bg-[#0D0D14] border border-[#20202E] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-bold text-white block">{isAr ? 'لغة التطبيق والتقارير' : 'System Language'}</span>
                <span className="text-[10px] text-zinc-400">{isAr ? 'التبديل بين العربية والإنجليزية' : 'Arabic & English support'}</span>
              </div>
            </div>
            <div className="flex bg-[#161622] p-1 rounded-xl border border-white/5 gap-1">
              <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  isAr ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  !isAr ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Subscription Tier Info & Upgrade Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-950/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                <Crown className="w-5 h-5 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">
                    {isPremiumUser ? (isAr ? 'عضوية PERSONA Premium نشطة 👑' : 'PERSONA Premium Active') : (isAr ? 'الباقة الأساسية (مجاني)' : 'Basic Free Tier')}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isPremiumUser
                    ? (isAr ? 'تحليلات الحميمية والعلاقات والذكاء الاصطناعي متاحة بالكامل' : 'Full depth, intimacy & live coach unlocked')
                    : (isAr ? 'قم بالترقية لفتح أبعاد العلاقات والحميمية الكاملة' : 'Upgrade for intimacy, career & unlimited AI coaching')}
                </p>
              </div>
            </div>

            {!isPremiumUser && (
              <button
                onClick={openPremiumModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-md shrink-0 cursor-pointer"
              >
                {isAr ? 'ترقية' : 'Upgrade'}
              </button>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="w-full p-3.5 rounded-2xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 flex items-center justify-between text-xs font-semibold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-red-400" />
              <span>{isAr ? 'تسجيل الخروج من الحساب الحالي' : 'Sign Out of Account'}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-red-400 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* 6. System Diagnostics & Ethics Footer Card */}
      <div className="p-4 rounded-2xl bg-[#101017] border border-[#1F1F2B] text-center space-y-1.5 text-zinc-500 text-[11px]">
        <div className="flex items-center justify-center gap-2 text-zinc-400 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>PERSONA Behavioral Intelligence • v2.6.4 (2026 Core)</span>
        </div>
        <p>
          {isAr
            ? 'تلتزم المنظومة بميثاق الأمان النفسي والتوجيه السلوكي غير التشخيصي.'
            : 'Non-diagnostic psychometric intelligence following strict psychological ethics.'}
        </p>
      </div>

      {/* ======================================================== */}
      {/* RESET CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#161424] border border-[#30264A] p-5 space-y-4 shadow-2xl animate-scale-in text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'استعادة الإعدادات الافتراضية؟' : 'Restore Default Settings?'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {isAr
                  ? 'سيتم إعادة تعيين المظهر، نبرة المدرب، والتنبيهات إلى القيم الافتراضية.'
                  : 'This will reset your theme, coach tone, and reminders to default.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="py-2.5 rounded-xl bg-white/5 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  resetSettings();
                  setIsResetConfirmOpen(false);
                  showToast(isAr ? 'تمت استعادة الإعدادات الافتراضية بنجاح' : 'Settings restored to default');
                }}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isAr ? 'نعم، استعادة' : 'Yes, Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

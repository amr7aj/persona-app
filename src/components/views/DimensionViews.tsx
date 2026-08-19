import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Heart,
  Users,
  Briefcase,
  Activity,
  Flame,
  Shield,
  Sparkles,
  Crown,
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';

export const DimensionViews: React.FC = () => {
  const { selectedDimension, setView, latestReport, user, language, openPremiumModal } = useApp();
  const isAr = language === 'ar';
  const isPremiumUser = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'super_admin';

  const archetype = latestReport?.archetype || ARCHETYPES[latestReport?.archetypeId || 'strategic-builder'];
  const scores = latestReport?.domainScores || {
    cognitive: 88,
    emotional: 82,
    social: 79,
    behavioral: 91,
    motivation: 87,
    lifestyle: 80,
    relationships: 83,
    intimacy: 85,
    career: 89
  };

  const getDimensionContent = () => {
    switch (selectedDimension) {
      case 'mind':
        return {
          titleAr: 'تحليل العقل والتفكير والمنطق',
          titleEn: 'Cognitive & Mind Intelligence',
          icon: <Brain className="w-6 h-6 text-violet-400" />,
          score: scores.cognitive,
          category: 'cognitive',
          analysisAr: 'يُظهر نموذجك العقلي قدرة عالية على التحليل الهيكلي وتفكيك المعضلات المعقدة. تميل إلى جمع الحقائق قبل إطلاق الأحكام وتفضّل الرؤية الشاملة على التفاصيل المتفرقة.',
          analysisEn: 'Your cognitive profile demonstrates high capacity for structural reasoning and decomposing complex problems with objective foresight.',
          metrics: [
            { nameAr: 'التفكير التحليلي', nameEn: 'Analytical Reasoning', val: 92 },
            { nameAr: 'المرونة الذهنية', nameEn: 'Cognitive Flexibility', val: 84 },
            { nameAr: 'سرعة اتخاذ القرار', nameEn: 'Decision Velocity', val: 88 },
            { nameAr: 'التركيز الاستراتيجي', nameEn: 'Strategic Focus', val: 95 }
          ]
        };

      case 'emotional':
        return {
          titleAr: 'تحليل الذكاء العاطفي والاستقرار',
          titleEn: 'Emotional Intelligence & Stability',
          icon: <Heart className="w-6 h-6 text-pink-400" />,
          score: scores.emotional,
          category: 'emotional',
          analysisAr: 'تتمتع بمستوى متقدم من الوعي الذاتي بالمشاعر الداخلية. تمتلك مرشحاً عقلانياً يمنع الانفعال اللحظي، مما يمنحك هدوءاً وثباتاً أمام المواقف غير المتوقعة.',
          analysisEn: 'You possess advanced emotional self-awareness, allowing you to regulate internal tension effectively and maintain calm presence under pressure.',
          metrics: [
            { nameAr: 'الوعي بالذات', nameEn: 'Self-Awareness', val: 86 },
            { nameAr: 'التحكم بالانفعال', nameEn: 'Impulse Control', val: 89 },
            { nameAr: 'التعاطف والتفهم', nameEn: 'Empathetic Resonance', val: 81 },
            { nameAr: 'المرونة النفسية', nameEn: 'Psychological Resilience', val: 85 }
          ]
        };

      case 'social':
        return {
          titleAr: 'الذكاء الاجتماعي والتواصل',
          titleEn: 'Social Intelligence & Energy',
          icon: <Users className="w-6 h-6 text-sky-400" />,
          score: scores.social,
          category: 'social',
          analysisAr: 'حضورك الاجتماعي يتسم بالعمق والانتقائية الإيجابية. تفضل الحوارات النوعية والمشاريع التعاونية المثمرة بدلاً من العلاقات السطحية المجهدة للطاقة.',
          analysisEn: 'Your social presence combines selective depth with constructive engagement, prioritizing meaningful collaboration over superficial interactions.',
          metrics: [
            { nameAr: 'الثقة والحضور', nameEn: 'Presence & Poise', val: 82 },
            { nameAr: 'الوضوح التواصلي', nameEn: 'Communication Clarity', val: 87 },
            { nameAr: 'إدارة بطارية الطاقة', nameEn: 'Social Energy Management', val: 78 },
            { nameAr: 'بناء التحالفات', nameEn: 'Alliance Building', val: 84 }
          ]
        };

      case 'career':
        return {
          titleAr: 'العمل والريادة والمال',
          titleEn: 'Career, Leadership & Wealth',
          icon: <Briefcase className="w-6 h-6 text-amber-400" />,
          score: scores.career,
          category: 'career',
          analysisAr: 'تمتلك طموحاً هيكلياً يحول الأهداف الكبيرة إلى خطط عمل واقعية قابلة للقياس. تفضل البيئات التي تمنحك استقلالية القيادة والتأثير الملموس.',
          analysisEn: 'You transform expansive visions into execution milestones with strong autonomy, driving long-term strategic compounding.',
          metrics: [
            { nameAr: 'الطموح والقيادة', nameEn: 'Leadership Drive', val: 91 },
            { nameAr: 'الانضباط المالي', nameEn: 'Financial Prudence', val: 88 },
            { nameAr: 'إدارة المخاطر', nameEn: 'Calculated Risk', val: 83 },
            { nameAr: 'التفويض الفعال', nameEn: 'Delegation Framework', val: 79 }
          ]
        };

      case 'lifestyle':
        return {
          titleAr: 'الجسد والطاقة الحيوية',
          titleEn: 'Body, Vitality & Habits',
          icon: <Activity className="w-6 h-6 text-emerald-400" />,
          score: scores.lifestyle,
          category: 'lifestyle',
          analysisAr: 'جسدك هو محرك إنتاجيتك الأساسي. يُظهر تحليلك أهمية الحفاظ على إيقاع نوم منتظم وفترات نشاط بدني متقطعة لحماية طاقتك الذهنية من الاحتراق.',
          analysisEn: 'Your physical vitality directly powers cognitive clarity. Consistent sleep rhythm and regular movement are essential anchors for your energy.',
          metrics: [
            { nameAr: 'إدارة طاقة اليوم', nameEn: 'Daily Energy Management', val: 82 },
            { nameAr: 'جودة النوم والاستشفاء', nameEn: 'Sleep & Recovery', val: 79 },
            { nameAr: 'النشاط البدني', nameEn: 'Physical Movement', val: 76 },
            { nameAr: 'الحماية من الاحتراق', nameEn: 'Burnout Shielding', val: 84 }
          ]
        };

      case 'intimacy':
      default:
        return {
          titleAr: 'الحميمية والتواصل العاطفي الناضج',
          titleEn: 'Intimacy & Deep Relational Connection',
          icon: <Flame className="w-6 h-6 text-rose-400" />,
          score: scores.intimacy,
          category: 'intimacy',
          isPremium: true,
          analysisAr: 'في الجانب الحميمي والتواصل العاطفي العميق، تعتمد على الأمان النفسي كشرط أساسي للتعبير والتقارب. تُقدّر الحوار الصادق، وضوح الحدود الشخصية، والتناغم المتبادل بين المشاعر والجسد.',
          analysisEn: 'In mature intimacy and relational vulnerability, psychological safety is your core prerequisite. You thrive when open boundary communication meets mutual resonance.',
          metrics: [
            { nameAr: 'التعبير عن الاحتياجات والحدود', nameEn: 'Boundary & Desire Communication', val: 87 },
            { nameAr: 'الأمان العاطفي والتقارب', nameEn: 'Emotional Safety in Intimacy', val: 85 },
            { nameAr: 'التناغم والاتصال الصادق', nameEn: 'Reciprocal Attunement', val: 89 },
            { nameAr: 'الوعي بالجسد والمشاعر', nameEn: 'Somatic & Emotional Presence', val: 83 }
          ]
        };
    }
  };

  const content = getDimensionContent();

  if (content.isPremium && !isPremiumUser) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-fade-in space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/30">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            {isAr ? 'ميزة حصرية للمشتركين' : 'Premium Exclusive'}
          </span>
          <h2 className="text-xl font-bold text-white">
            {isAr ? content.titleAr : content.titleEn}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {isAr
              ? 'يتضمن هذا القسم تحليلاً معمقاً للحدود العاطفية، أنماط التواصل الحميمي الناضج، والتوافق النفسي.'
              : 'This module provides in-depth psychological intelligence on intimate communication, boundaries, and relationship dynamics.'}
          </p>
        </div>

        <div className="w-full space-y-2 pt-2">
          <button
            onClick={openPremiumModal}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Crown className="w-4 h-4 fill-black" />
            <span>{isAr ? 'فتح المحور وترقية الحساب' : 'Unlock Premium Access'}</span>
          </button>
          <button
            onClick={() => setView('home')}
            className="w-full py-2.5 text-center text-xs text-zinc-500 hover:text-zinc-300"
          >
            {isAr ? 'العودة للرئيسية' : 'Return Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#20202E]">
        <button
          onClick={() => setView('home')}
          className="p-2 rounded-xl bg-[#161622] border border-[#252535] text-zinc-300 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
        >
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{isAr ? 'الرئيسية' : 'Back'}</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">{isAr ? 'المحور التخصصي' : 'Dimension Focus'}</span>
          <h1 className="text-xs font-bold text-white">{isAr ? content.titleAr : content.titleEn}</h1>
        </div>
      </div>

      {/* Hero Dimension Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#181826] via-[#14141E] to-[#101017] border border-[#2B2B3E] space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-[#1F1F2F] border border-[#2D2D44]">
            {content.icon}
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 px-4 rounded-xl bg-[#0F0F16] border border-[#232333]">
            <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'المؤشر' : 'Index'}</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{content.score}%</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isAr ? content.titleAr : content.titleEn}
          </h2>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            {isAr ? content.analysisAr : content.analysisEn}
          </p>
        </div>
      </div>

      {/* Detailed Metrics Sub-Dimensions */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-white">
          {isAr ? 'مؤشرات الأداء السلوكي الدقيقة' : 'Detailed Sub-Dimensional Vectors'}
        </h3>

        <div className="space-y-2.5">
          {content.metrics.map((m, i) => (
            <div key={i} className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{isAr ? m.nameAr : m.nameEn}</span>
                <span className="font-mono font-bold text-amber-400">{m.val}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#0D0D14] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-400"
                  style={{ width: `${m.val}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety / Ethics Footer */}
      <div className="p-4 rounded-2xl bg-[#12121A] border border-[#20202E] flex items-center gap-2.5 text-[11px] text-zinc-400">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{isAr ? 'هذا التحليل لأغراض التوعية الذاتية والتطوير، ولا يمثل تشخيصاً طبياً.' : 'Designed for self-awareness and personal development. Non-diagnostic.'}</span>
      </div>
    </div>
  );
};

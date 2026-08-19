import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Heart,
  Users,
  Briefcase,
  Activity,
  Flame,
  Sparkles,
  Zap,
  ChevronRight,
  TrendingUp,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DimensionInfo {
  key: string;
  dimensionId: string;
  labelAr: string;
  labelEn: string;
  score: number;
  category: 'core' | 'social' | 'lifestyle';
  descriptionAr: string;
  descriptionEn: string;
}

export const InteractivePersonalityRadar: React.FC = () => {
  const { latestReport, language, setView, triggerHaptic } = useApp();
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'core' | 'social' | 'lifestyle'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedScores, setSimulatedScores] = useState<Record<string, number>>({});

  const isAr = language === 'ar';

  const defaultScores = {
    cognitive: latestReport?.domainScores?.cognitive ?? 88,
    emotional: latestReport?.domainScores?.emotional ?? 82,
    social: latestReport?.domainScores?.social ?? 78,
    behavioral: latestReport?.domainScores?.behavioral ?? 85,
    motivation: latestReport?.domainScores?.motivation ?? 90,
    lifestyle: latestReport?.domainScores?.lifestyle ?? 79,
    relationships: latestReport?.domainScores?.relationships ?? 84,
    intimacy: latestReport?.domainScores?.intimacy ?? 86,
    career: latestReport?.domainScores?.career ?? 89
  };

  const getScore = (key: keyof typeof defaultScores) => {
    if (isSimulating && simulatedScores[key] !== undefined) {
      return simulatedScores[key];
    }
    return defaultScores[key];
  };

  const dimensionsData: DimensionInfo[] = [
    {
      key: 'cognitive',
      dimensionId: 'mind',
      labelAr: 'العقل والتحليل',
      labelEn: 'Mind & Cognition',
      score: getScore('cognitive'),
      category: 'core',
      descriptionAr: 'القدرة على التفكير الهيكلي، حل المعضلات، واتخاذ القرارات العقلانية.',
      descriptionEn: 'Structured thinking, complex problem solving, and analytical decision-making.'
    },
    {
      key: 'emotional',
      dimensionId: 'emotional',
      labelAr: 'الذكاء العاطفي',
      labelEn: 'Emotional IQ',
      score: getScore('emotional'),
      category: 'core',
      descriptionAr: 'الوعي بالذات، استيعاب المشاعر وتنظيم الاستجابات تحت الضغط.',
      descriptionEn: 'Self-awareness, emotional processing, and composure under tension.'
    },
    {
      key: 'social',
      dimensionId: 'social',
      labelAr: 'التأثير الاجتماعي',
      labelEn: 'Social Impact',
      score: getScore('social'),
      category: 'social',
      descriptionAr: 'الحضور، الكاريزما، وبناء شبكات علاقات متينة قائمة على الثقة.',
      descriptionEn: 'Charisma, networking presence, and trust-centered social engagement.'
    },
    {
      key: 'behavioral',
      dimensionId: 'mind',
      labelAr: 'الانضباط والالتزام',
      labelEn: 'Discipline',
      score: getScore('behavioral'),
      category: 'core',
      descriptionAr: 'قوة الإرادة، الاتساق اليومي، وإتمام المهام حتى خط النهاية.',
      descriptionEn: 'Willpower, daily consistency, and resilient project execution.'
    },
    {
      key: 'motivation',
      dimensionId: 'career',
      labelAr: 'الدافعية والطموح',
      labelEn: 'Drive & Ambition',
      score: getScore('motivation'),
      category: 'social',
      descriptionAr: 'الرغبة في الريادة والابتكار وتحقيق بصمة مستدامة.',
      descriptionEn: 'Internal motivation, leadership vision, and legacy creation.'
    },
    {
      key: 'lifestyle',
      dimensionId: 'lifestyle',
      labelAr: 'الطاقة الحيوية والجسد',
      labelEn: 'Vitality & Health',
      score: getScore('lifestyle'),
      category: 'lifestyle',
      descriptionAr: 'جودة النوم، النشاط البدني، واستعادة الطاقة الذهنية.',
      descriptionEn: 'Physical vitality, sleep balance, and neurological recharge.'
    },
    {
      key: 'relationships',
      dimensionId: 'social',
      labelAr: 'عمق العلاقات',
      labelEn: 'Relationships',
      score: getScore('relationships'),
      category: 'social',
      descriptionAr: 'التواصل الصادق، الأمان النفسي، وبناء الروابط العميقة.',
      descriptionEn: 'Authentic communication, psychological safety, and deep bonds.'
    },
    {
      key: 'intimacy',
      dimensionId: 'intimacy',
      labelAr: 'الحميمية والحدود',
      labelEn: 'Intimacy Balance',
      score: getScore('intimacy'),
      category: 'lifestyle',
      descriptionAr: 'التوازن بين القرب العاطفي والحفاظ على المساحة الشخصية.',
      descriptionEn: 'Emotional vulnerability paired with healthy personal boundaries.'
    },
    {
      key: 'career',
      dimensionId: 'career',
      labelAr: 'النجاح المهني والمالي',
      labelEn: 'Career & Wealth',
      score: getScore('career'),
      category: 'social',
      descriptionAr: 'التخطيط المالي، التميز الوظيفي، واقتناص الفرص الاستثمارية.',
      descriptionEn: 'Financial mastery, executive excellence, and strategic risk-taking.'
    }
  ];

  const filteredData = dimensionsData.filter(
    (d) => filterMode === 'all' || d.category === filterMode
  );

  const chartData = filteredData.map((d) => ({
    subject: isAr ? d.labelAr : d.labelEn,
    fullSubject: d,
    score: d.score,
    fullMark: 100
  }));

  const activeDimObj = dimensionsData.find((d) => d.key === selectedDimension) || dimensionsData[0];

  const handleSimulateChange = (key: string, val: number) => {
    setSimulatedScores((prev) => ({ ...prev, [key]: val }));
    triggerHaptic('light');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload.fullSubject as DimensionInfo;
      return (
        <div className="p-3 rounded-2xl bg-[#121217] border border-[#9061F9]/50 shadow-2xl backdrop-blur-md text-xs max-w-[200px] z-50">
          <div className="flex items-center justify-between font-bold text-white mb-1">
            <span>{isAr ? dataPoint.labelAr : dataPoint.labelEn}</span>
            <span className="text-amber-400 font-mono">{dataPoint.score}%</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
            {isAr ? dataPoint.descriptionAr : dataPoint.descriptionEn}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="interactive-personality-radar" className="p-5 rounded-3xl bg-[#121217] border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-[#7E3AF2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7E3AF2] to-[#9061F9] text-white flex items-center justify-center shadow-lg shadow-[#7E3AF2]/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              {isAr ? 'خارطة التوازن السلوكي التفاعلية (Real-Time Radar)' : 'Interactive Dimensions Radar (Real-Time)'}
            </h3>
            <p className="text-[11px] text-[#9CA3AF]">
              {isAr ? 'انقر على أي محور للاستكشاف والتحليل الفوري' : 'Dynamic visualization synced with assessment scores'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsSimulating(!isSimulating);
            triggerHaptic('light');
          }}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isSimulating
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
              : 'bg-[#18181F] text-[#9CA3AF] hover:text-white border border-white/10'
          }`}
          title={isAr ? 'محاكي الأبعاد' : 'Dimension Simulator'}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-[10px]">{isAr ? 'محاكاة' : 'Simulate'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B0B0F] border border-white/5 overflow-x-auto">
        {[
          { id: 'all', labelAr: 'كافة الأبعاد (9)', labelEn: 'All Vectors (9)' },
          { id: 'core', labelAr: 'العقل والانضباط', labelEn: 'Core & Mind' },
          { id: 'social', labelAr: 'المجتمع والمهنة', labelEn: 'Social & Drive' },
          { id: 'lifestyle', labelAr: 'الجسد والحميمية', labelEn: 'Lifestyle' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setFilterMode(tab.id as any);
              triggerHaptic('light');
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterMode === tab.id
                ? 'bg-[#7E3AF2] text-white shadow-md shadow-[#7E3AF2]/30'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Main Radar Canvas */}
      <div className="h-[290px] w-full relative flex items-center justify-center py-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#262636" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#E5E7EB', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#6B7280', fontSize: 9 }}
              stroke="#262636"
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Index"
              dataKey="score"
              stroke="#F59E0B"
              fill="url(#radarAreaGradient)"
              fillOpacity={0.65}
              isAnimationActive={true}
              animationDuration={800}
            />
            <defs>
              <linearGradient id="radarAreaGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7E3AF2" stopOpacity={0.7} />
                <stop offset="50%" stopColor="#9061F9" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.4} />
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Simulator Controls Drawer if active */}
      <AnimatePresence>
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-2xl bg-[#0B0B0F] border border-amber-400/30 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>{isAr ? '🎛️ جرب تغيير درجات أبعادك وشاهد إعادة التشكيل الحية:' : '🎛️ Adjust dimensions to simulate real-time morphing:'}</span>
              <button
                onClick={() => setSimulatedScores({})}
                className="text-[10px] text-[#9CA3AF] hover:text-white underline"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {dimensionsData.slice(0, 6).map((dim) => (
                <div key={dim.key} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                    <span>{isAr ? dim.labelAr : dim.labelEn}</span>
                    <span className="font-mono text-white font-bold">{dim.score}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={dim.score}
                    onChange={(e) => handleSimulateChange(dim.key, Number(e.target.value))}
                    className="w-full h-1 bg-[#1F1F2E] rounded-lg appearance-none cursor-pointer accent-[#9061F9]"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Dimension Quick Door */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {dimensionsData.slice(0, 3).map((dim) => (
          <div
            key={dim.key}
            onClick={() => {
              triggerHaptic('light');
              setView('dimension', dim.dimensionId);
            }}
            className="p-3 rounded-2xl bg-[#18181F] hover:bg-[#20202E] border border-white/5 hover:border-[#9061F9]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-white group-hover:text-amber-300 transition-colors">
                {isAr ? dim.labelAr : dim.labelEn}
              </span>
              <span className="text-xs font-mono font-black text-amber-400">
                {dim.score}%
              </span>
            </div>
            <div className="w-full bg-[#0B0B0F] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7E3AF2] to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${dim.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Explore CTA */}
      <button
        onClick={() => {
          triggerHaptic('light');
          setView('results');
        }}
        className="w-full py-2.5 rounded-xl bg-[#18181F] hover:bg-[#7E3AF2]/20 border border-white/10 hover:border-[#9061F9]/50 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        <span>{isAr ? 'عرض التحليل التفصيلي لكافة المحاور التسعة' : 'Deep-dive into all 9 dimensions'}</span>
        <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
      </button>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  Share2,
  ChevronRight,
  Download,
  Plus
} from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';

export const ReportsHistoryView: React.FC = () => {
  const { reportsList, setView, openShareModal, language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
            {isAr ? 'أرشيف التحليلات المعتمدة' : 'Certified Assessment Vault'}
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            {isAr ? 'تقارير الشخصية' : 'Personality Reports'}
          </h1>
        </div>

        <button
          onClick={() => setView('analysis')}
          className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تحليل جديد' : 'New Test'}</span>
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reportsList.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#14141E] border border-dashed border-[#262638] text-center space-y-3">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'لا توجد تقارير سابقة مسجلة' : 'No previous reports found'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              {isAr ? 'ابدأ أول جلسة تقييم لتوليد تقرير شخصيتك المعتمد وحفظه في الأرشيف.' : 'Take your first assessment to generate and store your personality blueprint.'}
            </p>
            <button
              onClick={() => setView('analysis')}
              className="py-2.5 px-5 rounded-xl bg-amber-400 text-black font-bold text-xs"
            >
              {isAr ? 'ابدأ التحليل الآن' : 'Start Assessment'}
            </button>
          </div>
        ) : (
          reportsList.map((r) => {
            const arch = r.archetype || ARCHETYPES[r.archetypeId] || ARCHETYPES['strategic-builder'];
            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] hover:border-[#383850] transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {isAr ? arch.nameAr : arch.nameEn}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="font-mono text-purple-300">v{r.version || '2026.1'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'المؤشر' : 'Score'}</span>
                    <span className="text-base font-bold font-mono text-amber-400">{r.overallScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1C1C28] text-center text-xs">
                  <div className="p-2 rounded-xl bg-[#0D0D14] text-zinc-300">
                    <div className="text-[10px] text-zinc-400">{isAr ? 'العقل' : 'Mind'}</div>
                    <div className="font-mono font-bold mt-0.5">{r.domainScores.cognitive}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0D0D14] text-zinc-300">
                    <div className="text-[10px] text-zinc-400">{isAr ? 'المشاعر' : 'Emotion'}</div>
                    <div className="font-mono font-bold mt-0.5">{r.domainScores.emotional}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0D0D14] text-zinc-300">
                    <div className="text-[10px] text-zinc-400">{isAr ? 'الريادة' : 'Career'}</div>
                    <div className="font-mono font-bold mt-0.5">{r.domainScores.career}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => openShareModal(r)}
                    className="p-2 px-3 rounded-lg bg-[#1B1B26] hover:bg-[#252535] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isAr ? 'مشاركة' : 'Share'}</span>
                  </button>

                  <button
                    onClick={() => setView('results')}
                    className="p-2 px-4 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isAr ? 'فتح التقرير الشامل' : 'Open Full Report'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

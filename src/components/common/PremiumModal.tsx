import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Crown, Check, Sparkles, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Api } from '../../services/api';

export const PremiumModal: React.FC = () => {
  const { isPremiumModalOpen, closePremiumModal, user, refreshUserData, language, triggerHaptic } = useApp();
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isPremiumModalOpen) return null;

  const isAr = language === 'ar';

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      setUpgrading(true);
      await Api.upgradeSubscription(user.id, 'premium_lifetime');
      await refreshUserData();
      setSuccess(true);
      triggerHaptic('success');
      setTimeout(() => {
        setSuccess(false);
        closePremiumModal();
      }, 1800);
    } catch (e) {
      console.error('Failed to upgrade subscription', e);
    } finally {
      setUpgrading(false);
    }
  };

  const premiumFeatures = [
    {
      titleAr: 'تحليل الحميمية والتواصل العميق (للبالغين)',
      titleEn: 'Intimacy & Deep Relational Communication (Adults)',
      descAr: 'تحليل محترم وموثوق لأنماط الحدود، التعبير عن الرغبات، والاتصال العاطفي الناضج.',
      descEn: 'Dignified insights on personal boundaries, desire communication & emotional attunement.'
    },
    {
      titleAr: 'التحليل الاستراتيجي للعلاقات والتعلق',
      titleEn: 'Relationship Intelligence & Attachment Patterns',
      descAr: 'فهم أسباب الخلافات، نمط الأمان العاطفي، وطريقة التعبير عن المشاعر.',
      descEn: 'Attachment tendencies, conflict de-escalation & emotional safety.'
    },
    {
      titleAr: 'تقرير الذكاء الاصطناعي الكامل (Gemini Pro Deep Report)',
      titleEn: 'Complete AI Deep Intelligence Report',
      descAr: 'خطة نمو مخصصة بـ 5 خطوات عملية، ونقاط عمياء وتحليل المسار المهني.',
      descEn: 'Custom 5-vector growth blueprint, psychological blindspots & career mapping.'
    },
    {
      titleAr: 'مقارنة النمو الزمني (2026 vs 2027)',
      titleEn: 'Longitudinal Growth Tracking (2026 vs 2027)',
      descAr: 'تتبع تطور وعيك وانضباطك وثباتك الانفعالي عبر إعادة التقييم الدوري.',
      descEn: 'Track your multi-year cognitive and behavioral evolution.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#121218] border border-[#2B2B3D] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-amber-500/20 p-5 border-b border-amber-500/20 text-center">
          <button
            onClick={closePremiumModal}
            className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30 mb-2">
            <Crown className="w-6 h-6 fill-black" />
          </div>

          <h2 className="text-lg font-bold text-white">
            {isAr ? 'ترقية إلى PERSONA Premium' : 'Upgrade to PERSONA Premium'}
          </h2>
          <p className="text-xs text-amber-200/80 mt-0.5">
            {isAr ? 'افتح أعمق طبقات تحليلك النفسي والعاطفي والعلاقات' : 'Unlock the deepest layers of your psychological intelligence'}
          </p>
        </div>

        {/* Feature List */}
        <div className="p-5 overflow-y-auto max-h-[55vh] space-y-3.5">
          {premiumFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#171722] border border-[#232333]">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">
                  {isAr ? f.titleAr : f.titleEn}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {isAr ? f.descAr : f.descEn}
                </p>
              </div>
            </div>
          ))}

          {/* Pricing Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-amber-950/30 border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-amber-300 font-medium uppercase tracking-wider">
                {isAr ? 'اشتراك مدى الحياة' : 'Lifetime Access'}
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-white">$14.99</span>
                <span className="text-xs text-zinc-400 line-through">$39.99</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'ضمان الرضا' : 'Safe & Private'}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-5 pt-2 border-t border-[#1F1F2C] bg-[#101016]">
          <button
            onClick={handleUpgrade}
            disabled={upgrading || success}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              success
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-amber-500/20'
            }`}
          >
            {success ? (
              <>
                <Check className="w-5 h-5" />
                <span>{isAr ? 'تم تفعيل العضوية المميزة بنجاح! 🎉' : 'Premium Activated! 🎉'}</span>
              </>
            ) : upgrading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>{isAr ? 'جاري تفعيل الحساب...' : 'Activating...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                <span>{isAr ? 'تفعيل العضوية الكاملة الآن' : 'Unlock Complete Analysis'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-zinc-400 mt-2">
            {isAr ? 'تفعيل فوري مع استرجاع كامل للتحليلات السابقة والمستقبلية' : 'Instant activation for all current and future reports'}
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Api } from '../../services/api';

export const ReferralHubView: React.FC = () => {
  const { user, language, setView, triggerHaptic } = useApp();
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    referralCount: number;
    totalXpEarned: number;
    records: any[];
  } | null>(null);

  const isAr = language === 'ar';
  const referralCode = user?.referralCode || 'PERSONA-7X92';
  const shareUrl = `https://t.me/persona_ai_bot?start=${referralCode}`;

  useEffect(() => {
    if (user) {
      Api.getReferralData(user.id).then(setReferralData).catch(console.error);
    }
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    triggerHaptic('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = isAr
      ? `🧠 انضم إليّ في PERSONA واكتشف أبعاد شخصيتك وذكائك السلوكي عبر تقارير الذكاء الاصطناعي الدقيقة:`
      : `🧠 Join me on PERSONA to discover your multi-dimensional personality blueprint:`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

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
          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">{isAr ? 'نظام المكافآت' : 'Referral Hub'}</span>
          <h1 className="text-xs font-bold text-white">{isAr ? 'دعوة الأصدقاء' : 'Invite & Earn'}</h1>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/20 via-[#161624] to-[#101018] border border-amber-500/30 p-6 text-center space-y-4 shadow-xl overflow-hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/30 mb-1">
          <Gift className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isAr ? 'شارك PERSONA واكسب مكافآت حصرية' : 'Invite Friends & Unlock Rewards'}
          </h2>
          <p className="text-xs text-zinc-300 mt-1 max-w-sm mx-auto leading-relaxed">
            {isAr
              ? 'احصل على +100 نقطة خبرة XP عن كل صديق ينضم ويكمل جلسته الأولى، وافتح أوسمة السفير والمزايا التنافسية.'
              : 'Earn +100 XP for every friend who completes their assessment and unlock exclusive Ambassador badges.'}
          </p>
        </div>

        {/* Code Box */}
        <div className="p-3.5 rounded-2xl bg-[#0D0D14] border border-[#262638] flex items-center justify-between max-w-sm mx-auto">
          <div className="text-left pl-2">
            <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'كود الدعوة الخاص بك' : 'Your Referral Code'}</div>
            <div className="text-base font-bold font-mono text-amber-400 tracking-wider">
              {referralCode}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="p-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy')}</span>
          </button>
        </div>

        {/* Share via Telegram */}
        <button
          onClick={handleShareTelegram}
          className="w-full max-w-sm mx-auto py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/30 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isAr ? 'إرسال عبر Telegram الآن' : 'Share via Telegram'}</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] text-center">
          <div className="text-[11px] text-zinc-400">{isAr ? 'إجمالي الأصدقاء' : 'Friends Invited'}</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {referralData?.referralCount ?? user?.referralCount ?? 4}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#232333] text-center">
          <div className="text-[11px] text-zinc-400">{isAr ? 'مكافآت الخبرة' : 'Earned Bonus'}</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            +{((referralData?.referralCount ?? user?.referralCount ?? 4) * 100)} XP
          </div>
        </div>
      </div>

      {/* Friends Joined History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">
              {isAr ? 'قائمة الأصدقاء المنضمين' : 'Referred Users List'}
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            {referralData?.records?.length || 4} {isAr ? 'أعضاء' : 'members'}
          </span>
        </div>

        <div className="space-y-2">
          {(referralData?.records || [
            { id: '1', referredUserName: 'سارة م.', createdAt: '2026-08-01', rewardXp: 100 },
            { id: '2', referredUserName: 'طارق ح.', createdAt: '2026-08-08', rewardXp: 100 },
            { id: '3', referredUserName: 'ليلى ع.', createdAt: '2026-08-12', rewardXp: 100 },
            { id: '4', referredUserName: 'كريم ن.', createdAt: '2026-08-16', rewardXp: 100 }
          ]).map((rec: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#14141E] border border-[#232333] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  {rec.referredUserName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-bold text-white">{rec.referredUserName}</div>
                  <div className="text-[10px] text-zinc-500">
                    {new Date(rec.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                <span>+{rec.rewardXp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Copy, Check, Share2, Sparkles, Shield, Send } from 'lucide-react';
import { ARCHETYPES } from '../../data/archetypesData';

export const ShareModal: React.FC = () => {
  const { isShareModalOpen, closeShareModal, activeShareReport, user, language } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen) return null;

  const isAr = language === 'ar';
  const report = activeShareReport;
  const archetype = report ? (report.archetype || ARCHETYPES[report.archetypeId]) : ARCHETYPES['strategic-builder'];
  const referralCode = user?.referralCode || 'PERSONA-7X92';
  const shareUrl = `https://t.me/persona_ai_bot?start=${referralCode}`;

  const shareText = isAr
    ? `🧠 اكتشفت نمط شخصيتي على منصة PERSONA!\n\n✨ النمط المعتمد: ${archetype?.nameAr || 'البنّاء الاستراتيجي'}\n📊 مؤشر الذكاء السلوكي: ${report?.overallScore || 87}%\n\nاكتشف كيف تعمل من الداخل عبر الرابط:\n${shareUrl}`
    : `🧠 Discovered my verified personality blueprint on PERSONA!\n\n✨ Archetype: ${archetype?.nameEn || 'The Strategic Builder'}\n📊 Composite Index: ${report?.overallScore || 87}%\n\nDiscover your psychological blueprint here:\n${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
      isAr ? `أنا حصلت على نمط: ${archetype?.nameAr} بمؤشر ${report?.overallScore || 87}% 🧠` : `I got: ${archetype?.nameEn} (${report?.overallScore || 87}%) 🧠`
    )}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#121217] border border-[#262636] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#22222E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm text-white">
              {isAr ? 'مشاركة بطاقة شخصيتك' : 'Share Personality Card'}
            </h3>
          </div>
          <button
            onClick={closeShareModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1A1A22] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-5">
          <div className="relative rounded-2xl p-5 bg-gradient-to-b from-[#181824] to-[#121218] border border-[#2E2E42] shadow-inner text-center overflow-hidden">
            {/* Top watermarks */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-2.5 mb-4">
              <span className="font-bold tracking-wider text-white">PERSONA</span>
              <span className="text-amber-400 font-mono text-[10px]">VERIFIED 2026</span>
            </div>

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-violet-600/30 border border-amber-400/40 mb-3 shadow-lg shadow-purple-950/40">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>

            <div className="text-[11px] font-semibold text-purple-300 tracking-wider uppercase mb-0.5">
              {isAr ? 'النمط السلوكي المعتمد' : 'Certified Archetype'}
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {isAr ? archetype?.nameAr : archetype?.nameEn}
            </h2>

            <p className="text-xs text-zinc-400 line-clamp-2 px-2 mb-4 leading-relaxed">
              {isAr ? archetype?.taglineAr : archetype?.taglineEn}
            </p>

            {/* Overall Score Dial */}
            <div className="bg-[#0D0D12] border border-[#252533] rounded-xl p-3 flex items-center justify-around mb-4">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'مؤشر الذكاء' : 'Overall Index'}</div>
                <div className="text-lg font-bold text-amber-400">{report?.overallScore || 87}%</div>
              </div>
              <div className="h-6 w-px bg-zinc-800"></div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'المرونة' : 'Resilience'}</div>
                <div className="text-lg font-bold text-purple-400">{report?.domainScores?.emotional || 85}%</div>
              </div>
              <div className="h-6 w-px bg-zinc-800"></div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'الريادة' : 'Career'}</div>
                <div className="text-lg font-bold text-sky-400">{report?.domainScores?.career || 89}%</div>
              </div>
            </div>

            {/* Privacy footer */}
            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{isAr ? 'بياناتك الحساسة محمية وخاصة' : 'Sensitive details kept strictly private'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 space-y-2">
          <button
            onClick={handleTelegramShare}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isAr ? 'مشاركة في Telegram' : 'Share to Telegram'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C26] hover:bg-[#252533] border border-[#2B2B3D] text-zinc-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isAr ? 'تم نسخ النص والرابط!' : 'Copied!') : (isAr ? 'نسخ رابط الدعوة والنتيجة' : 'Copy Text & Link')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

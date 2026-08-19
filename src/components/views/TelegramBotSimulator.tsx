import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Send,
  Sparkles,
  Smartphone,
  MessageSquare,
  HelpCircle,
  Compass,
  Flame,
  User,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Trash2,
  Share2,
  Check,
  Award,
  ShieldCheck,
  Brain
} from 'lucide-react';
import { Api } from '../../services/api';
import { ARCHETYPES } from '../../data/archetypesData';

interface MessageItem {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  isVoice?: boolean;
  voiceDuration?: number;
  buttons?: Array<{
    text: string;
    action?: string;
    url?: string;
    web_app?: { url: string };
  }>;
  suggestedQuestions?: string[];
  dilemmaChoices?: Array<{
    id: string;
    textAr: string;
    textEn: string;
    analysisAr: string;
    analysisEn: string;
  }>;
  time: string;
}

export const TelegramBotSimulator: React.FC = () => {
  const { user, latestReport, language, settings, setView, triggerHaptic, startAssessment } = useApp();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeVoicePlaying, setActiveVoicePlaying] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [botMode, setBotMode] = useState<'coach' | 'commands'>('coach');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

  // Audio tone helper
  const playTone = (type: 'send' | 'receive' | 'click') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'receive') {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    async function loadInitialChat() {
      if (user?.id) {
        try {
          const history = await Api.getBotChatHistory(user.id);
          if (history && history.length > 0) {
            setMessages(
              history.map((h) => ({
                id: h.id,
                sender: h.role === 'model' ? 'bot' : 'user',
                text: h.text,
                suggestedQuestions: h.suggestedQuestions,
                time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }))
            );
            return;
          }
        } catch (e) {
          console.error('Failed to load chat history', e);
        }
      }

      // Default welcome message
      const archetype = latestReport?.archetype || (latestReport?.archetypeId ? ARCHETYPES[latestReport.archetypeId] : null);
      const welcomeText = isAr
        ? `✨ أهلاً بك يا <b>${user?.firstName || 'صديقي'}</b> في المساعد الذكي التفاعلي لمنصة <b>PERSONA</b> 🧠\n\nأنا مدربك السلوكي الشخصي. أستطيع الإجابة على كافة استفساراتك حول أبعادك، تقديم نصائح يومية، أو تدريبك على مواقف حقيقية.\n\nما الذي تود مناقشته اليوم؟`
        : `✨ Welcome <b>${user?.firstName || 'Friend'}</b> to the <b>PERSONA AI Intelligence Coach</b> 🧠\n\nI am your personalized behavioral mentor. I can analyze your strengths, advise you on habits, or run situational scenario tests.\n\nHow can I empower you today?`;

      setMessages([
        {
          id: 'bot_init',
          sender: 'bot',
          text: welcomeText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: isAr
            ? [
                '🧠 ما هي أبرز نقاط قوتي وفق تحليلي؟',
                '⚡ اختبرني في موقف واقعي لتحليل تصرفي',
                '🧩 كيف أطور ذكائي العاطفي في النقاشات؟',
                '💼 ما هي بيئة العمل المثالية لنمطي؟'
              ]
            : [
                '🧠 What are my core strengths?',
                '⚡ Give me a realistic dilemma to test my decision-making',
                '🧩 How to regulate emotions in arguments?',
                '💼 Optimal work environment for my profile?'
              ],
          buttons: [
            {
              text: isAr ? '🚀 بدء تقييم جديد 2026' : '🚀 Start 2026 Assessment',
              action: 'quiz'
            },
            {
              text: isAr ? '📊 استعراض تقريري المعتمد' : '📊 View Latest Report',
              action: 'results'
            }
          ]
        }
      ]);
    }

    loadInitialChat();
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleVoiceToggle = (msgId: string, text: string) => {
    if (activeVoicePlaying === msgId) {
      window.speechSynthesis?.cancel();
      setActiveVoicePlaying(null);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/<[^>]*>?/gm, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = isAr ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => setActiveVoicePlaying(null);
      utterance.onerror = () => setActiveVoicePlaying(null);
      window.speechSynthesis.speak(utterance);
      setActiveVoicePlaying(msgId);
      triggerHaptic('light');
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(msgId);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    triggerHaptic('medium');
    setMessages([]);
    setTimeout(() => {
      setMessages([
        {
          id: 'bot_reset_' + Date.now(),
          sender: 'bot',
          text: isAr
            ? 'تم تنظيف سجل المحادثة. كيف يمكنني مساعدتك الآن؟'
            : 'Chat transcript cleared. How may I guide you now?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: isAr
            ? ['ما هي نصيحة اليوم لنمطي؟', 'اختبرني في موقف واقعي']
            : ['Daily growth tip', 'Test me with a dilemma']
        }
      ]);
    }, 200);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    playTone('send');
    triggerHaptic('light');

    const userMsg: MessageItem = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Special Trigger: Situational Dilemma Test
    if (text.includes('اختبرني') || text.toLowerCase().includes('dilemma') || text.toLowerCase().includes('scenario')) {
      setTimeout(() => {
        playTone('receive');
        triggerHaptic('medium');
        const dilemmaMsg: MessageItem = {
          id: 'bot_dilemma_' + Date.now(),
          sender: 'bot',
          text: isAr
            ? `⚡ <b>موقف واقعي لاختبار ذكائك السلوكي:</b>\n\nأنت تقود مشروعاً مهماً اقترب موعد تسليمه، واكتشفت أن زميلاً في الفريق ارتكب خطأ تحليلياً كبيراً غير مقصود سيؤخر التسليم إن أصلحته، أو قد يمر دون ملاحظة مؤقتاً.\n\n<b>ما هو خيارك الأقرب لتصرفك الطبيعي؟</b>`
            : `⚡ <b>Real-World Behavioral Dilemma:</b>\n\nYou are leading a high-stakes project near its deadline. You discover an unintentional structural error made by a teammate. Correcting it will delay launch; ignoring it might temporarily pass.\n\n<b>How do you respond?</b>`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dilemmaChoices: isAr
            ? [
                {
                  id: 'c1',
                  textAr: 'أتحمل المسؤولية، أبلغ الإدارة فوراً وأطلب مهلة للتصحيح',
                  textEn: 'Disclose transparently & request extension to fix',
                  analysisAr: '✅ يُظهر نزاهة فكرية وشجاعة قيادية استراتيجية تحمي الجودة على المدى الطويل.',
                  analysisEn: 'Demonstrates high integrity and strategic long-term governance.'
                },
                {
                  id: 'c2',
                  textAr: 'أعقد جلسة طارئة مع الزميل لإصلاح الخلل طوال الليل دون إشعار الإدارة',
                  textEn: 'Fix it urgently overnight with the teammate silently',
                  analysisAr: '⚡ يُظهر ولاءً عاطفياً عالياً للفريق مع ميل لتحمل أعباء تفوق طاقتك الفردية.',
                  analysisEn: 'High team loyalty and protective drive, with a risk of personal burnout.'
                },
                {
                  id: 'c3',
                  textAr: 'أعتمد التسليم الآن وأجدول إصلاح الخلل كتحديث لاحق',
                  textEn: 'Deliver as-is and patch later in phase 2',
                  analysisAr: '🎯 يُظهر براغماتية وسرعة تنفيذية، لكنه يتطلب إدارة حذرة للمخاطر.',
                  analysisEn: 'Pragmatic agility, requiring careful risk mitigation.'
                }
              ]
            : [
                {
                  id: 'c1',
                  textAr: 'شفافية كاملة وتعديل الجدول',
                  textEn: 'Full transparent disclosure & schedule adjustment',
                  analysisAr: 'نزاهة فكرية وقيادية.',
                  analysisEn: 'High ethical leadership & structural rigor.'
                },
                {
                  id: 'c2',
                  textAr: 'إصلاح ليلي مع الفريق',
                  textEn: 'Overnight collaborative emergency fix',
                  analysisAr: 'ولاء عالٍ للفريق.',
                  analysisEn: 'Deep emotional empathy & protective spirit.'
                }
              ]
        };
        setMessages((prev) => [...prev, dilemmaMsg]);
        setLoading(false);
      }, 700);
      return;
    }

    // Direct slash command handler
    if (text.startsWith('/')) {
      try {
        const cmdRes = await Api.sendBotCommand(text.trim(), user);
        playTone('receive');
        const botMsg: MessageItem = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: cmdRes.text,
          buttons: cmdRes.buttons?.map((b: any) => ({
            text: b.text,
            action: b.web_app?.url?.includes('analysis') ? 'quiz' : b.web_app?.url?.includes('results') ? 'results' : 'home'
          })),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (e) {
        console.error('Bot command error', e);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Conversational Gemini AI Mode
    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text.replace(/<[^>]*>?/gm, '')
      }));

      const res = await Api.sendBotChatMessage({
        userId: user?.id,
        message: text.trim(),
        history: historyPayload,
        userContext: {
          name: user?.firstName || 'Explorer',
          archetypeId: latestReport?.archetypeId || 'strategic-builder',
          overallScore: latestReport?.overallScore || 85,
          domainScores: latestReport?.domainScores,
          language,
          coachTone: settings.coachTone,
          storyDepth: settings.storyDepth
        }
      });

      playTone('receive');
      triggerHaptic('success');

      const botMsg: MessageItem = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: res.replyText,
        suggestedQuestions: res.suggestedQuestions,
        buttons: res.actionButtons?.map((b) => ({
          text: isAr ? b.labelAr : b.labelEn,
          action: b.action
        })),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      console.error('Error in bot conversational chat', e);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          sender: 'bot',
          text: isAr
            ? 'عذراً، حدث خطأ بسيط أثناء معالجة استفسارك. يرجى المحاولة مرة أخرى أو اختيار أحد الأوامر السريعة.'
            : 'Sorry, an error occurred while processing your request. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDilemmaChoiceClick = (choice: any) => {
    triggerHaptic('success');
    playTone('receive');
    const responseText = isAr
      ? `🎯 <b>تحليل اختيارك: "${choice.textAr}"</b>\n\n${choice.analysisAr}\n\nهذا يتماشى تماماً مع متجه <b>${latestReport?.archetype?.nameAr || 'شخصيتك'}</b> في معالجة المخاطر.`
      : `🎯 <b>Choice Analysis: "${choice.textEn}"</b>\n\n${choice.analysisEn}`;

    setMessages((prev) => [
      ...prev,
      {
        id: 'bot_choice_ans_' + Date.now(),
        sender: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: isAr
          ? ['أعطني موقفاً آخر أكثر تعقيداً', 'كيف أطور اتخاذ القرارات تحت الضغط؟']
          : ['Give me another scenario', 'How to improve high-stress decisions?']
      }
    ]);
  };

  const quickPills = [
    { label: isAr ? '📖 قصة ملهمة لنمطي' : '📖 Inspiring Story', prompt: isAr ? 'احكيلي قصة وتجربة واقعية ملهمة تناسب نمطي وشخصيتي' : 'Tell me an inspiring story that matches my personality archetype' },
    { label: isAr ? '📊 تحليل بياناتي ومحاوري' : '📊 Analyze My Data', prompt: isAr ? 'حلل بياناتي ومحاوري النفسية التسعة بالتفصيل واشرح لي التوازن' : 'Analyze my 9 dimensional scores in detail and explain my balance' },
    { label: isAr ? '🎭 معضلة وموقف واقعي' : '🎭 Real Dilemma', prompt: isAr ? 'اختبرني في موقف واقعي لمعرفة ردة فعلي وقراري' : 'Test me with a realistic dilemma scenario' },
    { label: isAr ? '☕ دردشة ونقاش إنساني' : '☕ Heart-to-Heart', prompt: isAr ? 'أريد أن أفضفض لك عن تحدي يواجهني في اتخاذ القرارات' : 'I want to talk about a decision challenge I am facing' },
    { label: isAr ? '🧘 تنظيم التوتر والعادات' : '🧘 Calm & Habits', prompt: isAr ? 'كيف أهدئ التفكير الزائد وأنظم عاداتي اليومية؟' : 'How can I calm overthinking and structure daily habits?' },
    { label: '/start', prompt: '/start' }
  ];

  const handleActionClick = (action?: string) => {
    triggerHaptic('medium');
    if (action === 'quiz' || action === 'assessment' || action === 'open_analysis') {
      startAssessment('full');
    } else if (action === 'results' || action === 'report' || action === 'open_growth') {
      setView('results');
    } else if (action === 'growth' || action === 'open_radar') {
      setView('growth');
    } else if (action === 'profile') {
      setView('profile');
    } else {
      setView('home');
    }
  };

  return (
    <div id="bot-simulator-view" className="pb-24 pt-2 px-3 max-w-2xl mx-auto flex flex-col h-[88vh]">
      {/* Bot Chat Header */}
      <div className="p-3 bg-[#121217] border border-white/10 rounded-2xl flex items-center justify-between shadow-xl mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7E3AF2] to-[#9061F9] border border-[#9061F9]/50 flex items-center justify-center text-white shadow-lg shadow-[#7E3AF2]/20">
              <Bot className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#121217] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xs text-white">PERSONA AI Intelligence Bot</h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#9061F9]/20 text-[#A4CAFE] border border-[#9061F9]/30 font-mono font-bold">
                PRO COACH
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              {isAr ? 'مدرب الذكاء السلوكي متصل ومدرك لنمطك' : 'Online • Context-Aware'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearHistory}
            title={isAr ? 'مسح المحادثة' : 'Clear Chat'}
            className="p-2 rounded-xl bg-[#18181F] hover:bg-white/5 border border-white/5 text-[#9CA3AF] hover:text-white transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setView('home')}
            className="p-2 px-3 rounded-xl bg-[#18181F] hover:bg-white/5 border border-white/5 text-[#D1D5DB] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#A4CAFE]" />
            <span>{isAr ? 'الرئيسية' : 'App'}</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 rounded-2xl bg-[#0B0B0F] border border-white/5">
        {messages.map((m) => {
          const isBot = m.sender === 'bot';
          return (
            <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-lg relative group ${
                  isBot
                    ? 'bg-[#18181F] border border-white/10 text-[#E5E7EB] rounded-tl-sm'
                    : 'bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] text-white rounded-tr-sm shadow-[#7E3AF2]/20'
                }`}
              >
                {/* HTML content */}
                <div
                  className="prose prose-invert prose-xs max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }}
                />

                {/* Situational Dilemma Interactive Choices */}
                {m.dilemmaChoices && m.dilemmaChoices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-amber-300 block">
                      {isAr ? 'اختر تصرفك الطبيعي:' : 'Choose your natural reaction:'}
                    </span>
                    {m.dilemmaChoices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => handleDilemmaChoiceClick(choice)}
                        className="w-full p-2.5 rounded-xl bg-[#121217] hover:bg-[#7E3AF2]/30 border border-white/10 hover:border-[#9061F9] text-start text-xs text-white transition-all flex items-center justify-between group/c"
                      >
                        <span>{isAr ? choice.textAr : choice.textEn}</span>
                        <Zap className="w-3.5 h-3.5 text-amber-300 opacity-0 group-hover/c:opacity-100 transition-opacity shrink-0 ms-2" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer bar with timestamp, voice audio note & copy */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px] text-[#9CA3AF]">
                  <div className="flex items-center gap-2">
                    {isBot && (
                      <button
                        onClick={() => handleVoiceToggle(m.id, m.text)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        title={isAr ? 'استمع صوتياً' : 'Listen'}
                      >
                        {activeVoicePlaying === m.id ? (
                          <>
                            <Pause className="w-3 h-3 text-amber-300 animate-pulse" />
                            <span className="text-amber-300">{isAr ? 'جاري القراءة...' : 'Playing...'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-[#A4CAFE]" />
                            <span>{isAr ? 'قراءة صوتية' : 'Voice'}</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      className="hover:text-white transition-colors flex items-center gap-1"
                      title={isAr ? 'نسخ' : 'Copy'}
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <span>{m.time}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {isBot && m.buttons && m.buttons.length > 0 && (
                <div className="w-[88%] mt-2 space-y-1.5">
                  {m.buttons.map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(btn.action)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#18181F] hover:bg-[#7E3AF2]/30 border border-[#9061F9]/40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{btn.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggested Follow-up Questions */}
              {isBot && m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div className="w-[88%] mt-2.5 space-y-1.5">
                  <span className="text-[10px] text-[#9CA3AF] font-semibold block px-1">
                    {isAr ? 'أسئلة مقترحة للاستكشاف:' : 'Suggested follow-ups:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="py-1.5 px-3 rounded-xl bg-[#121217] hover:bg-[#9061F9]/20 border border-white/10 hover:border-[#9061F9]/50 text-xs text-[#D1D5DB] hover:text-white transition-all text-start"
                      >
                        💬 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 text-[#9CA3AF] text-xs p-3 bg-[#18181F] rounded-2xl border border-white/10 max-w-xs shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9061F9] animate-ping" />
            <span>{isAr ? 'المدرب الذكي يحلل أبعادك ويكتب الإجابة...' : 'AI Coach is synthesizing answer...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-1">
        {quickPills.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            className="px-2.5 py-1.5 rounded-xl bg-[#121217] border border-white/10 hover:border-[#9061F9]/50 text-[11px] text-[#D1D5DB] hover:text-white whitespace-nowrap transition-all shadow-sm"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isAr
              ? 'اسأل المدرب الذكي، اطلب اختبار موقف، أو اكتب أمراً...'
              : 'Ask AI coach, request a dilemma test, or type /start...'
          }
          className="flex-1 py-3 px-4 rounded-xl bg-[#121217] border border-white/10 text-xs sm:text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9] transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-3 rounded-xl bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] hover:from-[#6C2BD9] hover:to-[#7E3AF2] disabled:opacity-40 text-white font-bold transition-all shadow-lg shadow-[#7E3AF2]/20 active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import {
  Bot,
  Sparkles,
  Send,
  X,
  Maximize2,
  Volume2,
  VolumeX,
  Copy,
  Trash2,
  Check,
  ChevronDown,
  Compass,
  Flame,
  Zap,
  Target,
  BrainCircuit,
} from "lucide-react";
import { Api } from "../../services/api";
import { ARCHETYPES } from "../../data/archetypesData";

interface FloatingMessageItem {
  id: string;
  sender: "bot" | "user";
  text: string;
  isVoice?: boolean;
  buttons?: Array<{ text: string; action?: string }>;
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

export const FloatingCoachWidget: React.FC = () => {
  const {
    user,
    latestReport,
    language,
    settings,
    setView,
    triggerHaptic,
    currentView,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<FloatingMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeVoicePlaying, setActiveVoicePlaying] = useState<string | null>(
    null
  );
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAr = language === "ar";

  const archetype = latestReport
    ? latestReport.archetype || ARCHETYPES[latestReport.archetypeId]
    : ARCHETYPES["strategic-builder"];

  // Soft audio synthesis feedback
  const playTone = (type: "send" | "receive" | "click") => {
    if (!settings?.soundEffects) return;
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "send") {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          880,
          audioCtx.currentTime + 0.1
        );
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.1
        );
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === "receive") {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          520,
          audioCtx.currentTime + 0.12
        );
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.12
        );
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(580, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.05
        );
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Initial welcome message (Fixed dependency array and data reactivity)
  useEffect(() => {
    const name = user?.firstName || (isAr ? "صديقي" : "Friend");
    const archName = isAr ? archetype?.nameAr : archetype?.nameEn;
    const initialText = isAr
      ? `أهلاً بك يا <b>${name}</b>! 🧠✨\n\nأنا مستشارك النفسي والسلوكي الذكي المتصل مباشرة بنمطك (<b>${archName}</b>).\n\nيمكنك استشارتي في أي قرار، طلب قصة ملهمة، أو اختبار رد فعلك في مواقف الحياة.`
      : `Hello <b>${name}</b>! 🧠✨\n\nI am your live Behavioral Mentor tuned specifically to your archetype (<b>${archName}</b>).\n\nAsk me for situational advice, an inspiring narrative, or a quick behavioral challenge.`;

    setMessages([
      {
        id: "welcome_" + Date.now(),
        sender: "bot",
        text: initialText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedQuestions: isAr
          ? [
              "📖 احكيلي قصة ملهمة تناسب نمطي",
              "⚡ اختبرني في موقف واقعي",
              "☕ كيف أتعامل مع التوتر اليوم؟",
              "📊 حلل أبعادي النفسية بعمق",
            ]
          : [
              "📖 Tell me an inspiring story",
              "⚡ Challenge me with a scenario",
              "☕ Stress resilience tip",
              "📊 Analyze my dimensions",
            ],
      },
    ]);
  }, [user?.firstName, archetype?.nameAr, archetype?.nameEn, isAr]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, isMinimized, messages.length]);

  const handleVoiceToggle = (msgId: string, text: string) => {
    if (activeVoicePlaying === msgId) {
      window.speechSynthesis?.cancel();
      setActiveVoicePlaying(null);
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/<[^>]*>?/gm, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = isAr ? "ar-SA" : "en-US";
      utterance.rate = 1.0;
      utterance.onend = () => setActiveVoicePlaying(null);
      utterance.onerror = () => setActiveVoicePlaying(null);
      window.speechSynthesis.speak(utterance);
      setActiveVoicePlaying(msgId);
      triggerHaptic("light");
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    const cleanText = text.replace(/<[^>]*>?/gm, "");
    navigator.clipboard.writeText(cleanText);
    setCopiedId(msgId);
    triggerHaptic("light");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleClear = () => {
    triggerHaptic("medium");
    setMessages([
      {
        id: "reset_" + Date.now(),
        sender: "bot",
        text: isAr
          ? "تم تنظيف المحادثة. ما هو السؤال أو الموقف الذي يشغل بالك الآن؟"
          : "Transcript cleared. How can I mentor you right now?",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedQuestions: isAr
          ? ["📖 احكيلي قصة لنمطي", "⚡ اختبرني في موقف واقعي"]
          : ["📖 Tell me a story", "⚡ Test me with a dilemma"],
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    playTone("send");
    triggerHaptic("light");

    const userMsg: FloatingMessageItem = {
      id: "usr_" + Date.now(),
      sender: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setInputText("");
    setShowCommandsMenu(false);
    setLoading(true);

    // Dilemma Trigger
    if (
      text.includes("اختبرني") ||
      text.toLowerCase().includes("dilemma") ||
      text.toLowerCase().includes("scenario")
    ) {
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(() => {
        playTone("receive");
        triggerHaptic("medium");
        const dilemmaMsg: FloatingMessageItem = {
          id: "bot_dilemma_" + Date.now(),
          sender: "bot",
          text: isAr
            ? `⚡ <b>موقف واقعي لاختبار ذكائك السلوكي:</b>\n\nأنت تقود مشروعاً مهماً اقترب موعد تسليمه، واكتشفت أن زميلاً في الفريق ارتكب خطأ تحليلياً كبيراً غير مقصود سيؤخر التسليم إن أصلحته، أو قد يمر دون ملاحظة مؤقتاً.\n\n<b>ما هو خيارك الأقرب لتصرفك الطبيعي؟</b>`
            : `⚡ <b>Real-World Behavioral Dilemma:</b>\n\nYou are leading a high-stakes project near its deadline. You discover an unintentional structural error made by a teammate. Correcting it will delay launch; ignoring it might temporarily pass.\n\n<b>How do you respond?</b>`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          dilemmaChoices: isAr
            ? [
                {
                  id: "c1",
                  textAr:
                    "أتحمل المسؤولية، أبلغ الإدارة فوراً وأطلب مهلة للتصحيح",
                  textEn: "Disclose transparently & request extension to fix",
                  analysisAr:
                    "✅ يُظهر نزاهة فكرية وشجاعة قيادية استراتيجية تحمي الجودة على المدى الطويل.",
                  analysisEn:
                    "Demonstrates high integrity and strategic long-term governance.",
                },
                {
                  id: "c2",
                  textAr:
                    "أعقد جلسة طارئة مع الزميل لإصلاح الخلل طوال الليل دون إشعار الإدارة",
                  textEn:
                    "Fix it urgently overnight with the teammate silently",
                  analysisAr:
                    "⚡ يُظهر ولاءً عاطفياً عالياً للفريق مع ميل لتحمل أعباء تفوق طاقتك الفردية.",
                  analysisEn:
                    "High team loyalty and protective drive, with a risk of personal burnout.",
                },
                {
                  id: "c3",
                  textAr: "أعتمد التسليم الآن وأجدول إصلاح الخلل كتحديث لاحق",
                  textEn: "Deliver as-is and patch later in phase 2",
                  analysisAr:
                    "⚠️ حل براغماتي سريع، لكنه قد يضع مصداقيتك في اختبار حرج إذا كُشف لاحقاً.",
                  analysisEn:
                    "Pragmatic short-term execution, but carries latent reputation risks.",
                },
              ]
            : [
                {
                  id: "c1",
                  textAr: "شفافية وإصلاح فوري",
                  textEn: "Disclose transparently & fix",
                  analysisAr: "نزاهة فكرية وقيادية.",
                  analysisEn: "High ethical leadership & structural rigor.",
                },
                {
                  id: "c2",
                  textAr: "إصلاح ليلي مع الفريق",
                  textEn: "Overnight collaborative emergency fix",
                  analysisAr: "ولاء عالٍ للفريق.",
                  analysisEn: "Deep emotional empathy & protective spirit.",
                },
              ],
        };
        setMessages((prev) => {
          const updated = [...prev, dilemmaMsg];
          if (!isOpen || isMinimized) {
            setUnreadCount((c) => c + 1);
          }
          return updated;
        });
        setLoading(false);
      }, 600);
      return;
    }

    // Call conversational Gemini AI coach
    try {
      setMessages((currentMessages) => {
        const updatedMessages = [...currentMessages, userMsg];
        const historyPayload = updatedMessages.slice(-6).map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("model" as const),
          text: m.text.replace(/<[^>]*>?/gm, ""),
        }));

        Api.sendBotChatMessage({
          userId: user?.id,
          message: text.trim(),
          history: historyPayload,
          userContext: {
            name: user?.firstName || "Explorer",
            archetypeId: latestReport?.archetypeId || "strategic-builder",
            overallScore: latestReport?.overallScore || 85,
            domainScores: latestReport?.domainScores,
            language,
            coachTone: settings.coachTone,
            storyDepth: settings.storyDepth,
          },
        })
          .then((res) => {
            playTone("receive");
            triggerHaptic("success");

            const botMsg: FloatingMessageItem = {
              id: "bot_" + Date.now(),
              sender: "bot",
              text: res.replyText,
              suggestedQuestions: res.suggestedQuestions,
              buttons: res.actionButtons?.map((b: any) => ({
                text: isAr ? b.labelAr : b.labelEn,
                action: b.action,
              })),
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            setMessages((prev) => {
              const newMsgs = [...prev, botMsg];
              if (!isOpen || isMinimized) {
                setUnreadCount((c) => c + 1);
              }
              return newMsgs;
            });
          })
          .catch((e) => {
            console.error("Error in floating coach chat", e);
            setMessages((prev) => [
              ...prev,
              {
                id: "bot_err_" + Date.now(),
                sender: "bot",
                text: isAr
                  ? "عذراً حدث خطأ في الاتصال، لكنني أستمع إليك. يرجى إعادة المحاولة."
                  : "Sorry, connection error occurred, but I am still here. Please try again.",
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          })
          .finally(() => {
            setLoading(false);
          });

        return updatedMessages;
      });
    } catch (e) {
      console.error("Error in floating coach chat wrapper", e);
      setLoading(false);
    }
  };

  if (currentView === "bot_simulator" || currentView === "loading") return null;

  return (
    <div
      id="persona-floating-coach-container"
      className="fixed z-50 pointer-events-none"
    >
      {/* 1. FLOATING ACTION ORB */}
      <div
        className={`fixed bottom-20 sm:bottom-6 ${
          isAr ? "left-4 sm:left-8" : "right-4 sm:right-8"
        } pointer-events-auto z-[999]`}
      >
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative group cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/40 via-purple-600/40 to-violet-500/40 blur-md opacity-75 group-hover:opacity-100 animate-pulse transition duration-500 pointer-events-none"></div>

          <button
            id="floating-coach-trigger-btn"
            onClick={() => {
              triggerHaptic("medium");
              playTone("click");
              const nextOpenState = !isOpen;
              setIsOpen(nextOpenState);
              if (nextOpenState) {
                setIsMinimized(false);
                setUnreadCount(0);
              }
            }}
            className="relative flex items-center gap-2.5 py-3 px-3.5 sm:px-4 rounded-full bg-[#12121B] border border-amber-500/40 hover:border-amber-400 text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95"
            title={isAr ? "المستشار النفسي الذكي" : "AI Behavioral Coach"}
          >
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-950/50">
              <Bot className="w-4.5 h-4.5 text-white" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#12121B] animate-pulse"></span>
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white tracking-tight">
                  PERSONA AI
                </span>
                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-[10px] text-zinc-400 leading-none">
                {isAr ? "المستشار الذكي متصل" : "Coach Online"}
              </span>
            </div>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </motion.div>
      </div>

      {/* 2. DOCKABLE / FLOATING POP-UP CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{
              opacity: 1,
              y: isMinimized ? 440 : 0,
              scale: isMinimized ? 0.85 : 1,
              height: isMinimized ? "64px" : "580px",
            }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`fixed bottom-20 sm:bottom-24 ${
              isAr ? "left-3 sm:left-8" : "right-3 sm:right-8"
            } w-[calc(100vw-24px)] sm:w-[440px] max-h-[82vh] rounded-3xl bg-[#0F0F17]/95 border border-[#2B2B3E] shadow-2xl shadow-black/80 backdrop-blur-2xl flex flex-col overflow-hidden pointer-events-auto z-50`}
          >
            {/* Header */}
            <div className="p-3.5 px-4 bg-[#141420] border-b border-[#242436] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      {isAr ? "المستشار النفسي الذكي" : "PERSONA AI Coach"}
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-300 font-mono leading-none mt-0.5">
                    {isAr
                      ? `نمطك: ${archetype?.nameAr}`
                      : `Tuned to: ${archetype?.nameEn}`}
                  </p>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                <button
                  id="float-coach-fullscreen-btn"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsOpen(false);
                    setView("bot_simulator");
                  }}
                  title={isAr ? "فتح كشاشة كاملة" : "Open full page simulator"}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  id="float-coach-clear-btn"
                  onClick={handleClear}
                  title={isAr ? "مسح المحادثة" : "Clear transcript"}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Minimize Toggle Button */}
                <button
                  id="float-coach-minimize-btn"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsMinimized(!isMinimized);
                  }}
                  title={
                    isAr ? "تصغير/تكبير النافذة" : "Minimize/Restore window"
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isMinimized ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <button
                  id="float-coach-close-btn"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsOpen(false);
                  }}
                  title={isAr ? "إغلاق" : "Close"}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div className="px-4 py-2 bg-[#12121D] border-b border-[#1E1E2C] flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {isAr
                        ? "مستشار موجه بالذكاء الاصطناعي التوليدي"
                        : "Generative Psychological Guidance"}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {settings.coachTone.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl p-3.5 text-xs leading-relaxed transition-all shadow-md ${
                          msg.sender === "user"
                            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-br-none"
                            : "bg-[#181826] border border-[#2B2B3D] text-zinc-200 rounded-bl-none"
                        }`}
                      >
                        {msg.sender === "bot" && (
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[10px] text-purple-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3 text-amber-400" />
                              PERSONA AI
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleVoiceToggle(msg.id, msg.text)
                                }
                                className="text-zinc-400 hover:text-amber-400 transition-colors p-0.5"
                                title={isAr ? "قراءة صوتية" : "Read aloud"}
                              >
                                {activeVoicePlaying === msg.id ? (
                                  <VolumeX className="w-3 h-3 text-amber-400 animate-pulse" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(msg.id, msg.text)}
                                className="text-zinc-400 hover:text-white transition-colors p-0.5"
                                title={isAr ? "نسخ النص" : "Copy message"}
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Sanitized HTML Content Rendering */}
                        <div
                          className="whitespace-pre-wrap select-text leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: msg.text }}
                        />

                        {msg.dilemmaChoices && (
                          <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                              {isAr
                                ? "اختر تصرفك الطبيعي:"
                                : "Choose your natural reaction:"}
                            </span>
                            {msg.dilemmaChoices.map((choice) => (
                              <button
                                key={choice.id}
                                onClick={() => {
                                  handleSendMessage(
                                    isAr ? choice.textAr : choice.textEn
                                  );
                                }}
                                className="w-full text-left p-2.5 rounded-xl bg-[#12121E] hover:bg-[#1C1C2E] border border-purple-500/20 hover:border-amber-400/50 text-[11px] text-zinc-300 hover:text-white transition-all block"
                              >
                                <span className="font-medium">
                                  {isAr ? choice.textAr : choice.textEn}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div
                          className={`text-[9px] mt-1.5 text-right font-mono ${
                            msg.sender === "user"
                              ? "text-purple-200/70"
                              : "text-zinc-500"
                          }`}
                        >
                          {msg.time}
                        </div>
                      </div>

                      {msg.suggestedQuestions &&
                        msg.suggestedQuestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                            {msg.suggestedQuestions.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(q)}
                                className="text-[10px] py-1 px-2.5 rounded-full bg-[#1A1A28] border border-[#2E2E42] hover:border-amber-500/50 hover:bg-[#242438] text-zinc-300 hover:text-white transition-all shadow-sm flex items-center gap-1"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                <span>{q}</span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#181826] border border-[#2B2B3D] w-24">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {showCommandsMenu && (
                  <div className="p-2.5 bg-[#141422] border-t border-[#222234] grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => handleSendMessage("/report")}
                      className="p-2 rounded-xl bg-[#1A1A2A] hover:bg-[#222238] border border-[#2C2C40] text-zinc-300 flex items-center gap-1.5 text-[11px]"
                    >
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                      <span>/report (ملخص التحليل)</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage("/goals")}
                      className="p-2 rounded-xl bg-[#1A1A2A] hover:bg-[#222238] border border-[#2C2C40] text-zinc-300 flex items-center gap-1.5 text-[11px]"
                    >
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <span>/goals (الأهداف اليومية)</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage("/challenge")}
                      className="p-2 rounded-xl bg-[#1A1A2A] hover:bg-[#222238] border border-[#2C2C40] text-zinc-300 flex items-center gap-1.5 text-[11px]"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>/challenge (تحدي 24 ساعة)</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage("اختبرني في موقف واقعي")}
                      className="p-2 rounded-xl bg-[#1A1A2A] hover:bg-[#222238] border border-[#2C2C40] text-zinc-300 flex items-center gap-1.5 text-[11px]"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>/dilemma (اختبار موقف)</span>
                    </button>
                  </div>
                )}

                <div className="p-3 bg-[#12121C] border-t border-[#222234] flex items-center gap-2 shrink-0">
                  <button
                    id="floating-coach-slash-btn"
                    onClick={() => setShowCommandsMenu(!showCommandsMenu)}
                    className={`p-2 rounded-xl border text-xs font-mono transition-colors ${
                      showCommandsMenu
                        ? "bg-purple-600/30 text-purple-300 border-purple-500/50"
                        : "bg-[#181826] text-zinc-400 border-[#28283C] hover:text-white"
                    }`}
                    title="Commands"
                  >
                    /
                  </button>

                  <input
                    ref={inputRef}
                    id="floating-coach-input"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isAr
                        ? "اسأل مستشارك السلوكي الذكي..."
                        : "Ask your behavioral mentor..."
                    }
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#181826] border border-[#28283C] focus:border-amber-500/60 focus:outline-none text-xs text-white placeholder-zinc-500 transition-all"
                  />

                  <button
                    id="floating-coach-send-btn"
                    disabled={!inputText.trim() || loading}
                    onClick={() => handleSendMessage()}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      inputText.trim() && !loading
                        ? "bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md shadow-purple-900/30 hover:scale-105 active:scale-95"
                        : "bg-[#1A1A28] text-zinc-600 cursor-not-allowed border border-[#26263A]"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

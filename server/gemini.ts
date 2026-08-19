import { GoogleGenAI, Type } from '@google/genai';
import { CalculatedScores } from './scoring';
import { ARCHETYPES } from '../src/data/archetypesData';
import { AIAnalysisReport, AICheckInPrompt, GrowthChallenge } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generatePersonalityReport(
  userName: string,
  scores: CalculatedScores,
  onboardingData?: Record<string, any>
): Promise<AIAnalysisReport> {
  const archetype = ARCHETYPES[scores.archetypeId] || ARCHETYPES['strategic-builder'];
  const client = getAIClient();

  if (!client) {
    console.log('[AI Engine] GEMINI_API_KEY not configured or offline, using robust structured fallback.');
    return getFallbackAIReport(userName, archetype, scores);
  }

  const systemInstruction = `
You are PERSONA AI — the world-class Psychological & Behavioral Intelligence Engine.
You synthesize multi-dimensional psychometric scores into a profound, elegant, highly structured, and empathetic personality intelligence report.

CRITICAL SAFETY & ETHICS DIRECTIVES:
1. NON-DIAGNOSTIC MANDATE: Never diagnose mental illnesses, clinical disorders, or medical issues. Always use tentative, self-reflective language:
   - In Arabic: "تشير إجاباتك إلى ميل نحو...", "يظهر تحليلك نمطاً من...", "قد يكون من المفيد التأمل في..."
   - In English: "Your responses suggest a tendency toward...", "Your pattern reflects...", "You might find it beneficial to explore..."
2. INTIMACY ANALYSIS: Treat intimacy, affection, and relationships with supreme dignity, mature emotional respect, boundaries, and psychological communication depth. Never output explicit, vulgar, or pornographic content.
3. CONSTRUCTIVE & EMPOWERING: Frame blind spots as actionable growth vectors rather than fixed flaws.
4. BILINGUAL JSON: Provide complete, expressive Arabic and English fields.
`;

  const userPrompt = `
Generate a comprehensive AI Personality Report for user "${userName}".

USER PROFILE & METRICS:
- Archetype: ${archetype.nameEn} (${archetype.nameAr})
- Overall Index: ${scores.overallScore}/100
- Domain Scores:
  * Cognitive & Analytical: ${scores.domainScores.cognitive}%
  * Emotional Intelligence: ${scores.domainScores.emotional}%
  * Social & Energy: ${scores.domainScores.social}%
  * Discipline & Behavioral: ${scores.domainScores.behavioral}%
  * Motivation & Ambition: ${scores.domainScores.motivation}%
  * Lifestyle & Vitality: ${scores.domainScores.lifestyle}%
  * Relationships & Attachment: ${scores.domainScores.relationships}%
  * Intimacy & Communication: ${scores.domainScores.intimacy}%
  * Career & Leadership: ${scores.domainScores.career}%
${onboardingData ? `- Context: ${JSON.stringify(onboardingData)}` : ''}

Generate structured JSON matching the exact schema.
`;

  try {
    let response;
    try {
      response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummaryAr: { type: Type.STRING },
              executiveSummaryEn: { type: Type.STRING },
              corePersonalityAr: { type: Type.STRING },
              corePersonalityEn: { type: Type.STRING },
              strengthsAr: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengthsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
              blindSpotsAr: { type: Type.ARRAY, items: { type: Type.STRING } },
              blindSpotsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
              emotionalPatternAr: { type: Type.STRING },
              emotionalPatternEn: { type: Type.STRING },
              relationshipPatternAr: { type: Type.STRING },
              relationshipPatternEn: { type: Type.STRING },
              workPatternAr: { type: Type.STRING },
              workPatternEn: { type: Type.STRING },
              stressPatternAr: { type: Type.STRING },
              stressPatternEn: { type: Type.STRING },
              lifestylePatternAr: { type: Type.STRING },
              lifestylePatternEn: { type: Type.STRING },
              intimacyPatternAr: { type: Type.STRING },
              intimacyPatternEn: { type: Type.STRING },
              growthOpportunitiesAr: { type: Type.ARRAY, items: { type: Type.STRING } },
              growthOpportunitiesEn: { type: Type.ARRAY, items: { type: Type.STRING } },
              personalizedAdviceAr: { type: Type.ARRAY, items: { type: Type.STRING } },
              personalizedAdviceEn: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalProfileQuoteAr: { type: Type.STRING },
              finalProfileQuoteEn: { type: Type.STRING },
            },
            required: [
              'executiveSummaryAr',
              'executiveSummaryEn',
              'corePersonalityAr',
              'corePersonalityEn',
              'strengthsAr',
              'strengthsEn',
              'blindSpotsAr',
              'blindSpotsEn',
              'emotionalPatternAr',
              'emotionalPatternEn',
              'relationshipPatternAr',
              'relationshipPatternEn',
              'workPatternAr',
              'workPatternEn',
              'stressPatternAr',
              'stressPatternEn',
              'lifestylePatternAr',
              'lifestylePatternEn',
              'intimacyPatternAr',
              'intimacyPatternEn',
              'growthOpportunitiesAr',
              'growthOpportunitiesEn',
              'personalizedAdviceAr',
              'personalizedAdviceEn',
              'finalProfileQuoteAr',
              'finalProfileQuoteEn'
            ]
          }
        }
      });
    } catch (primaryErr) {
      console.warn('[Gemini Report] Primary model failed, trying fallback model:', primaryErr);
      response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });
    }

    const rawText = response.text?.trim();
    if (rawText) {
      const parsed = JSON.parse(rawText) as AIAnalysisReport;
      return parsed;
    }
  } catch (error) {
    console.error('[AI Engine] Error generating Gemini report:', error);
  }

  return getFallbackAIReport(userName, archetype, scores);
}

export interface BotChatResponse {
  replyText: string;
  suggestedQuestions?: string[];
  actionButtons?: Array<{
    text: string;
    action?: string;
    url?: string;
  }>;
}

export async function chatWithPersonalityBot(
  userMessage: string,
  userContext: {
    name: string;
    archetypeId?: string;
    overallScore?: number;
    domainScores?: Record<string, number>;
    language?: string;
    coachTone?: string;
    storyDepth?: string;
  },
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<BotChatResponse> {
  const client = getAIClient();
  const archetype = userContext.archetypeId ? ARCHETYPES[userContext.archetypeId] : null;
  const isAr = !userContext.language || userContext.language === 'ar';

  // Customize coach persona based on user settings
  let toneInstruction = "Socratic Sage: Blend philosophical depth, subtle wisdom, and reflective questions.";
  if (userContext.coachTone === 'motivational') {
    toneInstruction = "Action Coach: Direct, energizing, high accountability, focusing on discipline and immediate execution.";
  } else if (userContext.coachTone === 'calm_empathic') {
    toneInstruction = "Empathic Counselor: Gentle, soothing, deeply validating, focusing on emotional safety and inner peace.";
  } else if (userContext.coachTone === 'analytical') {
    toneInstruction = "Neuroscience Analyst: Grounded in behavioral science, cognitive frameworks, data metrics, and psychological mechanisms.";
  }

  let storyInstruction = "Balanced wisdom with insightful real-life analogies.";
  if (userContext.storyDepth === 'rich_stories') {
    storyInstruction = "Deep Narrative Storyteller: Weave rich, memorable parables, metaphors, and archetypal tales that illuminate the mind.";
  } else if (userContext.storyDepth === 'direct_tactical') {
    storyInstruction = "Direct & Tactical: Minimize long preamble, provide concise high-impact tactical points and pragmatic steps.";
  }

  const defaultSuggested = isAr
    ? [
        '📖 احكيلي قصة ملهمة تناسب شخصيتي',
        '📊 حلل بياناتي ومحاوري النفسية بعمق',
        '☕ كيف أتعامل مع ضغوط العمل والتفكير الزائد؟',
        '🎭 اختبرني في معضلة قيادية واقعية'
      ]
    : [
        '📖 Tell me an inspiring story for my archetype',
        '📊 Deep-dive into my behavioral data & scores',
        '☕ How can I manage overthinking & stress?',
        '🎭 Challenge me with a realistic dilemma'
      ];

  if (!client) {
    const fallbackReply = generateRichHumanFallbackReply(userMessage, userContext, archetype, isAr);
    return {
      replyText: fallbackReply,
      suggestedQuestions: defaultSuggested,
      actionButtons: [
        { text: isAr ? '🚀 فتح جلسة التحليل' : '🚀 Open Assessment', action: 'open_analysis' },
        { text: isAr ? '📊 استكشاف الرادار التفاعلي' : '📊 Explore Radar', action: 'open_growth' }
      ]
    };
  }

  const systemInstruction = `
You are PERSONA AI — a world-class, deeply empathetic, razor-sharp Behavioral Intelligence Mentor & Psychologist.
You speak like a real, wise, warm human being who genuinely listens, understands nuance, and speaks directly to the soul — NOT like a rigid corporate chatbot or generic assistant.

YOUR SPECIFIC COACHING CONFIGURATION (FROM USER SETTINGS):
- CHOSEN TONE: ${toneInstruction}
- STORYTELLING PREFERENCE: ${storyInstruction}

YOUR PERSONA & SPEAKING STYLE:
1. **AUTHENTIC HUMAN CADENCE**:
   - Talk naturally, with emotional resonance, warmth, and intelligence.
   - Use vivid metaphors, relatable analogies, and captivating mini-stories according to the chosen storytelling preference.
   - Avoid robotic bullet points or canned clichés (never say "As an AI..." or "Here are 5 tips..."). Structure your thoughts organically.

2. **DEEP DATA & PROFILE INTEGRATION**:
   - User Name: ${userContext.name}
   - Core Archetype: ${archetype ? `${archetype.nameEn} (${archetype.nameAr})` : 'Strategic Explorer'}
   - Overall Equilibrium Index: ${userContext.overallScore || 86}%
   - Domain Scores:
     * Mind/Cognition: ${userContext.domainScores?.cognitive || 88}%
     * Emotional IQ: ${userContext.domainScores?.emotional || 82}%
     * Social Charisma: ${userContext.domainScores?.social || 79}%
     * Discipline: ${userContext.domainScores?.behavioral || 85}%
     * Career & Ambition: ${userContext.domainScores?.career || 89}%
     * Body & Vitality: ${userContext.domainScores?.lifestyle || 80}%
     * Deep Intimacy & Boundaries: ${userContext.domainScores?.intimacy || 85}%
   - When appropriate, reference their specific strengths, blind spots, and metric balances subtly to show you truly understand them.

3. **STORYTELLING & PARABLES**:
   - When asked for stories, advice on dilemmas, or dealing with fear/overthinking/relationships, tell an engaging, memorable 2-3 paragraph parable or real-world archetype scenario that leaves a lasting insight.

4. **SAFETY & RESPECT**:
   - Strictly non-diagnostic (no psychiatric labels). Frame observations tentatively ("يبدو أن نمطك يميل إلى...", "في علم النفس السلوكي، غالباً ما نرى...").
   - Discuss relationships and intimacy with supreme maturity, emotional intelligence, and respect.

5. **TELEGRAM FORMATTING**:
   - Use Telegram HTML formatting (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>) to make the text beautiful and readable.

RESPONSE FORMAT:
Provide valid JSON with:
{
  "replyText": "HTML formatted response string with rich human warmth and depth",
  "suggestedQuestions": ["3-4 natural follow-up conversation prompts"],
  "actionButtons": [{"text": "button text", "action": "open_analysis" | "open_growth" | "open_radar"}]
}
`;

  try {
    const formattedContents = [
      ...history.slice(-8).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      {
        role: 'user' as const,
        parts: [{ text: userMessage }]
      }
    ];

    let response;
    try {
      response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.82,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: { type: Type.STRING },
              suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionButtons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ['text']
                }
              }
            },
            required: ['replyText']
          }
        }
      });
    } catch (primaryErr) {
      console.warn('[Bot AI Chat] Primary model failed, trying fallback model:', primaryErr);
      response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.8,
          responseMimeType: 'application/json'
        }
      });
    }

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text) as BotChatResponse;
      return parsed;
    }
  } catch (err) {
    console.error('[Bot AI Chat] Error calling Gemini:', err);
  }

  const fallbackReply = generateRichHumanFallbackReply(userMessage, userContext, archetype, isAr);
  return {
    replyText: fallbackReply,
    suggestedQuestions: defaultSuggested,
    actionButtons: [
      { text: isAr ? '🚀 فتح جلسة التحليل' : '🚀 Open Assessment', action: 'open_analysis' }
    ]
  };
}

function generateRichHumanFallbackReply(
  userMessage: string,
  userContext: { name: string; overallScore?: number; domainScores?: Record<string, number> },
  archetype: any,
  isAr: boolean
): string {
  const name = userContext.name || (isAr ? 'صديقي' : 'my friend');
  const archName = archetype ? (isAr ? archetype.nameAr : archetype.nameEn) : (isAr ? 'البنّاء الاستراتيجي' : 'Strategic Builder');
  const lower = userMessage.toLowerCase();

  if (isAr) {
    if (lower.includes('قصة') || lower.includes('حكاية') || lower.includes('تجربة')) {
      return `أهلاً يا <b>${name}</b>.. دعني أشاركك هذه القصة الصغيرة التي تلمس عمق نمط <b>${archName}</b>:\n\nيُحكى أن نحّاتاً بارعاً قضى أشهراً طويلة أمام صخرة ضخمة من الرخام لم يمسسها بإزميله، بينما كان الناس يظنونه عاجزاً أو متردداً. وحين سألوه: <i>«لماذا لا تبدأ بالعمل؟»</i>، ابتسم وقال: <i>«أنا لا أنحت شكلاً جديداً، بل أراقب الصخرة حتى أرى التمثال المحبوس داخلها بوضوح، وما الإزميل إلا وسيلة لإزالة الزوائد فقط.»</i>\n\nوهكذا هو عقلك يا <b>${name}</b>؛ تحليلك العميق وتفكيرك قبل اتخاذ القرار ليس تردداً، بل هو تلك الرؤية التي ترى النتيجة النهائية قبل أن تبدأ. التحدي الوحيد هو ألا تطيل الوقوف أمام الصخرة أكثر مما ينبغي.\n\nما رأيك، في أي جوانب حياتك الآن تشعر أنك تدقق في الصخرة وتنتظر اللحظة المثالية للبدء؟`;
    }

    if (lower.includes('بيانات') || lower.includes('تحليل') || lower.includes('أبعاد') || lower.includes('درجات')) {
      return `أهلاً <b>${name}</b> 📊.. حين أنظر إلى خريطتك البيانية كنمط <b>${archName}</b>، أرى توازناً فريداً:\n\n• <b>محور العقل والتحليل (${userContext.domainScores?.cognitive || 88}%):</b> يمنحك وضوحاً فكرياً حاداً وقدرة على رؤية ما وراء السطور.\n• <b>محور الانضباط والدافعية (${userContext.domainScores?.career || 89}%):</b> مؤشر مرتفع يوضح أنك شخص لا يقبل بأنصاف الحلول ويسعى للأثر الحقيقي.\n• <b>محور الذكاء الاجتماعي والعاطفي (${userContext.domainScores?.emotional || 82}%):</b> يمثل منطقة النمو الأجمل؛ حيث يمكنك استثمار مشاعرك كبوصلة دقيقة وليس فقط كمنطق جاف.\n\nأيّ من هذه الأبعاد تشعر أنه يحتاج منك وقفة وتغذية خاصة في هذه المرحلة؟`;
    }

    return `أهلاً بك يا <b>${name}</b>.. أسمعك بكل اهتمام.\n\nمن خلال متابعتي لنمطك النفسي كـ <b>${archName}</b>، أعلم تماماً أنك لا تبحث عن نصائح سطحية أو عبارات تحفيز معلبة، بل عن حوار حقيقي يلامس ما تشعر به ويفكك التحديات بذكاء وهدوء.\n\nأخبرني، ما الذي يشغل تفكيرك أو يدور في ذهنك اليوم؟ سواء كان موقفاً في العمل، قراراً في علاقاتك، أو حتى شعوراً بالرغبة في إعادة ترتيب أولوياتك الشخصية.`;
  } else {
    if (lower.includes('story') || lower.includes('parable')) {
      return `Hello <b>${name}</b>. Let me share a brief story that speaks directly to the essence of <b>${archName}</b>:\n\nA master sculptor spent months observing a raw block of marble without carving a single line. When passersby questioned his hesitation, he calmly replied: <i>"I am not waiting out of hesitation; I am discerning the masterpiece already hidden inside. The chisel will merely remove what does not belong."</i>\n\nThat is your psychological core, <b>${name}</b>. Your careful analysis is not delay—it is vision. The only growth edge is knowing when the stone is ready for the first strike.\n\nWhere in your life right now are you waiting for that perfect clarity before taking action?`;
    }

    return `Welcome <b>${name}</b>. I am listening with deep attention.\n\nLooking at your <b>${archName}</b> profile, I know you don't need generic motivational platitudes. You appreciate authentic, intelligent dialogue that respects your depth.\n\nWhat is on your mind today? Whether it's a strategic crossroad at work, a dynamic in a relationship, or simply finding inner equilibrium—let's explore it together.`;
  }
}

export async function generateGoalAICheckInPrompt(
  goalTitle: string,
  category: string,
  userContext: {
    name: string;
    archetypeId?: string;
    overallScore?: number;
    domainScores?: Record<string, number>;
  }
): Promise<AICheckInPrompt> {
  const client = getAIClient();
  const archetype = userContext.archetypeId ? ARCHETYPES[userContext.archetypeId] : null;

  const defaultPrompt: AICheckInPrompt = {
    questionAr: `كيف انعكس التزامك بهدف "${goalTitle}" على صفاء ذهنك وطاقتك اليوم؟`,
    questionEn: `How did committing to "${goalTitle}" impact your mental clarity and energy today?`,
    reasoningAr: `النمط السلوكي "${archetype?.nameAr || 'الاستراتيجي'}" يحقق أعلى درجات الإنجاز عندما يربط العادات اليومية بالرؤية الكبرى والهدوء الداخلي.`,
    reasoningEn: `The "${archetype?.nameEn || 'Strategic'}" archetype achieves peak performance by bridging micro-habits with grand vision and inner equilibrium.`,
    archetypeTipAr: `ركز على بناء وتيرة مستمرة ولو لمدة 15 دقيقة فقط يومياً بدلاً من المثالية المرهقة.`,
    archetypeTipEn: `Prioritize steady 15-minute daily momentum over unsustainable perfectionism.`
  };

  if (!client) return defaultPrompt;

  const prompt = `
You are PERSONA AI Behavioral Psychologist.
A user named "${userContext.name}" with Archetype "${archetype?.nameEn || 'Strategic Builder'}" (${archetype?.nameAr || 'البناء الاستراتيجي'}) has created a lifestyle goal:
Goal Title: "${goalTitle}"
Category: "${category}"
Archetype Traits: ${archetype?.descriptionEn || 'High analytical focus, discipline, and strategic mindset'}.

Generate a personalized, psychologically deep check-in prompt in both Arabic and English tailored directly to their archetype.
Respond with JSON matching:
{
  "questionAr": "string",
  "questionEn": "string",
  "reasoningAr": "string",
  "reasoningEn": "string",
  "archetypeTipAr": "string",
  "archetypeTipEn": "string"
}
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (text) {
      return JSON.parse(text) as AICheckInPrompt;
    }
  } catch (err) {
    console.error('[Gemini Goal Prompt] Error:', err);
  }

  return defaultPrompt;
}

export async function generateGoalCheckInFeedback(
  goalTitle: string,
  status: 'completed' | 'progressed' | 'struggled',
  note: string,
  userContext: {
    name: string;
    archetypeId?: string;
  }
): Promise<string> {
  const client = getAIClient();
  const archetype = userContext.archetypeId ? ARCHETYPES[userContext.archetypeId] : null;

  const defaultFeedback = status === 'completed'
    ? `رائع يا ${userContext.name}! إنجاز هذا الهدف يعزز الانضباط لديك ويبني ثقة ذاتية عميقة.`
    : status === 'progressed'
    ? `خطوة موفقة يا ${userContext.name}. التقدم الجزئي هو جوهر الاستمرارية الطويلة.`
    : `لا بأس يا ${userContext.name}. الأيام الصعبة جزء طبيعي من مسار النمو؛ الأهم هو الوعي بالسبب والعودة غداً برفق.`;

  if (!client) return defaultFeedback;

  const prompt = `
You are a warm, wise, psychological mentor in PERSONA AI.
User: ${userContext.name}
Archetype: ${archetype?.nameAr || 'النمط الاستراتيجي'}
Goal: "${goalTitle}"
Status Today: ${status}
User Reflection Note: "${note || 'No note provided'}"

Write a concise (2-3 sentences), warm, deeply insightful coaching response in Arabic (or English if indicated) that validates their effort and gives a psychological perspective based on their archetype. Speak directly to them. Return pure text.
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.75
      }
    });
    return response.text?.trim() || defaultFeedback;
  } catch {
    return defaultFeedback;
  }
}

export async function generate24HourGrowthChallenge(
  userContext: {
    id: string;
    name: string;
    archetypeId?: string;
  },
  weakestDimension: {
    name: string;
    nameAr: string;
    nameEn: string;
    score: number;
    category?: string;
  }
): Promise<GrowthChallenge> {
  const client = getAIClient();
  const archetype = userContext.archetypeId ? ARCHETYPES[userContext.archetypeId] : null;

  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const challengeId = 'ch_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  // Curated Archetype & Dimension Default Fallbacks
  const getDimensionFallback = (): Omit<GrowthChallenge, 'id' | 'userId' | 'startedAt' | 'expiresAt' | 'status'> => {
    const dim = weakestDimension.name.toLowerCase();
    if (dim.includes('stress') || dim.includes('توتر') || dim.includes('ضغط')) {
      return {
        dimensionKey: weakestDimension.name,
        dimensionNameAr: weakestDimension.nameAr || 'إدارة التوتر وضغط العمل',
        dimensionNameEn: weakestDimension.nameEn || 'Stress Resilience',
        dimensionScore: weakestDimension.score || 45,
        titleAr: 'تحدي الـ 24 ساعة: وقفة التنفس الواعي (4-7-8) قبل أي رد عاجل',
        titleEn: '24-Hour Reset: 4-7-8 Breathing Pause Before Urgent Responses',
        descriptionAr: 'خلال الـ 24 ساعة القادمة، قبل أن ترد على أي رسالة، بريد إلكتروني، أو موقف يثير فيك الاستعجال أو التوتر، خذ 3 دورات تنفس عميق (شهيق 4 ثوانٍ، حبس 7 ثوانٍ، زفير 8 ثوانٍ).',
        descriptionEn: 'For the next 24 hours, perform 3 cycles of 4-7-8 box breathing before replying to any high-urgency message or triggering event.',
        actionStepsAr: [
          'لاحظ اللحظة الأولى التي تشعر فيها بتسارع النبض أو الرغبة في الرد الدفاعي السريع.',
          'توقف تماماً لمدة 30 ثانية وقم بتطبيق تنفس 4-7-8.',
          'أعد قراءة الموقف بهدوء ثم قرر الرد من موقع اتزان وليس رد فعل.'
        ],
        actionStepsEn: [
          'Catch the immediate visceral urge to react defensively.',
          'Pause for 30 seconds to execute the 4-7-8 breathing loop.',
          'Respond with calm intention rather than nervous reaction.'
        ],
        scientificRationaleAr: 'تفعيل العصب الحائر (Vagus Nerve) يخفض هرمون الكورتيزول ويمنع هيمنة اللوزة الدماغية (Amygdala Hijack) على القرارات.',
        scientificRationaleEn: 'Vagal nerve stimulation directly downregulates cortisol and prevents amygdala hijacking during critical friction moments.',
        durationHours: 24,
        xpReward: 60,
        difficulty: 'micro',
        category: 'psychological'
      };
    }

    if (dim.includes('assert') || dim.includes('social') || dim.includes('تواصل') || dim.includes('حزم')) {
      return {
        dimensionKey: weakestDimension.name,
        dimensionNameAr: weakestDimension.nameAr || 'الحزم والتواصل الشجاع',
        dimensionNameEn: weakestDimension.nameEn || 'Social Assertiveness',
        dimensionScore: weakestDimension.score || 42,
        titleAr: 'تحدي الـ 24 ساعة: التعبير عن رأيك الصادق دون الاعتذار غير المبرر',
        titleEn: '24-Hour Courage: Express Honest Preference Without Over-Apologizing',
        descriptionAr: 'في موقف اجتماعي أو مهني اليوم، عبر عن خيارك أو تفضيلك الحقيقي بوضوح ولباقة دون استخدام عبارات تبريرية أو اعتذار عن مجرد إبداء رأيك.',
        descriptionEn: 'In one social or professional interaction today, state your honest preference cleanly without padding it with unnecessary apologies.',
        actionStepsAr: [
          'اختر موقفاً بسيطاً (اختيار مطعم، موعد اجتماع، أو إبداء وجهة نظر في مناقشة).',
          'قل "أنا أفضل كذا لأن..." بدلاً من "أنا آسف ولكن ربما لو...".',
          'راقب شعورك بالارتياح والوضوح بعد انتهاء المحادثة.'
        ],
        actionStepsEn: [
          'Pick a low-stakes decision (lunch spot, meeting time, or feedback point).',
          'State "I recommend X because..." rather than "Sorry, but maybe...".',
          'Notice the sense of grounded self-respect that follows.'
        ],
        scientificRationaleAr: 'تقليل السلوكيات الاسترضائية (People Pleasing) يعيد ضبط الهوية الذاتية ويعزز الكفاءة الاجتماعية.',
        scientificRationaleEn: 'Reducing automatic appeasement behaviors directly recalibrates self-efficacy and boundary strength.',
        durationHours: 24,
        xpReward: 75,
        difficulty: 'courage',
        category: 'social'
      };
    }

    if (dim.includes('focus') || dim.includes('تركيز') || dim.includes('انضباط')) {
      return {
        dimensionKey: weakestDimension.name,
        dimensionNameAr: weakestDimension.nameAr || 'التركيز العميق ومقاومة التشتت',
        dimensionNameEn: weakestDimension.nameEn || 'Deep Focus & Impulse Control',
        dimensionScore: weakestDimension.score || 48,
        titleAr: 'تحدي الـ 24 ساعة: جلسة عمل عميق بدون إشعارات لمدة 45 دقيقة',
        titleEn: '24-Hour Mastery: Single-Tasking 45-min Deep Focus Sprint',
        descriptionAr: 'حدد مهمة واحدة معقدة أو مؤجلة، ضع هاتفك في غرفة أخرى، وأنجز 45 دقيقة من العمل المركز دون فتح أي تبويب إضافي.',
        descriptionEn: 'Select one meaningful project, remove your phone from the room, and complete a dedicated 45-minute distraction-free work block.',
        actionStepsAr: [
          'اكتب المهمة الوحيدة في ورقة أمامك.',
          'أغلق جميع التطبيقات والمشتتات وضع الهاتف في وضع الصامت.',
          'اعمل لـ 45 دقيقة متواصلة ثم كافئ نفسك بـ 10 دقائق استراحة حركية.'
        ],
        actionStepsEn: [
          'Write the single target objective on physical paper.',
          'Close all background tabs and place your phone out of reach.',
          'Engage for 45 uninterrupted minutes before a 10-minute movement break.'
        ],
        scientificRationaleAr: 'إزالة تكلفة التبديل الإدراكي (Context Switching Cost) تعيد شحن الدوبامين وترفع جودة المخرجات بنسبة 40%.',
        scientificRationaleEn: 'Eliminating cognitive switching costs optimizes baseline dopamine circuits and accelerates neuro-plastic flow state.',
        durationHours: 24,
        xpReward: 65,
        difficulty: 'standard',
        category: 'focus'
      };
    }

    // Universal Growth Challenge fallback
    return {
      dimensionKey: weakestDimension.name,
      dimensionNameAr: weakestDimension.nameAr || 'المرونة الذهنية والوعي الذاتي',
      dimensionNameEn: weakestDimension.nameEn || 'Cognitive Flexibility & Self-Awareness',
      dimensionScore: weakestDimension.score || 46,
      titleAr: 'تحدي الـ 24 ساعة: تدوين موقف مزعج وتفكيك الفرضية الذهنية خلفه',
      titleEn: '24-Hour Growth: Reframe One Friction Event Through Cognitive Restructuring',
      descriptionAr: 'اختر حدثاً أثار انزعاجك اليوم، واكتب على ورقة: ما الفكرة التلقائية التي خطرت ببالي؟ وما التفسير البديل الأكثر حكمة وإنصافاً؟',
      descriptionEn: 'Identify one irritating friction point today and deliberately formulate two alternative, empowering interpretations of it.',
      actionStepsAr: [
        'سجل الموقف المزعج بموضوعية بدون تضخيم.',
        'حدد التفسير السلبي التلقائي.',
        'اكتب تفسيراً بديلاً يعزز نموك الشخصي ويتفهم دوافع الطرف الآخر.'
      ],
      actionStepsEn: [
        'Log the triggering event objectively without emotional hyperbole.',
        'Identify the default negative cognitive distortion.',
        'Formulate a constructive reframing hypothesis.'
      ],
      scientificRationaleAr: 'إعادة التقييم الإدراكي (Cognitive Reappraisal) هي الآلية الأساسية في العلاج المعرفي السلوكي لبناء الصلابة النفسية.',
      scientificRationaleEn: 'Cognitive reappraisal is the validated mechanism in CBT for long-term psychological resilience.',
      durationHours: 24,
      xpReward: 60,
      difficulty: 'micro',
      category: 'mindset'
    };
  };

  const fallback = getDimensionFallback();

  if (!client) {
    return {
      id: challengeId,
      userId: userContext.id,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'active',
      ...fallback
    };
  }

  const prompt = `
You are PERSONA AI — a master behavioral scientist and psychological coach.
Design a highly motivating, practical, and safe 24-HOUR MICRO-CHALLENGE for user "${userContext.name}".

USER CONTEXT:
- Archetype: ${archetype?.nameEn || 'Strategic Mind'} (${archetype?.nameAr || 'النمط الاستراتيجي'})
- Weakest Dimension Detected: "${weakestDimension.nameEn}" (${weakestDimension.nameAr})
- Current Score in this Dimension: ${weakestDimension.score}% / 100

CRITICAL REQUIREMENTS:
1. ACTIONABLE & TIME-BOUND: Must be completed within 24 hours. Small, realistic, but psychologically potent.
2. TAILORED: Specifically addresses the friction point in their weakest dimension (${weakestDimension.nameAr} - ${weakestDimension.score}%).
3. NON-DIAGNOSTIC & SAFE: Focus on self-discipline, communication, stress release, courage, or emotional clarity.
4. BILINGUAL JSON: Provide compelling Arabic and English text for all fields.

Return ONLY a JSON object matching this schema:
{
  "titleAr": "تحدي الـ 24 ساعة: عنوان ملهم ومحدد بالعربي",
  "titleEn": "24-Hour Challenge: Catchy specific English title",
  "descriptionAr": "شرح مبسط ومباشر للتحدي وما المطلوب فعله خلال اليوم بالعربي",
  "descriptionEn": "Clear, direct explanation of what to do over the 24 hours in English",
  "actionStepsAr": ["الخطوة 1", "الخطوة 2", "الخطوة 3"],
  "actionStepsEn": ["Step 1", "Step 2", "Step 3"],
  "scientificRationaleAr": "الأساس العلمي والنفسي المقتضب لهذا التحدي بالعربي",
  "scientificRationaleEn": "Brief behavioral science rationale in English",
  "xpReward": 60,
  "difficulty": "micro",
  "category": "psychological"
}
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        id: challengeId,
        userId: userContext.id,
        dimensionKey: weakestDimension.name,
        dimensionNameAr: weakestDimension.nameAr,
        dimensionNameEn: weakestDimension.nameEn,
        dimensionScore: weakestDimension.score,
        titleAr: parsed.titleAr || fallback.titleAr,
        titleEn: parsed.titleEn || fallback.titleEn,
        descriptionAr: parsed.descriptionAr || fallback.descriptionAr,
        descriptionEn: parsed.descriptionEn || fallback.descriptionEn,
        actionStepsAr: parsed.actionStepsAr || fallback.actionStepsAr,
        actionStepsEn: parsed.actionStepsEn || fallback.actionStepsEn,
        scientificRationaleAr: parsed.scientificRationaleAr || fallback.scientificRationaleAr,
        scientificRationaleEn: parsed.scientificRationaleEn || fallback.scientificRationaleEn,
        durationHours: 24,
        xpReward: Number(parsed.xpReward) || 60,
        status: 'active',
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        difficulty: (parsed.difficulty as any) || 'micro',
        category: (parsed.category as any) || 'psychological'
      };
    }
  } catch (err) {
    console.error('[Gemini Growth Challenge] Error:', err);
  }

  return {
    id: challengeId,
    userId: userContext.id,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: 'active',
    ...fallback
  };
}

export async function evaluateGrowthChallengeCompletion(
  userContext: {
    name: string;
    archetypeId?: string;
  },
  challenge: GrowthChallenge,
  reflectionNote: string
): Promise<string> {
  const client = getAIClient();
  const archetype = userContext.archetypeId ? ARCHETYPES[userContext.archetypeId] : null;

  const defaultFeedback = `إنجاز رائع يا ${userContext.name}! إتمامك لتحدي "${challenge.titleAr}" يبرهن على رغبة حقيقية في كسر الأنماط التلقائية وتطوير بعد "${challenge.dimensionNameAr}". استمر بهذا الإصرار!`;

  if (!client) return defaultFeedback;

  const prompt = `
You are PERSONA AI's master psychological growth coach.
User "${userContext.name}" (${archetype?.nameAr || 'النمط الاستراتيجي'}) just completed a 24-Hour Growth Challenge targeting their weakest dimension: "${challenge.dimensionNameAr}".

Challenge: "${challenge.titleAr}"
User's Reflection Note on Completion: "${reflectionNote || 'Completed with focus'}"

Write a concise, empowering, warm 2-3 sentence psychological evaluation in Arabic.
Acknowledge what they did, validate their cognitive/emotional courage, and highlight how this builds lasting mental neuroplasticity. Return pure text.
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.75
      }
    });
    return response.text?.trim() || defaultFeedback;
  } catch {
    return defaultFeedback;
  }
}

export function getFallbackAIReport(
  userName: string,
  archetype: any,
  scores: CalculatedScores
): AIAnalysisReport {
  return {
    executiveSummaryAr: `يُظهر تحليلك السلوكي الشامل لعام 2026 تمتعك بنمط "${archetype.nameAr}" بمرتبة ذكاء كلي تصل إلى ${scores.overallScore}%. يتميز أسلوبك باتساق ذهني وعاطفي ملحوظ وقدرة على اتخاذ القرارات برؤية هيكلية واستراتيجية.`,
    executiveSummaryEn: `Your comprehensive 2026 behavioral analysis highlights "${archetype.nameEn}" characteristics with an overall index of ${scores.overallScore}%. Your profile demonstrates strong cognitive coherence and deliberate strategic decision-making.`,
    corePersonalityAr: archetype.descriptionAr || 'شخصية قيادية تجمع بين الدقة التحليلية وعمق التفكير الاستراتيجي.',
    corePersonalityEn: archetype.descriptionEn || 'A strategic mind combining analytical rigor with structured long-term vision.',
    strengthsAr: archetype.strengthsAr || [
      'التفكير الاستراتيجي وتفكيك المشكلات المعقدة',
      'الانضباط الذاتي والقدرة على التركيز المستمر',
      'الاستقرار العاطفي تحت ضغوط العمل',
      'الوضوح في تحديد الأهداف ومتابعة تنفيذها'
    ],
    strengthsEn: archetype.strengthsEn || [
      'Strategic structural reasoning and problem solving',
      'High self-discipline and sustained concentration',
      'Emotional stability under occupational pressure',
      'Clarity in goal setting and tactical execution'
    ],
    blindSpotsAr: archetype.blindSpotsAr || [
      'الميل إلى الإفراط في التحليل قبل المبادرة',
      'صعوبة تفويض المهام الحساسة للآخرين',
      'الحاجة لمزيد من المرونة العفوية في البيئات المتغيرة'
    ],
    blindSpotsEn: archetype.blindSpotsEn || [
      'Tendency to over-analyze before taking spontaneous action',
      'Hesitancy in delegating high-stakes tasks to team members',
      'Need for greater adaptability in unstructured settings'
    ],
    emotionalPatternAr: 'تميل إلى معالجة المشاعر بطريقة عقلانية متزنة، مع الحرص على عدم التأثر السريع بالانفعالات اللحظية.',
    emotionalPatternEn: 'You process emotions through a calm, rational filter, maintaining composure in high-friction moments.',
    relationshipPatternAr: 'تفضل العلاقات العميقة القائمة على الثقة المتبادلة والوضوح الفكري، وتضع حدوداً صحية واضحة.',
    relationshipPatternEn: 'You prioritize deep, value-aligned connections based on mutual trust and transparent communication.',
    workPatternAr: 'بيئة العمل المنظمة ذات الأهداف المحددة والمشاريع ذات الأثر الاستراتيجي تطلق أقصى طاقاتك الإنتاجية.',
    workPatternEn: 'Structured environments with clear milestones and systemic impact maximize your performance.',
    stressPatternAr: 'عند مواجهة الضغوط الشديدة، تميل إلى الانعزال لإعادة ترتيب الأولويات وصياغة خطط بديلة.',
    stressPatternEn: 'Under high stress, you retreat to re-evaluate structural priorities and formulate contingency plans.',
    lifestylePatternAr: 'تستفيد بشكل كبير من الروتين الصباحي المنظم وتخصيص فترات ثابتة للراحة واستعادة الطاقة الذهنية.',
    lifestylePatternEn: 'You thrive on steady daily routines, consistent sleep cycles, and deliberate mental reset rituals.',
    intimacyPatternAr: 'تُقدّر الأمان العاطفي، والتواصل الصادق غير المتكلف، والاحترام المتبادل للمساحات الشخصية.',
    intimacyPatternEn: 'You value emotional safety, authentic vulnerability, and mutual respect for individual boundaries.',
    growthOpportunitiesAr: [
      'تطوير مهارات التفويض وبناء الثقة في فرق العمل',
      'ممارسة التأمل وتخفيف التوتر العصبي اليومي',
      'تعزيز التعبير العفوي عن المشاعر والامتنان'
    ],
    growthOpportunitiesEn: [
      'Cultivating delegation and trust-building within teams',
      'Practicing mindfulness and daily nervous system regulation',
      'Enhancing spontaneous expression of warmth and gratitude'
    ],
    personalizedAdviceAr: [
      'خصص 15 دقيقة في نهاية كل يوم لمراجعة التقدم بدون إصدار أحكام قاسية على الذات.',
      'اعتمد قاعدة "الإنجاز بنسبة 80%" للمهام غير الحرجة لتسريع وتيرة التنفيذ.',
      'تحدث بوضوح عن احتياجاتك العاطفية في علاقاتك المقربة دون افتراض معرفتهم المسبقة بها.'
    ],
    personalizedAdviceEn: [
      'Dedicate 15 minutes at the end of each day for compassionate self-reflection.',
      'Adopt the 80% completion rule for non-critical tasks to avoid perfectionist bottlenecks.',
      'Directly communicate emotional expectations in close relationships rather than assuming unspoken alignment.'
    ],
    finalProfileQuoteAr: '«القوة الحقيقية ليست في السيطرة الكاملة على الظروف، بل في فهم الذات وتوجيه الطاقات نحو الأثر الأبقى.»',
    finalProfileQuoteEn: '"True mastery is not total control over external circumstances, but deep self-awareness channeled toward lasting purpose."'
  };
}


import { Question } from '../types';

export const QUESTIONS_POOL: Question[] = [
  // 1. Cognitive (التفكير والمنطق)
  {
    id: 'cog_1',
    category: 'cognitive',
    dimension: 'analytical_thinking',
    dimensionAr: 'التفكير التحليلي والمنهجي',
    dimensionEn: 'Analytical Thinking & Root Cause',
    questionAr: 'عندما تواجه مشكلة معقدة أو طارئة في عملك أو حياتك، ما هي خطوتك الأولى عادةً؟',
    questionEn: 'When facing a complex or unforeseen problem, what is typically your first instinct?',
    options: [
      { id: 'opt_1', labelAr: 'أفكك المشكلة إلى عناصر منطقية صغيرة وأحلل الأسباب الجذرية', labelEn: 'Deconstruct into logical components & analyze root causes', value: 5 },
      { id: 'opt_2', labelAr: 'أبحث عن تجارب سابقة مماثلة واستعين بنماذج مثبتة', labelEn: 'Look for past precedents and proven models', value: 4 },
      { id: 'opt_3', labelAr: 'أستشير أشخاصاً ذوي خبرة وأجمع آراء متنوعة', labelEn: 'Consult experienced peers and gather perspectives', value: 3 },
      { id: 'opt_4', labelAr: 'أثق بحدسي المباشر وأبدأ بتجربة حلول سريعة', labelEn: 'Rely on gut instinct and test intuitive trial solutions', value: 2 },
      { id: 'opt_5', labelAr: 'أشعر بالحيرة أحياناً وأفضل تأجيل الخوض فيها', labelEn: 'Feel momentarily overwhelmed and delay action', value: 1 }
    ],
    importance: 1.2
  },
  {
    id: 'cog_2',
    category: 'cognitive',
    dimension: 'creativity',
    dimensionAr: 'الإبداع والابتكار والتوليد',
    dimensionEn: 'Creativity & Cross-Domain Synthesis',
    questionAr: 'كيف تصف طريقتك في توليد الأفكار والحلول الجديدة غير المألوفة؟',
    questionEn: 'How would you describe your method of generating new and unorthodox ideas?',
    options: [
      { id: 'opt_1', labelAr: 'أحب ربط مجالات متباعدة ببعضها وابتكار أفكار غير مسبوقة', labelEn: 'Synthesizing distant domains into unorthodox concepts', value: 5 },
      { id: 'opt_2', labelAr: 'أطوّر الأفكار القائمة وأحسن عليها لتصبح أكثر كفاءة', labelEn: 'Refining and optimizing existing frameworks for efficiency', value: 4 },
      { id: 'opt_3', labelAr: 'أبدع عندما أكون ضمن فريق يعصف ذهنياً ويتبادل الآراء', labelEn: 'Flourish when brainstorming with collaborative peers', value: 3 },
      { id: 'opt_4', labelAr: 'أفضل الطرق المجربة والموثوقة على المغامرة بأفكار جديدة', labelEn: 'Prefer reliable tested methods over speculative novelty', value: 2 },
      { id: 'opt_5', labelAr: 'نادراً ما أهتم بتوليد أفكار جديدة، وأركز على المطلوب فقط', labelEn: 'Rarely focus on idea generation, executing direct requests', value: 1 }
    ],
    importance: 1.1
  },
  {
    id: 'cog_3',
    category: 'cognitive',
    dimension: 'decision_making',
    dimensionAr: 'اتخاذ القرارات في بيئات الغموض',
    dimensionEn: 'Decision Making Under Ambiguity',
    questionAr: 'عند اتخاذ قرار مصيري مع نقص في المعلومات المتوفرة، كيف تتصرف؟',
    questionEn: 'When making a major decision under ambiguous or incomplete information, what do you do?',
    options: [
      { id: 'opt_1', labelAr: 'أحسب الاحتمالات وأقرر بحزم مع قبول هامش المخاطرة المحسوبة', labelEn: 'Calculate odds, decide decisively with calculated risk tolerance', value: 5 },
      { id: 'opt_2', labelAr: 'أجمع أقصى قدر ممكن من البيانات قبل أن أخطو أي خطوة', labelEn: 'Gather every available data point before taking any step', value: 4 },
      { id: 'opt_3', labelAr: 'أزن تأثير القرار على مشاعر واستقرار الأشخاص المعنيين أولاً', labelEn: 'Weigh impact on human relationships and relational peace', value: 3 },
      { id: 'opt_4', labelAr: 'أتردد كثيراً وأنتظر حتى تتضح الأمور من تلقاء نفسها', labelEn: 'Hesitate significantly, awaiting external clarity', value: 2 },
      { id: 'opt_5', labelAr: 'أفوّض القرار لشخص آخر أو أتجنب تحمّل مسؤوليته', labelEn: 'Delegate the decision or avoid single responsibility', value: 1 }
    ],
    importance: 1.0
  },

  // 2. Emotional (الذكاء العاطفي والاستقرار)
  {
    id: 'emo_1',
    category: 'emotional',
    dimension: 'emotional_awareness',
    dimensionAr: 'الوعي العاطفي الذاتي',
    dimensionEn: 'Emotional Self-Awareness',
    questionAr: 'عندما تشعر بتغير مفاجئ في مزاجك أو ضيق داخلي، إلى أي مدى تدرك سببه الحقيقي؟',
    questionEn: 'When you feel a sudden shift in mood or inner tension, how aware are you of its root trigger?',
    options: [
      { id: 'opt_1', labelAr: 'أدرك مشاعري ومحفزاتها بدقة وأستطيع تسميتها فوراً', labelEn: 'Pinpoint precise nuances of emotion and their exact triggers immediately', value: 5 },
      { id: 'opt_2', labelAr: 'ألاحظ التغير وأحتاج وقتاً قصيراً للتأمل وفهم السبب', labelEn: 'Notice changes and need a brief reflection to understand causes', value: 4 },
      { id: 'opt_3', labelAr: 'أشعر به كإحساس جسدي عام (توتر، إرهاق) دون وضوح المشاعر المحددة', labelEn: 'Experience somatic signals (tension, fatigue) without distinct clarity', value: 3 },
      { id: 'opt_4', labelAr: 'أحاول تجاهل الشعور فوراً والانشغال بالعمل أو المشتتات', labelEn: 'Attempt immediate suppression by burying into work/distractions', value: 2 },
      { id: 'opt_5', labelAr: 'نادراً ما أنتبه لمشاعري حتى تؤثر على تصرفاتي أو تنفجر', labelEn: 'Rarely notice emotional states until they boil over externally', value: 1 }
    ],
    importance: 1.3
  },
  {
    id: 'emo_2',
    category: 'emotional',
    dimension: 'emotional_regulation',
    dimensionAr: 'تنظيم المشاعر والمرونة',
    dimensionEn: 'Emotional Regulation & Poise',
    questionAr: 'عندما تتعرض لموقف مستفز أو خيبة أمل غير متوقعة، كيف تكون استجابتك؟',
    questionEn: 'When facing an acute provocation or unexpected disappointment, how do you regulate yourself?',
    options: [
      { id: 'opt_1', labelAr: 'أحافظ على هدوئي، أتنفس بعمق، وأرد بطريقة محسوبة ومتزنة', labelEn: 'Maintain composure, pause to ground, and respond with calculated poise', value: 5 },
      { id: 'opt_2', labelAr: 'أشعر بالانزعاج داخلياً لكني أسيطر على تعبيراتي الخارجية تماماً', labelEn: 'Feel internal agitation but maintain complete external restraint', value: 4 },
      { id: 'opt_3', labelAr: 'أحتاج للابتعاد والعزلة لبعض الوقت حتى أستعيد توازني', labelEn: 'Step away into solitude for a period to regain inner balance', value: 3 },
      { id: 'opt_4', labelAr: 'قد يظهر عليّ الانفعال اللفظي السريع ثم أندم لاحقاً', labelEn: 'Prone to reactive verbal outbursts followed by remorse', value: 2 },
      { id: 'opt_5', labelAr: 'أفقد السيطرة على أعصابي ويستمر تأثير الموقف لأيام', labelEn: 'Lose self-control, ruminating over the incident for days', value: 1 }
    ],
    importance: 1.2
  },
  {
    id: 'emo_3',
    category: 'emotional',
    dimension: 'empathy',
    dimensionAr: 'التعاطف واستشعار الآخرين',
    dimensionEn: 'Empathy & Interpersonal Attunement',
    questionAr: 'عندما يشاركك صديق أو زميل محنة أو ألماً يمر به، ماذا يدور بداخلك؟',
    questionEn: 'When a friend shares painful vulnerability with you, what occurs within your awareness?',
    options: [
      { id: 'opt_1', labelAr: 'أشعر بألمه بعمق في داخلي وأقدم له حضوراً واستماعاً آمناً دون حكم', labelEn: 'Feel their pain deeply and provide safe non-judgmental presence', value: 5 },
      { id: 'opt_2', labelAr: 'أتعاطف معه وأحاول مباشرة تقديم حلول واقتراحات عملية لمساعدته', labelEn: 'Empathize while immediately offering practical solutions to help', value: 4 },
      { id: 'opt_3', labelAr: 'أستمع باحترام وأواسيه بالكلمات المناسبة اجتماعياً', labelEn: 'Listen respectfully and provide appropriate conventional comfort', value: 3 },
      { id: 'opt_4', labelAr: 'أشعر بعدم الارتياح مع المشاعر المكثفة وأفضل تغيير الموضوع بلطف', labelEn: 'Feel uneasy around intense vulnerability and subtly pivot topic', value: 2 },
      { id: 'opt_5', labelAr: 'أجد صعوبة في فهم سبب تأثره الكبير بمثل هذه المواقف', labelEn: 'Struggle to understand why such issues provoke intense emotion', value: 1 }
    ],
    importance: 1.1
  },

  // 3. Social (التواصل والطاقة الاجتماعية)
  {
    id: 'soc_1',
    category: 'social',
    dimension: 'social_energy',
    dimensionAr: 'إدارة الطاقة الاجتماعية',
    dimensionEn: 'Social Energy & Extroversion',
    questionAr: 'بعد قضاء يوم كامل في مناسبة اجتماعية حاشدة أو لقاءات عمل متعددة، كيف تكون طاقتك؟',
    questionEn: 'After a full day in a bustling social gathering or continuous meetings, how is your energy?',
    options: [
      { id: 'opt_1', labelAr: 'أشعر بالحماس والنشاط والتجدد بعد التفاعل مع الناس', labelEn: 'Feel energized, vibrant, and recharged by human interaction', value: 5 },
      { id: 'opt_2', labelAr: 'استمتعت بالتواجد لكن بطاريتي الاجتماعية بحاجة لشحن قليل', labelEn: 'Enjoyed it, but my social battery requires modest quiet recharge', value: 4 },
      { id: 'opt_3', labelAr: 'طبيعي، أوازن بسهولة بين الرغبة في التواجد والرغبة في الهدوء', labelEn: 'Balanced equilibrium between social engagement and solitude', value: 3 },
      { id: 'opt_4', labelAr: 'مستنزف تماماً وأحتاج لعزلة تامة لعدة ساعات أو أيام', labelEn: 'Completely drained, requiring immersive quiet solitude to reset', value: 2 },
      { id: 'opt_5', labelAr: 'أتجنب مثل هذه التجمعات أصلاً لأنها تسبب لي إرهاقاً شديداً', labelEn: 'Actively avoid large gatherings due to acute energy depletion', value: 1 }
    ],
    importance: 1.0
  },
  {
    id: 'soc_2',
    category: 'social',
    dimension: 'social_confidence',
    dimensionAr: 'الثقة والمبادرة الاجتماعية',
    dimensionEn: 'Social Presence & Assertiveness',
    questionAr: 'عندما تدخل مكاناً جديداً لا تعرف فيه أحداً تقريباً، كيف تتصرف؟',
    questionEn: 'When entering a completely unfamiliar setting where you know nobody, what do you do?',
    options: [
      { id: 'opt_1', labelAr: 'أبدأ الحديث بثقة مع الحاضرين وأكسر الجليد بابتسامة ومبادرة', labelEn: 'Initiate confident conversations and break ice with warmth', value: 5 },
      { id: 'opt_2', labelAr: 'أبحث عن شخص يبدو ودوداً أو منفرداً وأبدأ حواراً هادئاً معه', labelEn: 'Seek an approachable individual and start a gentle conversation', value: 4 },
      { id: 'opt_3', labelAr: 'أراقب المشهد العام أولاً وأنتظر فرصة طبيعية للاندماج', labelEn: 'Observe the room first and wait for an organic opening', value: 3 },
      { id: 'opt_4', labelAr: 'أبقى في زاوية مريحة وأتصفح هاتفي لتجنب الإحراج', labelEn: 'Stay in a comfortable corner checking my phone to avoid awkwardness', value: 2 },
      { id: 'opt_5', labelAr: 'أشعر برهبة وتوتر شديد ورغبة في المغادرة فوراً', labelEn: 'Feel noticeable tension and strong urge to leave quickly', value: 1 }
    ],
    importance: 1.1
  },
  {
    id: 'soc_3',
    category: 'social',
    dimension: 'communication_style',
    dimensionAr: 'أسلوب التواصل والمصارحة',
    dimensionEn: 'Communication & Constructive Candor',
    questionAr: 'عندما تختلف في الرأي مع مجموعة أو مسؤول في العمل، كيف تعبر عن وجهة نظرك؟',
    questionEn: 'When you fundamentally disagree with a group or lead, how do you express your view?',
    options: [
      { id: 'opt_1', labelAr: 'أطرح رأيي بوضوح ولباقة مدعماً بالأدلة والحجج المنطقية', labelEn: 'Present perspective clearly, respectfully, backed by sound rationale', value: 5 },
      { id: 'opt_2', labelAr: 'أطلب نقاشاً فردياً خاصاً لطرح اعتراضي دون إحراج أحد', labelEn: 'Request private one-on-one discussion to share concerns diplomatically', value: 4 },
      { id: 'opt_3', labelAr: 'ألمّح باعتراضي بلطف وأرى مدى تقبل الآخرين قبل التوضيح', labelEn: 'Gently hint at reservations to gauge receptivity first', value: 3 },
      { id: 'opt_4', labelAr: 'أفضل الصمت ومسايرة القرار لتجنب الصدام أو الجدال', labelEn: 'Choose silence to avoid confrontation or interpersonal friction', value: 2 },
      { id: 'opt_5', labelAr: 'أشعر بالانزعاج وأعبر عن رفضي بأسلوب هجومي أو مقاطعة', labelEn: 'Feel agitated and express opposition defensively or sharply', value: 1 }
    ],
    importance: 1.1
  },

  // 4. Behavioral (الانضباط والتحكم)
  {
    id: 'beh_1',
    category: 'behavioral',
    dimension: 'discipline',
    dimensionAr: 'الانضباط والالتزام الذاتي',
    dimensionEn: 'Discipline & Daily Execution',
    questionAr: 'عندما تضع لنفسك هدفاً جديداً (خطة دراسية أو روتين يومي)، ما مدى استمرارك الفعلي؟',
    questionEn: 'When committing to a personal target (study program or daily routine), how consistent are you?',
    options: [
      { id: 'opt_1', labelAr: 'ألتزم بالروتين بصرامة حتى في الأيام التي ينعدم فيها الشغف أو الحماس', labelEn: 'Execute routine with strict adherence even when motivation is absent', value: 5 },
      { id: 'opt_2', labelAr: 'ألتزم في أغلب الأيام، مع بعض المرونة عند الظروف الطارئة', labelEn: 'Consistent on most days, adapting with reasonable flexibility', value: 4 },
      { id: 'opt_3', labelAr: 'أبدأ بحماس شديد، ثم يتذبذب التزامي بحسب الحالة المزاجية', labelEn: 'Start with high enthusiasm, fluctuating depending on mood cycles', value: 3 },
      { id: 'opt_4', labelAr: 'أجد صعوبة بالغة في تجاوز الأسبوع الأول وأستسلم للتسويف', labelEn: 'Struggle beyond the first week, easily slipping into procrastination', value: 2 },
      { id: 'opt_5', labelAr: 'نادراً ما أضع خططاً والتزم بها، وأفضل العيش بعفوية تامة', labelEn: 'Rarely set structured plans, living entirely on moment-to-moment impulse', value: 1 }
    ],
    importance: 1.3
  },
  {
    id: 'beh_2',
    category: 'behavioral',
    dimension: 'impulsivity',
    dimensionAr: 'التحكم في الاندفاع والقرارات',
    dimensionEn: 'Impulse Control & Long-Term Bias',
    questionAr: 'عندما تشاهد فرصة أو عرضاً مغرياً لشراء أو تجربة شيء تريده ولكن دون حاجة حقيقية، كيف تتصرف؟',
    questionEn: 'When spotting a tempting impulse purchase or spontaneous whim, how do you react?',
    options: [
      { id: 'opt_1', labelAr: 'أؤجل القرار للتفكير العقلاني وألتزم بأولوياتي المالية والزمنية', labelEn: 'Enforce a cool-off window to evaluate need against financial goals', value: 5 },
      { id: 'opt_2', labelAr: 'أراجع مواردي وأقرر بناءً على وضعي الحقيقي دون ضغط', labelEn: 'Review savings budget and decide based on real liquidity', value: 4 },
      { id: 'opt_3', labelAr: 'أتردد قليلاً، ثم قد أستسلم إذا كان الإغراء قوياً وممتعاً', labelEn: 'Hesitate briefly, occasionally buying if desire is strong', value: 3 },
      { id: 'opt_4', labelAr: 'أستجيب فوراً تحت تأثير الحماس اللحظي ثم أندم أحياناً', labelEn: 'Purchase immediately on emotional impulse, sometimes regretting later', value: 2 },
      { id: 'opt_5', labelAr: 'دائماً ما أنساق وراء الرغبات اللحظية دون حساب للعواقب', labelEn: 'Consistently indulge spontaneous whims without weighing aftermath', value: 1 }
    ],
    importance: 1.0
  },

  // 5. Motivation (الدافعية والطموح)
  {
    id: 'mot_1',
    category: 'motivation',
    dimension: 'ambition',
    dimensionAr: 'الطموح والإنجاز الأسمى',
    dimensionEn: 'Ambition & Drive for Mastery',
    questionAr: 'ما هو المحرك الأساسي الأقوى لجهودك اليومية في العمل أو التعلم؟',
    questionEn: 'What is the primary driving fuel behind your daily work or academic efforts?',
    options: [
      { id: 'opt_1', labelAr: 'الرغبة في الوصول إلى قمة مجالي، وصناعة أثر تاريخي وتفوق استثنائي', labelEn: 'Burning desire for domain mastery, historical impact, and exceptional legacy', value: 5 },
      { id: 'opt_2', labelAr: 'تأمين استقلال مالي وبناء حياة كريمة ومستقرة لي ولمن أحب', labelEn: 'Securing financial sovereignty and building a flourishing stable life', value: 4 },
      { id: 'opt_3', labelAr: 'الشغف بالمعرفة والاستمتاع بتعلم أشياء جديدة كل يوم', labelEn: 'Pure intellectual curiosity and the joy of continuous daily discovery', value: 3 },
      { id: 'opt_4', labelAr: 'الحصول على تقدير واحترام المحيطين والمجتمع', labelEn: 'Gaining validation, social esteem, and recognition from peers', value: 2 },
      { id: 'opt_5', labelAr: 'أداء الحد الأدنى المطلوب لتجنب المشاكل أو فقدان الدخل', labelEn: 'Doing the baseline minimum required to sustain income without friction', value: 1 }
    ],
    importance: 1.2
  },
  {
    id: 'mot_2',
    category: 'motivation',
    dimension: 'independence',
    dimensionAr: 'الاستقلالية والسيادة الشخصية',
    dimensionEn: 'Autonomy & Sovereign Independence',
    questionAr: 'إلى أي مدى تُثمّن حريتك الشخصية واستقلالك في رسم مسار حياتك؟',
    questionEn: 'How fiercely do you value personal autonomy in charting your own life course?',
    options: [
      { id: 'opt_1', labelAr: 'الاستقلالية هي أثمن ما أملك، ولا أسمح لأحد بفرض قيود غير مبررة على مساري', labelEn: 'Sovereignty is sacred; I will not tolerate unchosen control over my path', value: 5 },
      { id: 'opt_2', labelAr: 'أفضل أن أكون صاحب الكلمة الأولى، مع الترحيب بالمشورة الصادقة', labelEn: 'Prefer driving my destiny while warmly welcoming trusted counsel', value: 4 },
      { id: 'opt_3', labelAr: 'أوازن بين رغباتي وبين توقعات عائلتي والمجتمع', labelEn: 'Balance personal desires with familial and social harmony', value: 3 },
      { id: 'opt_4', labelAr: 'أشعر براحة أكبر عندما يحدد شخص موثوق الاتجاه وأنا أتبعه', labelEn: 'Feel safer when a trusted authority sets direction for me to follow', value: 2 },
      { id: 'opt_5', labelAr: 'أعتمد بشكل كلي على آراء الآخرين وموافقتهم قبل أي خطوة', labelEn: 'Depend entirely on external validation and consensus before acting', value: 1 }
    ],
    importance: 1.1
  },

  // 6. Lifestyle (الجسد والطاقة الحيوية)
  {
    id: 'lif_1',
    category: 'lifestyle',
    dimension: 'sleep_vitality',
    dimensionAr: 'جودة النوم والطاقة البدنية',
    dimensionEn: 'Sleep Quality & Vitality',
    questionAr: 'كيف تصف جودة نومك ومستوى صفاء ذهنك عند الاستيقاظ صباحاً؟',
    questionEn: 'How would you describe your sleep quality and physical vitality upon waking?',
    options: [
      { id: 'opt_1', labelAr: 'نوم منتظم وعميق (7-8 ساعات)، وأستيقظ بطاقة عالية وذهن متقد', labelEn: 'Consistent deep sleep (7-8 hrs), waking recharged with mental clarity', value: 5 },
      { id: 'opt_2', labelAr: 'نوم جيد في معظم الأيام، وأحتاج روتيناً صباحياً بسيطاً لبدء النشاط', labelEn: 'Good sleep on most nights, reaching peak energy after morning routine', value: 4 },
      { id: 'opt_3', labelAr: 'نومي متقلب بحسب ضغوط العمل وأوقات الشاشات والسهر', labelEn: 'Irregular sleep fluctuating with workload and late-night screen time', value: 3 },
      { id: 'opt_4', labelAr: 'أعاني من الأرق المتكرر أو الاستيقاظ المتعب والمجهد', labelEn: 'Frequent insomnia, restless sleep, or waking up fatigued', value: 2 },
      { id: 'opt_5', labelAr: 'جدول نومي فوضوي تماماً وأعاني من خمول وإرهاق مزمن', labelEn: 'Completely fragmented sleep with persistent chronic lethargy', value: 1 }
    ],
    importance: 1.1
  },
  {
    id: 'lif_2',
    category: 'lifestyle',
    dimension: 'stress_management',
    dimensionAr: 'التعامل مع الضغوط والاستشفاء',
    dimensionEn: 'Stress Metabolism & Balance',
    questionAr: 'عندما تتراكم عليك المهام والمسؤوليات الحياتية، كيف تحمي طاقتك؟',
    questionEn: 'When responsibilities compound, how does your day-to-day balance hold up?',
    options: [
      { id: 'opt_1', labelAr: 'أعيد جدولة الأولويات وأحافظ على الرياضة والغذاء الصحي كدرع وقائي', labelEn: 'Reprioritize mindfully, protecting exercise and nutrition as protective anchors', value: 5 },
      { id: 'opt_2', labelAr: 'أزيد ساعات العمل مؤقتاً لكنني أعرف متى أتوقف للاستشفاء', labelEn: 'Push temporarily through sprints while scheduling restorative recovery', value: 4 },
      { id: 'opt_3', labelAr: 'أشعر بضغط ملحوظ يؤثر على مزاجي وعلاقاتي قليلاً', labelEn: 'Experience tangible stress that mildly strains mood and relationships', value: 3 },
      { id: 'opt_4', labelAr: 'أهمل صحتي وتغذيتي تماماً وأغرق في التوتر المستمر', labelEn: 'Neglect nutrition/movement entirely, feeling submerged in chronic anxiety', value: 2 },
      { id: 'opt_5', labelAr: 'أصل لمرحلة الانهيار أو التوقف التام عن الإنجاز والهرب', labelEn: 'Hit paralyzing burnout, shutting down and avoiding responsibilities', value: 1 }
    ],
    importance: 1.2
  },

  // 7. Relationships (العلاقات والأمان العاطفي)
  {
    id: 'rel_1',
    category: 'relationships',
    dimension: 'attachment_tendencies',
    dimensionAr: 'نمط التعلق والتقارب العاطفي',
    dimensionEn: 'Attachment Style & Relational Closeness',
    questionAr: 'في علاقاتك المقربة، كيف تشعر تجاه الاعتماد المتبادل والاقتراب العاطفي العميق؟',
    questionEn: 'In close personal bonds, how do you experience emotional closeness and mutual dependency?',
    options: [
      { id: 'opt_1', labelAr: 'أشعر بالأمان التام مع التقارب العاطفي وأحافظ على مساحتي ومساحة الطرف الآخر باحترام', labelEn: 'Secure with deep intimacy while maintaining healthy mutual boundaries', value: 5 },
      { id: 'opt_2', labelAr: 'أحب القرب الشديد ولكن قد يراودني قلق خفيف من الابتعاد أحياناً', labelEn: 'Cherish close bonding, occasionally feeling minor separation apprehension', value: 4 },
      { id: 'opt_3', labelAr: 'أحتاج وقتاً طويلاً قبل أن أمنح ثقتي الكاملة وأكشف جوانبي الهشة', labelEn: 'Require prolonged time to establish vulnerability and unreserved trust', value: 3 },
      { id: 'opt_4', labelAr: 'أشعر بالاختناق عندما يقترب مني شخص جداً وأميل للانسحاب لحماية استقلالي', labelEn: 'Feel claustrophobic when intimacy deepens, instinctively pulling back', value: 2 },
      { id: 'opt_5', labelAr: 'أتقلب بين الخوف الشديد من التخلي وبين الهروب من الالتزام', labelEn: 'Oscillate between intense fear of abandonment and flight from commitment', value: 1 }
    ],
    importance: 1.3
  },
  {
    id: 'rel_2',
    category: 'relationships',
    dimension: 'conflict_resolution',
    dimensionAr: 'إدارة الخلافات والشراكات',
    dimensionEn: 'Conflict Resolution & De-escalation',
    questionAr: 'عند وقوع خلاف حاد مع شريك الحياة أو شخص تحبه، ما هو نهجك التلقائي؟',
    questionEn: 'When serious friction occurs with a loved one or partner, what is your default posture?',
    options: [
      { id: 'opt_1', labelAr: 'أركز على حل أصل المشكلة مع الاستماع لمشاعر الطرف الآخر دون لوم أو تجريح', labelEn: 'Address root friction calmly, validating feelings without blame or contempt', value: 5 },
      { id: 'opt_2', labelAr: 'أطلب مهلة قصيرة لتهدئة النفوس ثم نعود للنقاش الهادئ والتفاهم', labelEn: 'Take a brief timeout to de-escalate, returning to resolve constructively', value: 4 },
      { id: 'opt_3', labelAr: 'أدافع عن موقفي بقوة في البداية حتى يشعر الطرف الآخر بوجهة نظري', labelEn: 'Defend viewpoint vigorously until the counterpart acknowledges my perspective', value: 3 },
      { id: 'opt_4', labelAr: 'أصمت تماماً (معاملة صامتة) وأنتظر اعتذار الطرف الآخر أولاً', labelEn: 'Enforce silent withdrawal, waiting for the other party to initiate apology', value: 2 },
      { id: 'opt_5', labelAr: 'تتحول الخلافات إلى تراشق واتهامات جارحة يصعب إصلاحها سريعاً', labelEn: 'Escalates into wounding recriminations and prolonged lingering resentment', value: 1 }
    ],
    importance: 1.2
  },

  // 8. Intimacy (الحميمية والتواصل الناضج)
  {
    id: 'int_1',
    category: 'intimacy',
    dimension: 'intimacy_communication',
    dimensionAr: 'التواصل والوضوح في الاحتياجات والحدود',
    dimensionEn: 'Intimacy Comfort & Transparent Boundaries',
    questionAr: 'في سياق العلاقة الزوجية/الحميمة الناضجة، ما مدى راحتك في التعبير الصريح عن احتياجاتك وحدودك الشخصية؟',
    questionEn: 'In a mature committed partnership, how comfortable are you communicating your personal needs and boundaries transparently?',
    options: [
      { id: 'opt_1', labelAr: 'أتحدث بصدق ونضج ووضوح واحترام تام مع الشريك حول ما يسعدني وما يقلقني', labelEn: 'Communicate with candid maturity, mutual respect, and clarity on needs and boundaries', value: 5 },
      { id: 'opt_2', labelAr: 'أعبر عن رغباتي باطمئنان، وإن كنت أشعر ببعض الحرج في بعض المواضيع الخاصة', labelEn: 'Express desires comfortably, with mild natural shyness around nuanced topics', value: 4 },
      { id: 'opt_3', labelAr: 'أعتمد على التلميحات غير اللفظية ولغة الجسد بدلاً من الحديث المباشر', labelEn: 'Rely primarily on non-verbal cues and body language over direct dialogue', value: 3 },
      { id: 'opt_4', labelAr: 'أجد حرجاً شديداً وأفضل مسايرة الشريك حتى لو كان ذلك على حساب راحتي الخاصة', labelEn: 'Feel significant hesitation, deferring to partner at expense of personal comfort', value: 2 },
      { id: 'opt_5', labelAr: 'أشعر بحاجز نفسي كبير وصعوبة بالغة في فتح أي حوار حميمي', labelEn: 'Experience acute psychological barrier in discussing emotional/intimacy matters', value: 1 }
    ],
    importance: 1.2,
    isSensitive: true,
    isPremium: true
  },
  {
    id: 'int_2',
    category: 'intimacy',
    dimension: 'emotional_intimacy_connection',
    dimensionAr: 'الترابط العاطفي والتناغم الروحي',
    dimensionEn: 'Emotional Connection & Deep Affection',
    questionAr: 'ما الذي يمثل بالنسبة لك جوهر التقارب الحميمي الحقيقي في العلاقة؟',
    questionEn: 'What constitutes the true core of intimate connection in a meaningful partnership for you?',
    options: [
      { id: 'opt_1', labelAr: 'التناغم بين الاتصال الروحي العميق، والاهتمام المتبادل، والراحة الجسدية الآمنة', labelEn: 'Harmony between soul-level attunement, active tenderness, and secure physical comfort', value: 5 },
      { id: 'opt_2', labelAr: 'الشعور بالقبول التام وعدم الخوف من الرفض أو النقد', labelEn: 'Feeling unconditionally accepted and safe from rejection or judgment', value: 4 },
      { id: 'opt_3', labelAr: 'المشاركة في الأنشطة واللحظات الممتعة والمرح المشترك', labelEn: 'Sharing playful recreational moments and quality shared experiences', value: 3 },
      { id: 'opt_4', labelAr: 'تأدية الواجبات باحترام واستقرار مادي واجتماعي', labelEn: 'Fulfilling relationship duties with mutual respect and domestic stability', value: 2 },
      { id: 'opt_5', labelAr: 'أشعر بالانفصال العاطفي حتى أثناء التواجد بالقرب من الشريك', labelEn: 'Feel emotional detachment even during physical presence with partner', value: 1 }
    ],
    importance: 1.1,
    isSensitive: true,
    isPremium: true
  },

  // 9. Career & Ambition (العمل والريادة والمال)
  {
    id: 'car_1',
    category: 'career',
    dimension: 'career_leadership',
    dimensionAr: 'أسلوب القيادة وبيئة العمل المثالية',
    dimensionEn: 'Leadership Style & Optimal Work Ecosystem',
    questionAr: 'ما هي البيئة المهنية التي تطلق أفضل إمكاناتك وقدراتك الإبداعية والقيادية؟',
    questionEn: 'Which professional ecosystem unlocks your highest potential and creative caliber?',
    options: [
      { id: 'opt_1', labelAr: 'بيئة ديناميكية تمنحني حرية القيادة والاستقلالية في بناء الحلول من الصفر', labelEn: 'A dynamic ecosystem offering leadership autonomy to build systems from ground zero', value: 5 },
      { id: 'opt_2', labelAr: 'مؤسسة عريقة ذات أهداف واضحة وفرق عمل محترفة تقدر التميز والمكافأة', labelEn: 'An established high-standard organization rewarding excellence with clear trajectories', value: 4 },
      { id: 'opt_3', labelAr: 'بيئة هادئة ومستقرة تركز على التخصص الدقيق والعمل الفردي العميق', labelEn: 'A tranquil environment prioritizing deep specialized focus and low noise', value: 3 },
      { id: 'opt_4', labelAr: 'وظيفة مستقرة بروتين ثابت وساعات محددة خالية من المفاجآت والمخاطر', labelEn: 'A steady position with predictable routines, fixed hours, and zero volatility', value: 2 },
      { id: 'opt_5', labelAr: 'أشعر بعدم الرضا في معظم البيئات المهنية وأكافح لإيجاد شغفي الحقيقي', labelEn: 'Feel discontent in most workplace settings, struggling to find authentic alignment', value: 1 }
    ],
    importance: 1.2
  },
  {
    id: 'car_2',
    category: 'career',
    dimension: 'career_risk_tolerance',
    dimensionAr: 'المخاطرة المالية والريادية',
    dimensionEn: 'Professional Risk Appetite & Financial Mindset',
    questionAr: 'إذا عُرضت عليك فرصة تأسيس مشروع ريادي يحمل إمكانات ربح استثنائية ولكن مع مخاطرة محسوبة، ماذا تختار؟',
    questionEn: 'If offered a breakthrough entrepreneurial venture with immense upside but calculated startup risk, what is your choice?',
    options: [
      { id: 'opt_1', labelAr: 'أخوض التجربة بشغف بعد دراسة جدوى وافية وإدارة للمخاطر، فالفرصة لا تتكرر', labelEn: 'Embrace the venture enthusiastically after thorough due diligence; high upside requires courage', value: 5 },
      { id: 'opt_2', labelAr: 'أشارك بنسبة محسوبة لا تهدد أماني المالي الأساسي (نهج متوازن)', labelEn: 'Participate with a strictly calculated stake that protects core financial baseline', value: 4 },
      { id: 'opt_3', labelAr: 'أفضل البقاء في مساري الآمن الحالي حتى تتراكم لدي ثروة تسمح بالمخاطرة', labelEn: 'Prefer remaining in current secure path until substantial capital cushion is built', value: 3 },
      { id: 'opt_4', labelAr: 'أرفض تماماً؛ الأمان الوظيفي والراتب المضمون خط أحمر بالنسبة لي', labelEn: 'Decline outright; guaranteed paycheck and stability are non-negotiable anchors', value: 2 },
      { id: 'opt_5', labelAr: 'أخشى المخاطرة المالية لدرجة تمنعني من اتخاذ أي استثمار مستقل', labelEn: 'Paralyzed by financial risk aversion, avoiding any independent ventures', value: 1 }
    ],
    importance: 1.1
  }
];

export const QUESTIONS = QUESTIONS_POOL;

export type AssessmentMode = 'full' | 'express' | 'category';

export function getAssessmentQuestions(
  mode: AssessmentMode = 'full',
  category?: string,
  randomize: boolean = true
): Question[] {
  let selected: Question[] = [];

  if (mode === 'category' && category) {
    selected = QUESTIONS_POOL.filter((q) => q.category === category);
  } else if (mode === 'express') {
    // Take 1 question per core domain
    const categories = ['cognitive', 'emotional', 'social', 'behavioral', 'motivation', 'lifestyle', 'relationships', 'career'];
    selected = categories.map((cat) => {
      const catQuestions = QUESTIONS_POOL.filter((q) => q.category === cat);
      if (randomize) {
        return catQuestions[Math.floor(Math.random() * catQuestions.length)];
      }
      return catQuestions[0];
    }).filter(Boolean);
  } else {
    // Full Comprehensive Mode
    selected = [...QUESTIONS_POOL];
  }

  if (randomize) {
    // Shuffle questions slightly within logical clusters
    return selected.sort(() => Math.random() - 0.5);
  }

  return selected;
}

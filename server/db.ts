import fs from 'fs';
import path from 'path';
import {
  ServerUser,
  StoredAnalysisResult,
  StoredNotification,
  StoredReferral,
  StoredChatMessage,
  AuditLog
} from './types';
import { GrowthMetric, UserRole, PersonalGoal, GoalCheckIn, GrowthChallenge } from '../src/types';
import { ARCHETYPES } from '../src/data/archetypesData';

interface DatabaseSchema {
  users: Record<string, ServerUser>;
  analysisResults: Record<string, StoredAnalysisResult>;
  notifications: Record<string, StoredNotification>;
  referrals: StoredReferral[];
  growthHistory: Record<string, GrowthMetric[]>;
  chatHistory: Record<string, StoredChatMessage[]>;
  goals: Record<string, PersonalGoal[]>;
  challenges: Record<string, GrowthChallenge[]>;
  auditLogs: AuditLog[];
  settings: {
    maintenanceMode: boolean;
    freeAssessmentQuestionsCount: number;
    premiumPriceUsd: number;
    aiModel: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'persona_db.json');

// In-memory working database
let db: DatabaseSchema = {
  users: {},
  analysisResults: {},
  notifications: {},
  referrals: [],
  growthHistory: {},
  chatHistory: {},
  goals: {},
  challenges: {},
  auditLogs: [],
  settings: {
    maintenanceMode: false,
    freeAssessmentQuestionsCount: 15,
    premiumPriceUsd: 14.99,
    aiModel: 'gemini-3.7-flash',
  }
};

// Seed default demo user & test result
function initDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      db = {
        users: loaded.users || {},
        analysisResults: loaded.analysisResults || {},
        notifications: loaded.notifications || {},
        referrals: Array.isArray(loaded.referrals) ? loaded.referrals : [],
        growthHistory: loaded.growthHistory || {},
        chatHistory: loaded.chatHistory || {},
        goals: loaded.goals || {},
        challenges: loaded.challenges || {},
        auditLogs: Array.isArray(loaded.auditLogs) ? loaded.auditLogs : [],
        settings: loaded.settings || {
          maintenanceMode: false,
          freeAssessmentQuestionsCount: 15,
          premiumPriceUsd: 14.99,
          aiModel: 'gemini-2.5-flash',
        }
      };

      if (!db.users['99843319']) {
        seedDefaultData();
        saveDb();
      }
    } else {
      seedDefaultData();
      saveDb();
    }
  } catch (err) {
    console.error('[DB] Error loading persona database, using clean state:', err);
    seedDefaultData();
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error persisting database to disk:', err);
  }
}

function seedDefaultData() {
  const defaultUserId = '99843319';
  const defaultUser: ServerUser = {
    id: defaultUserId,
    telegramId: 99843319,
    firstName: 'Amr',
    lastName: 'K.',
    username: 'amr_persona',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    language: 'ar',
    role: 'admin', // Demo account with admin privileges
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
    xp: 450,
    level: 3,
    badges: ['self_aware', 'goal_hunter', 'completed_profile', 'deep_thinker'],
    referralCode: 'PERSONA-7X92',
    referralCount: 4,
    onboardingCompleted: true,
    onboardingData: {
      age: '28-35',
      gender: 'male',
      status: 'single',
      field: 'Tech & Strategy',
      lifestyle: 'active_moderate',
      goals: ['self_mastery', 'career_growth', 'emotional_balance'],
      sleepHours: '7-8',
      stressLevel: 'moderate'
    }
  };

  db.users[defaultUserId] = defaultUser;

  // Seed default lifestyle goals with AI check-in prompts tailored to the Strategic Builder archetype
  db.goals[defaultUserId] = [
    {
      id: 'goal_01',
      userId: defaultUserId,
      title: 'جلسة تركيز وتخطيط استراتيجي عميق 45 دقيقة يومياً',
      category: 'focus',
      targetFrequency: 'daily',
      targetDaysPerWeek: 6,
      progress: 85,
      streak: 5,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      lastCheckIn: new Date(Date.now() - 2 * 3600000).toISOString(),
      checkIns: [
        {
          id: 'chk_1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          note: 'أنجزت تخطيط خارطة الطريق الفصلية بدون تشتت.',
          aiFeedback: 'ممتاز يا عمرو! استمرارك يغذي محور الانضباط (94%) لديك، لكن تذكر إغلاق الشاشات بعدها لحماية طاقتك الذهنية.'
        }
      ],
      aiCheckInPrompt: {
        questionAr: 'كيف كانت جودة تركيزك اليوم مقارنة بضغط المهام المتراكمة؟',
        questionEn: 'How was the depth of your focus today amidst task pressure?',
        reasoningAr: 'بما أن نمطك يميل إلى التفكير التحليلي العالي، فإن أكبر تحدٍ هو التحول إلى الإفراط في التفكير بدلاً من التنفيذ المباشر.',
        reasoningEn: 'Given your high analytical score, the primary barrier is analysis paralysis.',
        archetypeTipAr: 'قسّم جلسة الـ 45 دقيقة إلى 3 فترات من 15 دقيقة مع هدف واحد غير قابل للتأجيل.',
        archetypeTipEn: 'Break your 45m block into 3 x 15m intervals with a single non-negotiable objective.'
      }
    },
    {
      id: 'goal_02',
      userId: defaultUserId,
      title: 'تهدئة التفكير والتأمل قبل النوم وتنظيم هرمون التوتر',
      category: 'mindset',
      targetFrequency: 'daily',
      targetDaysPerWeek: 5,
      progress: 60,
      streak: 3,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      lastCheckIn: new Date(Date.now() - 24 * 3600000).toISOString(),
      checkIns: [
        {
          id: 'chk_2',
          timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
          status: 'progressed',
          note: 'تنفس بطني 10 دقائق وشعرت ببطء نبضات القلب.',
          aiFeedback: 'خطوة ممتازة لخفض التوتر العصبي وتصفية الذهن قبل النوم.'
        }
      ],
      aiCheckInPrompt: {
        questionAr: 'هل نجحت في فصل عقلك عن تحديات الغد قبل الاستلقاء؟',
        questionEn: 'Were you able to detach your mind from tomorrow\'s challenges before sleeping?',
        reasoningAr: 'الأنماط الاستراتيجية تميل لحمل خطط الغد إلى السرير، مما يقلل من جودة النوم العميق.',
        reasoningEn: 'Strategic builders often carry tomorrow\'s blueprints to bed, impeding REM sleep.',
        archetypeTipAr: 'اكتب 3 نقاط أساسية على ورقة خارجية قبل 30 دقيقة من النوم لإنهاء معالجة الدماغ.',
        archetypeTipEn: 'Write down top 3 points on physical paper 30m prior to sleep to signal completion.'
      }
    },
    {
      id: 'goal_03',
      userId: defaultUserId,
      title: 'تواصل عاطفي وإنساني أسبوعي عميق مع دائرة الثقة',
      category: 'relationships',
      targetFrequency: 'weekly',
      targetDaysPerWeek: 2,
      progress: 70,
      streak: 2,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      lastCheckIn: new Date(Date.now() - 48 * 3600000).toISOString(),
      checkIns: [],
      aiCheckInPrompt: {
        questionAr: 'متى كانت آخر محادثة تحدثت فيها بعفوية ودون تحليل منطقي للحلول؟',
        questionEn: 'When was your last spontaneous conversation without logically analyzing solutions?',
        reasoningAr: 'توازنك العاطفي يزدهر عندما تشارك مشاعرك الحقيقية وتصغي باهتمام دون وضع خطط إصلاح فورية.',
        reasoningEn: 'Your emotional health flourishes when listening without attempting to engineer immediate fixes.',
        archetypeTipAr: 'اسأل الطرف الآخر: "هل ترغب في الاستماع والمشاركة فقط أم تريد أن نفكر في حلول؟"',
        archetypeTipEn: 'Ask: "Do you want me to just listen and be present, or help brainstorm solutions?"'
      }
    }
  ];

  // Historic 2026 assessment
  const report2026: StoredAnalysisResult = {
    id: 'rep_2026_01',
    userId: defaultUserId,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    version: '2026.1',
    overallScore: 84,
    archetypeId: 'strategic-builder',
    domainScores: {
      cognitive: 88,
      emotional: 82,
      social: 79,
      behavioral: 91,
      motivation: 87,
      lifestyle: 80,
      relationships: 83,
      intimacy: 85,
      career: 89,
    },
    dimensions: [
      { name: 'analytical_thinking', nameAr: 'التفكير التحليلي', nameEn: 'Analytical Thinking', category: 'cognitive', score: 92, benchmark: 65, descriptionAr: 'قدرة استثنائية على تفكيك المشكلات المعقدة.', descriptionEn: 'High ability to deconstruct complex challenges.' },
      { name: 'emotional_awareness', nameAr: 'الوعي العاطفي', nameEn: 'Emotional Awareness', category: 'emotional', score: 85, benchmark: 65, descriptionAr: 'إدراك متزن للمشاعر والدوافع.', descriptionEn: 'Grounded awareness of emotions and triggers.' },
      { name: 'discipline', nameAr: 'الانضباط والالتزام', nameEn: 'Discipline', category: 'behavioral', score: 94, benchmark: 65, descriptionAr: 'استمرارية عالية في تنفيذ الأهداف طويلة الأجل.', descriptionEn: 'High persistence in executing long-range goals.' },
      { name: 'social_confidence', nameAr: 'الثقة الاجتماعية', nameEn: 'Social Confidence', category: 'social', score: 78, benchmark: 65, descriptionAr: 'حضور هادئ ومؤثر في المجموعات.', descriptionEn: 'Calm and effective group presence.' },
      { name: 'ambition', nameAr: 'الطموح والإنجاز', nameEn: 'Ambition', category: 'motivation', score: 90, benchmark: 65, descriptionAr: 'رغبة مستمرة في التطور والريادة.', descriptionEn: 'Continuous drive for mastery and leadership.' }
    ],
    isUnlockedPremium: true,
    completionTimeSeconds: 240
  };

  db.analysisResults[report2026.id] = report2026;

  // Growth metrics tracking
  db.growthHistory[defaultUserId] = [
    { date: '2026-01-15', discipline: 75, emotionalAwareness: 70, confidence: 68, communication: 72, stressManagement: 65, overallScore: 70 },
    { date: '2026-04-10', discipline: 82, emotionalAwareness: 76, confidence: 74, communication: 78, stressManagement: 73, overallScore: 77 },
    { date: '2026-08-01', discipline: 91, emotionalAwareness: 85, confidence: 82, communication: 84, stressManagement: 80, overallScore: 84 }
  ];

  // Seed initial notifications
  const notif1: StoredNotification = {
    id: 'notif_01',
    userId: defaultUserId,
    title: 'تحليل شخصيتك جاهز 🧠',
    message: 'اكتمل بناء تقرير الذكاء الشخصي الشامل لنمط "البنّاء الاستراتيجي".',
    type: 'analysis_ready',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionUrl: '/reports/rep_2026_01'
  };
  const notif2: StoredNotification = {
    id: 'notif_02',
    userId: defaultUserId,
    title: 'وسام جديد مفتوح 🏆',
    message: 'حصلت على وسام "الوعي الذاتي العميق" لإتمام كافة محاور التحليل.',
    type: 'badge_unlocked',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  };
  db.notifications[notif1.id] = notif1;
  db.notifications[notif2.id] = notif2;

  // Seed referrals
  db.referrals.push(
    { id: 'ref_1', referrerId: defaultUserId, referredUserId: '1002', referredUserName: 'سارة م.', createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), rewardXp: 100, status: 'active' },
    { id: 'ref_2', referrerId: defaultUserId, referredUserId: '1003', referredUserName: 'طارق ح.', createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), rewardXp: 100, status: 'active' },
    { id: 'ref_3', referrerId: defaultUserId, referredUserId: '1004', referredUserName: 'ليلى ع.', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), rewardXp: 100, status: 'active' },
    { id: 'ref_4', referrerId: defaultUserId, referredUserId: '1005', referredUserName: 'كريم ن.', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), rewardXp: 100, status: 'active' }
  );

  // Seed audit logs
  db.auditLogs.push(
    { id: 'log_1', timestamp: new Date().toISOString(), action: 'SYSTEM_BOOT', userId: 'system', details: 'PERSONA AI Server initialized with 12 Archetypes', status: 'success' },
    { id: 'log_2', timestamp: new Date(Date.now() - 5000).toISOString(), action: 'USER_LOGIN', userId: defaultUserId, details: 'Telegram WebApp initData validated', status: 'success' }
  );
}

// Public DB Methods
export const Db = {
  init: initDb,

  getUser(userId: string): ServerUser | undefined {
    if (!userId) return undefined;
    db.users = db.users || {};
    return db.users[userId];
  },

  getOrCreateUser(telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  }): ServerUser {
    db.users = db.users || {};
    const userId = String(telegramUser.id);
    if (!db.users[userId]) {
      const code = 'PERSONA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(10 + Math.random() * 90);
      db.users[userId] = {
        id: userId,
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name || 'User',
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        language: (telegramUser.language_code?.startsWith('en') ? 'en' : 'ar'),
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        xp: 50,
        level: 1,
        badges: ['explorer'],
        referralCode: code,
        referralCount: 0,
        onboardingCompleted: false
      };
      saveDb();
    } else {
      db.users[userId].lastLogin = new Date().toISOString();
      if (telegramUser.first_name) db.users[userId].firstName = telegramUser.first_name;
      if (telegramUser.last_name) db.users[userId].lastName = telegramUser.last_name;
      if (telegramUser.username) db.users[userId].username = telegramUser.username;
      saveDb();
    }
    return db.users[userId];
  },

  updateUser(userId: string, updates: Partial<ServerUser>): ServerUser | null {
    if (!userId) return null;
    db.users = db.users || {};
    if (!db.users[userId]) return null;
    db.users[userId] = { ...db.users[userId], ...updates };
    saveDb();
    return db.users[userId];
  },

  addXp(userId: string, amount: number, badgeAward?: string): ServerUser | null {
    if (!userId) return null;
    db.users = db.users || {};
    const user = db.users[userId];
    if (!user) return null;
    user.xp = (user.xp || 0) + amount;
    user.level = Math.floor(user.xp / 150) + 1;
    user.badges = user.badges || [];
    if (badgeAward && !user.badges.includes(badgeAward)) {
      user.badges.push(badgeAward);
      this.addNotification(userId, {
        title: 'وسام جديد مفتوح 🎖️',
        message: `تهانينا! لقد حصلت على وسام جديد: ${badgeAward}`,
        type: 'badge_unlocked'
      });
    }
    saveDb();
    return user;
  },

  saveAnalysisResult(result: StoredAnalysisResult): StoredAnalysisResult {
    db.analysisResults = db.analysisResults || {};
    db.growthHistory = db.growthHistory || {};
    db.analysisResults[result.id] = result;

    // Track user growth timeline
    if (!db.growthHistory[result.userId]) {
      db.growthHistory[result.userId] = [];
    }
    db.growthHistory[result.userId].push({
      date: new Date().toISOString().split('T')[0],
      discipline: result.domainScores.behavioral,
      emotionalAwareness: result.domainScores.emotional,
      confidence: result.domainScores.social,
      communication: result.domainScores.social,
      stressManagement: result.domainScores.lifestyle,
      overallScore: result.overallScore
    });

    // Reward XP
    this.addXp(result.userId, 150, 'completed_profile');

    // Add notification
    this.addNotification(result.userId, {
      title: 'تحليل شخصيتك الجديد مكتمل 🧠',
      message: `تم تحليل إجاباتك بنجاح. نمطك هو: ${ARCHETYPES[result.archetypeId]?.nameAr || result.archetypeId}`,
      type: 'analysis_ready',
      actionUrl: `/reports/${result.id}`
    });

    saveDb();
    return result;
  },

  getAnalysisResult(reportId: string): StoredAnalysisResult | undefined {
    db.analysisResults = db.analysisResults || {};
    return db.analysisResults[reportId];
  },

  getUserAnalysisHistory(userId: string): StoredAnalysisResult[] {
    if (!userId) return [];
    db.analysisResults = db.analysisResults || {};
    return Object.values(db.analysisResults)
      .filter((r) => r && r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getGrowthHistory(userId: string): GrowthMetric[] {
    if (!userId) return [];
    db.growthHistory = db.growthHistory || {};
    return db.growthHistory[userId] || [];
  },

  addNotification(userId: string, notif: Omit<StoredNotification, 'id' | 'userId' | 'createdAt' | 'read'>): StoredNotification {
    db.notifications = db.notifications || {};
    const id = 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newNotif: StoredNotification = {
      id,
      userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: notif.actionUrl
    };
    db.notifications[id] = newNotif;
    saveDb();
    return newNotif;
  },

  getUserNotifications(userId: string): StoredNotification[] {
    if (!userId) return [];
    db.notifications = db.notifications || {};
    return Object.values(db.notifications)
      .filter((n) => n && n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead(notifId: string): boolean {
    db.notifications = db.notifications || {};
    if (db.notifications[notifId]) {
      db.notifications[notifId].read = true;
      saveDb();
      return true;
    }
    return false;
  },

  applyReferral(referrerCode: string, newUserId: string, newUserName: string): boolean {
    db.users = db.users || {};
    db.referrals = db.referrals || [];
    const referrer = Object.values(db.users).find((u) => u && u.referralCode === referrerCode);
    if (!referrer || referrer.id === newUserId) return false;

    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.xp = (referrer.xp || 0) + 100;
    this.addXp(referrer.id, 100, 'influencer');

    db.referrals.push({
      id: 'ref_' + Date.now(),
      referrerId: referrer.id,
      referredUserId: newUserId,
      referredUserName: newUserName,
      createdAt: new Date().toISOString(),
      rewardXp: 100,
      status: 'active'
    });

    this.addNotification(referrer.id, {
      title: 'صديق جديد انضم عبر كودك 🎉',
      message: `انضم ${newUserName} إلى PERSONA وحصلت على +100 نقطة خبرة XP!`,
      type: 'recommendation'
    });

    saveDb();
    return true;
  },

  getReferrals(userId: string): StoredReferral[] {
    if (!userId) return [];
    db.referrals = db.referrals || [];
    return db.referrals.filter((r) => r && r.referrerId === userId);
  },

  logAudit(action: string, userId: string, details: string, status: 'success' | 'warning' | 'error' = 'success') {
    db.auditLogs = db.auditLogs || [];
    db.auditLogs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
      status
    });
    if (db.auditLogs.length > 200) db.auditLogs.pop();
    saveDb();
  },

  registerUser(payload: {
    email?: string;
    password?: string;
    firstName: string;
    lastName?: string;
    username?: string;
    language?: 'ar' | 'en';
  }): ServerUser {
    db.users = db.users || {};
    const cleanEmail = payload.email?.toLowerCase().trim();
    if (cleanEmail) {
      const existing = Object.values(db.users).find((u) => u && u.email?.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error('البريد الإلكتروني مسجل مسبقاً (Email already registered)');
      }
    }

    const generatedId = String(Date.now() + Math.floor(Math.random() * 10000));
    const generatedTgId = Math.floor(10000000 + Math.random() * 90000000);
    const code = 'PERSONA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(10 + Math.random() * 90);

    const newUser: ServerUser = {
      id: generatedId,
      telegramId: generatedTgId,
      email: cleanEmail,
      passwordHash: payload.password ? Buffer.from(payload.password).toString('base64') : undefined,
      accountCode: code,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName?.trim(),
      username: payload.username?.replace('@', '').trim() || `user_${generatedId.slice(-4)}`,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      language: payload.language || 'ar',
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      xp: 100,
      level: 1,
      badges: ['explorer'],
      referralCode: code,
      referralCount: 0,
      onboardingCompleted: false
    };

    db.users[generatedId] = newUser;
    this.logAudit('USER_REGISTER', generatedId, `New user registered via email: ${cleanEmail || 'Guest'}`);
    saveDb();
    return newUser;
  },

  loginUser(identifier: string, password?: string): ServerUser | null {
    if (!identifier) return null;
    db.users = db.users || {};
    const clean = identifier.toLowerCase().trim();
    const user = Object.values(db.users).find(
      (u) =>
        u &&
        (u.email?.toLowerCase() === clean ||
          u.username?.toLowerCase() === clean ||
          u.id === clean ||
          String(u.telegramId) === clean ||
          u.referralCode?.toLowerCase() === clean)
    );

    if (!user) return null;

    if (password && user.passwordHash) {
      const hashed = Buffer.from(password).toString('base64');
      if (user.passwordHash !== hashed) {
        return null;
      }
    }

    user.lastLogin = new Date().toISOString();
    this.logAudit('USER_LOGIN', user.id, `User logged in: ${user.firstName} (@${user.username})`);
    saveDb();
    return user;
  },

  saveChatMessage(msg: StoredChatMessage): void {
    if (!msg || !msg.userId) return;
    db.chatHistory = db.chatHistory || {};
    if (!db.chatHistory[msg.userId]) {
      db.chatHistory[msg.userId] = [];
    }
    db.chatHistory[msg.userId].push(msg);
    if (db.chatHistory[msg.userId].length > 100) {
      db.chatHistory[msg.userId].shift();
    }
    saveDb();
  },

  getChatHistory(userId: string): StoredChatMessage[] {
    if (!userId) return [];
    db.chatHistory = db.chatHistory || {};
    return db.chatHistory[userId] || [];
  },

  getUserGoals(userId: string): PersonalGoal[] {
    if (!userId) return [];
    db.goals = db.goals || {};
    return db.goals[userId] || [];
  },

  saveGoal(goal: PersonalGoal): PersonalGoal {
    db.goals = db.goals || {};
    if (!db.goals[goal.userId]) {
      db.goals[goal.userId] = [];
    }
    const existingIndex = db.goals[goal.userId].findIndex((g) => g.id === goal.id);
    if (existingIndex >= 0) {
      db.goals[goal.userId][existingIndex] = goal;
    } else {
      db.goals[goal.userId].unshift(goal);
    }
    this.addXp(goal.userId, 40, 'goal_hunter');
    saveDb();
    return goal;
  },

  updateGoal(userId: string, goalId: string, updates: Partial<PersonalGoal>): PersonalGoal | null {
    if (!userId || !goalId) return null;
    db.goals = db.goals || {};
    const userGoals = db.goals[userId] || [];
    const goal = userGoals.find((g) => g.id === goalId);
    if (!goal) return null;
    Object.assign(goal, updates);
    saveDb();
    return goal;
  },

  deleteGoal(userId: string, goalId: string): boolean {
    if (!userId || !goalId) return false;
    db.goals = db.goals || {};
    if (!db.goals[userId]) return false;
    const initialLen = db.goals[userId].length;
    db.goals[userId] = db.goals[userId].filter((g) => g.id !== goalId);
    saveDb();
    return db.goals[userId].length < initialLen;
  },

  recordGoalCheckIn(
    userId: string,
    goalId: string,
    checkIn: Omit<GoalCheckIn, 'id' | 'timestamp'>
  ): { goal: PersonalGoal; checkIn: GoalCheckIn } | null {
    if (!userId || !goalId) return null;
    db.goals = db.goals || {};
    const userGoals = db.goals[userId] || [];
    const goal = userGoals.find((g) => g.id === goalId);
    if (!goal) return null;

    const newCheckIn: GoalCheckIn = {
      id: 'chk_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      note: checkIn.note,
      status: checkIn.status,
      aiFeedback: checkIn.aiFeedback
    };

    goal.checkIns = goal.checkIns || [];
    goal.checkIns.unshift(newCheckIn);
    goal.lastCheckIn = newCheckIn.timestamp;

    if (checkIn.status === 'completed') {
      goal.streak = (goal.streak || 0) + 1;
      goal.progress = Math.min(100, (goal.progress || 0) + 15);
      this.addXp(userId, 30);
    } else if (checkIn.status === 'progressed') {
      goal.progress = Math.min(100, (goal.progress || 0) + 8);
      this.addXp(userId, 15);
    }

    saveDb();
    return { goal, checkIn: newCheckIn };
  },

  // -------------------------------------------------------------
  // Growth Challenges Methods
  // -------------------------------------------------------------
  getUserChallenges(userId: string): GrowthChallenge[] {
    if (!userId) return [];
    db.challenges = db.challenges || {};
    return db.challenges[userId] || [];
  },

  getActiveChallenge(userId: string): GrowthChallenge | null {
    if (!userId) return null;
    db.challenges = db.challenges || {};
    const userChallenges = db.challenges[userId] || [];
    const now = new Date().getTime();

    // Check for an active non-expired challenge
    for (const c of userChallenges) {
      if (c.status === 'active') {
        const expTime = new Date(c.expiresAt).getTime();
        if (now > expTime) {
          c.status = 'expired';
          saveDb();
        } else {
          return c;
        }
      }
    }
    return null;
  },

  saveChallenge(userId: string, challenge: GrowthChallenge): GrowthChallenge {
    if (!userId) return challenge;
    db.challenges = db.challenges || {};
    if (!db.challenges[userId]) {
      db.challenges[userId] = [];
    }

    // Archive or update existing active challenge if replacing
    db.challenges[userId] = db.challenges[userId].map((c) => {
      if (c.id === challenge.id) return challenge;
      if (c.status === 'active') return { ...c, status: 'expired' as const };
      return c;
    });

    if (!db.challenges[userId].some((c) => c.id === challenge.id)) {
      db.challenges[userId].unshift(challenge);
    }

    saveDb();
    return challenge;
  },

  completeChallenge(
    userId: string,
    challengeId: string,
    reflectionNote?: string,
    aiEvaluation?: string
  ): { challenge: GrowthChallenge; xpEarned: number } | null {
    if (!userId || !challengeId) return null;
    db.challenges = db.challenges || {};
    const userChallenges = db.challenges[userId] || [];
    const challenge = userChallenges.find((c) => c.id === challengeId);
    if (!challenge) return null;

    challenge.status = 'completed';
    challenge.completedAt = new Date().toISOString();
    challenge.reflectionNote = reflectionNote || '';
    challenge.aiEvaluation = aiEvaluation || '';

    const xpEarned = challenge.xpReward || 60;
    this.addXp(userId, xpEarned);

    saveDb();
    return { challenge, xpEarned };
  },

  getAdminStats(): Record<string, any> {
    const userList = Object.values(db.users);
    const reports = Object.values(db.analysisResults);
    const premiumCount = userList.filter((u) => u.role === 'premium' || u.role === 'admin' || u.role === 'super_admin').length;

    const archetypeCounts: Record<string, number> = {};
    let totalScore = 0;
    for (const r of reports) {
      archetypeCounts[r.archetypeId] = (archetypeCounts[r.archetypeId] || 0) + 1;
      totalScore += r.overallScore;
    }

    const topArchetypes = Object.entries(archetypeCounts)
      .map(([id, count]) => ({
        id,
        name: ARCHETYPES[id]?.nameAr || id,
        nameEn: ARCHETYPES[id]?.nameEn || id,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUsers: userList.length,
      activeUsers24h: Math.max(1, userList.filter((u) => Date.now() - new Date(u.lastLogin).getTime() < 86400000).length),
      newUsers7d: userList.length,
      completedAnalyses: reports.length,
      premiumUsers: premiumCount,
      revenueEst: premiumCount * 14.99,
      aiRequestsCount: reports.length * 3 + 12,
      averageScore: reports.length ? Math.round(totalScore / reports.length) : 82,
      topArchetypes,
      recentLogs: db.auditLogs.slice(0, 15),
      users: userList.slice(0, 50)
    };
  }
};

// Initialize DB immediately on load
Db.init();

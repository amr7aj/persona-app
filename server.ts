import 'dotenv/config';
import { randomUUID } from 'crypto';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Db } from './server/db';
import { calculateAssessmentScores } from './server/scoring';
import {
  generatePersonalityReport,
  getFallbackAIReport,
  chatWithPersonalityBot,
  generateGoalAICheckInPrompt,
  generateGoalCheckInFeedback,
  generate24HourGrowthChallenge,
  evaluateGrowthChallengeCompletion
} from './server/gemini';
import { handleBotCommand } from './server/telegramBot';
import { QUESTIONS, getAssessmentQuestions, AssessmentMode } from './src/data/questionsData';
import { ARCHETYPES } from './src/data/archetypesData';
import { StoredAnalysisResult } from './server/types';
import { PersonalGoal } from './src/types';
import { getAuthenticatedUser } from './server/supabase';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  const configuredOrigins = [
    process.env.APP_URL,
    process.env.CORS_ORIGIN,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ]
    .filter(Boolean)
    .map((origin) => String(origin).replace(/\/$/, ''));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && configuredOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      if (origin && !configuredOrigins.includes(origin)) {
        return res.sendStatus(403);
      }
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Helper response wrapper
  const sendSuccess = (res: express.Response, data: any, message?: string) => {
    return res.json({ success: true, data, message: message || 'Success', status: 200 });
  };

  const sendError = (res: express.Response, message: string, status = 400, details?: any) => {
    return res.status(status).json({ success: false, error: message, message, details, status });
  };

  // ==========================================
  // 1. HEALTH & METADATA
  // ==========================================
  app.get('/api/health', async (req, res) => {
    sendSuccess(res, {
      status: 'online',
      service: 'PERSONA AI Intelligence Platform',
      version: '2026.1.0',
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & TELEGRAM / EMAIL / PASSWORD
  // ==========================================
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, username, language } = req.body;
      if (!firstName || !String(firstName).trim()) return sendError(res, 'الاسم الأول مطلوب (First name is required)', 400);
      const result = await Db.registerUser({ email, password, firstName, lastName, username, language: language || 'ar' });
      const login = await Db.loginUser(email, password);
      if (!login) return sendError(res, 'Account created but session could not be created', 500);
      return sendSuccess(res, { user: result, token: login.accessToken, refreshToken: login.refreshToken }, 'Account created successfully');
    } catch (err: any) {
      console.error('[API Register Error]:', err);
      return sendError(res, err.message || 'Registration failed', 400);
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !String(identifier).trim() || !password) return sendError(res, 'يرجى إدخال البريد/اسم المستخدم وكلمة المرور', 400);
      const result = await Db.loginUser(identifier, password);
      if (!result) return sendError(res, 'بيانات الدخول غير صحيحة، أو الحساب غير مسجل', 401);
      return sendSuccess(res, { user: result.user, token: result.accessToken, refreshToken: result.refreshToken }, 'Logged in successfully');
    } catch (err: any) {
      console.error('[API Login Error]:', err);
      return sendError(res, 'Login failed', 500);
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return sendError(res, 'Refresh token is required', 400);
      const { getSupabaseAuth } = await import('./server/supabase');
      const { data, error } = await getSupabaseAuth().auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session || !data.user) return sendError(res, 'Session expired', 401);
      const user = await Db.getUser(data.user.id);
      if (!user) return sendError(res, 'User not found', 404);
      return sendSuccess(res, { user, token: data.session.access_token, refreshToken: data.session.refresh_token }, 'Session refreshed');
    } catch (err: any) {
      return sendError(res, 'Failed to refresh session', 401, err.message);
    }
  });

  app.get('/api/auth/demo-accounts', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const stats = await Db.getAdminStats();
    const accounts = stats.users.map((u: any) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName || ''}`.trim(),
      username: u.username,
      email: u.email,
      role: u.role,
      level: u.level,
      photoUrl: u.photoUrl
    }));
    return sendSuccess(res, accounts);
  });

  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { initData } = req.body;
      if (!initData) return sendError(res, 'Telegram initData is required', 400);
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return sendError(res, 'Telegram authentication is not configured on the server', 503);
      const crypto = await import('crypto');
      const params = new URLSearchParams(initData);
      const receivedHash = params.get('hash');
      if (!receivedHash) return sendError(res, 'Invalid Telegram initData', 401);
      params.delete('hash');
      const dataCheckString = [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      const receivedHashBuffer = Buffer.from(receivedHash, 'hex');
      const expectedHashBuffer = Buffer.from(expectedHash, 'hex');
      if (
        receivedHashBuffer.length !== expectedHashBuffer.length ||
        !crypto.timingSafeEqual(receivedHashBuffer, expectedHashBuffer)
      ) {
        return sendError(res, 'Invalid Telegram signature', 401);
      }
      const authDate = Number(params.get('auth_date') || 0);
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (
        !Number.isFinite(authDate) ||
        authDate <= 0 ||
        authDate > nowSeconds + 60 ||
        nowSeconds - authDate > 86400
      ) {
        return sendError(res, 'Telegram initData expired', 401);
      }
      const rawUser = params.get('user');
      if (!rawUser) return sendError(res, 'Telegram user data missing', 401);
      const telegramUser = JSON.parse(rawUser);
      const session = await Db.getOrCreateUser(telegramUser);
      await Db.logAudit('USER_AUTH', session.user.id, `Authenticated via verified Telegram WebApp (${session.user.username || session.user.id})`);
      return sendSuccess(res, { user: session.user, token: session.accessToken, refreshToken: session.refreshToken, telegramUserId: telegramUser.id });
    } catch (err: any) {
      console.error('[API Telegram Auth] Error:', err);
      return sendError(res, 'Authentication failed', 500, err.message);
    }
  });

  // All API data endpoints require a real Supabase JWT. Health, auth and public questions remain open.
  app.use('/api', async (req, res, next) => {
    if (
      req.path === '/health' ||
      req.path === '/auth/register' ||
      req.path === '/auth/login' ||
      req.path === '/auth/refresh' ||
      req.path === '/auth/telegram' ||
      req.path === '/questions' ||
      req.path === '/telegram/webhook'
    ) {
      return next();
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const authUser = await getAuthenticatedUser(token);
    if (!authUser) return sendError(res, 'Unauthorized', 401);

    (req as any).authUserId = authUser.id;

    const body = (req.body || {}) as any;
    const params = req.params as Record<string, string>;

    let requestedUserId =
      body.userId ||
      body.newUserId ||
      body.targetUserId ||
      params.userId ||
      params.targetUserId;

    const ownUserPathPrefixes = [
      '/user/profile/',
      '/user/growth/',
      '/reports/user/',
      '/referrals/',
      '/notifications/',
      '/goals/',
      '/challenges/active/',
      '/challenges/history/',
      '/bot/history/',
    ];

    const ownPathPrefix = ownUserPathPrefixes.find((prefix) =>
      req.path.startsWith(prefix)
    );

    if (ownPathPrefix && !requestedUserId) {
      const suffix = req.path.slice(ownPathPrefix.length).split('/')[0];
      if (suffix) requestedUserId = suffix;
    }

    if (requestedUserId && requestedUserId !== authUser.id) {
      const actor = await Db.getUser(authUser.id);
      const isAdmin =
        actor && (actor.role === 'admin' || actor.role === 'super_admin');
      if (!isAdmin) return sendError(res, 'Forbidden', 403);
    }

    return next();
  });

  const requireAdmin = async (req: express.Request, res: express.Response) => {
    const authUserId = (req as any).authUserId as string | undefined;
    if (!authUserId) {
      sendError(res, 'Unauthorized', 401);
      return false;
    }

    const actor = await Db.getUser(authUserId);
    if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
      sendError(res, 'Forbidden', 403);
      return false;
    }

    return true;
  };

  // ==========================================
  // 3. USER PROFILE & ONBOARDING
  // ==========================================
  app.get('/api/user/profile/:userId', async (req, res) => {
    const user = await Db.getUser(req.params.userId);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  });

  app.post('/api/user/update', async (req, res) => {
    const { userId, updates } = req.body;
    if (!userId) return sendError(res, 'Missing userId', 400);

    const updated = await Db.updateUser(userId, updates);
    if (!updated) return sendError(res, 'User not found', 404);
    return sendSuccess(res, updated, 'Profile updated successfully');
  });

  app.post('/api/user/onboarding', async (req, res) => {
    const { userId, onboardingData } = req.body;
    if (!userId) return sendError(res, 'Missing userId', 400);

    const updated = await Db.updateUser(userId, {
      onboardingCompleted: true,
      onboardingData
    });
    await Db.addXp(userId, 50, 'onboarded');
    return sendSuccess(res, updated, 'Onboarding saved');
  });

  // ==========================================
  // 4. QUESTIONS & DYNAMIC ASSESSMENT ENGINE
  // ==========================================
  app.get('/api/questions', async (req, res) => {
    const { mode, category, randomize } = req.query;
    const shouldRandomize = randomize !== 'false';
    const questions = getAssessmentQuestions(
      (mode as AssessmentMode) || 'full',
      category as string | undefined,
      shouldRandomize
    );

    return sendSuccess(res, {
      total: questions.length,
      mode: mode || 'full',
      categories: ['cognitive', 'emotional', 'social', 'behavioral', 'motivation', 'lifestyle', 'relationships', 'intimacy', 'career'],
      questions
    });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { userId, answers, completionTimeSeconds, version } = req.body;
      if (!userId || !answers || !Array.isArray(answers)) {
        return sendError(res, 'Invalid submission payload. userId and answers array required.', 400);
      }

      const user = await Db.getUser(userId);
      const userName = user ? `${user.firstName}` : 'Explorer';

      // Step 1: Algorithmic multidimensional vector calculation
      const calculated = calculateAssessmentScores(answers);

      // Step 2: Invoke Gemini AI Personality Intelligence Layer
      const aiReport = await generatePersonalityReport(userName, calculated, user?.onboardingData);

      // Step 3: Package complete report record
      const reportId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const resultRecord: StoredAnalysisResult = {
        id: reportId,
        userId,
        createdAt: new Date().toISOString(),
        version: version || '2026.1',
        overallScore: calculated.overallScore,
        archetypeId: calculated.archetypeId,
        domainScores: calculated.domainScores,
        dimensions: calculated.dimensions,
        aiReport,
        isUnlockedPremium: user?.role === 'premium' || user?.role === 'admin' || user?.role === 'super_admin',
        completionTimeSeconds: completionTimeSeconds || 180
      };

      // Step 4: Persist in database
      const saved = await Db.saveAnalysisResult(resultRecord);
      await Db.logAudit('ASSESSMENT_COMPLETED', userId, `Completed assessment. Archetype: ${calculated.archetypeId} (Score: ${calculated.overallScore})`);

      return sendSuccess(res, {
        report: {
          ...saved,
          archetype: ARCHETYPES[saved.archetypeId]
        }
      }, 'Analysis successfully completed');
    } catch (err: any) {
      console.error('[API Analyze] Error:', err);
      return sendError(res, 'Failed to complete analysis', 500, err.message);
    }
  });

  // ==========================================
  // 5. REPORTS & HISTORY
  // ==========================================
  app.get('/api/reports/:id', async (req, res) => {
    const result = await Db.getAnalysisResult(req.params.id);
    if (!result) return sendError(res, 'Report not found', 404);

    const authUserId = (req as any).authUserId as string | undefined;
    if (!authUserId) return sendError(res, 'Unauthorized', 401);

    if (result.userId !== authUserId) {
      const actor = await Db.getUser(authUserId);
      const isAdmin =
        actor && (actor.role === 'admin' || actor.role === 'super_admin');

      if (!isAdmin) return sendError(res, 'Forbidden', 403);
    }

    return sendSuccess(res, {
      ...result,
      archetype: ARCHETYPES[result.archetypeId]
    });
  });

  app.get('/api/reports/user/:userId', async (req, res) => {
    const list = await Db.getUserAnalysisHistory(req.params.userId);
    const enriched = list.map((item) => ({
      ...item,
      archetype: ARCHETYPES[item.archetypeId]
    }));
    return sendSuccess(res, enriched);
  });

  app.get('/api/user/growth/:userId', async (req, res) => {
    const growth = await Db.getGrowthHistory(req.params.userId);
    return sendSuccess(res, growth);
  });

  // ==========================================
  // 6. SUBSCRIPTIONS & PREMIUM
  // ==========================================
  app.post('/api/subscription/upgrade', async (req, res) => {
    const { userId, tier } = req.body;
    if (!userId) return sendError(res, 'Missing userId', 400);

    const user = await Db.getUser(userId);
    if (!user) return sendError(res, 'User not found', 404);

    const updated = await Db.updateUser(userId, { role: 'premium' });
    await Db.addXp(userId, 200, 'premium_member');
    await Db.addNotification(userId, {
      title: 'تم تفعيل العضوية المميزة PERSONA Premium 💎',
      message: 'تم فتح جميع التحليلات العميقة، بما فيها تقارير العلاقات والحميمية والتوصيات المتقدمة.',
      type: 'badge_unlocked'
    });
    await Db.logAudit('PREMIUM_UPGRADE', userId, `Upgraded to tier: ${tier || 'premium'}`);

    return sendSuccess(res, updated, 'Upgraded to Premium successfully');
  });

  // ==========================================
  // 7. REFERRALS & GAMIFICATION
  // ==========================================
  app.get('/api/referrals/:userId', async (req, res) => {
    const user = await Db.getUser(req.params.userId);
    if (!user) return sendError(res, 'User not found', 404);
    const records = await Db.getReferrals(req.params.userId);
    return sendSuccess(res, {
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      totalXpEarned: (user.referralCount || 0) * 100,
      records
    });
  });

  app.post('/api/referrals/apply', async (req, res) => {
    const { referralCode, newUserId, newUserName } = req.body;
    if (!referralCode || !newUserId) return sendError(res, 'Missing referralCode or newUserId', 400);

    const success = await Db.applyReferral(referralCode, newUserId, newUserName || 'Friend');
    if (!success) {
      return sendError(res, 'Invalid referral code or self-referral attempt', 400);
    }
    return sendSuccess(res, { message: 'Referral applied successfully! Bonus XP awarded.' });
  });

  // ==========================================
  // 8. NOTIFICATIONS & GOALS TRACKER
  // ==========================================
  app.get('/api/notifications/:userId', async (req, res) => {
    const list = await Db.getUserNotifications(req.params.userId);
    return sendSuccess(res, list);
  });

  app.post('/api/notifications/read', async (req, res) => {
    const { notifId } = req.body;
    await Db.markNotificationRead(notifId, (req as any).authUserId);
    return sendSuccess(res, { read: true });
  });

  // Goals API
  app.get('/api/goals/:userId', async (req, res) => {
    const goals = await Db.getUserGoals(req.params.userId);
    return sendSuccess(res, goals);
  });

  app.post('/api/goals', async (req, res) => {
    try {
      const { userId, title, category, targetFrequency, targetDaysPerWeek } = req.body;
      if (!userId || !title || !title.trim()) {
        return sendError(res, 'userId and title are required', 400);
      }

      const user = await Db.getUser(userId);
      const reports = await Db.getUserAnalysisHistory(userId);
      const latest = reports[0];

      const userContext = {
        name: user ? user.firstName : 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder',
        overallScore: latest?.overallScore || 85,
        domainScores: latest?.domainScores
      };

      // Generate customized psychological check-in prompt from Gemini AI
      const aiPrompt = await generateGoalAICheckInPrompt(title.trim(), category || 'habits', userContext);

      const goalId = randomUUID();      const newGoal: PersonalGoal = {
        id: goalId,
        userId,
        title: title.trim(),
        category: category || 'habits',
        targetFrequency: targetFrequency || 'daily',
        targetDaysPerWeek: targetDaysPerWeek || 5,
        progress: 0,
        streak: 0,
        createdAt: new Date().toISOString(),
        checkIns: [],
        aiCheckInPrompt: aiPrompt
      };

      const saved = await Db.saveGoal(newGoal);
      await Db.logAudit('GOAL_CREATED', userId, `Created goal: "${newGoal.title}" (${newGoal.category})`);

      return sendSuccess(res, saved, 'Goal created successfully');
    } catch (err: any) {
      console.error('[API Goals Error]:', err);
      return sendError(res, 'Failed to create goal', 500, err.message);
    }
  });

  app.post('/api/goals/checkin', async (req, res) => {
    try {
      const { userId, goalId, status, note } = req.body;
      if (!userId || !goalId || !status) {
        return sendError(res, 'userId, goalId, and status are required', 400);
      }

      const user = await Db.getUser(userId);
      const reports = await Db.getUserAnalysisHistory(userId);
      const latest = reports[0];
      const userGoals = await Db.getUserGoals(userId);
      const targetGoal = userGoals.find((g) => g.id === goalId);

      const userContext = {
        name: user ? user.firstName : 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder'
      };

      // Generate instant AI coaching reflection
      const aiFeedback = await generateGoalCheckInFeedback(
        targetGoal ? targetGoal.title : 'Goal',
        status,
        note || '',
        userContext
      );

      const result = await Db.recordGoalCheckIn(userId, goalId, {
        status,
        note,
        aiFeedback
      });

      if (!result) {
        return sendError(res, 'Goal not found', 404);
      }

      await Db.logAudit('GOAL_CHECKIN', userId, `Checked in on goal: "${result.goal.title}" (${status})`);
      return sendSuccess(res, result, 'Check-in recorded successfully');
    } catch (err: any) {
      console.error('[API Goal Check-in Error]:', err);
      return sendError(res, 'Failed to record check-in', 500, err.message);
    }
  });

  app.delete('/api/goals/:userId/:goalId', async (req, res) => {
    const { userId, goalId } = req.params;
    const deleted = await Db.deleteGoal(userId, goalId);
    if (!deleted) return sendError(res, 'Goal not found', 404);
    await Db.logAudit('GOAL_DELETED', userId, `Deleted goal ID: ${goalId}`);
    return sendSuccess(res, { deleted: true }, 'Goal deleted successfully');
  });

  app.post('/api/goals/refresh-ai-prompt', async (req, res) => {
    try {
      const { userId, goalId } = req.body;
      const userGoals = await Db.getUserGoals(userId);
      const goal = userGoals.find((g) => g.id === goalId);
      if (!goal) return sendError(res, 'Goal not found', 404);

      const user = await Db.getUser(userId);
      const reports = await Db.getUserAnalysisHistory(userId);
      const latest = reports[0];

      const userContext = {
        name: user ? user.firstName : 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder',
        overallScore: latest?.overallScore || 85,
        domainScores: latest?.domainScores
      };

      const newPrompt = await generateGoalAICheckInPrompt(goal.title, goal.category, userContext);
      const updated = await Db.updateGoal(userId, goalId, { aiCheckInPrompt: newPrompt });

      return sendSuccess(res, updated, 'Prompt refreshed successfully');
    } catch (err: any) {
      console.error('[API Refresh Prompt Error]:', err);
      return sendError(res, 'Failed to refresh AI prompt', 500, err.message);
    }
  });

  // ==========================================
  // 9. 24-HOUR GROWTH CHALLENGES API
  // ==========================================
  app.get('/api/challenges/active/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await Db.getUser(userId);
      if (!user) return sendError(res, 'User not found', 404);

      // Check if user already has an active challenge
      let active = await Db.getActiveChallenge(userId);
      if (active) {
        return sendSuccess(res, active);
      }

      // If no active challenge, find weakest dimension from user's latest report
      const history = await Db.getUserAnalysisHistory(userId);
      const latest = history[0];

      let weakest = {
        name: 'stress_management',
        nameAr: 'إدارة التوتر والضغوط',
        nameEn: 'Stress Resilience',
        score: 45
      };

      if (latest && latest.dimensions && latest.dimensions.length > 0) {
        // Find dimension with lowest score
        const sorted = [...latest.dimensions].sort((a, b) => a.score - b.score);
        const lowest = sorted[0];
        weakest = {
          name: lowest.name,
          nameAr: lowest.nameAr || lowest.name,
          nameEn: lowest.nameEn || lowest.name,
          score: lowest.score
        };
      }

      // Generate 24-hour micro challenge
      const userContext = {
        id: user.id,
        name: user.firstName || 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder'
      };

      const newChallenge = await generate24HourGrowthChallenge(userContext, weakest);
      await Db.saveChallenge(userId, newChallenge);

      return sendSuccess(res, newChallenge);
    } catch (err: any) {
      console.error('[API Active Challenge Error]:', err);
      return sendError(res, 'Failed to fetch active challenge', 500, err.message);
    }
  });

  app.post('/api/challenges/reroll', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return sendError(res, 'User ID is required', 400);

      const user = await Db.getUser(userId);
      if (!user) return sendError(res, 'User not found', 404);

      const history = await Db.getUserAnalysisHistory(userId);
      const latest = history[0];

      let weakest = {
        name: 'social_assertiveness',
        nameAr: 'الحزم والتواصل الشجاع',
        nameEn: 'Social Assertiveness',
        score: 42
      };

      if (latest && latest.dimensions && latest.dimensions.length > 0) {
        // Pick one of the bottom 2 lowest dimensions
        const sorted = [...latest.dimensions].sort((a, b) => a.score - b.score);
        const pickIdx = sorted.length > 1 ? (Math.random() > 0.5 ? 1 : 0) : 0;
        const lowest = sorted[pickIdx];
        weakest = {
          name: lowest.name,
          nameAr: lowest.nameAr || lowest.name,
          nameEn: lowest.nameEn || lowest.name,
          score: lowest.score
        };
      }

      const userContext = {
        id: user.id,
        name: user.firstName || 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder'
      };

      const newChallenge = await generate24HourGrowthChallenge(userContext, weakest);
      await Db.saveChallenge(userId, newChallenge);

      return sendSuccess(res, newChallenge, 'Challenge rerolled successfully');
    } catch (err: any) {
      console.error('[API Reroll Challenge Error]:', err);
      return sendError(res, 'Failed to reroll challenge', 500, err.message);
    }
  });

  app.post('/api/challenges/complete', async (req, res) => {
    try {
      const { userId, challengeId, reflectionNote } = req.body;
      if (!userId || !challengeId) {
        return sendError(res, 'userId and challengeId are required', 400);
      }

      const user = await Db.getUser(userId);
      if (!user) return sendError(res, 'User not found', 404);

      const userChallenges = await Db.getUserChallenges(userId);
      const challenge = userChallenges.find((c) => c.id === challengeId);
      if (!challenge) return sendError(res, 'Challenge not found', 404);

      const history = await Db.getUserAnalysisHistory(userId);
      const latest = history[0];

      const userContext = {
        name: user.firstName || 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder'
      };

      // Generate psychological evaluation & feedback
      const aiFeedback = await evaluateGrowthChallengeCompletion(userContext, challenge, reflectionNote || '');

      const result = await Db.completeChallenge(userId, challengeId, reflectionNote, aiFeedback);
      if (!result) return sendError(res, 'Failed to complete challenge', 500);

      // Create notification
      await Db.addNotification(userId, {
        title: 'تحدي النمو مكتمل! 🎯',
        message: `أحسنت يا ${user.firstName}! أتممت بنجاح "${challenge.titleAr}" وحصلت على +${result.xpEarned} XP!`,
        type: 'badge_unlocked'
      });

      return sendSuccess(res, {
        challenge: result.challenge,
        xpEarned: result.xpEarned,
        aiFeedback
      }, 'Challenge marked completed!');
    } catch (err: any) {
      console.error('[API Complete Challenge Error]:', err);
      return sendError(res, 'Failed to complete challenge', 500, err.message);
    }
  });

  app.get('/api/challenges/history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const list = await Db.getUserChallenges(userId);
      return sendSuccess(res, list);
    } catch (err: any) {
      console.error('[API Challenge History Error]:', err);
      return sendError(res, 'Failed to fetch challenge history', 500, err.message);
    }
  });

  // ==========================================
  // 10. TELEGRAM BOT SIMULATION & LIVE AI COACH CHAT
  // ==========================================
  app.post('/api/bot/command', async (req, res) => {
    const { command, user } = req.body;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const botResponse = await handleBotCommand(
      command || '/start',
      user || { id: 99843319, first_name: 'Amr', username: 'amr_persona' },
      appUrl
    );
    return sendSuccess(res, botResponse);
  });

  app.post('/api/bot/chat', async (req, res) => {
    try {
      const { userId, message, history, userContext } = req.body;
      if (!message || !message.trim()) {
        return sendError(res, 'Message is required', 400);
      }

      const user = userId ? await Db.getUser(userId) : null;
      const latestReports = userId ? await Db.getUserAnalysisHistory(userId) : [];
      const latest = latestReports[0];

      const effectiveContext = {
        name: user ? user.firstName : (userContext?.name || 'Explorer'),
        archetypeId: latest?.archetypeId || userContext?.archetypeId || 'strategic-builder',
        overallScore: latest?.overallScore || userContext?.overallScore || 85,
        domainScores: latest?.domainScores || userContext?.domainScores,
        language: user?.language || userContext?.language || 'ar',
        coachTone: userContext?.coachTone || 'deep_wise',
        storyDepth: userContext?.storyDepth || 'rich_stories'
      };

      // Call conversational Gemini AI coach
      const botReply = await chatWithPersonalityBot(message, effectiveContext, history || []);

      // Persist in DB history if user exists
      if (userId) {
        await Db.saveChatMessage({
          id: 'msg_' + Date.now(),
          userId,
          role: 'user',
          text: message,
          timestamp: new Date().toISOString()
        });
        await Db.saveChatMessage({
          id: 'msg_bot_' + Date.now(),
          userId,
          role: 'model',
          text: botReply.replyText,
          timestamp: new Date().toISOString(),
          suggestedQuestions: botReply.suggestedQuestions
        });
      }

      return sendSuccess(res, botReply);
    } catch (err: any) {
      console.error('[API Bot Chat Error]:', err);
      return sendError(res, 'Failed to process AI chat message', 500, err.message);
    }
  });

  app.get('/api/bot/history/:userId', async (req, res) => {
    const history = await Db.getChatHistory(req.params.userId);
    return sendSuccess(res, history);
  });

  // Webhook for real Telegram Bot if configured
  app.post('/api/telegram/webhook', async (req, res) => {
    const update = req.body;
    console.log('[Telegram Webhook] Received update:', JSON.stringify(update));
    res.sendStatus(200);
  });

  // ==========================================
  // 10. ADMIN DASHBOARD & TELEMETRY
  // ==========================================
  app.get('/api/admin/stats', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const stats = await Db.getAdminStats();
    return sendSuccess(res, stats);
  });

  app.post('/api/admin/role', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const { adminSecret, targetUserId, newRole } = req.body;
    if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
      return sendError(res, 'Unauthorized admin action. Invalid secret.', 403);
    }
    const updated = await Db.updateUser(targetUserId, { role: newRole });
    await Db.logAudit('ADMIN_ROLE_CHANGE', targetUserId, `Role updated to ${newRole}`);
    return sendSuccess(res, updated, 'Role updated');
  });

  app.post('/api/admin/broadcast', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const { title, message } = req.body;
    const stats = await Db.getAdminStats();
    let sentCount = 0;
    for (const u of stats.users) {
      await Db.addNotification(u.id, {
        title: title || 'إعلان من فريق PERSONA',
        message: message || 'تحديثات جديدة متاحة في المنصة.',
        type: 'system'
      });
      sentCount++;
    }
    await Db.logAudit('ADMIN_BROADCAST', 'admin', `Broadcast sent to ${sentCount} users`);
    return sendSuccess(res, { sentCount }, 'Broadcast sent successfully');
  });

  // ==========================================
  // 11. VITE MIDDLEWARE FOR DEVELOPMENT / STATIC SPA FOR PROD
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "PERSONA AI Engine",
      time: new Date().toISOString(),
    });
  });
  
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
    });
  });
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PERSONA AI Engine] Server listening on http://0.0.0.0:${PORT}`);
  });
  }
  
  startServer();
import 'dotenv/config';
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

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  app.get('/api/health', (req, res) => {
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
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, firstName, lastName, username, language } = req.body;
      if (!firstName || !firstName.trim()) {
        return sendError(res, 'الاسم الأول مطلوب (First name is required)', 400);
      }

      const user = Db.registerUser({
        email,
        password,
        firstName,
        lastName,
        username,
        language: language || 'ar'
      });

      return sendSuccess(res, { user, token: `tok_${user.id}` }, 'Account created successfully');
    } catch (err: any) {
      console.error('[API Register Error]:', err);
      return sendError(res, err.message || 'Registration failed', 400);
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !identifier.trim()) {
        return sendError(res, 'يرجى إدخال اسم المستخدم، البريد، أو المعرف', 400);
      }

      const user = Db.loginUser(identifier, password);
      if (!user) {
        return sendError(res, 'بيانات الدخول غير صحيحة، أو الحساب غير مسجل', 401);
      }

      return sendSuccess(res, { user, token: `tok_${user.id}` }, 'Logged in successfully');
    } catch (err: any) {
      console.error('[API Login Error]:', err);
      return sendError(res, 'Login failed', 500);
    }
  });

  app.get('/api/auth/demo-accounts', (req, res) => {
    const stats = Db.getAdminStats();
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

  app.post('/api/auth/telegram', (req, res) => {
    try {
      const { initData, user } = req.body;
      const effectiveUser = user || {
        id: 99843319,
        first_name: 'Amr',
        last_name: 'K.',
        username: 'amr_persona',
        language_code: 'ar',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };

      const serverUser = Db.getOrCreateUser(effectiveUser);
      Db.logAudit('USER_AUTH', serverUser.id, `Authenticated via Telegram WebApp (${serverUser.username || serverUser.id})`);

      return sendSuccess(res, { user: serverUser, token: `tok_${serverUser.id}` });
    } catch (err: any) {
      console.error('[API Auth] Error:', err);
      return sendError(res, 'Authentication failed', 500, err.message);
    }
  });

  // ==========================================
  // 3. USER PROFILE & ONBOARDING
  // ==========================================
  app.get('/api/user/profile/:userId', (req, res) => {
    const user = Db.getUser(req.params.userId);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  });

  app.post('/api/user/update', (req, res) => {
    const { userId, updates } = req.body;
    if (!userId) return sendError(res, 'Missing userId', 400);

    const updated = Db.updateUser(userId, updates);
    if (!updated) return sendError(res, 'User not found', 404);
    return sendSuccess(res, updated, 'Profile updated successfully');
  });

  app.post('/api/user/onboarding', (req, res) => {
    const { userId, onboardingData } = req.body;
    if (!userId) return sendError(res, 'Missing userId', 400);

    const updated = Db.updateUser(userId, {
      onboardingCompleted: true,
      onboardingData
    });
    Db.addXp(userId, 50, 'onboarded');
    return sendSuccess(res, updated, 'Onboarding saved');
  });

  // ==========================================
  // 4. QUESTIONS & DYNAMIC ASSESSMENT ENGINE
  // ==========================================
  app.get('/api/questions', (req, res) => {
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

      const user = Db.getUser(userId);
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
      const saved = Db.saveAnalysisResult(resultRecord);
      Db.logAudit('ASSESSMENT_COMPLETED', userId, `Completed assessment. Archetype: ${calculated.archetypeId} (Score: ${calculated.overallScore})`);

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
  app.get('/api/reports/:id', (req, res) => {
    const result = Db.getAnalysisResult(req.params.id);
    if (!result) return sendError(res, 'Report not found', 404);
    return sendSuccess(res, {
      ...result,
      archetype: ARCHETYPES[result.archetypeId]
    });
  });

  app.get('/api/reports/user/:userId', (req, res) => {
    const list = Db.getUserAnalysisHistory(req.params.userId);
    const enriched = list.map((item) => ({
      ...item,
      archetype: ARCHETYPES[item.archetypeId]
    }));
    return sendSuccess(res, enriched);
  });

  app.get('/api/user/growth/:userId', (req, res) => {
    const growth = Db.getGrowthHistory(req.params.userId);
    return sendSuccess(res, growth);
  });

  // ==========================================
  // 6. SUBSCRIPTIONS & PREMIUM
  // ==========================================
  app.post('/api/subscription/upgrade', (req, res) => {
    const { userId, tier } = req.body;
    if (!userId) return sendError(res, 'Missing userId', 400);

    const user = Db.getUser(userId);
    if (!user) return sendError(res, 'User not found', 404);

    const updated = Db.updateUser(userId, { role: 'premium' });
    Db.addXp(userId, 200, 'premium_member');
    Db.addNotification(userId, {
      title: 'تم تفعيل العضوية المميزة PERSONA Premium 💎',
      message: 'تم فتح جميع التحليلات العميقة، بما فيها تقارير العلاقات والحميمية والتوصيات المتقدمة.',
      type: 'badge_unlocked'
    });
    Db.logAudit('PREMIUM_UPGRADE', userId, `Upgraded to tier: ${tier || 'premium'}`);

    return sendSuccess(res, updated, 'Upgraded to Premium successfully');
  });

  // ==========================================
  // 7. REFERRALS & GAMIFICATION
  // ==========================================
  app.get('/api/referrals/:userId', (req, res) => {
    const user = Db.getUser(req.params.userId);
    if (!user) return sendError(res, 'User not found', 404);
    const records = Db.getReferrals(req.params.userId);
    return sendSuccess(res, {
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      totalXpEarned: (user.referralCount || 0) * 100,
      records
    });
  });

  app.post('/api/referrals/apply', (req, res) => {
    const { referralCode, newUserId, newUserName } = req.body;
    if (!referralCode || !newUserId) return sendError(res, 'Missing referralCode or newUserId', 400);

    const success = Db.applyReferral(referralCode, newUserId, newUserName || 'Friend');
    if (!success) {
      return sendError(res, 'Invalid referral code or self-referral attempt', 400);
    }
    return sendSuccess(res, { message: 'Referral applied successfully! Bonus XP awarded.' });
  });

  // ==========================================
  // 8. NOTIFICATIONS & GOALS TRACKER
  // ==========================================
  app.get('/api/notifications/:userId', (req, res) => {
    const list = Db.getUserNotifications(req.params.userId);
    return sendSuccess(res, list);
  });

  app.post('/api/notifications/read', (req, res) => {
    const { notifId } = req.body;
    Db.markNotificationRead(notifId);
    return sendSuccess(res, { read: true });
  });

  // Goals API
  app.get('/api/goals/:userId', (req, res) => {
    const goals = Db.getUserGoals(req.params.userId);
    return sendSuccess(res, goals);
  });

  app.post('/api/goals', async (req, res) => {
    try {
      const { userId, title, category, targetFrequency, targetDaysPerWeek } = req.body;
      if (!userId || !title || !title.trim()) {
        return sendError(res, 'userId and title are required', 400);
      }

      const user = Db.getUser(userId);
      const reports = Db.getUserAnalysisHistory(userId);
      const latest = reports[0];

      const userContext = {
        name: user ? user.firstName : 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder',
        overallScore: latest?.overallScore || 85,
        domainScores: latest?.domainScores
      };

      // Generate customized psychological check-in prompt from Gemini AI
      const aiPrompt = await generateGoalAICheckInPrompt(title.trim(), category || 'habits', userContext);

      const goalId = 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
      const newGoal: PersonalGoal = {
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

      const saved = Db.saveGoal(newGoal);
      Db.logAudit('GOAL_CREATED', userId, `Created goal: "${newGoal.title}" (${newGoal.category})`);

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

      const user = Db.getUser(userId);
      const reports = Db.getUserAnalysisHistory(userId);
      const latest = reports[0];
      const userGoals = Db.getUserGoals(userId);
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

      const result = Db.recordGoalCheckIn(userId, goalId, {
        status,
        note,
        aiFeedback
      });

      if (!result) {
        return sendError(res, 'Goal not found', 404);
      }

      Db.logAudit('GOAL_CHECKIN', userId, `Checked in on goal: "${result.goal.title}" (${status})`);
      return sendSuccess(res, result, 'Check-in recorded successfully');
    } catch (err: any) {
      console.error('[API Goal Check-in Error]:', err);
      return sendError(res, 'Failed to record check-in', 500, err.message);
    }
  });

  app.delete('/api/goals/:userId/:goalId', (req, res) => {
    const { userId, goalId } = req.params;
    const deleted = Db.deleteGoal(userId, goalId);
    if (!deleted) return sendError(res, 'Goal not found', 404);
    Db.logAudit('GOAL_DELETED', userId, `Deleted goal ID: ${goalId}`);
    return sendSuccess(res, { deleted: true }, 'Goal deleted successfully');
  });

  app.post('/api/goals/refresh-ai-prompt', async (req, res) => {
    try {
      const { userId, goalId } = req.body;
      const userGoals = Db.getUserGoals(userId);
      const goal = userGoals.find((g) => g.id === goalId);
      if (!goal) return sendError(res, 'Goal not found', 404);

      const user = Db.getUser(userId);
      const reports = Db.getUserAnalysisHistory(userId);
      const latest = reports[0];

      const userContext = {
        name: user ? user.firstName : 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder',
        overallScore: latest?.overallScore || 85,
        domainScores: latest?.domainScores
      };

      const newPrompt = await generateGoalAICheckInPrompt(goal.title, goal.category, userContext);
      const updated = Db.updateGoal(userId, goalId, { aiCheckInPrompt: newPrompt });

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
      const user = Db.getUser(userId);
      if (!user) return sendError(res, 'User not found', 404);

      // Check if user already has an active challenge
      let active = Db.getActiveChallenge(userId);
      if (active) {
        return sendSuccess(res, active);
      }

      // If no active challenge, find weakest dimension from user's latest report
      const history = Db.getUserAnalysisHistory(userId);
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
      Db.saveChallenge(userId, newChallenge);

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

      const user = Db.getUser(userId);
      if (!user) return sendError(res, 'User not found', 404);

      const history = Db.getUserAnalysisHistory(userId);
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
      Db.saveChallenge(userId, newChallenge);

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

      const user = Db.getUser(userId);
      if (!user) return sendError(res, 'User not found', 404);

      const userChallenges = Db.getUserChallenges(userId);
      const challenge = userChallenges.find((c) => c.id === challengeId);
      if (!challenge) return sendError(res, 'Challenge not found', 404);

      const history = Db.getUserAnalysisHistory(userId);
      const latest = history[0];

      const userContext = {
        name: user.firstName || 'Friend',
        archetypeId: latest?.archetypeId || 'strategic-builder'
      };

      // Generate psychological evaluation & feedback
      const aiFeedback = await evaluateGrowthChallengeCompletion(userContext, challenge, reflectionNote || '');

      const result = Db.completeChallenge(userId, challengeId, reflectionNote, aiFeedback);
      if (!result) return sendError(res, 'Failed to complete challenge', 500);

      // Create notification
      Db.addNotification(userId, {
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

  app.get('/api/challenges/history/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const list = Db.getUserChallenges(userId);
      return sendSuccess(res, list);
    } catch (err: any) {
      console.error('[API Challenge History Error]:', err);
      return sendError(res, 'Failed to fetch challenge history', 500, err.message);
    }
  });

  // ==========================================
  // 10. TELEGRAM BOT SIMULATION & LIVE AI COACH CHAT
  // ==========================================
  app.post('/api/bot/command', (req, res) => {
    const { command, user } = req.body;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const botResponse = handleBotCommand(
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

      const user = userId ? Db.getUser(userId) : null;
      const latestReports = userId ? Db.getUserAnalysisHistory(userId) : [];
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
        Db.saveChatMessage({
          id: 'msg_' + Date.now(),
          userId,
          role: 'user',
          text: message,
          timestamp: new Date().toISOString()
        });
        Db.saveChatMessage({
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

  app.get('/api/bot/history/:userId', (req, res) => {
    const history = Db.getChatHistory(req.params.userId);
    return sendSuccess(res, history);
  });

  // Webhook for real Telegram Bot if configured
  app.post('/api/telegram/webhook', (req, res) => {
    const update = req.body;
    console.log('[Telegram Webhook] Received update:', JSON.stringify(update));
    res.sendStatus(200);
  });

  // ==========================================
  // 10. ADMIN DASHBOARD & TELEMETRY
  // ==========================================
  app.get('/api/admin/stats', (req, res) => {
    const stats = Db.getAdminStats();
    return sendSuccess(res, stats);
  });

  app.post('/api/admin/role', (req, res) => {
    const { adminSecret, targetUserId, newRole } = req.body;
    if (adminSecret !== (process.env.ADMIN_SECRET || 'persona_admin_secret_2026')) {
      return sendError(res, 'Unauthorized admin action. Invalid secret.', 403);
    }
    const updated = Db.updateUser(targetUserId, { role: newRole });
    Db.logAudit('ADMIN_ROLE_CHANGE', targetUserId, `Role updated to ${newRole}`);
    return sendSuccess(res, updated, 'Role updated');
  });

  app.post('/api/admin/broadcast', (req, res) => {
    const { title, message } = req.body;
    const stats = Db.getAdminStats();
    let sentCount = 0;
    for (const u of stats.users) {
      Db.addNotification(u.id, {
        title: title || 'إعلان من فريق PERSONA',
        message: message || 'تحديثات جديدة متاحة في المنصة.',
        type: 'system'
      });
      sentCount++;
    }
    Db.logAudit('ADMIN_BROADCAST', 'admin', `Broadcast sent to ${sentCount} users`);
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PERSONA AI Engine] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

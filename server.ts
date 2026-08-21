import "dotenv/config";
import cors from "cors";
import { randomUUID } from "crypto";
import express from "express";
import { z } from "zod";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Db } from "./server/db";
import { calculateAssessmentScores } from "./server/scoring";
import {
  generatePersonalityReport,
  getFallbackAIReport,
  chatWithPersonalityBot,
  generateGoalAICheckInPrompt,
  generateGoalCheckInFeedback,
  generate24HourGrowthChallenge,
  evaluateGrowthChallengeCompletion,
} from "./server/gemini";
import { handleBotCommand } from "./server/telegramBot";
import {
  QUESTIONS,
  getAssessmentQuestions,
  AssessmentMode,
} from "./src/data/questionsData";
import { ARCHETYPES } from "./src/data/archetypesData";
import { StoredAnalysisResult } from "./server/types";
import { PersonalGoal } from "./src/types";
import { getAuthenticatedUser, getSupabaseAuth } from "./server/supabase";
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);

  const PORT = Number(process.env.PORT || 3000);
  // =========================================================
  // CORS
  // Supports:
  // - Web development
  // - Production web app
  // - Capacitor Android/iOS WebView
  // =========================================================

  const configuredOrigins = [
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : []),

    // Local web development
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    "http://localhost",
    "https://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    // Capacitor
    "capacitor://localhost",
    "https://localhost",
    "http://localhost:8080",
    "https://localhost:8080",
  ]
    .filter(Boolean)
    .map((origin) => String(origin).trim().replace(/\/$/, ""))
    .filter((origin, index, all) => all.indexOf(origin) === index);

  app.use((req, res, next) => {
    const origin = req.headers.origin
      ? String(req.headers.origin).replace(/\/$/, "")
      : "";

    // Allow requests from configured web/native origins
    if (origin && configuredOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.header("Vary", "Origin");
    }

    // Handle browser / Capacitor preflight requests
    if (req.method === "OPTIONS") {
      if (origin && !configuredOrigins.includes(origin)) {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        return res.sendStatus(403);
      }

      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: "1mb" }));

  // Basic security headers without adding a new dependency.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // Lightweight in-memory rate limiting for authentication endpoints.
  // This is intentionally dependency-free; Railway can still add an edge/WAF
  // limiter later without changing the application contract.
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (limit: number, windowMs: number) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const nowMs = Date.now();
      const key = `${req.ip}:${req.path}`;
      const current = rateBuckets.get(key);
      if (!current || nowMs >= current.resetAt) {
        rateBuckets.set(key, { count: 1, resetAt: nowMs + windowMs });
        return next();
      }
      if (current.count >= limit) {
        res.setHeader("Retry-After", Math.ceil((current.resetAt - nowMs) / 1000));
        return sendError(res, "Too many requests. Please try again later.", 429);
      }
      current.count += 1;
      return next();
    };

  const loginSchema = z.object({
    identifier: z.string().trim().min(1).max(320).optional(),
    email: z.string().trim().email().max(320).optional(),
    password: z.string().min(1).max(128),
  }).refine((v) => Boolean(v.identifier || v.email), { message: "Login identifier is required" });

  const registerSchema = z.object({
    email: z.string().trim().email().max(320),
    password: z.string().min(6).max(128),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100).optional(),
    username: z.string().trim().max(100).optional(),
    language: z.enum(["ar", "en"]).optional(),
  });

  // Helper response wrapper
  const sendSuccess = (res: express.Response, data: any, message?: string) => {
    return res.json({
      success: true,
      data,
      message: message || "Success",
      status: 200,
    });
  };

  const sendError = (
    res: express.Response,
    message: string,
    status = 400,
    details?: any
  ) => {
    return res.status(status).json({
      success: false,
      error: message,
      message,
      details,
      status,
    });
  };

  // ==========================================
  // 1. HEALTH & METADATA
  // ==========================================

  app.get("/api/health", async (req, res) => {
    sendSuccess(res, {
      status: "online",
      service: "PERSONA AI Intelligence Platform",
      version: "2026.1.0",
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & TELEGRAM / EMAIL / PASSWORD
  // ==========================================

  app.post("/api/auth/register", rateLimit(5, 60_000), async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0]?.message || "Invalid registration data", 400);
      }
      const { email, password, firstName, lastName, username, language } = parsed.data;

      if (!firstName || !String(firstName).trim()) {
        return sendError(
          res,
          "الاسم الأول مطلوب (First name is required)",
          400
        );
      }

      const result = await Db.registerUser({
        email,
        password,
        firstName,
        lastName,
        username,
        language: language || "ar",
      });

      const login = await Db.loginUser(email, password);

      if (!login) {
        return sendError(
          res,
          "Account created but session could not be created",
          500
        );
      }

      return sendSuccess(
        res,
        {
          user: result,
          token: login.accessToken,
          refreshToken: login.refreshToken,
        },
        "Account created successfully"
      );
    } catch (err: any) {
      console.error("[API Register Error]:", err);
      return sendError(res, err.message || "Registration failed", 400);
    }
  });

  app.post("/api/auth/login", rateLimit(10, 60_000), async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "يرجى إدخال البريد/اسم المستخدم وكلمة المرور", 400);
      }
      const { identifier, email, password } = parsed.data;

      const loginIdentifier = identifier || email;
      if (!loginIdentifier || !String(loginIdentifier).trim() || !password) {
        return sendError(
          res,
          "يرجى إدخال البريد/اسم المستخدم وكلمة المرور",
          400
        );
      }

      const result = await Db.loginUser(loginIdentifier, password);
      if (!result) {
        return sendError(
          res,
          "بيانات الدخول غير صحيحة، أو الحساب غير مسجل",
          401
        );
      }

      return sendSuccess(
        res,
        {
          user: result.user,
          token: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "Logged in successfully"
      );
    } catch (err: any) {
      console.error("[API Login Error]:", err);

      return sendError(res, "Login failed", 500);
    }
  });

  // One-time legacy migration endpoint.
  // This is intentionally protected by a server-only secret and is NOT part
  // of the normal login flow. Use it only for accounts that existed before
  // Supabase Auth became the single source of truth.
  app.get("/api/auth/me", async (req, res) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

      if (!token) {
        return sendError(res, "Unauthorized", 401);
      }

      const authUser = await getAuthenticatedUser(token);
      if (!authUser) {
        return sendError(res, "Unauthorized", 401);
      }

      const user = await Db.getUser(authUser.id);
      if (!user) {
        return sendError(res, "User profile not found", 404);
      }

      return sendSuccess(res, user);
    } catch (err: any) {
      console.error("[API Auth Me]", err);
      return sendError(res, "Failed to load authenticated user", 401);
    }
  });

  app.post("/api/auth/repair-legacy", async (req, res) => {
    try {
      const migrationSecret = String(process.env.PERSONA_MIGRATION_SECRET || "").trim();
      const providedSecret = String(req.headers["x-persona-migration-secret"] || "").trim();

      if (!migrationSecret || providedSecret !== migrationSecret) {
        return sendError(res, "Forbidden", 403);
      }

      const { userId, password } = req.body || {};
      if (!userId || !password || String(password).length < 6) {
        return sendError(res, "userId and a password of at least 6 characters are required", 400);
      }

      const legacyUser = await Db.getUser(String(userId));
      if (!legacyUser?.email) {
        return sendError(res, "Legacy user or email not found", 404);
      }

      const email = String(legacyUser.email).trim().toLowerCase();
      const authAdmin = (await import("./server/supabase")).getSupabaseAuthAdmin();

      // If Auth already contains this email, reset its password and repair the UUID.
      let existingAuth: any | null = null;
      const perPage = 1000;
      for (let page = 1; page <= 100; page += 1) {
        const { data: authList, error: authListError } =
          await authAdmin.auth.admin.listUsers({ page, perPage });
        if (authListError) throw authListError;

        existingAuth = (authList.users || []).find(
          (u) => u.email?.trim().toLowerCase() === email
        ) || null;

        if (existingAuth || (authList.users || []).length < perPage) break;
      }

      let authUser;
      if (existingAuth) {
        const { data, error } = await authAdmin.auth.admin.updateUserById(existingAuth.id, {
          password: String(password),
          email_confirm: true,
        });
        if (error || !data.user) throw error || new Error("Failed to repair Auth user");
        authUser = data.user;
      } else {
        const { data, error } = await authAdmin.auth.admin.createUser({
          email,
          password: String(password),
          email_confirm: true,
          user_metadata: {
            first_name: legacyUser.firstName,
            last_name: legacyUser.lastName,
            username: legacyUser.username,
          },
        });
        if (error || !data.user) throw error || new Error("Failed to create Auth user");
        authUser = data.user;
      }

      if (legacyUser.id !== authUser.id) {
        await Db.rekeyUserId(legacyUser.id, authUser.id);
      }

      return sendSuccess(res, {
        userId: authUser.id,
        email,
        repaired: true,
      }, "Legacy account repaired");
    } catch (err: any) {
      console.error("[Legacy Auth Repair]", err);
      return sendError(res, err.message || "Legacy account repair failed", 500);
    }
  });

  app.post("/api/auth/logout", rateLimit(20, 60_000), async (req, res) => {
    try {
      const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : "";
      const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";

      // Revoke the refresh session when possible. The client also clears its
      // local tokens, so logout remains safe if the refresh token is already invalid.
      if (refreshToken && accessToken) {
        const auth = getSupabaseAuth();
        const { data: authUser } = await auth.auth.getUser(accessToken);
        if (authUser.user) {
          const sessionClient = await import("@supabase/supabase-js");
          const client = sessionClient.createClient(
            String(process.env.SUPABASE_URL || ""),
            String(process.env.SUPABASE_ANON_KEY || ""),
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
          );
          await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          await client.auth.signOut();
        }
      }

      return sendSuccess(res, { loggedOut: true }, "Logged out successfully");
    } catch (err) {
      console.error("[API Logout]", err);
      // Logout is idempotent from the client's perspective.
      return sendSuccess(res, { loggedOut: true }, "Logged out successfully");
    }
  });

  app.post("/api/auth/refresh", rateLimit(20, 60_000), async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, "Refresh token is required", 400);
      }

      const { getSupabaseAuth } = await import("./server/supabase");

      const { data, error } = await getSupabaseAuth().auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session || !data.user) {
        return sendError(res, "Session expired", 401);
      }

      const user = await Db.getUser(data.user.id);

      if (!user) {
        return sendError(res, "User not found", 404);
      }

      return sendSuccess(
        res,
        {
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
        },
        "Session refreshed"
      );
    } catch (err: any) {
      return sendError(res, "Failed to refresh session", 401);
    }
  });

  app.get("/api/auth/demo-accounts", (req, res) => {
    if (process.env.PERSONA_DEMO_MODE !== "true") {
      return sendError(res, "Demo mode is disabled", 404);
    }

    void Db.getAdminStats()
      .then((stats) => {
        const accounts = stats.users.map((u: any) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName || ""}`.trim(),
          username: u.username,
          role: u.role,
          level: u.level,
          photoUrl: u.photoUrl,
        }));
        return sendSuccess(res, accounts);
      })
      .catch((err) => {
        console.error("[Demo Accounts]", err);
        return sendError(res, "Failed to load demo accounts", 500);
      });
  });

  app.post("/api/auth/demo-login", rateLimit(10, 60_000), async (req, res) => {
    if (process.env.PERSONA_DEMO_MODE !== "true") {
      return sendError(res, "Demo mode is disabled", 404);
    }

    const demoPassword = String(process.env.PERSONA_DEMO_PASSWORD || "");
    const parsed = z.object({ userId: z.string().uuid() }).safeParse(req.body);
    if (!parsed.success || !demoPassword) {
      return sendError(res, "Demo login is not configured", 404);
    }

    try {
      const target = await Db.getUser(parsed.data.userId);
      if (!target?.email) return sendError(res, "Demo account not found", 404);

      // Demo mode intentionally uses a server-side password so no credential
      // is embedded in the browser bundle. Never enable this in production.
      const login = await Db.loginUser(target.email, demoPassword);
      if (!login) return sendError(res, "Demo login failed", 401);

      return sendSuccess(res, {
        user: login.user,
        token: login.accessToken,
        refreshToken: login.refreshToken,
      }, "Demo login successful");
    } catch (err) {
      console.error("[Demo Login]", err);
      return sendError(res, "Demo login failed", 500);
    }
  });

  app.post("/api/auth/telegram", rateLimit(20, 60_000), async (req, res) => {
    try {
      const { initData } = req.body;

      if (!initData) {
        return sendError(res, "Telegram initData is required", 400);
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return sendError(
          res,
          "Telegram authentication is not configured on the server",
          503
        );
      }

      const crypto = await import("crypto");

      const params = new URLSearchParams(initData);

      const receivedHash = params.get("hash");

      if (!receivedHash) {
        return sendError(res, "Invalid Telegram initData", 401);
      }

      params.delete("hash");

      const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

      const secretKey = crypto
        .createHmac("sha256", "WebAppData")
        .update(botToken)
        .digest();

      const expectedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      const receivedHashBuffer = Buffer.from(receivedHash, "hex");

      const expectedHashBuffer = Buffer.from(expectedHash, "hex");

      if (
        receivedHashBuffer.length !== expectedHashBuffer.length ||
        !crypto.timingSafeEqual(receivedHashBuffer, expectedHashBuffer)
      ) {
        return sendError(res, "Invalid Telegram signature", 401);
      }

      const authDate = Number(params.get("auth_date") || 0);

      const nowSeconds = Math.floor(Date.now() / 1000);

      if (
        !Number.isFinite(authDate) ||
        authDate <= 0 ||
        authDate > nowSeconds + 60 ||
        nowSeconds - authDate > 86400
      ) {
        return sendError(res, "Telegram initData expired", 401);
      }

      const rawUser = params.get("user");

      if (!rawUser) {
        return sendError(res, "Telegram user data missing", 401);
      }

      const telegramUser = JSON.parse(rawUser);

      const session = await Db.getOrCreateUser(telegramUser);

      await Db.logAudit(
        "USER_AUTH",
        session.user.id,
        `Authenticated via verified Telegram WebApp (${
          session.user.username || session.user.id
        })`
      );

      return sendSuccess(res, {
        user: session.user,
        token: session.accessToken,
        refreshToken: session.refreshToken,
        telegramUserId: telegramUser.id,
      });
    } catch (err: any) {
      console.error("[API Telegram Auth] Error:", err);

      return sendError(res, "Authentication failed", 500);
    }
  });

  // ==========================================
  // AUTHENTICATION MIDDLEWARE
  // ==========================================

  app.use("/api", async (req, res, next) => {
    if (
      req.path === "/health" ||
      req.path === "/auth/register" ||
      req.path === "/auth/login" ||
      req.path === "/auth/refresh" ||
      req.path === "/auth/logout" ||
      req.path === "/auth/me" ||
      req.path === "/auth/repair-legacy" ||
      req.path === "/auth/telegram" ||
      req.path === "/auth/demo-accounts" ||
      req.path === "/auth/demo-login" ||
      req.path === "/questions" ||
      req.path === "/telegram/webhook"
    ) {
      return next();
    }

    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

    const authUser = await getAuthenticatedUser(token);

    if (!authUser) {
      return sendError(res, "Unauthorized", 401);
    }

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
      "/user/profile/",
      "/user/growth/",
      "/reports/user/",
      "/referrals/",
      "/notifications/",
      "/goals/",
      "/challenges/active/",
      "/challenges/history/",
      "/bot/history/",
    ];

    const ownPathPrefix = ownUserPathPrefixes.find((prefix) =>
      req.path.startsWith(prefix)
    );

    if (ownPathPrefix && !requestedUserId) {
      const suffix = req.path.slice(ownPathPrefix.length).split("/")[0];

      if (suffix) {
        requestedUserId = suffix;
      }
    }

    if (requestedUserId && requestedUserId !== authUser.id) {
      const actor = await Db.getUser(authUser.id);

      const isAdmin =
        actor && (actor.role === "admin" || actor.role === "super_admin");

      if (!isAdmin) {
        return sendError(res, "Forbidden", 403);
      }
    }

    return next();
  });

  const requireAdmin = async (req: express.Request, res: express.Response) => {
    const authUserId = (req as any).authUserId as string | undefined;

    if (!authUserId) {
      sendError(res, "Unauthorized");

      return false;
    }

    const actor = await Db.getUser(authUserId);

    if (!actor || !["admin", "super_admin"].includes(actor.role)) {
      sendError(res, "Forbidden");

      return false;
    }

    return true;
  };

  // ==========================================
  // 3. USER PROFILE & ONBOARDING
  // ==========================================

  app.get("/api/user/profile/:userId", async (req, res) => {
    const user = await Db.getUser(req.params.userId);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, user);
  });

  app.post("/api/user/update", async (req, res) => {
    const { userId, updates } = req.body;

    if (!userId) {
      return sendError(res, "Missing userId", 400);
    }

    const authUserId = (req as any).authUserId as string | undefined;
    if (!authUserId) {
      return sendError(res, "Unauthorized", 401);
    }

    const actor = await Db.getUser(authUserId);
    const isAdmin = !!actor && ["admin", "super_admin"].includes(actor.role);
    if (userId !== authUserId && !isAdmin) {
      return sendError(res, "Forbidden", 403);
    }

    const parsedUpdates = z.object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().max(100).nullable().optional(),
      username: z.string().trim().max(100).nullable().optional(),
      photoUrl: z.string().url().max(2048).nullable().optional(),
      language: z.enum(["ar", "en"]).optional(),
      onboardingCompleted: z.boolean().optional(),
      onboardingData: z.record(z.string(), z.unknown()).optional(),
    }).safeParse(updates || {});

    if (!parsedUpdates.success) {
      return sendError(res, "Invalid profile update", 400);
    }

    const updated = await Db.updateUser(userId, parsedUpdates.data);

    if (!updated) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, updated, "Profile updated successfully");
  });

  app.post("/api/user/onboarding", async (req, res) => {
    const { userId, onboardingData } = req.body;

    if (!userId) {
      return sendError(res, "Missing userId", 400);
    }

    const updated = await Db.updateUser(userId, {
      onboardingCompleted: true,
      onboardingData,
    });

    await Db.addXp(userId, 50, "onboarded");

    return sendSuccess(res, updated, "Onboarding saved");
  });

  // ==========================================
  // 4. QUESTIONS & DYNAMIC ASSESSMENT ENGINE
  // ==========================================

  app.get("/api/questions", async (req, res) => {
    const { mode, category, randomize } = req.query;

    const shouldRandomize = randomize !== "false";

    const questions = getAssessmentQuestions(
      (mode as AssessmentMode) || "full",
      category as string | undefined,
      shouldRandomize
    );

    return sendSuccess(res, {
      total: questions.length,
      mode: mode || "full",
      categories: [
        "cognitive",
        "emotional",
        "social",
        "behavioral",
        "motivation",
        "lifestyle",
        "relationships",
        "intimacy",
        "career",
      ],
      questions,
    });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { userId, answers, completionTimeSeconds, version } = req.body;

      if (!userId || !answers || !Array.isArray(answers)) {
        return sendError(
          res,
          "Invalid submission payload. userId and answers array required.",
          400
        );
      }

      const user = await Db.getUser(userId);

      const userName = user ? `${user.firstName}` : "Explorer";

      const calculated = calculateAssessmentScores(answers);

      const aiReport = await generatePersonalityReport(
        userName,
        calculated,
        user?.onboardingData
      );

      const reportId =
        "rep_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

      const resultRecord: StoredAnalysisResult = {
        id: reportId,
        userId,
        createdAt: new Date().toISOString(),
        version: version || "2026.1",
        overallScore: calculated.overallScore,
        archetypeId: calculated.archetypeId,
        domainScores: calculated.domainScores,
        dimensions: calculated.dimensions,
        aiReport,
        isUnlockedPremium:
          user?.role === "premium" ||
          user?.role === "admin" ||
          user?.role === "super_admin",
        completionTimeSeconds: completionTimeSeconds || 180,
      };

      const saved = await Db.saveAnalysisResult(resultRecord);

      await Db.logAudit(
        "ASSESSMENT_COMPLETED",
        userId,
        `Completed assessment. Archetype: ${calculated.archetypeId} (Score: ${calculated.overallScore})`
      );

      return sendSuccess(
        res,
        {
          report: {
            ...saved,
            archetype: ARCHETYPES[saved.archetypeId],
          },
        },
        "Analysis successfully completed"
      );
    } catch (err: any) {
      console.error("[API Analyze] Error:", err);

      return sendError(res, "Failed to complete analysis", 500);
    }
  });

  // ==========================================
  // 5. REPORTS & HISTORY
  // ==========================================

  app.get("/api/reports/:id", async (req, res) => {
    const result = await Db.getAnalysisResult(req.params.id);

    if (!result) {
      return sendError(res, "Report not found", 404);
    }

    const authUserId = (req as any).authUserId as string | undefined;

    if (!authUserId) {
      return sendError(res, "Unauthorized", 401);
    }

    if (result.userId !== authUserId) {
      const actor = await Db.getUser(authUserId);

      const isAdmin =
        actor && (actor.role === "admin" || actor.role === "super_admin");

      if (!isAdmin) {
        return sendError(res, "Forbidden", 403);
      }
    }

    return sendSuccess(res, {
      ...result,
      archetype: ARCHETYPES[result.archetypeId],
    });
  });

  app.get("/api/reports/user/:userId", async (req, res) => {
    const list = await Db.getUserAnalysisHistory(req.params.userId);

    const enriched = list.map((item) => ({
      ...item,
      archetype: ARCHETYPES[item.archetypeId],
    }));

    return sendSuccess(res, enriched);
  });

  app.get("/api/user/growth/:userId", async (req, res) => {
    const growth = await Db.getGrowthHistory(req.params.userId);

    return sendSuccess(res, growth);
  });

  // ==========================================
  // 6. SUBSCRIPTIONS & PREMIUM
  // ==========================================

  app.post("/api/subscription/upgrade", async (req, res) => {
    const { userId, tier } = req.body;

    if (!userId) {
      return sendError(res, "Missing userId", 400);
    }

    const user = await Db.getUser(userId);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const actor = await Db.getUser((req as any).authUserId);
    const isAdmin = !!actor && ["admin", "super_admin"].includes(actor.role);
    const allowSelfUpgrade = process.env.PERSONA_ALLOW_SELF_UPGRADE === "true";

    if (!isAdmin && !allowSelfUpgrade) {
      return sendError(res, "Premium purchases are not configured", 501);
    }

    const updated = await Db.updateUser(userId, {
      role: "premium",
    });

    await Db.addXp(userId, 200, "premium_member");

    await Db.addNotification(userId, {
      title: "تم تفعيل العضوية المميزة PERSONA Premium 💎",
      message:
        "تم فتح جميع التحليلات العميقة، بما فيها تقارير العلاقات والحميمية والتوصيات المتقدمة.",
      type: "badge_unlocked",
    });

    await Db.logAudit(
      "PREMIUM_UPGRADE",
      userId,
      `Upgraded to tier: ${tier || "premium"}`
    );

    return sendSuccess(res, updated, "Upgraded to Premium successfully");
  });

  // ==========================================
  // 7. REFERRALS & GAMIFICATION
  // ==========================================

  app.get("/api/referrals/:userId", async (req, res) => {
    const user = await Db.getUser(req.params.userId);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const records = await Db.getReferrals(req.params.userId);

    return sendSuccess(res, {
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      totalXpEarned: (user.referralCount || 0) * 100,
      records,
    });
  });

  app.post("/api/referrals/apply", async (req, res) => {
    const { referralCode, newUserId, newUserName } = req.body;

    if (!referralCode || !newUserId) {
      return sendError(res, "Missing referralCode or newUserId", 400);
    }

    const success = await Db.applyReferral(
      referralCode,
      newUserId,
      newUserName || "Friend"
    );

    if (!success) {
      return sendError(
        res,
        "Invalid referral code or self-referral attempt",
        400
      );
    }

    return sendSuccess(res, {
      message: "Referral applied successfully! Bonus XP awarded.",
    });
  });

  // ==========================================
  // 8. NOTIFICATIONS & GOALS TRACKER
  // ==========================================

  app.get("/api/notifications/:userId", async (req, res) => {
    const list = await Db.getUserNotifications(req.params.userId);

    return sendSuccess(res, list);
  });

  app.post("/api/notifications/read", async (req, res) => {
    const { notifId } = req.body;

    await Db.markNotificationRead(notifId, (req as any).authUserId);

    return sendSuccess(res, {
      read: true,
    });
  });

  // Goals API
  app.get("/api/goals/:userId", async (req, res) => {
    const goals = await Db.getUserGoals(req.params.userId);

    return sendSuccess(res, goals);
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const { userId, title, category, targetFrequency, targetDaysPerWeek } =
        req.body;

      if (!userId || !title || !title.trim()) {
        return sendError(res, "userId and title are required", 400);
      }

      const user = await Db.getUser(userId);

      const reports = await Db.getUserAnalysisHistory(userId);

      const latest = reports[0];

      const userContext = {
        name: user ? user.firstName : "Friend",
        archetypeId: latest?.archetypeId || "strategic-builder",
        overallScore: latest?.overallScore || 85,
        domainScores: latest?.domainScores,
      };

      const aiPrompt = await generateGoalAICheckInPrompt(
        title.trim(),
        category || "habits",
        userContext
      );

      const goalId = randomUUID();

      const newGoal: PersonalGoal = {
        id: goalId,
        userId,
        title: title.trim(),
        category: category || "habits",
        targetFrequency: targetFrequency || "daily",
        targetDaysPerWeek: targetDaysPerWeek || 5,
        progress: 0,
        streak: 0,
        createdAt: new Date().toISOString(),
        checkIns: [],
        aiCheckInPrompt: aiPrompt,
      };

      const saved = await Db.saveGoal(newGoal);

      await Db.logAudit(
        "GOAL_CREATED",
        userId,
        `Created goal: "${newGoal.title}" (${newGoal.category})`
      );

      return sendSuccess(res, saved, "Goal created successfully");
    } catch (err: any) {
      console.error("[API Goals Error]:", err);

      return sendError(res, "Failed to create goal", 500);
    }
  });

  app.post("/api/goals/checkin", async (req, res) => {
    try {
      const { userId, goalId, status, note } = req.body;

      if (!userId || !goalId || !status) {
        return sendError(res, "userId, goalId, and status are required", 400);
      }

      const user = await Db.getUser(userId);

      const reports = await Db.getUserAnalysisHistory(userId);

      const latest = reports[0];

      const userGoals = await Db.getUserGoals(userId);

      const targetGoal = userGoals.find((g) => g.id === goalId);

      const userContext = {
        name: user ? user.firstName : "Friend",
        archetypeId: latest?.archetypeId || "strategic-builder",
      };

      const aiFeedback = await generateGoalCheckInFeedback(
        targetGoal ? targetGoal.title : "Goal",
        status,
        note || "",
        userContext
      );

      const result = await Db.recordGoalCheckIn(userId, goalId, {
        status,
        note,
        aiFeedback,
      });

      if (!result) {
        return sendError(res, "Goal not found", 404);
      }

      await Db.logAudit(
        "GOAL_CHECKIN",
        userId,
        `Checked in on goal: "${result.goal.title}" (${status})`
      );

      return sendSuccess(res, result, "Check-in recorded successfully");
    } catch (err: any) {
      console.error("[API Goal Check-in Error]:", err);

      return sendError(res, "Failed to record check-in", 500);
    }
  });

  app.delete("/api/goals/:userId/:goalId", async (req, res) => {
    const { userId, goalId } = req.params;

    const deleted = await Db.deleteGoal(userId, goalId);

    if (!deleted) {
      return sendError(res, "Goal not found", 404);
    }

    await Db.logAudit("GOAL_DELETED", userId, `Deleted goal ID: ${goalId}`);

    return sendSuccess(
      res,
      {
        deleted: true,
      },
      "Goal deleted successfully"
    );
  });

  app.post("/api/goals/refresh-ai-prompt", async (req, res) => {
    try {
      const { userId, goalId } = req.body;

      const userGoals = await Db.getUserGoals(userId);

      const goal = userGoals.find((g) => g.id === goalId);

      if (!goal) {
        return sendError(res, "Goal not found", 404);
      }

      const user = await Db.getUser(userId);

      const reports = await Db.getUserAnalysisHistory(userId);

      const latest = reports[0];

      const userContext = {
        name: user ? user.firstName : "Friend",
        archetypeId: latest?.archetypeId || "strategic-builder",
        overallScore: latest?.overallScore || 85,
        domainScores: latest?.domainScores,
      };

      const newPrompt = await generateGoalAICheckInPrompt(
        goal.title,
        goal.category,
        userContext
      );

      const updated = await Db.updateGoal(userId, goalId, {
        aiCheckInPrompt: newPrompt,
      });

      return sendSuccess(res, updated, "Prompt refreshed successfully");
    } catch (err: any) {
      console.error("[API Refresh Prompt Error]:", err);

      return sendError(res, "Failed to refresh AI prompt", 500);
    }
  });

  // ==========================================
  // 9. 24-HOUR GROWTH CHALLENGES API
  // ==========================================

  app.get("/api/challenges/active/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await Db.getUser(userId);

      if (!user) {
        return sendError(res, "User not found", 404);
      }

      let active = await Db.getActiveChallenge(userId);

      if (active) {
        return sendSuccess(res, active);
      }

      const history = await Db.getUserAnalysisHistory(userId);

      const latest = history[0];

      let weakest = {
        name: "stress_management",
        nameAr: "إدارة التوتر والضغوط",
        nameEn: "Stress Resilience",
        score: 45,
      };

      if (latest && latest.dimensions && latest.dimensions.length > 0) {
        const sorted = [...latest.dimensions].sort((a, b) => a.score - b.score);

        const lowest = sorted[0];

        weakest = {
          name: lowest.name,
          nameAr: lowest.nameAr || lowest.name,
          nameEn: lowest.nameEn || lowest.name,
          score: lowest.score,
        };
      }

      const userContext = {
        id: user.id,
        name: user.firstName || "Friend",
        archetypeId: latest?.archetypeId || "strategic-builder",
      };

      const newChallenge = await generate24HourGrowthChallenge(
        userContext,
        weakest
      );

      await Db.saveChallenge(userId, newChallenge);

      return sendSuccess(res, newChallenge);
    } catch (err: any) {
      console.error("[API Active Challenge Error]:", err);

      return sendError(
        res,
        "Failed to fetch active challenge",
        500
      );
    }
  });

  app.post("/api/challenges/reroll", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return sendError(res, "User ID is required", 400);
      }

      const user = await Db.getUser(userId);

      if (!user) {
        return sendError(res, "User not found", 404);
      }

      const history = await Db.getUserAnalysisHistory(userId);

      const latest = history[0];

      let weakest = {
        name: "social_assertiveness",
        nameAr: "الحزم والتواصل الشجاع",
        nameEn: "Social Assertiveness",
        score: 42,
      };

      if (latest && latest.dimensions && latest.dimensions.length > 0) {
        const sorted = [...latest.dimensions].sort((a, b) => a.score - b.score);

        const pickIdx = sorted.length > 1 ? (Math.random() > 0.5 ? 1 : 0) : 0;

        const lowest = sorted[pickIdx];

        weakest = {
          name: lowest.name,
          nameAr: lowest.nameAr || lowest.name,
          nameEn: lowest.nameEn || lowest.name,
          score: lowest.score,
        };
      }

      const userContext = {
        id: user.id,
        name: user.firstName || "Friend",
        archetypeId: latest?.archetypeId || "strategic-builder",
      };

      const newChallenge = await generate24HourGrowthChallenge(
        userContext,
        weakest
      );

      await Db.saveChallenge(userId, newChallenge);

      return sendSuccess(res, newChallenge, "Challenge rerolled successfully");
    } catch (err: any) {
      console.error("[API Reroll Challenge Error]:", err);

      return sendError(res, "Failed to reroll challenge", 500);
    }
  });

  app.post("/api/challenges/complete", async (req, res) => {
    try {
      const { userId, challengeId, reflectionNote } = req.body;

      if (!userId || !challengeId) {
        return sendError(res, "userId and challengeId are required", 400);
      }

      const user = await Db.getUser(userId);

      if (!user) {
        return sendError(res, "User not found", 404);
      }

      const userChallenges = await Db.getUserChallenges(userId);

      const challenge = userChallenges.find((c) => c.id === challengeId);

      if (!challenge) {
        return sendError(res, "Challenge not found", 404);
      }

      const history = await Db.getUserAnalysisHistory(userId);

      const latest = history[0];

      const userContext = {
        name: user.firstName || "Friend",
        archetypeId: latest?.archetypeId || "strategic-builder",
      };

      const aiFeedback = await evaluateGrowthChallengeCompletion(
        userContext,
        challenge,
        reflectionNote || ""
      );

      const result = await Db.completeChallenge(
        userId,
        challengeId,
        reflectionNote,
        aiFeedback
      );

      if (!result) {
        return sendError(res, "Failed to complete challenge", 500);
      }

      await Db.addNotification(userId, {
        title: "تحدي النمو مكتمل! 🎯",
        message: `أحسنت يا ${user.firstName}! أتممت بنجاح "${challenge.titleAr}" وحصلت على +${result.xpEarned} XP!`,
        type: "badge_unlocked",
      });

      return sendSuccess(
        res,
        {
          challenge: result.challenge,
          xpEarned: result.xpEarned,
          aiFeedback,
        },
        "Challenge marked completed!"
      );
    } catch (err: any) {
      console.error("[API Complete Challenge Error]:", err);

      return sendError(res, "Failed to complete challenge", 500);
    }
  });

  app.get("/api/challenges/history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const list = await Db.getUserChallenges(userId);

      return sendSuccess(res, list);
    } catch (err: any) {
      console.error("[API Challenge History Error]:", err);

      return sendError(
        res,
        "Failed to fetch challenge history",
        500
      );
    }
  });

  // ==========================================
  // 10. TELEGRAM BOT SIMULATION & LIVE AI COACH CHAT
  // ==========================================

  app.post("/api/bot/command", async (req, res) => {
    if (process.env.PERSONA_DEMO_MODE !== "true") {
      return sendError(res, "Bot simulator is disabled", 404);
    }

    const parsed = z.object({
      command: z.string().trim().max(200).optional(),
      user: z.object({
        id: z.number().int().positive(),
        first_name: z.string().trim().min(1).max(100),
        username: z.string().trim().max(100).optional(),
        language_code: z.string().max(20).optional(),
      }).optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid bot simulator payload", 400);
    }

    const { command, user } = parsed.data;

    const appUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

    const botResponse = await handleBotCommand(
      command || "/start",
      user || {
        id: 99843319,
        first_name: "Amr",
        username: "amr_persona",
      },
      appUrl
    );

    return sendSuccess(res, botResponse);
  });

  app.post("/api/bot/chat", async (req, res) => {
    try {
      const { userId, message, history, userContext } = req.body;

      if (!message || !message.trim()) {
        return sendError(res, "Message is required", 400);
      }

      const user = userId ? await Db.getUser(userId) : null;

      const latestReports = userId
        ? await Db.getUserAnalysisHistory(userId)
        : [];

      const latest = latestReports[0];

      const effectiveContext = {
        name: user ? user.firstName : userContext?.name || "Explorer",
        archetypeId:
          latest?.archetypeId ||
          userContext?.archetypeId ||
          "strategic-builder",
        overallScore: latest?.overallScore || userContext?.overallScore || 85,
        domainScores: latest?.domainScores || userContext?.domainScores,
        language: user?.language || userContext?.language || "ar",
        coachTone: userContext?.coachTone || "deep_wise",
        storyDepth: userContext?.storyDepth || "rich_stories",
      };

      const botReply = await chatWithPersonalityBot(
        message,
        effectiveContext,
        history || []
      );

      if (userId) {
        await Db.saveChatMessage({
          id: "msg_" + Date.now(),
          userId,
          role: "user",
          text: message,
          timestamp: new Date().toISOString(),
        });

        await Db.saveChatMessage({
          id: "msg_bot_" + Date.now(),
          userId,
          role: "model",
          text: botReply.replyText,
          timestamp: new Date().toISOString(),
          suggestedQuestions: botReply.suggestedQuestions,
        });
      }

      return sendSuccess(res, botReply);
    } catch (err: any) {
      console.error("[API Bot Chat Error]:", err);

      return sendError(
        res,
        "Failed to process AI chat message",
        500
      );
    }
  });

  app.get("/api/bot/history/:userId", async (req, res) => {
    const history = await Db.getChatHistory(req.params.userId);

    return sendSuccess(res, history);
  });

  // Webhook for real Telegram Bot
  app.post("/api/telegram/webhook", async (req, res) => {
    const configuredSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
    const providedSecret = String(req.headers["x-telegram-bot-api-secret-token"] || "").trim();

    if (!configuredSecret || providedSecret !== configuredSecret) {
      return sendError(res, "Webhook not configured", 404);
    }

    // Telegram update processing is not implemented in this project yet.
    // Do not acknowledge arbitrary updates as successfully processed.
    return sendError(res, "Telegram webhook processing is not configured", 501);
  });

  // ==========================================
  // 10. ADMIN DASHBOARD & TELEMETRY
  // ==========================================

  app.get("/api/admin/stats", async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return;
    }

    const stats = await Db.getAdminStats();

    return sendSuccess(res, stats);
  });

  app.post("/api/admin/role", async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return;
    }

    const parsed = z.object({
      targetUserId: z.string().uuid(),
      newRole: z.enum(["user", "premium", "moderator", "admin", "super_admin"]),
    }).safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid role change request", 400);
    }

    const { targetUserId, newRole } = parsed.data;
    const actor = await Db.getUser((req as any).authUserId);
    if (!actor) {
      return sendError(res, "Unauthorized", 401);
    }
    if ((newRole === "admin" || newRole === "super_admin") && actor.role !== "super_admin") {
      return sendError(res, "Only a super admin can assign admin privileges", 403);
    }
    if (targetUserId === actor.id) {
      return sendError(res, "You cannot change your own role", 400);
    }

    const updated = await Db.updateUser(targetUserId, {
      role: newRole,
    });

    await Db.logAudit(
      "ADMIN_ROLE_CHANGE",
      targetUserId,
      `Role updated to ${newRole}`
    );

    return sendSuccess(res, updated, "Role updated");
  });

  app.post("/api/admin/broadcast", async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return;
    }

    const { title, message } = req.body;

    const stats = await Db.getAdminStats();

    let sentCount = 0;

    for (const u of stats.users) {
      await Db.addNotification(u.id, {
        title: title || "إعلان من فريق PERSONA",
        message: message || "تحديثات جديدة متاحة في المنصة.",
        type: "system",
      });

      sentCount++;
    }

    await Db.logAudit(
      "ADMIN_BROADCAST",
      "admin",
      `Broadcast sent to ${sentCount} users`
    );

    return sendSuccess(
      res,
      {
        sentCount,
      },
      "Broadcast sent successfully"
    );
  });

  // Favicon: keep the browser from requesting a missing /favicon.ico.
  app.get("/favicon.ico", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "favicon.svg"));
  });

  // ==========================================
  // 11. VITE / STATIC SPA
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ==========================================
  // ROOT
  // ==========================================

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: "online",
        service: "PERSONA AI Intelligence Platform",
        version: "2026.1.0",
        timestamp: new Date().toISOString(),
      },
      message: "Success",
      status: 200,
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[PERSONA AI Engine] Server listening on http://0.0.0.0:${PORT}`
    );

    console.log("[PERSONA CORS] Allowed origins:", configuredOrigins);
  });
}

startServer();

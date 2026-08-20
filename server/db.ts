import { randomUUID } from "crypto";
import {
  getSupabaseAdmin,
  getSupabaseAuth,
  getSupabaseAuthAdmin,
} from "./supabase";
import {
  ServerUser,
  StoredAnalysisResult,
  StoredNotification,
  StoredReferral,
  StoredChatMessage,
  AuditLog,
} from "./types";

import {
  GrowthMetric,
  PersonalGoal,
  GoalCheckIn,
  GrowthChallenge,
} from "../src/types";

const s = () => getSupabaseAdmin();

const now = () => new Date().toISOString();

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * custom_settings is the only JSON storage available on users.
 *
 * We keep application-only data here:
 * {
 *   onboardingData: {...},
 *   userSettings: {...}
 * }
 */
function getCustomSettings(row: any): Record<string, any> {
  if (!row?.custom_settings) return {};

  if (
    typeof row.custom_settings === "object" &&
    !Array.isArray(row.custom_settings)
  ) {
    return row.custom_settings;
  }

  return {};
}

function getOnboardingData(row: any): Record<string, any> | undefined {
  const settings = getCustomSettings(row);
  return settings.onboardingData || undefined;
}

function getUserSettings(row: any): Record<string, any> | undefined {
  const settings = getCustomSettings(row);
  return settings.userSettings || undefined;
}

/**
 * Maps the real Supabase users table to ServerUser.
 *
 * IMPORTANT:
 * users.last_login does not exist in your schema.
 * We therefore use updated_at as the server-side last activity/login timestamp.
 *
 * accountCode and referralCount are not real DB columns.
 * accountCode is mapped from referral_code.
 * referralCount is calculated from referrals.
 */
function mapUser(row: any, referralCount = 0): ServerUser {
  const customSettings = getCustomSettings(row);

  return {
    id: row.id,

    telegramId: Number(row.telegram_id || 0),

    email: row.email || undefined,

    accountCode: row.referral_code || undefined,

    firstName: row.first_name || "User",

    lastName: row.last_name || undefined,

    username: row.username || undefined,

    photoUrl: row.avatar_url || undefined,

    language: row.language === "en" ? "en" : "ar",

    role: row.role || "user",

    createdAt: row.created_at,

    lastLogin: row.updated_at || row.created_at,

    xp: Number(row.xp || 0),

    level: Number(row.level || 1),

    badges: Array.isArray(row.badges) ? row.badges : [],

    referralCode: row.referral_code || "",

    referredBy: row.referred_by || undefined,

    referralCount,

    onboardingCompleted: Boolean(row.onboarding_completed),

    onboardingData: customSettings.onboardingData || undefined,
  };
}

async function getReferralCount(userId: string): Promise<number> {
  const { count, error } = await s()
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId);

  if (error) return 0;

  return count || 0;
}

async function getUserRow(userId: string): Promise<any | null> {
  const { data, error } = await s()
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return data;
}

export const Db = {
  /**
   * Initialize DB connection.
   *
   * Supabase is the ONLY persistent database.
   * No JSON database is created.
   */
  async init() {
    const { error } = await s().from("users").select("id").limit(1);

    if (error) {
      console.error("[DB INIT]", error.message);
    }
  },

  /**
   * Get user by Supabase Auth UUID.
   */
  async getUser(userId: string): Promise<ServerUser | undefined> {
    if (!userId) return undefined;

    const row = await getUserRow(userId);

    if (!row) return undefined;

    const referralCount = await getReferralCount(userId);

    return mapUser(row, referralCount);
  },

  /**
   * Telegram authentication.
   *
   * Telegram users are represented by a real Supabase Auth user.
   */
  async getOrCreateUser(telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  }): Promise<{
    user: ServerUser;
    accessToken: string;
    refreshToken?: string;
  }> {
    let userId: string;

    const existing = await s()
      .from("users")
      .select("*")
      .eq("telegram_id", telegramUser.id)
      .maybeSingle();

    if (existing.data) {
      userId = existing.data.id;

      const existingSettings = getCustomSettings(existing.data);

      const { data, error } = await s()
        .from("users")
        .update({
          first_name:
            telegramUser.first_name || existing.data.first_name || "User",

          last_name: telegramUser.last_name ?? existing.data.last_name ?? null,

          username: telegramUser.username ?? existing.data.username ?? null,

          avatar_url:
            telegramUser.photo_url ?? existing.data.avatar_url ?? null,

          language: telegramUser.language_code?.startsWith("en")
            ? "en"
            : existing.data.language || "ar",

          updated_at: now(),

          custom_settings: existingSettings,
        })
        .eq("id", userId)
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to update Telegram user");
      }
    } else {
      const syntheticEmail = `telegram_${telegramUser.id}@telegram.persona.local`;

      const temporaryPassword = `${randomUUID()}A1!`;

      const { data: authData, error: authError } =
        await s().auth.admin.createUser({
          email: syntheticEmail,
          password: temporaryPassword,
          email_confirm: true,

          user_metadata: {
            telegram_id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
          },
        });

      if (authError || !authData.user) {
        throw authError || new Error("Failed to create Telegram Auth user");
      }

      userId = authData.user.id;

      const referralCode = `PERSONA-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;

      const { error } = await s()
        .from("users")
        .insert({
          id: userId,

          telegram_id: telegramUser.id,

          first_name: telegramUser.first_name || "User",

          last_name: telegramUser.last_name || null,

          username: telegramUser.username || null,

          email: syntheticEmail,

          avatar_url: telegramUser.photo_url || null,

          language: telegramUser.language_code?.startsWith("en") ? "en" : "ar",

          role: "user",

          level: 1,

          xp: 50,

          current_streak: 1,

          last_active_date: new Date().toISOString().slice(0, 10),

          onboarding_completed: false,

          referral_code: referralCode,

          referred_by: null,

          custom_settings: {},

          badges: ["explorer"],

          updated_at: now(),
        });

      if (error) {
        await s().auth.admin.deleteUser(userId);
        throw error;
      }
    }

    /**
     * Generate a temporary password so we can obtain
     * a REAL Supabase JWT session.
     */
    const temporaryPassword = `${randomUUID()}A1!`;

    const { error: passwordError } = await s().auth.admin.updateUserById(
      userId,
      {
        password: temporaryPassword,
      }
    );

    if (passwordError) {
      throw passwordError;
    }

    const { data: emailRow } = await s()
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    const email = emailRow?.email;

    if (!email) {
      throw new Error("Telegram account email is missing");
    }

    const { data: sessionData, error: sessionError } =
      await getSupabaseAuth().auth.signInWithPassword({
        email,
        password: temporaryPassword,
      });

    if (sessionError || !sessionData.session) {
      throw (
        sessionError || new Error("Failed to create Telegram Supabase session")
      );
    }

    await s()
      .from("users")
      .update({
        updated_at: now(),
        last_active_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", userId);

    const user = await this.getUser(userId);

    if (!user) {
      throw new Error("Failed to load Telegram user");
    }

    await this.logAudit(
      "USER_AUTH",
      user.id,
      "Authenticated via verified Telegram WebApp"
    );

    return {
      user,
      accessToken: sessionData.session.access_token,

      refreshToken: sessionData.session.refresh_token,
    };
  },

  /**
   * Update user.
   *
   * Only real users columns are written.
   */
  async updateUser(
    userId: string,
    updates: Partial<ServerUser>
  ): Promise<ServerUser | null> {
    if (!userId) return null;

    const existing = await getUserRow(userId);

    if (!existing) return null;

    const patch: Record<string, any> = {};

    if (updates.firstName !== undefined) {
      patch.first_name = updates.firstName;
    }

    if (updates.lastName !== undefined) {
      patch.last_name = updates.lastName || null;
    }

    if (updates.username !== undefined) {
      patch.username = updates.username || null;
    }

    if (updates.photoUrl !== undefined) {
      patch.avatar_url = updates.photoUrl || null;
    }

    if (updates.language !== undefined) {
      patch.language = updates.language;
    }

    if (updates.role !== undefined) {
      patch.role = updates.role;
    }

    if (updates.xp !== undefined) {
      patch.xp = updates.xp;
    }

    if (updates.level !== undefined) {
      patch.level = updates.level;
    }

    if (updates.badges !== undefined) {
      patch.badges = updates.badges;
    }

    if (updates.referralCode !== undefined) {
      patch.referral_code = updates.referralCode;
    }

    if (updates.referredBy !== undefined) {
      patch.referred_by = updates.referredBy || null;
    }

    if (updates.onboardingCompleted !== undefined) {
      patch.onboarding_completed = updates.onboardingCompleted;
    }

    /**
     * ServerUser.lastLogin maps to updated_at
     */
    if (updates.lastLogin !== undefined) {
      patch.updated_at = updates.lastLogin;
    }

    /**
     * onboardingData is stored inside custom_settings.
     */
    if (updates.onboardingData !== undefined) {
      const currentSettings = getCustomSettings(existing);

      patch.custom_settings = {
        ...currentSettings,

        onboardingData: updates.onboardingData,
      };
    }

    patch.updated_at = patch.updated_at || now();

    const { data, error } = await s()
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.getUser(userId);
  },

  /**
   * XP system.
   *
   * Updates users.xp + users.level
   * and records every XP operation in xp_logs.
   */
  async addXp(
    userId: string,
    amount: number,
    badgeAward?: string
  ): Promise<ServerUser | null> {
    const user = await this.getUser(userId);

    if (!user) return null;

    const badges = [...(user.badges || [])];

    if (badgeAward && !badges.includes(badgeAward)) {
      badges.push(badgeAward);
    }

    const oldXp = user.xp || 0;

    const newXp = oldXp + amount;

    const newLevel = Math.floor(newXp / 150) + 1;

    const { error } = await s()
      .from("users")
      .update({
        xp: newXp,
        level: newLevel,
        badges,
        updated_at: now(),
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    await s()
      .from("xp_logs")
      .insert({
        user_id: userId,

        level: "info",

        action: amount >= 0 ? "XP_EARNED" : "XP_DEDUCTED",

        meta: {
          amount,
          oldXp,
          newXp,
          oldLevel: user.level,
          newLevel,
          badgeAward: badgeAward || null,
        },
      });

    if (badgeAward && !user.badges.includes(badgeAward)) {
      await this.addNotification(userId, {
        title: "وسام جديد مفتوح 🎖️",

        message: `تهانينا! لقد حصلت على وسام جديد: ${badgeAward}`,

        type: "badge_unlocked",
      });
    }

    return this.getUser(userId);
  },

  /**
   * Save personality analysis.
   *
   * REAL TABLE:
   * analysis_reports
   */
  async saveAnalysisResult(
    result: StoredAnalysisResult
  ): Promise<StoredAnalysisResult> {
    const id = isUuid(result.id) ? result.id : randomUUID();

    const row = {
      id,

      user_id: result.userId,

      archetype_id: result.archetypeId,

      overall_score: result.overallScore,

      domain_scores: result.domainScores || {},

      /**
       * Frontend calls this "dimensions".
       * DB calls it "scores".
       */
      scores: result.dimensions || [],

      ai_report: result.aiReport || null,

      /**
       * Not represented in StoredAnalysisResult.
       * Keep null.
       */
      archetype_data: null,

      answers_snapshot: null,

      completion_time_seconds: result.completionTimeSeconds || 0,

      version: result.version || "2026.1",

      created_at: result.createdAt || now(),
    };

    const { error } = await s().from("analysis_reports").upsert(row);

    if (error) {
      throw error;
    }

    /**
     * XP reward for completing analysis.
     */
    await this.addXp(result.userId, 150, "completed_profile");

    await this.addNotification(result.userId, {
      title: "تحليل شخصيتك الجديد مكتمل 🧠",

      message: `تم تحليل إجاباتك بنجاح. نمطك هو: ${result.archetypeId}`,

      type: "analysis_ready",

      actionUrl: `/reports/${id}`,
    });

    return {
      ...result,
      id,
    };
  },

  /**
   * Get one analysis report.
   */
  async getAnalysisResult(
    reportId: string
  ): Promise<StoredAnalysisResult | undefined> {
    const { data, error } = await s()
      .from("analysis_reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,

      userId: data.user_id,

      createdAt: data.created_at,

      version: data.version || "2026.1",

      overallScore: Number(data.overall_score || 0),

      archetypeId: data.archetype_id || "",

      domainScores: data.domain_scores || {},

      dimensions: data.scores || [],

      aiReport: data.ai_report || undefined,

      isUnlockedPremium: Boolean(
        data.ai_report?.isUnlockedPremium ?? data.is_unlocked_premium ?? false
      ),

      completionTimeSeconds: data.completion_time_seconds || undefined,
    };
  },

  /**
   * Get all analysis reports for user.
   */
  async getUserAnalysisHistory(
    userId: string
  ): Promise<StoredAnalysisResult[]> {
    const { data, error } = await s()
      .from("analysis_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data || []).map((r: any) => ({
      id: r.id,

      userId: r.user_id,

      createdAt: r.created_at,

      version: r.version || "2026.1",

      overallScore: Number(r.overall_score || 0),

      archetypeId: r.archetype_id || "",

      domainScores: r.domain_scores || {},

      dimensions: r.scores || [],

      aiReport: r.ai_report || undefined,

      isUnlockedPremium: Boolean(r.ai_report?.isUnlockedPremium ?? false),

      completionTimeSeconds: r.completion_time_seconds || undefined,
    }));
  },

  /**
   * Growth history.
   *
   * There is NO user_progress table in your DB.
   *
   * Therefore growth is reconstructed from analysis_reports.
   */
  async getGrowthHistory(userId: string): Promise<GrowthMetric[]> {
    const { data, error } = await s()
      .from("analysis_reports")
      .select("created_at,domain_scores,overall_score")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data || []).map((r: any) => {
      const d = r.domain_scores || {};

      return {
        date: r.created_at,

        discipline: Number(d.behavioral || 0),

        emotionalAwareness: Number(d.emotional || 0),

        confidence: Number(d.social || 0),

        communication: Number(d.social || 0),

        stressManagement: Number(d.lifestyle || 0),

        overallScore: Number(r.overall_score || 0),
      };
    });
  },

  /**
   * Notifications.
   */
  async addNotification(
    userId: string,
    notif: Omit<StoredNotification, "id" | "userId" | "createdAt" | "read">
  ): Promise<StoredNotification> {
    const { data, error } = await s()
      .from("notifications")
      .insert({
        user_id: userId,

        title: notif.title,

        message: notif.message,

        type: notif.type,

        is_read: false,

        read: false,

        action_url: notif.actionUrl || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create notification");
    }

    return {
      id: data.id,

      userId: data.user_id,

      title: data.title,

      message: data.message,

      type: data.type,

      read: Boolean(data.is_read ?? data.read ?? false),

      createdAt: data.created_at,

      actionUrl: data.action_url || undefined,
    };
  },

  async getUserNotifications(userId: string): Promise<StoredNotification[]> {
    const { data, error } = await s()
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data || []).map((n: any) => ({
      id: n.id,

      userId: n.user_id,

      title: n.title,

      message: n.message,

      type: n.type,

      read: Boolean(n.is_read ?? n.read ?? false),

      createdAt: n.created_at,

      actionUrl: n.action_url || undefined,
    }));
  },

  async markNotificationRead(
    notifId: string,
    userId?: string
  ): Promise<boolean> {
    let query = s()
      .from("notifications")
      .update({
        is_read: true,
        read: true,
      })
      .eq("id", notifId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select("id").maybeSingle();

    return !error && !!data;
  },

  /**
   * Referrals.
   */
  async applyReferral(
    referrerCode: string,
    newUserId: string,
    newUserName: string
  ): Promise<boolean> {
    const { data: referrer } = await s()
      .from("users")
      .select("*")
      .eq("referral_code", referrerCode)
      .maybeSingle();

    if (!referrer || referrer.id === newUserId) {
      return false;
    }

    /**
     * Prevent duplicate referral.
     */
    const { data: existingReferral } = await s()
      .from("referrals")
      .select("id")
      .eq("referred_id", newUserId)
      .maybeSingle();

    if (existingReferral) {
      return false;
    }

    const { error } = await s().from("referrals").insert({
      referrer_id: referrer.id,

      referred_id: newUserId,

      xp_rewarded: 100,

      status: "joined",
    });

    if (error) {
      return false;
    }

    await s()
      .from("users")
      .update({
        referred_by: referrer.referral_code,

        updated_at: now(),
      })
      .eq("id", newUserId);

    await this.addXp(referrer.id, 100, "influencer");

    await this.addNotification(referrer.id, {
      title: "صديق جديد انضم عبر كودك 🎉",

      message: `انضم ${newUserName} إلى PERSONA وحصلت على +100 نقطة خبرة XP!`,

      type: "recommendation",
    });

    return true;
  },

  async getReferrals(userId: string): Promise<StoredReferral[]> {
    const { data, error } = await s()
      .from("referrals")
      .select("*")
      .eq("referrer_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    const rows = data || [];

    const result: StoredReferral[] = [];

    for (const r of rows) {
      let referredUserName = "User";

      const { data: referredUser } = await s()
        .from("users")
        .select("first_name,last_name")
        .eq("id", r.referred_id)
        .maybeSingle();

      if (referredUser) {
        referredUserName = `${referredUser.first_name || ""} ${
          referredUser.last_name || ""
        }`.trim();
      }

      result.push({
        id: r.id,

        referrerId: r.referrer_id,

        referredUserId: r.referred_id,

        referredUserName,

        createdAt: r.created_at,

        rewardXp: Number(r.xp_rewarded || 0),

        status: r.status === "pending" ? "pending" : "active",
      });
    }

    return result;
  },

  /**
   * Audit.
   *
   * system_logs schema was not provided.
   *
   * Therefore we deliberately DON'T insert an assumed schema here.
   * Authentication must never fail because of an optional audit log.
   */
  async logAudit(
    action: string,
    userId: string,
    details: string,
    status: "success" | "warning" | "error" = "success"
  ): Promise<void> {
    try {
      console.log(`[AUDIT:${status}]`, action, userId, details);
    } catch {
      // Audit is non-critical.
    }
  },

  /**
   * Email registration.
   */
  async registerUser(payload: {
    email?: string;
    password?: string;
    firstName: string;
    lastName?: string;
    username?: string;
    language?: "ar" | "en";
  }): Promise<ServerUser> {
    const email = clean(payload.email).toLowerCase();

    const password = payload.password || "";

    const firstName = clean(payload.firstName);

    if (!email || !password) {
      throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
    }

    if (!firstName) {
      throw new Error("الاسم الأول مطلوب");
    }

    if (password.length < 6) {
      throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }

    /**
     * Create REAL Supabase Auth user.
     */
    const { data: auth, error: authError } = await s().auth.admin.createUser({
      email,

      password,

      email_confirm: true,

      user_metadata: {
        first_name: firstName,

        last_name: payload.lastName,

        username: payload.username,
      },
    });

    if (authError || !auth.user) {
      throw authError || new Error("Registration failed");
    }

    const referralCode = `PERSONA-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;

    const { error } = await s()
      .from("users")
      .insert({
        id: auth.user.id,

        email,

        telegram_id: null,

        first_name: firstName,

        last_name: clean(payload.lastName) || null,

        username: clean(payload.username?.replace("@", "")) || null,

        avatar_url: null,

        language: payload.language || "ar",

        role: "user",

        level: 1,

        xp: 100,

        current_streak: 1,

        last_active_date: new Date().toISOString().slice(0, 10),

        onboarding_completed: false,

        referral_code: referralCode,

        referred_by: null,

        custom_settings: {},

        badges: ["explorer"],

        updated_at: now(),
      });

    if (error) {
      await s().auth.admin.deleteUser(auth.user.id);

      throw error;
    }

    await this.logAudit(
      "USER_REGISTER",
      auth.user.id,
      `New user registered via email: ${email}`,
      "success"
    );

    const user = await this.getUser(auth.user.id);

    if (!user) {
      throw new Error("Failed to load registered user");
    }

    return user;
  },

  /**
   * Login using:
   *
   * email
   * username
   * referral code
   * UUID
   */
  async loginUser(
    identifier: string,
    password?: string
  ): Promise<{
    user: ServerUser;
    accessToken: string;
    refreshToken?: string;
  } | null> {
    const cleanId = clean(identifier).toLowerCase();

    if (!cleanId || !password) {
      return null;
    }

    let email = cleanId;

    /**
     * If identifier is not email,
     * resolve it through users.
     */
    if (!cleanId.includes("@")) {
      let row: any = null;

      /**
       * username
       */
      const { data: usernameRow } = await s()
        .from("users")
        .select("email")
        .ilike("username", cleanId)
        .maybeSingle();

      row = usernameRow;

      /**
       * referral code
       */
      if (!row) {
        const { data: referralRow } = await s()
          .from("users")
          .select("email")
          .ilike("referral_code", cleanId)
          .maybeSingle();

        row = referralRow;
      }

      /**
       * UUID
       */
      if (!row && isUuid(cleanId)) {
        const { data: uuidRow } = await s()
          .from("users")
          .select("email")
          .eq("id", cleanId)
          .maybeSingle();

        row = uuidRow;
      }

      if (!row?.email) {
        return null;
      }

      email = row.email;
    }

    /**
     * REAL Supabase Auth login.
     */
    const { data, error } = await getSupabaseAuth().auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return null;
    }

    /**
     * Update activity.
     */
    await s()
      .from("users")
      .update({
        updated_at: now(),

        last_active_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", data.user.id);

    await this.logAudit(
      "USER_LOGIN",
      data.user.id,
      "User logged in through Supabase Auth",
      "success"
    );

    const user = await this.getUser(data.user.id);

    if (!user) {
      return null;
    }

    return {
      user,

      accessToken: data.session.access_token,

      refreshToken: data.session.refresh_token,
    };
  },

  /**
   * Chat history.
   */
  async saveChatMessage(msg: StoredChatMessage): Promise<void> {
    const { error } = await s()
      .from("chat_history")
      .insert({
        user_id: msg.userId,

        message_id: msg.id,

        role: msg.role,

        text: msg.text,

        timestamp: msg.timestamp,

        suggested_questions: msg.suggestedQuestions || [],
      });

    if (error) {
      throw error;
    }
  },

  async getChatHistory(userId: string): Promise<StoredChatMessage[]> {
    const { data, error } = await s()
      .from("chat_history")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", {
        ascending: true,
      })
      .limit(100);

    if (error) {
      throw error;
    }

    return (data || []).map((m: any) => ({
      id: m.message_id || m.id,

      userId: m.user_id,

      role: m.role,

      text: m.text,

      timestamp: m.timestamp,

      suggestedQuestions: m.suggested_questions || [],
    }));
  },

  /**
   * PERSONAL GOALS
   *
   * Real table:
   * personal_goals
   *
   * Goal check-ins:
   * goal_checkins
   */
  async getUserGoals(userId: string): Promise<PersonalGoal[]> {
    const { data, error } = await s()
      .from("personal_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    const goals = data || [];

    const result: PersonalGoal[] = [];

    for (const row of goals) {
      const { data: checkins } = await s()
        .from("goal_checkins")
        .select("*")
        .eq("goal_id", row.id)
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      result.push({
        id: row.id,

        userId: row.user_id,

        title: row.title_ar || row.title_en || "",

        category: row.category || "mindset",

        targetFrequency: row.frequency || "daily",

        targetDaysPerWeek: row.target_count || undefined,

        progress: row.target_count
          ? Math.min(
              100,
              Math.round(
                (Number(row.total_completions || 0) /
                  Number(row.target_count)) *
                  100
              )
            )
          : 0,

        streak: Number(row.current_streak || 0),

        createdAt: row.created_at,

        lastCheckIn: row.last_check_in_date
          ? `${row.last_check_in_date}T00:00:00.000Z`
          : undefined,

        checkIns: (checkins || []).map((c: any) => ({
          id: c.id,

          timestamp: c.created_at,

          note: c.reflection_note || undefined,

          status:
            c.status === "completed"
              ? "completed"
              : c.status === "progressed"
              ? "progressed"
              : "struggled",

          aiFeedback: c.ai_feedback || undefined,
        })),

        aiCheckInPrompt: row.ai_prompt || undefined,
      });
    }

    return result;
  },

  async saveGoal(goal: PersonalGoal): Promise<PersonalGoal> {
    const existing = await s()
      .from("personal_goals")
      .select("id")
      .eq("id", goal.id)
      .maybeSingle();

    const dimensionMap: Record<
      string,
      {
        key: string;
        ar: string;
        en: string;
      }
    > = {
      habits: {
        key: "habits",
        ar: "العادات",
        en: "Habits",
      },
      focus: {
        key: "focus",
        ar: "التركيز",
        en: "Focus",
      },
      vitality: {
        key: "vitality",
        ar: "الحيوية",
        en: "Vitality",
      },
      mindset: {
        key: "mindset",
        ar: "العقلية",
        en: "Mindset",
      },
      emotional: {
        key: "emotional",
        ar: "الوعي العاطفي",
        en: "Emotional Awareness",
      },
      social: {
        key: "social",
        ar: "التواصل الاجتماعي",
        en: "Social",
      },
      career: {
        key: "career",
        ar: "المسار المهني",
        en: "Career",
      },
    };

    const dimension = dimensionMap[goal.category] || {
      key: goal.category || "habits",
      ar: goal.category || "العادات",
      en: goal.category || "Habits",
    };

    const row = {
      id: goal.id,
      user_id: goal.userId,

      dimension_key: dimension.key,
      dimension_name_ar: dimension.ar,
      dimension_name_en: dimension.en,

      title_ar: goal.title,
      title_en: goal.title,

      category: goal.category,
      frequency: goal.targetFrequency,
      target_count: goal.targetDaysPerWeek || 1,

      current_streak: goal.streak || 0,
      last_streak: goal.streak || 0,

      total_completions: (goal.checkIns || []).filter(
        (c) => c.status === "completed"
      ).length,

      last_check_in_date: goal.lastCheckIn
        ? goal.lastCheckIn.slice(0, 10)
        : null,

      ai_prompt: goal.aiCheckInPrompt || null,

      is_active: true,
      created_at: goal.createdAt || now(),
      updated_at: now(),
    };

    const { error } = await s().from("personal_goals").upsert(row);

    if (error) {
      throw error;
    }
    /**
     * Only award XP on creation,
     * not every update.
     */
    if (!existing.data) {
      await this.addXp(goal.userId, 40, "goal_hunter");
    }

    return goal;
  },

  async updateGoal(
    userId: string,
    goalId: string,
    updates: Partial<PersonalGoal>
  ): Promise<PersonalGoal | null> {
    const { data, error } = await s()
      .from("personal_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const patch: Record<string, any> = {
      updated_at: now(),
    };

    if (updates.title !== undefined) {
      patch.title_ar = updates.title;

      patch.title_en = updates.title;
    }

    if (updates.category !== undefined) {
      patch.category = updates.category;
    }

    if (updates.targetFrequency !== undefined) {
      patch.frequency = updates.targetFrequency;
    }

    if (updates.targetDaysPerWeek !== undefined) {
      patch.target_count = updates.targetDaysPerWeek;
    }

    if (updates.streak !== undefined) {
      patch.current_streak = updates.streak;
    }

    if (updates.lastCheckIn !== undefined) {
      patch.last_check_in_date = updates.lastCheckIn
        ? updates.lastCheckIn.slice(0, 10)
        : null;
    }

    if (updates.aiCheckInPrompt !== undefined) {
      patch.ai_prompt = updates.aiCheckInPrompt;
    }

    const { error: updateError } = await s()
      .from("personal_goals")
      .update(patch)
      .eq("id", goalId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    const updated = await s()
      .from("personal_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", userId)
      .single();

    if (updated.error) {
      throw updated.error;
    }

    return this.getUserGoals(userId).then(
      (goals) => goals.find((g) => g.id === goalId) || null
    );
  },

  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const { error, count } = await s()
      .from("personal_goals")
      .delete({
        count: "exact",
      })
      .eq("id", goalId)
      .eq("user_id", userId);

    return !error && (count || 0) > 0;
  },

  /**
   * Record check-in in goal_checkins.
   *
   * Also updates aggregate fields on personal_goals.
   */
  async recordGoalCheckIn(
    userId: string,
    goalId: string,
    checkIn: Omit<GoalCheckIn, "id" | "timestamp">
  ): Promise<{
    goal: PersonalGoal;
    checkIn: GoalCheckIn;
  } | null> {
    const { data: goal } = await s()
      .from("personal_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!goal) {
      return null;
    }

    const checkInId = randomUUID();

    const timestamp = now();

    let xpAwarded = 0;

    if (checkIn.status === "completed") {
      xpAwarded = 30;
    } else if (checkIn.status === "progressed") {
      xpAwarded = 15;
    }

    const { error } = await s()
      .from("goal_checkins")
      .insert({
        id: checkInId,

        goal_id: goalId,

        user_id: userId,

        check_in_date: timestamp.slice(0, 10),

        status: checkIn.status,

        reflection_note: checkIn.note || null,

        ai_feedback: checkIn.aiFeedback || null,

        xp_awarded: xpAwarded,

        created_at: timestamp,
      });

    if (error) {
      throw error;
    }

    let currentStreak = Number(goal.current_streak || 0);

    let totalCompletions = Number(goal.total_completions || 0);

    if (checkIn.status === "completed") {
      currentStreak += 1;
      totalCompletions += 1;
    } else if (checkIn.status === "struggled") {
      currentStreak = 0;
    }

    const { error: updateError } = await s()
      .from("personal_goals")
      .update({
        current_streak: currentStreak,

        last_streak: currentStreak,

        total_completions: totalCompletions,

        last_check_in_date: timestamp.slice(0, 10),

        updated_at: timestamp,
      })
      .eq("id", goalId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    if (xpAwarded > 0) {
      await this.addXp(userId, xpAwarded);
    }

    const updatedGoals = await this.getUserGoals(userId);

    const updatedGoal = updatedGoals.find((g) => g.id === goalId);

    if (!updatedGoal) {
      return null;
    }

    const newCheckIn: GoalCheckIn = {
      id: checkInId,

      timestamp,

      note: checkIn.note,

      status: checkIn.status,

      aiFeedback: checkIn.aiFeedback,
    };

    return {
      goal: updatedGoal,

      checkIn: newCheckIn,
    };
  },

  /**
   * GROWTH CHALLENGES
   *
   * Uses the real normalized columns.
   */
  async getUserChallenges(userId: string): Promise<GrowthChallenge[]> {
    const { data, error } = await s()
      .from("growth_challenges")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => this.mapChallenge(row));
  },

  mapChallenge(row: any): GrowthChallenge {
    return {
      id: row.id,

      userId: row.user_id,

      dimensionKey: row.dimension_key,

      dimensionNameAr: row.dimension_name_ar,

      dimensionNameEn: row.dimension_name_en,

      dimensionScore: Number(row.dimension_score || 0),

      titleAr: row.title_ar,

      titleEn: row.title_en,

      descriptionAr: row.description_ar,

      descriptionEn: row.description_en,

      actionStepsAr: Array.isArray(row.action_steps_ar)
        ? row.action_steps_ar
        : [],

      actionStepsEn: Array.isArray(row.action_steps_en)
        ? row.action_steps_en
        : [],

      scientificRationaleAr: row.scientific_rationale_ar || "",

      scientificRationaleEn: row.scientific_rationale_en || "",

      durationHours: Number(row.duration_hours || 24),

      xpReward: Number(row.xp_reward || 50),

      status:
        row.status === "completed"
          ? "completed"
          : row.status === "expired"
          ? "expired"
          : "active",

      startedAt: row.started_at,

      expiresAt:
        row.expires_at ||
        new Date(
          new Date(row.started_at).getTime() +
            Number(row.duration_hours || 24) * 60 * 60 * 1000
        ).toISOString(),

      completedAt: row.completed_at || undefined,

      reflectionNote: row.user_reflection || undefined,

      aiEvaluation: row.ai_completion_feedback || undefined,

      /**
       * These two fields don't exist
       * as columns in your current DB.
       * Safe defaults.
       */
      difficulty: "standard",

      category: "mindset",
    };
  },

  async getActiveChallenge(userId: string): Promise<GrowthChallenge | null> {
    const { data, error } = await s()
      .from("growth_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const challenge = this.mapChallenge(data);

    if (
      challenge.expiresAt &&
      new Date(challenge.expiresAt).getTime() < Date.now()
    ) {
      await s()
        .from("growth_challenges")
        .update({
          status: "expired",
        })
        .eq("id", challenge.id)
        .eq("user_id", userId);

      return null;
    }

    return challenge;
  },

  async saveChallenge(
    userId: string,
    challenge: GrowthChallenge
  ): Promise<GrowthChallenge> {
    /**
     * Ensure only one active challenge.
     */
    if (challenge.status === "active") {
      await s()
        .from("growth_challenges")
        .update({
          status: "expired",
        })
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("id", challenge.id);
    }

    const { error } = await s()
      .from("growth_challenges")
      .upsert({
        id: challenge.id,

        user_id: userId,

        dimension_key: challenge.dimensionKey,

        dimension_name_ar: challenge.dimensionNameAr,

        dimension_name_en: challenge.dimensionNameEn,

        dimension_score: challenge.dimensionScore,

        title_ar: challenge.titleAr,

        title_en: challenge.titleEn,

        description_ar: challenge.descriptionAr,

        description_en: challenge.descriptionEn,

        action_steps_ar: challenge.actionStepsAr,

        action_steps_en: challenge.actionStepsEn,

        scientific_rationale_ar: challenge.scientificRationaleAr,

        scientific_rationale_en: challenge.scientificRationaleEn,

        duration_hours: challenge.durationHours,

        xp_reward: challenge.xpReward,

        status: challenge.status,

        user_reflection: challenge.reflectionNote || null,

        ai_completion_feedback: challenge.aiEvaluation || null,

        started_at: challenge.startedAt || now(),

        expires_at: challenge.expiresAt || null,

        completed_at: challenge.completedAt || null,

        updated_at: now(),
      });

    if (error) {
      throw error;
    }

    return challenge;
  },

  async completeChallenge(
    userId: string,
    challengeId: string,
    reflectionNote?: string,
    aiEvaluation?: string
  ): Promise<{
    challenge: GrowthChallenge;
    xpEarned: number;
  } | null> {
    const { data, error } = await s()
      .from("growth_challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const challenge = this.mapChallenge(data);

    const xpEarned = challenge.xpReward || 60;

    const completedAt = now();

    const { error: updateError } = await s()
      .from("growth_challenges")
      .update({
        status: "completed",

        completed_at: completedAt,

        user_reflection: reflectionNote || "",

        ai_completion_feedback: aiEvaluation || null,
      })
      .eq("id", challengeId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    await this.addXp(userId, xpEarned);

    return {
      challenge: {
        ...challenge,

        status: "completed",

        completedAt,

        reflectionNote: reflectionNote || "",

        aiEvaluation: aiEvaluation || "",
      },

      xpEarned,
    };
  },

  /**
   * ADMIN STATS
   */
  async getAdminStats(): Promise<Record<string, any>> {
    const [usersResult, reportsResult, xpLogsResult] = await Promise.all([
      s()
        .from("users")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(1000),

      s()
        .from("analysis_reports")
        .select("archetype_id,overall_score,created_at"),

      s()
        .from("xp_logs")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(15),
    ]);

    const users = usersResult.data || [];
    const reports = reportsResult.data || [];
    const logs = xpLogsResult.data || [];

    // ==========================================
    // REAL SUPABASE AUTH USERS
    // ==========================================

    const authUsersMap = new Map<string, any>();

    try {
      let page = 1;
      const perPage = 1000;

      while (true) {
        const { data, error } = await getSupabaseAuth().auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          console.error("[AdminStats] Auth users error:", error);
          break;
        }

        for (const authUser of data.users || []) {
          authUsersMap.set(authUser.id, authUser);
        }

        if (!data.users || data.users.length < perPage) {
          break;
        }

        page++;
      }
    } catch (error) {
      console.error("[AdminStats] Failed to load Supabase Auth users:", error);
    }

    // ==========================================
    // REFERRALS
    // ==========================================

    const referralCounts = new Map<string, number>();

    const { data: referrals } = await s()
      .from("referrals")
      .select("referrer_id");

    for (const referral of referrals || []) {
      const id = referral.referrer_id;

      referralCounts.set(id, (referralCounts.get(id) || 0) + 1);
    }

    // ==========================================
    // MERGE DATABASE USERS + SUPABASE AUTH
    // ==========================================

    const list = users.map((u: any) => {
      const mapped = mapUser(u, referralCounts.get(u.id) || 0);

      const authUser = authUsersMap.get(u.id);

      return {
        ...mapped,

        // Real email from Supabase Auth when available
        email: authUser?.email || mapped.email || undefined,

        // Real Auth creation time
        createdAt: authUser?.created_at || mapped.createdAt,

        // REAL LAST SIGN IN FROM SUPABASE AUTH
        lastLogin: authUser?.last_sign_in_at || mapped.lastLogin || undefined,
      };
    });

    // ==========================================
    // PREMIUM
    // ==========================================

    const premiumUsers = list.filter((u) =>
      ["premium", "admin", "super_admin"].includes(u.role)
    );

    // ==========================================
    // ARCHETYPES
    // ==========================================

    const counts: Record<string, number> = {};

    for (const report of reports) {
      const id = report.archetype_id || "unknown";

      counts[id] = (counts[id] || 0) + 1;
    }

    // ==========================================
    // ACTIVITY
    // ==========================================

    const nowMs = Date.now();

    const activeUsers24h = list.filter((u) => {
      if (!u.lastLogin) return false;

      const loginTime = new Date(u.lastLogin).getTime();

      return !Number.isNaN(loginTime) && nowMs - loginTime < 86400000;
    }).length;

    // ==========================================
    // NEW USERS
    // ==========================================

    const newUsers7d = list.filter((u) => {
      const createdTime = new Date(u.createdAt).getTime();

      return !Number.isNaN(createdTime) && nowMs - createdTime < 7 * 86400000;
    }).length;

    // ==========================================
    // AVERAGE SCORE
    // ==========================================

    const averageScore = reports.length
      ? Math.round(
          reports.reduce(
            (sum: number, report: any) =>
              sum + Number(report.overall_score || 0),
            0
          ) / reports.length
        )
      : 0;

    // ==========================================
    // AI REQUESTS
    // ==========================================

    let aiRequestsCount = 0;

    try {
      const { count } = await s().from("ai_requests").select("id", {
        count: "exact",
        head: true,
      });

      aiRequestsCount = count || 0;
    } catch {
      aiRequestsCount = 0;
    }

    // ==========================================
    // RETURN ADMIN TELEMETRY
    // ==========================================

    return {
      totalUsers: list.length,

      activeUsers24h,

      newUsers7d,

      completedAnalyses: reports.length,

      premiumUsers: premiumUsers.length,

      revenueEst: premiumUsers.length * 14.99,

      aiRequestsCount,

      averageScore,

      topArchetypes: Object.entries(counts)
        .map(([id, count]) => ({
          id,
          name: id,
          nameEn: id,
          count,
        }))
        .sort((a: any, b: any) => b.count - a.count),

      recentLogs: logs,

      // USERS FOR ADMIN DASHBOARD
      users: list.slice(0, 50),
    };
  },
};

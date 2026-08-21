import { randomUUID } from "crypto";
import { getSupabaseAdmin, getSupabaseAuth, getSupabaseAuthAdmin } from "./supabase";

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

const today = () => new Date().toISOString().slice(0, 10);

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getCustomSettings(row: any): Record<string, any> {
  if (!row?.custom_settings) {
    return {};
  }

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

async function findAuthUserByEmail(email: string): Promise<any | null> {
  const normalized = clean(email).toLowerCase();
  if (!normalized) return null;

  const admin = getSupabaseAuthAdmin();

  // Supabase admin.listUsers is paginated. Never assume the target account is
  // inside the first 1000 Auth users. Stop as soon as the requested email is
  // found or the returned page is smaller than the page size.
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const users = data.users || [];
    const match = users.find(
      (u) => (u.email || "").trim().toLowerCase() === normalized
    );

    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

function createReferralCode(): string {
  return `PERSONA-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
}

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
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("referrer_id", userId);

  if (error) {
    return 0;
  }

  return count || 0;
}

async function getUserRow(userId: string): Promise<any | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await s()
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function ensureAuthUserProfile(authUser: any): Promise<ServerUser> {
  const authId = String(authUser?.id || "").trim();
  const email = clean(authUser?.email).toLowerCase();

  if (!authId || !isUuid(authId)) {
    throw new Error("Authenticated user ID is invalid");
  }

  let user = await Db.getUser(authId);
  if (user) return user;

  // Legacy profile: the email belongs to this Auth identity but the public
  // profile still has the pre-Supabase UUID. Reconcile the existing data
  // instead of creating a second profile.
  if (email) {
    const { data: legacyRow, error: legacyError } = await s()
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (legacyError) throw legacyError;

    if (legacyRow?.id && legacyRow.id !== authId) {
      await Db.rekeyUserId(legacyRow.id, authId);
      user = await Db.getUser(authId);
      if (user) return user;
    }
  }

  // A valid Supabase Auth identity can exist without its application profile
  // (for example after a partially completed registration). Create the real
  // profile from Auth metadata; never invent an unrelated user identity.
  const meta = (authUser.user_metadata || {}) as Record<string, any>;
  const firstName = clean(meta.first_name) || clean(meta.name) || "User";
  const lastName = clean(meta.last_name);
  const username = clean(meta.username).replace(/^@/, "");

  const { error: profileError } = await s().from("users").insert({
    id: authId,
    email: email || null,
    telegram_id: null,
    first_name: firstName,
    last_name: lastName || null,
    username: username || null,
    avatar_url: clean(meta.avatar_url) || null,
    language: meta.language === "en" ? "en" : "ar",
    role: "user",
    level: 1,
    xp: 100,
    current_streak: 1,
    last_active_date: today(),
    onboarding_completed: false,
    referral_code: createReferralCode(),
    referred_by: null,
    custom_settings: {},
    badges: ["explorer"],
    updated_at: now(),
  });

  if (profileError && profileError.code !== "23505") {
    throw profileError;
  }

  user = await Db.getUser(authId);
  if (!user) throw new Error("Authenticated user profile could not be loaded");
  return user;
}

export const Db = {
  async init(): Promise<void> {
    const { error } = await s().from("users").select("id").limit(1);

    if (error) {
      console.error("[DB INIT]", error.message);
    }
  },

  async ensureAuthUserProfile(authUser: any): Promise<ServerUser> {
    return ensureAuthUserProfile(authUser);
  },

  async getUser(userId: string): Promise<ServerUser | undefined> {
    if (!userId) {
      return undefined;
    }

    const row = await getUserRow(userId);

    if (!row) {
      return undefined;
    }

    const referralCount = await getReferralCount(userId);

    return mapUser(row, referralCount);
  },

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
    if (!telegramUser?.id) {
      throw new Error("Invalid Telegram user");
    }

    let userId: string;
    let telegramPassword: string;

    const { data: existing, error: existingError } = await s()
      .from("users")
      .select("*")
      .eq("telegram_id", telegramUser.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      userId = existing.id;

      const existingSettings = getCustomSettings(existing);
      let accountEmail = clean(existing.email).toLowerCase();
      if (!accountEmail) {
        accountEmail = `telegram_${telegramUser.id}@telegram.persona.local`;
      }

      // Existing Telegram accounts may pre-date Supabase Auth. Ensure that
      // exactly one Auth identity exists before creating the session.
      let authUser = await findAuthUserByEmail(accountEmail);
      telegramPassword = `${randomUUID()}A1!`;

      if (!authUser) {
        const { data: createdAuth, error: createAuthError } =
          await getSupabaseAuthAdmin().auth.admin.createUser({
            email: accountEmail,
            password: telegramPassword,
            email_confirm: true,
            user_metadata: {
              telegram_id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              username: telegramUser.username,
            },
          });

        if (createAuthError || !createdAuth.user) {
          throw createAuthError || new Error("Failed to create Telegram Auth user");
        }
        authUser = createdAuth.user;
      } else {
        const { error: updateAuthError } =
          await getSupabaseAuthAdmin().auth.admin.updateUserById(authUser.id, {
            password: telegramPassword,
            email_confirm: true,
          });
        if (updateAuthError) throw updateAuthError;
      }

      if (userId !== authUser.id) {
        await Db.rekeyUserId(userId, authUser.id);
        userId = authUser.id;
      }

      const { data, error } = await s()
        .from("users")
        .update({
          first_name: telegramUser.first_name || existing.first_name || "User",

          last_name: telegramUser.last_name ?? existing.last_name ?? null,

          username: telegramUser.username ?? existing.username ?? null,

          avatar_url: telegramUser.photo_url ?? existing.avatar_url ?? null,

          language: telegramUser.language_code?.startsWith("en")
            ? "en"
            : existing.language || "ar",

          email: accountEmail,

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

      telegramPassword = `${randomUUID()}A1!`;

      const { data: authData, error: authError } =
        await getSupabaseAuthAdmin().auth.admin.createUser({
          email: syntheticEmail,

          password: telegramPassword,

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

      const referralCode = createReferralCode();

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

          last_active_date: today(),

          onboarding_completed: false,

          referral_code: referralCode,

          referred_by: null,

          custom_settings: {},

          badges: ["explorer"],

          updated_at: now(),
        });

      if (error) {
        await getSupabaseAuthAdmin().auth.admin.deleteUser(userId);

        throw error;
      }
    }


    const { data: emailRow, error: emailError } = await s()
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (emailError) {
      throw emailError;
    }

    const email = emailRow?.email;

    if (!email) {
      throw new Error("Telegram account email is missing");
    }

    const { data: sessionData, error: sessionError } =
      await getSupabaseAuth().auth.signInWithPassword({
        email,

        password: telegramPassword,
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

        last_active_date: today(),
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

  async updateUser(
    userId: string,
    updates: Partial<ServerUser>
  ): Promise<ServerUser | null> {
    if (!userId) {
      return null;
    }

    const existing = await getUserRow(userId);

    if (!existing) {
      return null;
    }

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

    if (updates.lastLogin !== undefined) {
      patch.updated_at = updates.lastLogin;
    }

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

  async addXp(
    userId: string,
    amount: number,
    badgeAward?: string
  ): Promise<ServerUser | null> {
    if (!userId || !Number.isFinite(amount)) {
      return null;
    }

    const user = await this.getUser(userId);

    if (!user) {
      return null;
    }

    const badges = [...(user.badges || [])];

    const hadBadge = badgeAward ? badges.includes(badgeAward) : true;

    if (badgeAward && !hadBadge) {
      badges.push(badgeAward);
    }

    const oldXp = Number(user.xp || 0);

    const newXp = Math.max(0, oldXp + amount);

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

    const { error: xpLogError } = await s()
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

    if (xpLogError) {
      console.error("[XP LOG]", xpLogError.message);
    }

    if (badgeAward && !hadBadge) {
      try {
        await this.addNotification(userId, {
          title: "وسام جديد مفتوح 🎖️",

          message: `تهانينا! لقد حصلت على وسام جديد: ${badgeAward}`,

          type: "badge_unlocked",
        });
      } catch (error) {
        console.error("[BADGE NOTIFICATION]", error);
      }
    }

    return this.getUser(userId);
  },

  async saveAnalysisResult(
    result: StoredAnalysisResult
  ): Promise<StoredAnalysisResult> {
    if (!result?.userId) {
      throw new Error("Analysis userId is required");
    }

    let id = isUuid(result.id) ? result.id : randomUUID();

    const { data: existing } = await s()
      .from("analysis_reports")
      .select("id,user_id")
      .eq("id", id)
      .maybeSingle();

    if (existing && existing.user_id !== result.userId) {
      id = randomUUID();
    }

    const row = {
      id,

      user_id: result.userId,

      archetype_id: result.archetypeId,

      overall_score: result.overallScore,

      domain_scores: result.domainScores || {},

      scores: result.dimensions || [],

      ai_report: result.aiReport || null,

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

    if (!existing) {
      await this.addXp(result.userId, 150, "completed_profile");

      try {
        await this.addNotification(result.userId, {
          title: "تحليل شخصيتك الجديد مكتمل 🧠",

          message: `تم تحليل إجاباتك بنجاح. نمطك هو: ${result.archetypeId}`,

          type: "analysis_ready",

          actionUrl: `/reports/${id}`,
        });
      } catch (error) {
        console.error("[ANALYSIS NOTIFICATION]", error);
      }
    }

    return {
      ...result,

      id,
    };
  },

  async getAnalysisResult(
    reportId: string
  ): Promise<StoredAnalysisResult | undefined> {
    if (!reportId) {
      return undefined;
    }

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

      isUnlockedPremium: Boolean(
        r.ai_report?.isUnlockedPremium ?? r.is_unlocked_premium ?? false
      ),

      completionTimeSeconds: r.completion_time_seconds || undefined,
    }));
  },

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

      read: Boolean(data.is_read || false),

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

      read: Boolean(n.is_read || false),

      createdAt: n.created_at,

      actionUrl: n.action_url || undefined,
    }));
  },

  async markNotificationRead(
    notifId: string,
    userId?: string
  ): Promise<boolean> {
    if (!notifId) {
      return false;
    }

    let query = s()
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notifId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select("id").maybeSingle();

    return !error && !!data;
  },

  async applyReferral(
    referrerCode: string,
    newUserId: string,
    newUserName: string
  ): Promise<boolean> {
    const code = clean(referrerCode).toUpperCase();

    if (!code || !newUserId) {
      return false;
    }

    const { data: referrer, error: referrerError } = await s()
      .from("users")
      .select("*")
      .ilike("referral_code", code)
      .maybeSingle();

    if (referrerError || !referrer || referrer.id === newUserId) {
      return false;
    }

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

    try {
      await this.addNotification(referrer.id, {
        title: "صديق جديد انضم عبر كودك 🎉",

        message: `انضم ${
          newUserName || "مستخدم"
        } إلى PERSONA وحصلت على +100 نقطة خبرة XP!`,

        type: "recommendation",
      });
    } catch (error) {
      console.error("[REFERRAL NOTIFICATION]", error);
    }

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
        referredUserName =
          `${referredUser.first_name || ""} ${
            referredUser.last_name || ""
          }`.trim() || "User";
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

  async rekeyUserId(oldUserId: string, newUserId: string): Promise<void> {
    if (!isUuid(oldUserId) || !isUuid(newUserId) || oldUserId === newUserId) return;

    const { error } = await s().rpc("rekey_persona_user", {
      p_old_id: oldUserId,
      p_new_id: newUserId,
    });

    if (error) {
      throw error;
    }
  },

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

    const lastName = clean(payload.lastName);

    const username = clean(payload.username).replace(/^@/, "");

    if (!email || !password) {
      throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
    }

    if (!firstName) {
      throw new Error("الاسم الأول مطلوب");
    }

    if (password.length < 6) {
      throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }
    // Check both application DB and Supabase Auth before creating the account.
    const { data: existingRows, error: existingDbError } = await s()
      .from("users")
      .select("id,email")
      .eq("email", email)
      .limit(1);

    if (existingDbError) {
      throw existingDbError;
    }

    if (existingRows && existingRows.length > 0) {
      throw new Error("هذا البريد الإلكتروني مستخدم مسبقاً");
    }

    // Supabase Auth is the source of truth for credentials.
    // The service-role client is used only for server-side admin operations.
    const { data: auth, error: authError } =
      await getSupabaseAuthAdmin().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName || undefined,
          username: username || undefined,
        },
      });

    if (authError || !auth.user) {
      throw authError || new Error("Registration failed");
    }

    const referralCode = createReferralCode();

    const { error } = await s()
      .from("users")
      .insert({
        id: auth.user.id,

        email,

        telegram_id: null,

        first_name: firstName,

        last_name: lastName || null,

        username: username || null,

        avatar_url: null,

        language: payload.language || "ar",

        role: "user",

        level: 1,

        xp: 100,

        current_streak: 1,

        last_active_date: today(),

        onboarding_completed: false,

        referral_code: referralCode,

        referred_by: null,

        custom_settings: {},

        badges: ["explorer"],

        updated_at: now(),
      });

    if (error) {
      await getSupabaseAuthAdmin().auth.admin.deleteUser(auth.user.id);

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

  async loginUser(
    identifier: string,
    password?: string
  ): Promise<{
    user: ServerUser;
    accessToken: string;
    refreshToken?: string;
  } | null> {
    const cleanId = clean(identifier).toLowerCase();
    const cleanPassword = clean(password);

    if (!cleanId || !cleanPassword) return null;

    let email = cleanId;
    let dbUserId: string | null = null;

    // Email login. For username/referral/UUID login, resolve the canonical
    // email from public.users first.
    if (!cleanId.includes("@")) {
      let row: any = null;

      const { data: usernameRow, error: usernameError } = await s()
        .from("users")
        .select("id,email")
        .ilike("username", cleanId)
        .maybeSingle();

      if (usernameError) throw usernameError;
      row = usernameRow;

      if (!row) {
        const { data: referralRow, error: referralError } = await s()
          .from("users")
          .select("id,email")
          .ilike("referral_code", cleanId)
          .maybeSingle();
        if (referralError) throw referralError;
        row = referralRow;
      }

      if (!row && isUuid(cleanId)) {
        const { data: uuidRow, error: uuidError } = await s()
          .from("users")
          .select("id,email")
          .eq("id", cleanId)
          .maybeSingle();
        if (uuidError) throw uuidError;
        row = uuidRow;
      }

      if (!row?.email) return null;
      email = String(row.email).trim().toLowerCase();
      dbUserId = row.id;
    } else {
      const { data: row, error } = await s()
        .from("users")
        .select("id,email")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      if (row) dbUserId = row.id;
    }

    // Credentials are verified only by Supabase Auth.
    const { data, error } = await getSupabaseAuth().auth.signInWithPassword({
      email,
      password: cleanPassword,
    });

    if (error || !data.user || !data.session) {
      console.error("[LOGIN ERROR]", error?.message);
      return null;
    }

    // Critical integrity check: the application row MUST use the same UUID
    // as auth.users. Never silently create a second identity here.
    if (dbUserId && dbUserId !== data.user.id) {
      // Legacy account: auth.users and public.users have the same email but
      // different UUIDs. Move the application data to the Auth UUID.
      await this.rekeyUserId(dbUserId, data.user.id);
    }

    let user = await this.getUser(data.user.id);

    if (!user) {
      // Auth-only account: create its application profile now.
      const meta = (data.user.user_metadata || {}) as Record<string, any>;
      const referralCode = createReferralCode();

      const { error: profileError } = await s().from("users").insert({
        id: data.user.id,
        email,
        telegram_id: null,
        first_name: clean(meta.first_name) || "User",
        last_name: clean(meta.last_name) || null,
        username: clean(meta.username).replace(/^@/, "") || null,
        avatar_url: null,
        language: meta.language === "en" ? "en" : "ar",
        role: "user",
        level: 1,
        xp: 100,
        current_streak: 1,
        last_active_date: today(),
        onboarding_completed: false,
        referral_code: referralCode,
        referred_by: null,
        custom_settings: {},
        badges: ["explorer"],
        updated_at: now(),
      });

      if (profileError && profileError.code !== "23505") {
        throw profileError;
      }

      user = await this.getUser(data.user.id);
    }

    if (!user) return null;

    await s()
      .from("users")
      .update({ updated_at: now(), last_active_date: today() })
      .eq("id", data.user.id);

    await this.logAudit("USER_LOGIN", user.id, "Login successful", "success");

    return {
      user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },
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
      const { data: checkins, error: checkinsError } = await s()
        .from("goal_checkins")
        .select("*")
        .eq("goal_id", row.id)
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (checkinsError) {
        throw checkinsError;
      }

      const targetCount = Number(row.target_count || 0);

      const totalCompletions = Number(row.total_completions || 0);

      result.push({
        id: row.id,

        userId: row.user_id,

        title: row.title_ar || row.title_en || "",

        category: row.category || "mindset",

        targetFrequency: row.frequency || "daily",

        targetDaysPerWeek: targetCount || undefined,

        progress:
          targetCount > 0
            ? Math.min(100, Math.round((totalCompletions / targetCount) * 100))
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
    if (!goal?.userId) {
      throw new Error("Goal userId is required");
    }

    let goalId = isUuid(goal.id) ? goal.id : randomUUID();

    const { data: existing } = await s()
      .from("personal_goals")
      .select("id,user_id")
      .eq("id", goalId)
      .maybeSingle();

    if (existing && existing.user_id !== goal.userId) {
      goalId = randomUUID();
    }

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

    const checkIns = goal.checkIns || [];

    const totalCompletions = checkIns.filter(
      (c) => c.status === "completed"
    ).length;

    const row = {
      id: goalId,

      user_id: goal.userId,

      dimension_key: dimension.key,

      dimension_name_ar: dimension.ar,

      dimension_name_en: dimension.en,

      title_ar: goal.title,

      title_en: goal.title,

      category: goal.category,

      frequency: goal.targetFrequency,

      target_count: Number(goal.targetDaysPerWeek || 1),

      current_streak: Number(goal.streak || 0),

      last_streak: Number(goal.streak || 0),

      total_completions: totalCompletions,

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

    if (!existing) {
      await this.addXp(goal.userId, 40, "goal_hunter");
    }

    return {
      ...goal,
      id: goalId,
    };
  },

  async updateGoal(
    userId: string,
    goalId: string,
    updates: Partial<PersonalGoal>
  ): Promise<PersonalGoal | null> {
    if (!userId || !goalId) {
      return null;
    }

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

      const dimension = dimensionMap[updates.category];

      if (dimension) {
        patch.dimension_key = dimension.key;

        patch.dimension_name_ar = dimension.ar;

        patch.dimension_name_en = dimension.en;
      }
    }

    if (updates.targetFrequency !== undefined) {
      patch.frequency = updates.targetFrequency;
    }

    if (updates.targetDaysPerWeek !== undefined) {
      patch.target_count = Number(updates.targetDaysPerWeek);
    }

    if (updates.streak !== undefined) {
      patch.current_streak = Number(updates.streak);

      patch.last_streak = Number(updates.streak);
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

    const goals = await this.getUserGoals(userId);

    return goals.find((g) => g.id === goalId) || null;
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

  async recordGoalCheckIn(
    userId: string,
    goalId: string,
    checkIn: Omit<GoalCheckIn, "id" | "timestamp">
  ): Promise<{
    goal: PersonalGoal;
    checkIn: GoalCheckIn;
  } | null> {
    const { data: goal, error: goalError } = await s()
      .from("personal_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (goalError || !goal) {
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
    const startedAt = row.started_at || row.created_at || now();

    const durationHours = Number(row.duration_hours || 24);

    const expiresAt =
      row.expires_at ||
      new Date(
        new Date(startedAt).getTime() + durationHours * 60 * 60 * 1000
      ).toISOString();

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

      durationHours,

      xpReward: Number(row.xp_reward || 50),

      status:
        row.status === "completed"
          ? "completed"
          : row.status === "expired"
          ? "expired"
          : "active",

      startedAt,

      expiresAt,

      completedAt: row.completed_at || undefined,

      reflectionNote: row.user_reflection || undefined,

      aiEvaluation: row.ai_completion_feedback || undefined,

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

    if (error) {
      throw error;
    }

    if (!data) {
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
          updated_at: now(),
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
    if (!userId || !challenge) {
      throw new Error("Invalid challenge");
    }

    const challengeId = isUuid(challenge.id) ? challenge.id : randomUUID();

    if (challenge.status === "active") {
      await s()
        .from("growth_challenges")
        .update({
          status: "expired",

          updated_at: now(),
        })
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("id", challengeId);
    }

    const startedAt = challenge.startedAt || now();

    const expiresAt =
      challenge.expiresAt ||
      new Date(
        new Date(startedAt).getTime() +
          Number(challenge.durationHours || 24) * 60 * 60 * 1000
      ).toISOString();

    const { error } = await s()
      .from("growth_challenges")
      .upsert({
        id: challengeId,

        user_id: userId,

        dimension_key: challenge.dimensionKey,

        dimension_name_ar: challenge.dimensionNameAr,

        dimension_name_en: challenge.dimensionNameEn,

        dimension_score: challenge.dimensionScore,

        title_ar: challenge.titleAr,

        title_en: challenge.titleEn,

        description_ar: challenge.descriptionAr,

        description_en: challenge.descriptionEn,

        action_steps_ar: challenge.actionStepsAr || [],

        action_steps_en: challenge.actionStepsEn || [],

        scientific_rationale_ar: challenge.scientificRationaleAr || "",

        scientific_rationale_en: challenge.scientificRationaleEn || "",

        duration_hours: Number(challenge.durationHours || 24),

        xp_reward: Number(challenge.xpReward || 50),

        status: challenge.status,

        user_reflection: challenge.reflectionNote || null,

        ai_completion_feedback: challenge.aiEvaluation || null,

        started_at: startedAt,

        expires_at: expiresAt,

        completed_at: challenge.completedAt || null,

        updated_at: now(),
      });

    if (error) {
      throw error;
    }

    return {
      ...challenge,

      id: challengeId,

      userId: userId,

      startedAt,

      expiresAt,
    };
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

    if (challenge.status === "completed") {
      return {
        challenge,

        xpEarned: 0,
      };
    }

    if (challenge.status === "expired") {
      return null;
    }

    const xpEarned = Number(challenge.xpReward || 60);

    const completedAt = now();

    const { error: updateError } = await s()
      .from("growth_challenges")
      .update({
        status: "completed",

        completed_at: completedAt,

        user_reflection: reflectionNote || "",

        ai_completion_feedback: aiEvaluation || null,

        updated_at: completedAt,
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

    if (usersResult.error) {
      console.error("[AdminStats] Users:", usersResult.error.message);
    }

    if (reportsResult.error) {
      console.error("[AdminStats] Reports:", reportsResult.error.message);
    }

    if (xpLogsResult.error) {
      console.error("[AdminStats] XP logs:", xpLogsResult.error.message);
    }

    const users = usersResult.data || [];

    const reports = reportsResult.data || [];

    const logs = xpLogsResult.data || [];

    const authUsersMap = new Map<string, any>();

    try {
      let page = 1;

      const perPage = 1000;

      while (true) {
        const { data, error } = await getSupabaseAuthAdmin().auth.admin.listUsers({
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

    const referralCounts = new Map<string, number>();

    const { data: referrals, error: referralsError } = await s()
      .from("referrals")
      .select("referrer_id");

    if (referralsError) {
      console.error("[AdminStats] Referrals:", referralsError.message);
    }

    for (const referral of referrals || []) {
      const id = referral.referrer_id;

      referralCounts.set(id, (referralCounts.get(id) || 0) + 1);
    }

    const list = users.map((u: any) => {
      const mapped = mapUser(u, referralCounts.get(u.id) || 0);

      const authUser = authUsersMap.get(u.id);

      return {
        ...mapped,

        email: authUser?.email || mapped.email || undefined,

        createdAt: authUser?.created_at || mapped.createdAt,

        lastLogin: authUser?.last_sign_in_at || mapped.lastLogin || undefined,
      };
    });

    const premiumUsers = list.filter((u) =>
      ["premium", "admin", "super_admin"].includes(u.role)
    );

    const counts: Record<string, number> = {};

    for (const report of reports) {
      const id = report.archetype_id || "unknown";

      counts[id] = (counts[id] || 0) + 1;
    }

    const nowMs = Date.now();

    const activeUsers24h = list.filter((u) => {
      if (!u.lastLogin) {
        return false;
      }

      const loginTime = new Date(u.lastLogin).getTime();

      return !Number.isNaN(loginTime) && nowMs - loginTime < 86400000;
    }).length;

    const newUsers7d = list.filter((u) => {
      if (!u.createdAt) {
        return false;
      }

      const createdTime = new Date(u.createdAt).getTime();

      return !Number.isNaN(createdTime) && nowMs - createdTime < 7 * 86400000;
    }).length;

    const averageScore = reports.length
      ? Math.round(
          reports.reduce(
            (sum: number, report: any) =>
              sum + Number(report.overall_score || 0),
            0
          ) / reports.length
        )
      : 0;

    let aiRequestsCount = 0;

    try {
      const { count, error: aiError } = await s()
        .from("ai_requests")
        .select("id", {
          count: "exact",
          head: true,
        });

      if (!aiError) {
        aiRequestsCount = count || 0;
      }
    } catch {
      aiRequestsCount = 0;
    }

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

      users: list.slice(0, 50),
    };
  },
};

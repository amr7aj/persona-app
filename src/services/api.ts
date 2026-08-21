import {
  UserProfile,
  AnalysisResult,
  Question,
  GrowthMetric,
  BotNotification,
  AdminStats,
  PersonalGoal,
  GoalCategory,
  GoalFrequency,
  GoalCheckIn,
  GrowthChallenge,
} from "../types";

const configuredApiBaseUrl = String(
  (import.meta as any).env?.VITE_API_BASE_URL || ""
).trim().replace(/\/$/, "");

// In local development the Express server and Vite share the same origin.
// Keeping this same-origin by default prevents a local browser session from
// accidentally sending credentials to the production Railway API.
// For production/Capacitor builds, set VITE_API_BASE_URL to the deployed API.
const API_BASE_URL =
  (import.meta as any).env?.DEV === true
    ? ""
    : configuredApiBaseUrl;

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("persona_refresh_token");
    if (!refreshToken) return null;

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshJson = await refreshRes.json();
      if (!refreshRes.ok || !refreshJson.success || !refreshJson.data?.token) {
        localStorage.removeItem("persona_token");
        localStorage.removeItem("persona_refresh_token");
        return null;
      }

      localStorage.setItem("persona_token", refreshJson.data.token);
      if (refreshJson.data.refreshToken) {
        localStorage.setItem("persona_refresh_token", refreshJson.data.refreshToken);
      }
      return refreshJson.data.token as string;
    } catch {
      localStorage.removeItem("persona_token");
      localStorage.removeItem("persona_refresh_token");
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("persona_token")
      : null;

  let res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  const isAuthEndpoint =
    url === "/api/auth/login" ||
    url === "/api/auth/register" ||
    url === "/api/auth/refresh" ||
    url === "/api/auth/logout" ||
    url === "/api/auth/telegram" ||
    url === "/api/auth/me" ||
    url === "/api/auth/repair-legacy";

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !isAuthEndpoint
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...(options?.headers || {}),
        },
      });
    }
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(
        `Server returned error (${res.status}): ${rawText.substring(0, 100)}`
      );
    }
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(`Unexpected non-JSON response from ${url}`);
    }
  }

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || `HTTP Error ${res.status}`);
  }
  return json.data as T;
}

export const Api = {
  async authenticateTelegram(
    initData: string
  ): Promise<{ user: UserProfile; token: string }> {
    const res = await fetchJson<{ user: UserProfile; token: string }>(
      "/api/auth/telegram",
      {
        method: "POST",
        body: JSON.stringify({ initData }),
      }
    );

    localStorage.setItem("persona_token", res.token);
    if ((res as any).refreshToken)
      localStorage.setItem("persona_refresh_token", (res as any).refreshToken);
    return res;
  },

  async registerUser(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    username?: string;
    language?: "ar" | "en";
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetchJson<{ user: UserProfile; token: string }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    localStorage.setItem("persona_token", res.token);
    if ((res as any).refreshToken)
      localStorage.setItem("persona_refresh_token", (res as any).refreshToken);
    return res;
  },

  async loginUser(payload: {
    identifier: string;
    password: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await fetchJson<{ user: UserProfile; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    localStorage.setItem("persona_token", res.token);
    if ((res as any).refreshToken)
      localStorage.setItem("persona_refresh_token", (res as any).refreshToken);
    return res;
  },

  async logout(): Promise<void> {
    const accessToken = localStorage.getItem("persona_token") || "";
    const refreshToken = localStorage.getItem("persona_refresh_token") || "";
    try {
      await fetchJson("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ accessToken, refreshToken }),
      });
    } finally {
      localStorage.removeItem("persona_token");
      localStorage.removeItem("persona_refresh_token");
      localStorage.removeItem("persona_active_user_id");
    }
  },

  async getCurrentUser(): Promise<UserProfile> {
    return fetchJson<UserProfile>("/api/auth/me");
  },

  async demoLogin(userId: string): Promise<{ user: UserProfile; token: string; refreshToken?: string }> {
    const res = await fetchJson<{ user: UserProfile; token: string; refreshToken?: string }>(
      "/api/auth/demo-login",
      { method: "POST", body: JSON.stringify({ userId }) }
    );
    localStorage.setItem("persona_token", res.token);
    if (res.refreshToken) localStorage.setItem("persona_refresh_token", res.refreshToken);
    return res;
  },

  async getDemoAccounts(): Promise<
    Array<{
      id: string;
      name: string;
      username: string;
      email?: string;
      role: string;
      level: number;
      photoUrl?: string;
    }>
  > {
    return fetchJson("/api/auth/demo-accounts");
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    return fetchJson(`/api/user/profile/${userId}`);
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    return fetchJson("/api/user/update", {
      method: "POST",
      body: JSON.stringify({ userId, updates }),
    });
  },

  async saveOnboarding(
    userId: string,
    onboardingData: any
  ): Promise<UserProfile> {
    return fetchJson("/api/user/onboarding", {
      method: "POST",
      body: JSON.stringify({ userId, onboardingData }),
    });
  },

  async getQuestions(options?: {
    mode?: string;
    category?: string;
    randomize?: boolean;
  }): Promise<{
    total: number;
    mode: string;
    categories: string[];
    questions: Question[];
  }> {
    const params = new URLSearchParams();
    if (options?.mode) params.append("mode", options.mode);
    if (options?.category) params.append("category", options.category);
    if (options?.randomize !== undefined)
      params.append("randomize", String(options.randomize));
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchJson(`/api/questions${query}`);
  },

  async submitAnalysis(payload: {
    userId: string;
    answers: Array<{
      questionId: string;
      category: string;
      dimension: string;
      optionId: string;
      value: number;
    }>;
    completionTimeSeconds?: number;
    version?: string;
  }): Promise<{ report: AnalysisResult }> {
    return fetchJson("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getReport(reportId: string): Promise<AnalysisResult> {
    return fetchJson(`/api/reports/${reportId}`);
  },

  async getUserReports(userId: string): Promise<AnalysisResult[]> {
    return fetchJson(`/api/reports/user/${userId}`);
  },

  async getUserGrowth(userId: string): Promise<GrowthMetric[]> {
    return fetchJson(`/api/user/growth/${userId}`);
  },

  async upgradeSubscription(
    userId: string,
    tier?: string
  ): Promise<UserProfile> {
    return fetchJson("/api/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify({ userId, tier }),
    });
  },

  async getReferralData(userId: string): Promise<{
    referralCode: string;
    referralCount: number;
    totalXpEarned: number;
    records: any[];
  }> {
    return fetchJson(`/api/referrals/${userId}`);
  },

  async applyReferral(
    referralCode: string,
    newUserId: string,
    newUserName: string
  ): Promise<{ message: string }> {
    return fetchJson("/api/referrals/apply", {
      method: "POST",
      body: JSON.stringify({ referralCode, newUserId, newUserName }),
    });
  },

  async getNotifications(userId: string): Promise<BotNotification[]> {
    return fetchJson(`/api/notifications/${userId}`);
  },

  async markNotificationRead(notifId: string): Promise<{ read: boolean }> {
    return fetchJson("/api/notifications/read", {
      method: "POST",
      body: JSON.stringify({ notifId }),
    });
  },

  async getUserGoals(userId: string): Promise<PersonalGoal[]> {
    return fetchJson(`/api/goals/${userId}`);
  },

  async createGoal(payload: {
    userId: string;
    title: string;
    category: GoalCategory;
    targetFrequency: GoalFrequency;
    targetDaysPerWeek?: number;
  }): Promise<PersonalGoal> {
    return fetchJson("/api/goals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async recordGoalCheckIn(payload: {
    userId: string;
    goalId: string;
    status: "completed" | "progressed" | "struggled";
    note?: string;
  }): Promise<{ goal: PersonalGoal; checkIn: GoalCheckIn }> {
    return fetchJson("/api/goals/checkin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteGoal(
    userId: string,
    goalId: string
  ): Promise<{ deleted: boolean }> {
    return fetchJson(`/api/goals/${userId}/${goalId}`, {
      method: "DELETE",
    });
  },

  async refreshGoalAIPrompt(
    userId: string,
    goalId: string
  ): Promise<PersonalGoal> {
    return fetchJson("/api/goals/refresh-ai-prompt", {
      method: "POST",
      body: JSON.stringify({ userId, goalId }),
    });
  },

  async getActiveChallenge(userId: string): Promise<GrowthChallenge> {
    return fetchJson(`/api/challenges/active/${userId}`);
  },

  async rerollChallenge(userId: string): Promise<GrowthChallenge> {
    return fetchJson("/api/challenges/reroll", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  async completeChallenge(payload: {
    userId: string;
    challengeId: string;
    reflectionNote?: string;
  }): Promise<{
    challenge: GrowthChallenge;
    xpEarned: number;
    aiFeedback: string;
  }> {
    return fetchJson("/api/challenges/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getChallengeHistory(userId: string): Promise<GrowthChallenge[]> {
    return fetchJson(`/api/challenges/history/${userId}`);
  },

  async sendBotCommand(command: string, user?: any): Promise<any> {
    return fetchJson("/api/bot/command", {
      method: "POST",
      body: JSON.stringify({ command, user }),
    });
  },

  async sendBotChatMessage(payload: {
    userId?: string;
    message: string;
    history?: Array<{ role: "user" | "model"; text: string }>;
    userContext?: any;
  }): Promise<{
    replyText: string;
    suggestedQuestions?: string[];
    actionButtons?: Array<{
      labelAr: string;
      labelEn: string;
      action: string;
      payload?: any;
    }>;
  }> {
    return fetchJson("/api/bot/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getBotChatHistory(userId: string): Promise<
    Array<{
      id: string;
      userId: string;
      role: "user" | "model";
      text: string;
      timestamp: string;
      suggestedQuestions?: string[];
    }>
  > {
    return fetchJson(`/api/bot/history/${userId}`);
  },

  async getAdminStats(): Promise<AdminStats> {
    return fetchJson("/api/admin/stats");
  },

  async updateAdminRole(
    targetUserId: string,
    newRole: string
  ): Promise<UserProfile> {
    return fetchJson("/api/admin/role", {
      method: "POST",
      body: JSON.stringify({ targetUserId, newRole }),
    });
  },

  async sendAdminBroadcast(
    title: string,
    message: string
  ): Promise<{ sentCount: number }> {
    return fetchJson("/api/admin/broadcast", {
      method: "POST",
      body: JSON.stringify({ title, message }),
    });
  },
};

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
  GrowthChallenge
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(`Server returned error (${res.status}): ${rawText.substring(0, 100)}`);
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
  async authenticateTelegram(user?: any): Promise<{ user: UserProfile; token: string }> {
    return fetchJson('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ user })
    });
  },

  async registerUser(payload: {
    email?: string;
    password?: string;
    firstName: string;
    lastName?: string;
    username?: string;
    language?: 'ar' | 'en';
  }): Promise<{ user: UserProfile; token: string }> {
    return fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async loginUser(payload: { identifier: string; password?: string }): Promise<{ user: UserProfile; token: string }> {
    return fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getDemoAccounts(): Promise<Array<{
    id: string;
    name: string;
    username: string;
    email?: string;
    role: string;
    level: number;
    photoUrl?: string;
  }>> {
    return fetchJson('/api/auth/demo-accounts');
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    return fetchJson(`/api/user/profile/${userId}`);
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return fetchJson('/api/user/update', {
      method: 'POST',
      body: JSON.stringify({ userId, updates })
    });
  },

  async saveOnboarding(userId: string, onboardingData: any): Promise<UserProfile> {
    return fetchJson('/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify({ userId, onboardingData })
    });
  },

  async getQuestions(options?: { mode?: string; category?: string; randomize?: boolean }): Promise<{
    total: number;
    mode: string;
    categories: string[];
    questions: Question[];
  }> {
    const params = new URLSearchParams();
    if (options?.mode) params.append('mode', options.mode);
    if (options?.category) params.append('category', options.category);
    if (options?.randomize !== undefined) params.append('randomize', String(options.randomize));
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/api/questions${query}`);
  },

  async submitAnalysis(payload: {
    userId: string;
    answers: Array<{ questionId: string; category: string; dimension: string; optionId: string; value: number }>;
    completionTimeSeconds?: number;
    version?: string;
  }): Promise<{ report: AnalysisResult }> {
    return fetchJson('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
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

  async upgradeSubscription(userId: string, tier?: string): Promise<UserProfile> {
    return fetchJson('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ userId, tier })
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

  async applyReferral(referralCode: string, newUserId: string, newUserName: string): Promise<{ message: string }> {
    return fetchJson('/api/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ referralCode, newUserId, newUserName })
    });
  },

  async getNotifications(userId: string): Promise<BotNotification[]> {
    return fetchJson(`/api/notifications/${userId}`);
  },

  async markNotificationRead(notifId: string): Promise<{ read: boolean }> {
    return fetchJson('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ notifId })
    });
  },

  // Personal Goals API
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
    return fetchJson('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async recordGoalCheckIn(payload: {
    userId: string;
    goalId: string;
    status: 'completed' | 'progressed' | 'struggled';
    note?: string;
  }): Promise<{ goal: PersonalGoal; checkIn: GoalCheckIn }> {
    return fetchJson('/api/goals/checkin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteGoal(userId: string, goalId: string): Promise<{ deleted: boolean }> {
    return fetchJson(`/api/goals/${userId}/${goalId}`, {
      method: 'DELETE'
    });
  },

  async refreshGoalAIPrompt(userId: string, goalId: string): Promise<PersonalGoal> {
    return fetchJson('/api/goals/refresh-ai-prompt', {
      method: 'POST',
      body: JSON.stringify({ userId, goalId })
    });
  },

  // 24-Hour Growth Challenges API
  async getActiveChallenge(userId: string): Promise<GrowthChallenge> {
    return fetchJson(`/api/challenges/active/${userId}`);
  },

  async rerollChallenge(userId: string): Promise<GrowthChallenge> {
    return fetchJson('/api/challenges/reroll', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async completeChallenge(payload: {
    userId: string;
    challengeId: string;
    reflectionNote?: string;
  }): Promise<{ challenge: GrowthChallenge; xpEarned: number; aiFeedback: string }> {
    return fetchJson('/api/challenges/complete', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getChallengeHistory(userId: string): Promise<GrowthChallenge[]> {
    return fetchJson(`/api/challenges/history/${userId}`);
  },

  async sendBotCommand(command: string, user?: any): Promise<any> {
    return fetchJson('/api/bot/command', {
      method: 'POST',
      body: JSON.stringify({ command, user })
    });
  },

  async sendBotChatMessage(payload: {
    userId?: string;
    message: string;
    history?: Array<{ role: 'user' | 'model'; text: string }>;
    userContext?: any;
  }): Promise<{
    replyText: string;
    suggestedQuestions?: string[];
    actionButtons?: Array<{ labelAr: string; labelEn: string; action: string; payload?: any }>;
  }> {
    return fetchJson('/api/bot/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getBotChatHistory(userId: string): Promise<Array<{
    id: string;
    userId: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
    suggestedQuestions?: string[];
  }>> {
    return fetchJson(`/api/bot/history/${userId}`);
  },

  async getAdminStats(): Promise<AdminStats> {
    return fetchJson('/api/admin/stats');
  },

  async updateAdminRole(adminSecret: string, targetUserId: string, newRole: string): Promise<UserProfile> {
    return fetchJson('/api/admin/role', {
      method: 'POST',
      body: JSON.stringify({ adminSecret, targetUserId, newRole })
    });
  },

  async sendAdminBroadcast(title: string, message: string): Promise<{ sentCount: number }> {
    return fetchJson('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, message })
    });
  }
};

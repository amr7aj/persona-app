export type UserRole = 'user' | 'premium' | 'moderator' | 'admin' | 'super_admin';

export type Language = 'ar' | 'en';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

export type AppView =
  | 'splash'
  | 'onboarding'
  | 'dashboard'
  | 'goals'
  | 'quiz'
  | 'results'
  | 'dimensions'
  | 'growth'
  | 'reports_history'
  | 'profile'
  | 'referrals'
  | 'bot_simulator'
  | 'admin'
  | 'auth';

export type GoalCategory = 'habits' | 'mindset' | 'vitality' | 'relationships' | 'career' | 'focus';
export type GoalFrequency = 'daily' | 'weekly' | 'milestone';

export interface GoalCheckIn {
  id: string;
  timestamp: string;
  note?: string;
  status: 'completed' | 'progressed' | 'struggled';
  aiFeedback?: string;
}

export interface AICheckInPrompt {
  questionAr: string;
  questionEn: string;
  reasoningAr: string;
  reasoningEn: string;
  archetypeTipAr: string;
  archetypeTipEn: string;
}

export interface PersonalGoal {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  targetFrequency: GoalFrequency;
  targetDaysPerWeek?: number;
  progress: number; // 0 - 100
  streak: number;
  createdAt: string;
  lastCheckIn?: string;
  checkIns: GoalCheckIn[];
  aiCheckInPrompt?: AICheckInPrompt;
}

export type AssessmentMode = 'full' | 'express' | 'category';

export interface UserProfile {
  id: string; // telegram id or unique id
  telegramId: number;
  email?: string;
  accountCode?: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  language: Language;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  xp: number;
  level: number;
  badges: string[];
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  onboardingCompleted: boolean;
  onboardingData?: {
    age?: string;
    gender?: string;
    status?: string;
    field?: string;
    lifestyle?: string;
    goals?: string[];
    sleepHours?: string;
    stressLevel?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  actionButtons?: Array<{
    labelAr: string;
    labelEn: string;
    action: string;
    payload?: any;
  }>;
}

export type QuestionCategory =
  | 'cognitive'
  | 'emotional'
  | 'social'
  | 'behavioral'
  | 'motivation'
  | 'lifestyle'
  | 'relationships'
  | 'intimacy'
  | 'career';

export interface QuestionOption {
  id: string;
  labelAr: string;
  labelEn: string;
  value: number; // 1 to 5 scale
  weight?: number;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  dimension: string;
  dimensionAr: string;
  dimensionEn: string;
  questionAr: string;
  questionEn: string;
  options: QuestionOption[];
  reverseScore?: boolean;
  importance?: number;
  isSensitive?: boolean;
  isPremium?: boolean;
}

export interface DimensionScore {
  name: string;
  nameAr: string;
  nameEn: string;
  category: QuestionCategory;
  score: number; // 0 - 100
  benchmark: number;
  descriptionAr: string;
  descriptionEn: string;
}

export interface ArchetypeProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  avatarIcon: string;
  primaryColor: string;
  secondaryColor: string;
  strengthsAr: string[];
  strengthsEn: string[];
  blindSpotsAr: string[];
  blindSpotsEn: string[];
  relationshipsAr: string;
  relationshipsEn: string;
  workStyleAr: string;
  workStyleEn: string;
  stressResponseAr: string;
  stressResponseEn: string;
  growthAdviceAr: string;
  growthAdviceEn: string;
}

export interface AIAnalysisReport {
  executiveSummaryAr: string;
  executiveSummaryEn: string;
  corePersonalityAr: string;
  corePersonalityEn: string;
  strengthsAr: string[];
  strengthsEn: string[];
  blindSpotsAr: string[];
  blindSpotsEn: string[];
  emotionalPatternAr: string;
  emotionalPatternEn: string;
  relationshipPatternAr: string;
  relationshipPatternEn: string;
  workPatternAr: string;
  workPatternEn: string;
  stressPatternAr: string;
  stressPatternEn: string;
  lifestylePatternAr: string;
  lifestylePatternEn: string;
  intimacyPatternAr: string;
  intimacyPatternEn: string;
  growthOpportunitiesAr: string[];
  growthOpportunitiesEn: string[];
  personalizedAdviceAr: string[];
  personalizedAdviceEn: string[];
  finalProfileQuoteAr: string;
  finalProfileQuoteEn: string;
}

export interface AnalysisResult {
  id: string;
  userId: string;
  createdAt: string;
  version: string; // e.g. "2026.1"
  overallScore: number;
  archetypeId: string;
  archetype: ArchetypeProfile;
  dimensions: DimensionScore[];
  domainScores: {
    cognitive: number;
    emotional: number;
    social: number;
    behavioral: number;
    motivation: number;
    lifestyle: number;
    relationships: number;
    intimacy: number;
    career: number;
  };
  aiReport?: AIAnalysisReport;
  isUnlockedPremium: boolean;
  completionTimeSeconds?: number;
}

export interface GrowthMetric {
  date: string;
  discipline: number;
  emotionalAwareness: number;
  confidence: number;
  communication: number;
  stressManagement: number;
  overallScore: number;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  createdAt: string;
  rewardXp: number;
  status: 'active' | 'pending';
}

export interface BotNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'analysis_ready' | 'retest_reminder' | 'recommendation' | 'badge_unlocked' | 'system';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface GrowthChallenge {
  id: string;
  userId: string;
  dimensionKey: string;
  dimensionNameAr: string;
  dimensionNameEn: string;
  dimensionScore: number; // e.g. 42%
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionStepsAr: string[];
  actionStepsEn: string[];
  scientificRationaleAr: string;
  scientificRationaleEn: string;
  durationHours: number;
  xpReward: number;
  status: 'active' | 'completed' | 'expired';
  startedAt: string;
  expiresAt: string;
  completedAt?: string;
  reflectionNote?: string;
  aiEvaluation?: string;
  difficulty: 'micro' | 'standard' | 'courage';
  category: 'psychological' | 'social' | 'mindset' | 'vitality' | 'focus';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers24h: number;
  newUsers7d: number;
  completedAnalyses: number;
  premiumUsers: number;
  revenueEst: number;
  aiRequestsCount: number;
  averageScore: number;
  topArchetypes: { name: string; count: number }[];
  recentLogs: { id: string; timestamp: string; action: string; user: string; status: string }[];
}

export interface UserSettings {
  theme: 'cinematic_dark' | 'midnight_oled' | 'royal_purple' | 'emerald_focus';
  fontSize: 'standard' | 'comfortable' | 'compact';
  hapticFeedback: boolean;
  reducedMotion: boolean;
  coachTone: 'deep_wise' | 'motivational' | 'calm_empathic' | 'analytical';
  storyDepth: 'rich_stories' | 'balanced' | 'direct_tactical';
  dailyGrowthReminder: boolean;
  reminderTime: string;
  goalsReminder: boolean;
  monthlyRetestReminder: boolean;
  soundEffects: boolean;
  privateMode: boolean;
  telegramSync: boolean;
  offlineCache: boolean;
}


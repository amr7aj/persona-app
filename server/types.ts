import { UserRole, QuestionCategory, Language, PersonalGoal, GrowthChallenge } from '../src/types';

export interface ServerUser {
  id: string;
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
  onboardingData?: Record<string, any>;
}

export interface StoredChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
}

export interface UserAnswerSubmission {
  questionId: string;
  category: QuestionCategory;
  dimension: string;
  optionId: string;
  value: number;
}

export interface AnalysisSubmissionPayload {
  userId: string;
  answers: UserAnswerSubmission[];
  completionTimeSeconds?: number;
  version?: string;
}

export interface StoredAnalysisResult {
  id: string;
  userId: string;
  createdAt: string;
  version: string;
  overallScore: number;
  archetypeId: string;
  domainScores: Record<string, number>;
  dimensions: Array<any>;
  aiReport?: Record<string, any>;
  isUnlockedPremium: boolean;
  completionTimeSeconds?: number;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'analysis_ready' | 'retest_reminder' | 'recommendation' | 'badge_unlocked' | 'system';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface StoredReferral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  createdAt: string;
  rewardXp: number;
  status: 'active' | 'pending';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details: string;
  status: 'success' | 'warning' | 'error';
}

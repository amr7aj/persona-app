import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AnalysisResult, Language, BotNotification, Question, AssessmentMode, UserSettings } from '../types';
import { Api } from '../services/api';

export type AppView =
  | 'home'
  | 'goals'
  | 'onboarding'
  | 'analysis'
  | 'loading'
  | 'results'
  | 'reports'
  | 'growth'
  | 'profile'
  | 'settings'
  | 'referrals'
  | 'dimension'
  | 'bot'
  | 'admin'
  | 'auth';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'cinematic_dark',
  fontSize: 'standard',
  hapticFeedback: true,
  reducedMotion: false,
  coachTone: 'deep_wise',
  storyDepth: 'rich_stories',
  dailyGrowthReminder: true,
  reminderTime: '20:00',
  goalsReminder: true,
  monthlyRetestReminder: true,
  soundEffects: true,
  privateMode: false,
  telegramSync: true,
  offlineCache: true
};

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  currentView: AppView;
  selectedDimension: string | null;
  language: Language;
  latestReport: AnalysisResult | null;
  reportsList: AnalysisResult[];
  notifications: BotNotification[];
  unreadNotifsCount: number;
  isPremiumModalOpen: boolean;
  isShareModalOpen: boolean;
  activeShareReport: AnalysisResult | null;
  questions: Question[];
  assessmentMode: AssessmentMode;
  assessmentCategory: string | null;
  settings: UserSettings;

  // Actions
  setView: (view: AppView, dimension?: string) => void;
  setLanguage: (lang: Language) => void;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  openShareModal: (report?: AnalysisResult) => void;
  closeShareModal: () => void;
  refreshUserData: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  startAssessment: (mode?: AssessmentMode, category?: string) => Promise<void>;
  submitAssessment: (answers: Array<{ questionId: string; category: string; dimension: string; optionId: string; value: number }>) => Promise<AnalysisResult>;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
  login: (identifier: string, password?: string) => Promise<UserProfile>;
  register: (payload: { email?: string; password?: string; firstName: string; lastName?: string; username?: string }) => Promise<UserProfile>;
  switchUser: (targetUser: UserProfile) => Promise<void>;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>('ar');
  const [latestReport, setLatestReport] = useState<AnalysisResult | null>(null);
  const [reportsList, setReportsList] = useState<AnalysisResult[]>([]);
  const [notifications, setNotifications] = useState<BotNotification[]>([]);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeShareReport, setActiveShareReport] = useState<AnalysisResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('full');
  const [assessmentCategory, setAssessmentCategory] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('persona_user_settings');
      if (saved) {
        return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
    return DEFAULT_USER_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('persona_user_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving settings:', e);
      }
      return updated;
    });
    triggerHaptic('light');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_USER_SETTINGS);
    try {
      localStorage.setItem('persona_user_settings', JSON.stringify(DEFAULT_USER_SETTINGS));
    } catch (e) {
      console.error('Error resetting settings:', e);
    }
    triggerHaptic('medium');
  };

  // Initialize Telegram WebApp bridge & fetch initial user or saved local user
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);

        // Check if there's a stored session user in localStorage
        const savedUserId = localStorage.getItem('persona_active_user_id');

        let tgUser: any = undefined;
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          const webApp = (window as any).Telegram.WebApp;
          webApp.ready();
          webApp.expand();
          if (webApp.initDataUnsafe?.user) {
            tgUser = webApp.initDataUnsafe.user;
          }
        }

        let activeUser: UserProfile;
        if (savedUserId && !tgUser) {
          try {
            activeUser = await Api.getUserProfile(savedUserId);
          } catch {
            const authResult = await Api.authenticateTelegram(tgUser);
            activeUser = authResult.user;
          }
        } else {
          const authResult = await Api.authenticateTelegram(tgUser);
          activeUser = authResult.user;
        }

        setUser(activeUser);
        localStorage.setItem('persona_active_user_id', activeUser.id);
        setLanguageState(activeUser.language || 'ar');

        // Fetch questions initially
        const qRes = await Api.getQuestions({ mode: 'full', randomize: true });
        setQuestions(qRes.questions);

        // Fetch reports
        const reports = await Api.getUserReports(activeUser.id);
        setReportsList(reports);
        if (reports.length > 0) {
          setLatestReport(reports[0]);
        }

        // Fetch notifications
        const notifs = await Api.getNotifications(activeUser.id);
        setNotifications(notifs);

        if (!activeUser.onboardingCompleted) {
          setCurrentView('onboarding');
        }
      } catch (err) {
        console.error('[App Init] Error initializing session:', err);
      } finally {
        setLoading(false);
      }
    }

    initApp();
  }, []);

  // Update HTML dir attribute on language change
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (user) {
      try {
        const updated = await Api.updateUserProfile(user.id, { language: lang });
        setUser(updated);
      } catch (e) {
        console.error('Failed to persist language preference', e);
      }
    }
  };

  const setView = (view: AppView, dimension?: string) => {
    setCurrentView(view);
    if (dimension) {
      setSelectedDimension(dimension);
    }
    triggerHaptic('light');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      const haptic = (window as any).Telegram.WebApp.HapticFeedback;
      if (type === 'success' || type === 'warning' || type === 'error') {
        haptic.notificationOccurred(type);
      } else {
        haptic.impactOccurred(type);
      }
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const [u, r, n] = await Promise.all([
        Api.getUserProfile(user.id),
        Api.getUserReports(user.id),
        Api.getNotifications(user.id)
      ]);
      setUser(u);
      setReportsList(r);
      if (r.length > 0) setLatestReport(r[0]);
      setNotifications(n);
    } catch (e) {
      console.error('Failed to refresh data', e);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await Api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const startAssessment = async (mode: AssessmentMode = 'full', category?: string) => {
    setAssessmentMode(mode);
    setAssessmentCategory(category || null);
    try {
      const qRes = await Api.getQuestions({
        mode,
        category,
        randomize: true
      });
      setQuestions(qRes.questions);
    } catch (err) {
      console.error('Failed to fetch new questions pool', err);
    }
    setView('analysis');
  };

  const submitAssessment = async (answers: Array<{ questionId: string; category: string; dimension: string; optionId: string; value: number }>): Promise<AnalysisResult> => {
    if (!user) throw new Error('User not logged in');
    setView('loading');
    const res = await Api.submitAnalysis({
      userId: user.id,
      answers,
      completionTimeSeconds: 180,
      version: '2026.1'
    });
    setLatestReport(res.report);
    setReportsList((prev) => [res.report, ...prev]);
    await refreshUserData();
    triggerHaptic('success');
    return res.report;
  };

  const login = async (identifier: string, password?: string): Promise<UserProfile> => {
    const res = await Api.loginUser({ identifier, password });
    setUser(res.user);
    localStorage.setItem('persona_active_user_id', res.user.id);
    setLanguageState(res.user.language || 'ar');
    await refreshUserData();
    triggerHaptic('success');
    return res.user;
  };

  const register = async (payload: { email?: string; password?: string; firstName: string; lastName?: string; username?: string }): Promise<UserProfile> => {
    const res = await Api.registerUser({ ...payload, language });
    setUser(res.user);
    localStorage.setItem('persona_active_user_id', res.user.id);
    await refreshUserData();
    triggerHaptic('success');
    return res.user;
  };

  const switchUser = async (targetUser: UserProfile) => {
    setUser(targetUser);
    localStorage.setItem('persona_active_user_id', targetUser.id);
    setLanguageState(targetUser.language || 'ar');
    const [r, n] = await Promise.all([
      Api.getUserReports(targetUser.id),
      Api.getNotifications(targetUser.id)
    ]);
    setReportsList(r);
    setLatestReport(r[0] || null);
    setNotifications(n);
    triggerHaptic('light');
  };

  const logout = () => {
    localStorage.removeItem('persona_active_user_id');
    setView('auth');
    triggerHaptic('medium');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        currentView,
        selectedDimension,
        language,
        latestReport,
        reportsList,
        notifications,
        unreadNotifsCount,
        isPremiumModalOpen,
        isShareModalOpen,
        activeShareReport,
        questions,
        assessmentMode,
        assessmentCategory,
        settings,
        setView,
        setLanguage,
        openPremiumModal: () => setIsPremiumModalOpen(true),
        closePremiumModal: () => setIsPremiumModalOpen(false),
        openShareModal: (rep) => {
          setActiveShareReport(rep || latestReport);
          setIsShareModalOpen(true);
        },
        closeShareModal: () => setIsShareModalOpen(false),
        refreshUserData,
        markNotificationRead,
        startAssessment,
        submitAssessment,
        triggerHaptic,
        login,
        register,
        switchUser,
        logout,
        updateSettings,
        resetSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

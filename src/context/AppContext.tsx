import React, { createContext, useContext, useState, useEffect } from "react";

import {
  UserProfile,
  AnalysisResult,
  Language,
  BotNotification,
  Question,
  AssessmentMode,
  UserSettings,
} from "../types";

import { Api } from "../services/api";

export type AppView =
  | "home"
  | "goals"
  | "onboarding"
  | "analysis"
  | "loading"
  | "results"
  | "reports"
  | "growth"
  | "profile"
  | "settings"
  | "referrals"
  | "dimension"
  | "bot"
  | "admin"
  | "auth";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "cinematic_dark",
  fontSize: "standard",
  hapticFeedback: true,
  reducedMotion: false,
  coachTone: "deep_wise",
  storyDepth: "rich_stories",
  dailyGrowthReminder: true,
  reminderTime: "20:00",
  goalsReminder: true,
  monthlyRetestReminder: true,
  soundEffects: true,
  privateMode: false,
  telegramSync: true,
  offlineCache: true,
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

  setView: (view: AppView, dimension?: string) => void;
  setLanguage: (lang: Language) => void;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  openShareModal: (report?: AnalysisResult) => void;
  closeShareModal: () => void;
  refreshUserData: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  startAssessment: (mode?: AssessmentMode, category?: string) => Promise<void>;
  submitAssessment: (
    answers: Array<{
      questionId: string;
      category: string;
      dimension: string;
      optionId: string;
      value: number;
    }>
  ) => Promise<AnalysisResult>;
  triggerHaptic: (
    type?: "light" | "medium" | "heavy" | "success" | "warning" | "error"
  ) => void;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    username?: string;
  }) => Promise<UserProfile>;
  switchUser: (targetUser: UserProfile) => Promise<void>;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  /*
   * IMPORTANT:
   * Start from auth instead of home.
   * The application will only become accessible after a user exists.
   */
  const [currentView, setCurrentView] = useState<AppView>("auth");

  const [selectedDimension, setSelectedDimension] = useState<string | null>(
    null
  );

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("persona_language");
      return (saved as Language) || "ar";
    } catch {
      return "ar";
    }
  });

  const [latestReport, setLatestReport] = useState<AnalysisResult | null>(null);

  const [reportsList, setReportsList] = useState<AnalysisResult[]>([]);

  const [notifications, setNotifications] = useState<BotNotification[]>([]);

  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [activeShareReport, setActiveShareReport] =
    useState<AnalysisResult | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>("full");

  const [assessmentCategory, setAssessmentCategory] = useState<string | null>(
    null
  );

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem("persona_user_settings");

      if (saved) {
        return {
          ...DEFAULT_USER_SETTINGS,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      console.error("Error loading settings from localStorage:", e);
    }

    return DEFAULT_USER_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
      };

      try {
        localStorage.setItem("persona_user_settings", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving settings:", e);
      }

      return updated;
    });

    triggerHaptic("light");
  };

  const resetSettings = () => {
    setSettings(DEFAULT_USER_SETTINGS);

    try {
      localStorage.setItem(
        "persona_user_settings",
        JSON.stringify(DEFAULT_USER_SETTINGS)
      );
    } catch (e) {
      console.error("Error resetting settings:", e);
    }

    triggerHaptic("medium");
  };

  /*
   * INITIALIZATION
   */
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);

        let tgUser: any = undefined;

        let activeUser: UserProfile | null = null;

        /*
         * Telegram authentication
         */
        if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
          const webApp = (window as any).Telegram.WebApp;

          webApp.ready();
          webApp.expand();

          if (webApp.initDataUnsafe?.user && webApp.initData) {
            tgUser = webApp.initDataUnsafe.user;

            const authResult = await Api.authenticateTelegram(webApp.initData);

            activeUser = authResult.user;
          }
        }

        // Restore the session from the Supabase access token, not from a
        // locally stored user ID. The backend validates the token against
        // auth.users and then loads public.users by the same UUID.
        if (!activeUser && localStorage.getItem("persona_token")) {
          try {
            activeUser = await Api.getCurrentUser();
          } catch (error) {
            console.error("[App Init] Failed to restore Auth session:", error);
            localStorage.removeItem("persona_token");
            localStorage.removeItem("persona_refresh_token");
          }
        }

        /*
         * No authenticated user.
         */
        if (!activeUser) {
          setUser(null);
          setCurrentView("auth");
          return;
        }

        /*
         * Authenticated user exists.
         */
        setUser(activeUser);

        setLanguageState(activeUser.language || "ar");

        try {
          localStorage.setItem("persona_language", activeUser.language || "ar");
        } catch (e) {
          console.error("Failed to save language to localStorage", e);
        }

        /*
         * Load questions
         */
        try {
          const qRes = await Api.getQuestions({
            mode: "full",
            randomize: true,
          });

          setQuestions(qRes.questions);
        } catch (e) {
          console.error("Failed to load questions:", e);
        }

        /*
         * Load reports
         */
        try {
          const reports = await Api.getUserReports(activeUser.id);

          setReportsList(reports);
          setLatestReport(reports[0] || null);
        } catch (e) {
          console.error("Failed to load reports:", e);
        }

        /*
         * Load notifications
         */
        try {
          const notifs = await Api.getNotifications(activeUser.id);

          setNotifications(notifs);
        } catch (e) {
          console.error("Failed to load notifications:", e);
        }

        /*
         * Decide initial authenticated view.
         */
        if (!activeUser.onboardingCompleted) {
          setCurrentView("onboarding");
        } else {
          setCurrentView("home");
        }
      } catch (err) {
        console.error("[App Init] Error initializing session:", err);

        setUser(null);
        setCurrentView("auth");

        localStorage.removeItem("persona_active_user_id");

        localStorage.removeItem("persona_token");

        localStorage.removeItem("persona_refresh_token");
      } finally {
        setLoading(false);
      }
    }

    initApp();
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);

    try {
      localStorage.setItem("persona_language", lang);
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }

    if (user) {
      try {
        const updated = await Api.updateUserProfile(user.id, {
          language: lang,
        });

        setUser(updated);
      } catch (e) {
        console.error("Failed to persist language preference", e);
      }
    }
  };

  const setView = (view: AppView, dimension?: string) => {
    /*
     * Never allow unauthenticated users
     * to navigate into protected views.
     */
    if (!user && view !== "auth") {
      setCurrentView("auth");
      return;
    }

    setCurrentView(view);

    if (dimension) {
      setSelectedDimension(dimension);
    }

    triggerHaptic("light");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const triggerHaptic = (
    type:
      | "light"
      | "medium"
      | "heavy"
      | "success"
      | "warning"
      | "error" = "light"
  ) => {
    if (typeof window === "undefined") return;

    const webApp = (window as any).Telegram?.WebApp;
    if (!webApp?.HapticFeedback) return;

    // HapticFeedback is supported from Telegram Mini Apps API 6.1.
    // Older clients expose the object inconsistently, so guard both the
    // version and the concrete methods before invoking them.
    const supportsHaptics =
      typeof webApp.isVersionAtLeast === "function"
        ? webApp.isVersionAtLeast("6.1")
        : false;

    if (!supportsHaptics) return;

    try {
      const haptic = webApp.HapticFeedback;
      if (
        (type === "success" || type === "warning" || type === "error") &&
        typeof haptic.notificationOccurred === "function"
      ) {
        haptic.notificationOccurred(type);
      } else if (typeof haptic.impactOccurred === "function") {
        haptic.impactOccurred(type);
      }
    } catch {
      // Haptics are optional UX feedback; never let an unsupported Telegram
      // client interrupt the application flow.
    }
  };

  const refreshUserData = async () => {
    if (!user) return;

    try {
      const [u, r, n] = await Promise.all([
        Api.getUserProfile(user.id),
        Api.getUserReports(user.id),
        Api.getNotifications(user.id),
      ]);

      setUser(u);
      setReportsList(r);
      setLatestReport(r[0] || null);
      setNotifications(n);
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await Api.markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                read: true,
              }
            : n
        )
      );
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const startAssessment = async (
    mode: AssessmentMode = "full",
    category?: string
  ) => {
    /*
     * Extra protection.
     */
    if (!user) {
      setCurrentView("auth");
      return;
    }

    setAssessmentMode(mode);
    setAssessmentCategory(category || null);

    try {
      const qRes = await Api.getQuestions({
        mode,
        category,
        randomize: true,
      });

      setQuestions(qRes.questions);
    } catch (err) {
      console.error("Failed to fetch new questions pool", err);
    }

    setView("analysis");
  };

  const submitAssessment = async (
    answers: Array<{
      questionId: string;
      category: string;
      dimension: string;
      optionId: string;
      value: number;
    }>
  ): Promise<AnalysisResult> => {
    if (!user) {
      throw new Error("User not logged in");
    }

    setView("loading");

    const res = await Api.submitAnalysis({
      userId: user.id,
      answers,
      completionTimeSeconds: 180,
      version: "2026.1",
    });

    setLatestReport(res.report);

    setReportsList((prev) => [res.report, ...prev]);

    await refreshUserData();

    triggerHaptic("success");

    return res.report;
  };

  const login = async (
    identifier: string,
    password: string
  ): Promise<UserProfile> => {
    const res = await Api.loginUser({
      identifier,
      password,
    });

    setUser(res.user);

    setLanguageState(res.user.language || "ar");

    try {
      localStorage.setItem("persona_language", res.user.language || "ar");
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }

    /*
     * Load fresh user data after login.
     */
    try {
      const [reports, notifs] = await Promise.all([
        Api.getUserReports(res.user.id),
        Api.getNotifications(res.user.id),
      ]);

      setReportsList(reports);
      setLatestReport(reports[0] || null);
      setNotifications(notifs);
    } catch (e) {
      console.error("Failed to load user data after login:", e);
    }

    /*
     * IMPORTANT:
     * Move away from AuthView after successful login.
     */
    if (!res.user.onboardingCompleted) {
      setCurrentView("onboarding");
    } else {
      setCurrentView("home");
    }

    triggerHaptic("success");

    return res.user;
  };

  const register = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    username?: string;
  }): Promise<UserProfile> => {
    const email = payload.email.trim();
    const password = payload.password;
    const firstName = payload.firstName.trim();

    if (!email) {
      throw new Error(language === "ar" ? "البريد الإلكتروني مطلوب" : "Email is required");
    }

    if (!password || password.length < 6) {
      throw new Error(
        language === "ar"
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters"
      );
    }

    if (!firstName) {
      throw new Error(language === "ar" ? "الاسم الأول مطلوب" : "First name is required");
    }

    const res = await Api.registerUser({
      email,
      password,
      firstName,
      lastName: payload.lastName?.trim() || undefined,
      username: payload.username?.trim() || undefined,
      language,
    });

    setUser(res.user);

    /*
     * Load fresh data after registration.
     */
    try {
      const [reports, notifs] = await Promise.all([
        Api.getUserReports(res.user.id),
        Api.getNotifications(res.user.id),
      ]);

      setReportsList(reports);
      setLatestReport(reports[0] || null);
      setNotifications(notifs);
    } catch (e) {
      console.error("Failed to load user data after registration:", e);
    }

    /*
     * New users should go through onboarding.
     */
    if (!res.user.onboardingCompleted) {
      setCurrentView("onboarding");
    } else {
      setCurrentView("home");
    }

    triggerHaptic("success");

    return res.user;
  };

  const switchUser = async (targetUser: UserProfile) => {
    setUser(targetUser);

    setLanguageState(targetUser.language || "ar");

    try {
      localStorage.setItem("persona_language", targetUser.language || "ar");
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }

    const [r, n] = await Promise.all([
      Api.getUserReports(targetUser.id),
      Api.getNotifications(targetUser.id),
    ]);

    setReportsList(r);
    setLatestReport(r[0] || null);
    setNotifications(n);

    setCurrentView(targetUser.onboardingCompleted ? "home" : "onboarding");

    triggerHaptic("light");
  };

  const logout = () => {
    void Api.logout();

    /*
     * Clear application state.
     */
    setUser(null);

    setReportsList([]);

    setLatestReport(null);

    setNotifications([]);

    setQuestions([]);

    /*
     * Return to authentication screen.
     */
    setCurrentView("auth");

    triggerHaptic("medium");
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

        resetSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
};

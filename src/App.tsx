import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ShareModal } from './components/common/ShareModal';
import { PremiumModal } from './components/common/PremiumModal';
import { FloatingCoachWidget } from './components/common/FloatingCoachWidget';
import { HomeDashboard } from './components/views/HomeDashboard';
import { OnboardingView } from './components/views/OnboardingView';
import { AnalysisQuizView } from './components/views/AnalysisQuizView';
import { LoadingAnalysisView } from './components/views/LoadingAnalysisView';
import { ResultsView } from './components/views/ResultsView';
import { DimensionViews } from './components/views/DimensionViews';
import { GrowthProgressView } from './components/views/GrowthProgressView';
import { ReportsHistoryView } from './components/views/ReportsHistoryView';
import { UserProfileView } from './components/views/UserProfileView';
import { ReferralHubView } from './components/views/ReferralHubView';
import { TelegramBotSimulator } from './components/views/TelegramBotSimulator';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { AuthView } from './components/views/AuthView';
import { PersonalGoalsView } from './components/views/PersonalGoalsView';
import { SettingsView } from './components/views/SettingsView';

const AppContent: React.FC = () => {
  const { currentView, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7E3AF2] to-[#9061F9] p-0.5 animate-pulse">
          <div className="w-full h-full bg-[#0B0B0F] rounded-[14px] flex items-center justify-center text-[#A4CAFE] font-bold text-lg font-mono">
            P
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white tracking-widest font-mono">PERSONA AI</h2>
          <p className="text-xs text-[#9CA3AF]">Initializing Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100 flex flex-col selection:bg-[#7E3AF2] selection:text-white font-sans antialiased">
      <Header />

      <main className="flex-1 w-full">
        {currentView === 'home' && <HomeDashboard />}
        {currentView === 'goals' && <PersonalGoalsView />}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'auth' && <AuthView />}
        {currentView === 'onboarding' && <OnboardingView />}
        {currentView === 'analysis' && <AnalysisQuizView />}
        {currentView === 'loading' && <LoadingAnalysisView />}
        {currentView === 'results' && <ResultsView />}
        {currentView === 'dimension' && <DimensionViews />}
        {currentView === 'growth' && <GrowthProgressView />}
        {currentView === 'reports' && <ReportsHistoryView />}
        {currentView === 'profile' && <UserProfileView />}
        {currentView === 'referrals' && <ReferralHubView />}
        {/*currentView === 'bot' && <TelegramBotSimulator />*/}
        {currentView === 'admin' && <AdminDashboardView />}
      </main>

      <BottomNav />
      <ShareModal />
      <PremiumModal />
      <FloatingCoachWidget />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { Home, BrainCircuit, LineChart, FileText, UserCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentView, setView, language } = useApp();
  const isAr = language === 'ar';

  const navItems: Array<{ view: AppView; labelAr: string; labelEn: string; icon: React.ReactNode }> = [
    {
      view: 'home',
      labelAr: 'الرئيسية',
      labelEn: 'Home',
      icon: <Home className="w-5 h-5" />
    },
    {
      view: 'analysis',
      labelAr: 'التحليل',
      labelEn: 'Analysis',
      icon: <BrainCircuit className="w-5 h-5" />
    },
    {
      view: 'growth',
      labelAr: 'التطور',
      labelEn: 'Progress',
      icon: <LineChart className="w-5 h-5" />
    },
    {
      view: 'reports',
      labelAr: 'التقارير',
      labelEn: 'Reports',
      icon: <FileText className="w-5 h-5" />
    },
    {
      view: 'profile',
      labelAr: 'حسابي',
      labelEn: 'Profile',
      icon: <UserCircle className="w-5 h-5" />
    }
  ];

  // Hide nav bar on active quiz question execution to ensure zero distractions
  if (currentView === 'loading') return null;

  return (
    <nav id="persona-bottom-nav" className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E14]/95 backdrop-blur-lg border-t border-[#1C1C26] px-2 py-2 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentView === item.view || (item.view === 'reports' && currentView === 'results');
          return (
            <button
              key={item.view}
              id={`nav-${item.view}`}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">
                {isAr ? item.labelAr : item.labelEn}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 shadow-sm shadow-amber-400/50"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

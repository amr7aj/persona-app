import React from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  CheckCheck,
  Sparkles,
  Award,
  Target,
  Bell,
  ArrowRight,
} from "lucide-react";

export const NotificationsDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, language, setView } = useApp();
  const isAr = language === "ar";

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "analysis_ready":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "badge_unlocked":
        return <Award className="w-4 h-4 text-purple-400" />;
      case "recommendation":
        return <Target className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in" onClick={onClose}>
      <div
        className="fixed top-20 left-4 w-[calc(100vw-2rem)] max-w-sm max-h-[75vh] bg-[#121217]/95 backdrop-blur-xl border border-[#22222E] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="p-4 border-b border-[#22222E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />

            <h3 className="font-semibold text-sm text-white">
              {isAr ? "الإشعارات والتنبيهات" : "Notifications"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1C1C24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              {isAr ? "لا توجد إشعارات جديدة حالياً" : "No notifications yet"}
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);

                  if (n.actionUrl) {
                    onClose();
                    setView("reports");
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? "bg-[#16161D]/90 border-[#22222E] text-zinc-400"
                    : "bg-[#1A1A24]/95 border-purple-800/40 text-zinc-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#22222E] mt-0.5 shrink-0">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-xs text-white">
                        {n.title}
                      </h4>

                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#252533] text-[10px] text-zinc-500">
                      <span>
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {n.actionUrl && (
                        <span className="text-amber-400 flex items-center gap-1 font-medium">
                          {isAr ? "عرض" : "View"}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

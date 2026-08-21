import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Users,
  Eye,
  EyeOff,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Api } from '../../services/api';

export const AuthView: React.FC = () => {
  const { language, login, register, switchUser, setView, triggerHaptic } = useApp();
  const isAr = language === 'ar';

  const demoMode = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  const [tab, setTab] = useState<'login' | 'register' | 'demo'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Demo accounts
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (!demoMode) return;
    async function loadDemos() {
      try {
        const demos = await Api.getDemoAccounts();
        setDemoAccounts(demos);
      } catch (e) {
        console.error('Failed to load demo accounts', e);
      }
    }
    loadDemos();
  }, [demoMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم' : 'Please enter email or username');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await login(identifier, password);
      setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح! مرحباً بك' : 'Logged in successfully! Welcome back');
      setTimeout(() => {
        setView('home');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'فشل تسجيل الدخول. تأكد من البيانات' : 'Login failed. Please check credentials'));
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg(isAr ? 'الاسم الأول مطلوب' : 'First name is required');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg(isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await register({
        firstName,
        lastName,
        username: regUsername || undefined,
        email: regEmail,
        password: regPassword
      });
      setSuccessMsg(isAr ? 'تم إنشاء الحساب بنجاح! جاهز للانطلاق' : 'Account created successfully! Welcome');
      setTimeout(() => {
        setView('onboarding');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'فشل إنشاء الحساب' : 'Registration failed'));
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSwitch = async (account: any) => {
    setIsLoading(true);
    try {
      const auth = await Api.demoLogin(account.id);
      await switchUser(auth.user);
      setSuccessMsg(
        isAr
          ? `تم التبديل بنجاح إلى حساب: ${account.name}`
          : `Switched successfully to: ${account.name}`
      );
      setTimeout(() => {
        setView('home');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramAuth = async () => {
    setIsLoading(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData;
      if (!initData) throw new Error(isAr ? 'افتح التطبيق من Telegram لإتمام المصادقة' : 'Open the app from Telegram to authenticate');
      const auth = await Api.authenticateTelegram(initData);
      await switchUser(auth.user);
      setSuccessMsg(isAr ? 'تم الربط التلقائي بحساب Telegram' : 'Connected via Telegram profile');
      setTimeout(() => {
        setView('home');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Telegram auth failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-view" className="min-h-screen pb-24 pt-6 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#9061F9]/30 to-[#E02424]/20 border border-[#9061F9]/40 flex items-center justify-center shadow-lg shadow-[#9061F9]/10"
        >
          <Sparkles className="w-8 h-8 text-[#A4CAFE]" />
        </motion.div>
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          {isAr ? 'بوابة الحساب والذكاء الشخصي' : 'PERSONA Account Portal'}
        </h1>
        <p className="text-sm text-[#9CA3AF] max-w-xs mx-auto">
          {isAr
            ? 'سجل دخولك لمزامنة تقاريرك، مسارات نموك، واستشارات المدرب الذكي'
            : 'Access your personality reports, growth metrics, and AI coaching history'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#121217] p-1 rounded-2xl border border-white/5 mb-6">
        <button
          id="tab-login"
          type="button"
          onClick={() => {
            setTab('login');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            tab === 'login'
              ? 'bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] text-white shadow-md'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          {isAr ? 'تسجيل الدخول' : 'Sign In'}
        </button>
        <button
          id="tab-register"
          type="button"
          onClick={() => {
            setTab('register');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            tab === 'register'
              ? 'bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] text-white shadow-md'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          {isAr ? 'إنشاء حساب جديد' : 'Register'}
        </button>
        {demoMode && <button
          id="tab-demo"
          type="button"
          onClick={() => {
            setTab('demo');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            tab === 'demo'
              ? 'bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] text-white shadow-md'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          {isAr ? 'تبديل الحسابات' : 'Switch Profiles'}
        </button>}
      </div>

      {/* Notification banners */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Container */}
      <div className="bg-[#18181F] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#D1D5DB] mb-1.5">
                {isAr ? 'البريد الإلكتروني / اسم المستخدم / المعرف' : 'Email, Username or ID'}
              </label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isAr ? 'amr_persona أو البريد...' : 'amr_persona or user@example.com'}
                  className="w-full bg-[#121217] border border-white/10 rounded-xl py-3 ps-10 pe-4 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9] transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-[#D1D5DB]">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <span className="text-[11px] text-[#9CA3AF]">
                  {isAr ? '(اختيارية للحسابات العامة)' : '(Optional for guests)'}
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121217] border border-white/10 rounded-xl py-3 ps-10 pe-10 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9] transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] hover:from-[#6C2BD9] hover:to-[#7E3AF2] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#7E3AF2]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isAr ? 'دخول فوري' : 'Sign In Now'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>

            <div className="pt-3 border-t border-white/5">
              <button
                id="btn-quick-telegram"
                type="button"
                onClick={handleTelegramAuth}
                className="w-full py-3 bg-[#24A1DE]/15 hover:bg-[#24A1DE]/25 border border-[#24A1DE]/30 text-[#54C7EC] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{isAr ? 'المزامنة السريعة بحساب Telegram' : 'Sync with Telegram Account'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                  {isAr ? 'الاسم الأول *' : 'First Name *'}
                </label>
                <input
                  id="reg-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isAr ? 'عمرو' : 'Amr'}
                  required
                  className="w-full bg-[#121217] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                  {isAr ? 'اللقب' : 'Last Name'}
                </label>
                <input
                  id="reg-lastname"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? 'كمال' : 'Kamal'}
                  className="w-full bg-[#121217] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                {isAr ? 'اسم المستخدم (Telegram / Handle)' : 'Username'}
              </label>
              <div className="relative">
                <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">@</span>
                <input
                  id="reg-username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="persona_user"
                  className="w-full bg-[#121217] border border-white/10 rounded-xl py-2.5 ps-8 pe-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9]"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                {isAr ? 'البريد الإلكتروني (لحفظ التقارير)' : 'Email'}
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#121217] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121217] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#9061F9]"
                dir="ltr"
              />
            </div>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#7E3AF2] to-[#9061F9] hover:from-[#6C2BD9] hover:to-[#7E3AF2] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#7E3AF2]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isAr ? 'إنشاء حساب وبدء التحليل' : 'Create & Launch'}</span>
                  <Zap className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: DEMO ACCOUNT SWITCHER */}
        {tab === 'demo' && (
          <div className="space-y-3">
            <p className="text-xs text-[#9CA3AF] mb-2">
              {isAr
                ? 'اختر حساباً تجريبياً جاهزاً لاستعراض التقرير الكامل، لوحة التحكم، أو سجل النمو:'
                : 'Select a pre-loaded test profile to preview full reports, admin tools, and growth logs:'}
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => handleDemoSwitch(acc)}
                  className="p-3 bg-[#121217] hover:bg-white/5 border border-white/5 hover:border-[#9061F9]/40 rounded-2xl cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={acc.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-[#A4CAFE] transition-colors">
                          {acc.name}
                        </span>
                        {acc.role === 'admin' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold rounded">
                            ADMIN
                          </span>
                        )}
                        {acc.role === 'premium' && (
                          <span className="px-1.5 py-0.5 bg-[#9061F9]/20 text-[#A4CAFE] border border-[#9061F9]/30 text-[9px] font-bold rounded">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#9CA3AF]">@{acc.username} • Level {acc.level || 1}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#9CA3AF] group-hover:text-white ${isAr ? 'rotate-180' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security & Confidentiality Footer */}
      <div className="mt-8 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>{isAr ? 'خصوصية البيانات مشفرة وتلتزم بأعلى معايير الأمان 2026' : 'End-to-end encrypted AI personality intelligence'}</span>
      </div>
    </div>
  );
};

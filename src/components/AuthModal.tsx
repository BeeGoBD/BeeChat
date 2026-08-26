import React, { useState } from 'react';
import { Shield, Phone, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { translations, Language } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { safeFetchJson } from '../utils/api';

interface AuthModalProps {
  onLoginSuccess: (user: any, isAdmin: boolean) => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, lang }) => {
  const t = translations[lang];
  const [isRegister, setIsRegister] = useState(false);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillAdminCredentials = () => {
    setIsRegister(false);
    setPhoneOrEmail('admin@zayettl.com');
    setPassword('Work@ETTL2026.com#');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isRegister) {
      if (!fullName.trim() || !phoneOrEmail.trim() || !password) {
        setError('Please fill in all registration fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError(t.passwordsMismatch);
        return;
      }

      setLoading(true);
      const res = await safeFetchJson<{ user: any }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phoneOrEmail.trim(),
          password,
        }),
      });

      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.error || 'Registration failed.');
        return;
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#FFFFFF'],
      });

      setSuccessMessage(t.registrationSuccess);
      setTimeout(() => {
        onLoginSuccess(res.data?.user, false);
      }, 800);
    } else {
      // Login
      if (!phoneOrEmail.trim() || !password) {
        setError('Please enter your mobile number/email and password.');
        return;
      }

      setLoading(true);
      const res = await safeFetchJson<{ user: any; isAdmin: boolean }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: phoneOrEmail.trim(),
          password,
        }),
      });

      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.error || t.invalidCredentials);
        return;
      }

      onLoginSuccess(res.data.user, res.data.isAdmin);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 flex flex-col justify-center items-center px-4 py-8">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6 space-y-2">
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#25D366] via-[#00B2FE] to-[#006AFF] text-white shadow-xl shadow-emerald-500/25 ring-4 ring-emerald-100 overflow-hidden">
          {/* Custom WhatsApp + Messenger Hybrid SVG Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-9 h-9 text-white drop-shadow-xs"
          >
            <path
              d="M12 2C6.477 2 2 6.253 2 11.5C2 13.568 2.705 15.482 3.905 17.025L3.06 20.474C2.96 20.884 3.35 21.242 3.75 21.109L7.545 19.845C8.892 20.575 10.407 21 12 21C17.523 21 22 16.747 22 11.5C22 6.253 17.523 2 12 2Z"
              fill="currentColor"
            />
            <path
              d="M12.8 7.5L7.5 13.8H11.2L11.2 16.5L16.5 10.2H12.8V7.5Z"
              fill="#0F172A"
              fillOpacity="0.15"
            />
            <path
              d="M13.2 7L7.8 13.4H11.5L11.5 16.2L16.2 9.8H12.5V7H13.2Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Bee <span className="text-emerald-500">Chat</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium px-4">
          {t.appFullName} — {t.tagline}
        </p>
      </div>

      {/* Main Card */}
      <div
        id="auth-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Top Gradient Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#25D366] via-[#00B2FE] to-[#006AFF]" />

        {/* Tab Toggle */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl mb-6 border border-slate-200/60">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
              !isRegister
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.loginTitle}
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
              isRegister
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.registerTitle}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            id="auth-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-shake"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            id="auth-success-alert"
            className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name for Registration */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.fullNameLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="register-fullname-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Bangladesh Mobile Number / Admin Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRegister ? t.phoneLabel : 'Bangladesh Mobile Number / Email'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="auth-phone-input"
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder={
                  isRegister
                    ? '017XXXXXXXX (11 digits)'
                    : '01XXXXXXXXX or admin@zayettl.com'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-all"
              />
            </div>
            {isRegister && (
              <p className="text-[10px] text-slate-400 mt-1 pl-1">
                Must be an active 11-digit Bangladesh SIM number (e.g. 017..., 018..., 019..., 013...).
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password for Registration */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.confirmPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#25D366] via-[#00B2FE] to-[#006AFF] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? t.registerBtn : t.loginBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Admin Access Preset */}
        {!isRegister && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              id="fill-admin-creds-btn"
              type="button"
              onClick={fillAdminCredentials}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-900 text-xs font-semibold transition-all border border-blue-200/80"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Use Official Admin Credentials</span>
            </button>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              admin@zayettl.com • Work@ETTL2026.com#
            </p>
          </div>
        )}
      </div>

      {/* Footer Security Badge */}
      <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>End-to-End Enterprise Encryption • High-Security Records Storage</span>
      </div>
    </div>
  );
};

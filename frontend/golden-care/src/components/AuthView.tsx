import React, { useState } from 'react';
import { User } from '../types';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface AuthViewProps {
  allUsers: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: Omit<User, 'id' | 'created_at'>) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
}) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Please enter your staff email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginLoading(true);

    try {
      const response = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }

      if (response.user) {
        localStorage.setItem(
          'current_user',
          JSON.stringify(response.user)
        );

        onLogin(response.user);
      } else {
        setLoginError(
          'Login was successful but no user information was returned.'
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);

      setLoginError(
        error?.message ||
          'Unable to sign in. Please check your email and password.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f7] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">

      <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-[30px] shadow-xl border border-slate-200 overflow-hidden grid lg:grid-cols-[1.05fr_0.95fr]">

        {/* =====================================================
            LEFT BRANDING PANEL
        ====================================================== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between">

          {/* Decorative Background */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-20 w-64 h-64 rounded-full bg-teal-300/10" />

          <div className="relative z-10">

            {/* Brand */}
            <div className="flex items-center gap-4 mb-12">

              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <HeartPulse className="w-8 h-8 text-emerald-200" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  GoldenCare
                </h1>

                <p className="text-xs text-emerald-200 font-medium mt-0.5">
                  Elderly Health Monitoring System
                </p>
              </div>

            </div>

            {/* Main Content */}
            <div className="max-w-lg">

              <p className="text-xs font-bold tracking-[0.22em] uppercase text-emerald-300 mb-4">
                Elderly Care Management
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black leading-tight tracking-tight">
                Supporting safer and more organised elderly care.
              </h2>

            </div>

          </div>

          {/* Facility Name */}
          <div className="relative z-10 mt-12 pt-6 border-t border-white/10">

            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300 font-bold">
              Developed for
            </p>

            <p className="mt-2 text-sm font-semibold text-white/90">
              Pusat Jagaan Warga Emas dan Terapi Fitrah
            </p>

          </div>

        </section>

        {/* =====================================================
            LOGIN PANEL
        ====================================================== */}
        <section className="p-7 sm:p-10 lg:p-14 flex items-center bg-white">

          <div className="w-full max-w-md mx-auto">

            {/* Secure System Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold mb-6">

              <ShieldCheck className="w-4 h-4" />

              Secure Staff Access

            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in using your registered GoldenCare staff account.
            </p>

            <form
              onSubmit={handleLoginSubmit}
              className="mt-8 space-y-5"
            >

              {/* Error */}
              {loginError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3.5 rounded-xl flex items-start gap-3">

                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

                  <span>{loginError}</span>

                </div>
              )}

              {/* Email */}
              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Staff Email Address
                </label>

                <div className="relative">

                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. admin@fitrah.care"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />

                </div>

              </div>

              {/* Password */}
              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >

                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}

                  </button>

                </div>

              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">

                <input
                  id="remember-login"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                />

                <label
                  htmlFor="remember-login"
                  className="text-xs text-slate-500"
                >
                  Keep me signed in on this device
                </label>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-400 text-white font-bold text-sm py-3.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >

                {loginLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to GoldenCare</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}

              </button>

            </form>

            {/* Support Text */}
            <div className="mt-8 pt-6 border-t border-slate-100">

              <p className="text-xs leading-5 text-slate-400 text-center">
                Account access is provided to authorised GoldenCare
                staff only. Please contact the Administrator if you
                experience difficulty signing in.
              </p>

            </div>

            {/* Security Note */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">

              <ShieldCheck className="w-4 h-4 text-emerald-600" />

              Protected health information access

            </div>

          </div>

        </section>

      </div>

    </div>
  );
};
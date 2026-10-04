import React from 'react';
import { User } from '../types';
import { Bell, Menu, Shield, UserCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  activeAlertsCount: number;
  onOpenAlerts: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  activeAlertsCount,
  onOpenAlerts,
  onToggleSidebar,
}) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-40 text-slate-800">
      {/* Left: mobile menu + facility context */}
      <div className="flex items-center min-w-0 gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Open navigation"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
            F
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
              Pusat Jagaan Warga Emas dan Terapi Fitrah
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
              Elderly Care & Health Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right Header Metadata & Actions */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {/* System Date */}
        <div className="hidden md:flex flex-col items-end">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            System Date
          </p>
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            {currentDate}
          </p>
        </div>

        <div className="hidden md:block h-8 w-[1px] bg-slate-200" />

        {/* Alert Bell */}
        <button
          type="button"
          onClick={onOpenAlerts}
          className="relative p-2 text-slate-600 hover:text-amber-600 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
          title="View Critical Health Alerts"
          aria-label="View Critical Health Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Role */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <div className="text-right hidden lg:block px-1">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
              {currentUser.role === 'admin' ? (
                <Shield className="w-3 h-3 text-amber-600" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-600" />
              )}
              <span className="capitalize font-semibold text-amber-700">
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="bg-white text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-300 shadow-xs">
            {currentUser.role.toUpperCase()}
          </div>
        </div>

        {/* Existing Logout Function - preserved */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          title="Sign out of GoldenCare session"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

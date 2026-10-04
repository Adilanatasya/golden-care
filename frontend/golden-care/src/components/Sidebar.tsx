import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Activity,
  UserCheck,
  Send,
  FileText,
  ShieldAlert,
  CalendarCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

export type NavView =
  | 'admin-dashboard'
  | 'caregiver-dashboard'
  | 'residents-list'
  | 'add-resident'
  | 'record-vitals'
  | 'vitals-history'
  | 'visitor-logs'
  | 'staff-management'
  | 'reports'
  | 'telegram-config';

interface SidebarProps {
  currentRole: UserRole;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onLogout: () => void;
  activeAlertsCount: number;

  // Mobile sidebar
  isOpen: boolean;
  onClose: () => void;

  // Desktop collapse
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeView,
  onSelectView,
  onLogout,
  activeAlertsCount,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapsed,
}) => {
  const isAdmin = currentRole === 'admin';

  const handleSelect = (view: NavView) => {
    onSelectView(view);
    onClose();
  };

  const itemClass = (view: NavView) => {
    const isActive = activeView === view;

    return `
      relative
      flex
      w-full
      min-h-[42px]
      items-center
      gap-3
      px-5
      py-2.5
      text-left
      text-sm
      font-medium
      transition-colors
      duration-150
      cursor-pointer

      ${
        isCollapsed
          ? 'lg:justify-center lg:gap-0 lg:px-3'
          : ''
      }

      ${
        isActive
          ? 'border-r-[3px] border-emerald-400 bg-emerald-500/10 text-emerald-300'
          : 'border-r-[3px] border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
      }
    `;
  };

  const labelClass = isCollapsed
    ? 'block lg:hidden'
    : 'block';

  const sectionTitleClass = isCollapsed
    ? 'mb-2 px-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 lg:hidden'
    : 'mb-2 px-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500';

  return (
    <aside
      className={`
        fixed
        inset-y-0
        left-0
        z-50
        flex
        h-screen
        w-72
        flex-col
        overflow-hidden
        border-r
        border-slate-800
        bg-[#0f172a]
        text-white
        shadow-xl
        transition-[width,transform]
        duration-300
        ease-in-out

        lg:relative
        lg:inset-y-auto
        lg:left-auto
        lg:z-auto
        lg:h-full
        lg:min-h-0
        lg:shrink-0
        lg:shadow-none

        ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }

        ${
          isCollapsed
            ? 'lg:w-20'
            : 'lg:w-64'
        }
      `}
    >
      {/* BRAND HEADER */}
      <div
        className="
          flex
          min-h-[72px]
          shrink-0
          items-center
          gap-3
          border-b
          border-slate-800
          px-4
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-emerald-600
            text-lg
            font-black
            text-white
            shadow-sm
          "
        >
          F
        </div>

        <div
          className={`min-w-0 flex-1 ${
            isCollapsed ? 'lg:hidden' : ''
          }`}
        >
          <h1 className="truncate text-xs font-bold leading-tight text-emerald-300">
            Pusat Jagaan Fitrah
          </h1>

          <p className="mt-1 truncate text-[10px] font-medium leading-tight text-slate-400">
            Warga Emas dan Terapi
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          title="Close sidebar"
          className="
            ml-auto
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-slate-400
            transition
            hover:bg-slate-800
            hover:text-white
            lg:hidden
          "
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* DESKTOP COLLAPSE */}
      <div
        className={`
          hidden
          shrink-0
          border-b
          border-slate-800/70
          px-3
          py-2.5
          lg:flex
          ${isCollapsed ? 'justify-center' : 'justify-end'}
        `}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            border
            border-slate-700
            bg-slate-900
            text-slate-400
            transition
            hover:border-emerald-700
            hover:bg-slate-800
            hover:text-emerald-300
          "
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* SCROLLABLE NAVIGATION */}
      <nav
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          py-4
          [scrollbar-width:thin]
          [scrollbar-color:#475569_transparent]
        "
      >
        <div className="space-y-5">
          {/* MANAGEMENT */}
          <section>
            <div className={sectionTitleClass}>
              Management
            </div>

            <div className="space-y-0.5">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleSelect('admin-dashboard')}
                  className={itemClass('admin-dashboard')}
                  title={isCollapsed ? 'Admin Dashboard' : undefined}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>Admin Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelect('caregiver-dashboard')}
                  className={itemClass('caregiver-dashboard')}
                  title={isCollapsed ? 'Caregiver Station' : undefined}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>Caregiver Station</span>
                </button>
              )}
            </div>
          </section>

          {/* RESIDENT HEALTH */}
          <section>
            <div className={sectionTitleClass}>
              Resident Health
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelect('residents-list')}
                className={itemClass('residents-list')}
                title={isCollapsed ? 'Residents Directory' : undefined}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className={labelClass}>Residents Directory</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleSelect('add-resident')}
                  className={itemClass('add-resident')}
                  title={isCollapsed ? 'Register Resident' : undefined}
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>Register Resident</span>
                </button>
              )}
            </div>
          </section>

          {/* HEALTH MONITORING */}
          <section>
            <div className={sectionTitleClass}>
              Health Monitoring
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelect('record-vitals')}
                className={itemClass('record-vitals')}
                title={isCollapsed ? 'Record Vital Signs' : undefined}
              >
                <Activity className="h-4 w-4 shrink-0" />
                <span className={labelClass}>Record Vital Signs</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('vitals-history')}
                className={itemClass('vitals-history')}
                title={isCollapsed ? 'Vitals & Alert Log' : undefined}
              >
                <div className="relative shrink-0">
                  <ShieldAlert className="h-4 w-4" />

                  {isCollapsed && activeAlertsCount > 0 && (
                    <span
                      className="
                        absolute
                        -right-2
                        -top-2
                        hidden
                        h-[15px]
                        min-w-[15px]
                        items-center
                        justify-center
                        rounded-full
                        bg-rose-500
                        px-1
                        text-[8px]
                        font-bold
                        text-white
                        lg:flex
                      "
                    >
                      {activeAlertsCount}
                    </span>
                  )}
                </div>

                <span className={labelClass}>Vitals & Alert Log</span>

                {activeAlertsCount > 0 && (
                  <span
                    className={`
                      ml-auto
                      inline-flex
                      min-w-[20px]
                      items-center
                      justify-center
                      rounded-full
                      bg-rose-600
                      px-1.5
                      py-0.5
                      text-[10px]
                      font-bold
                      text-white
                      ${isCollapsed ? 'lg:hidden' : ''}
                    `}
                  >
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* SUPPORTING MODULES */}
          <section>
            <div className={sectionTitleClass}>
              Supporting Modules
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelect('visitor-logs')}
                className={itemClass('visitor-logs')}
                title={isCollapsed ? 'Visitor Management' : undefined}
              >
                <CalendarCheck className="h-4 w-4 shrink-0" />
                <span className={labelClass}>Visitor Management</span>
              </button>
            </div>
          </section>

          {/* ADMIN REPORTS & ACCESS */}
          {isAdmin && (
            <section>
              <div className={sectionTitleClass}>
                Reports & Access
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleSelect('reports')}
                  className={itemClass('reports')}
                  title={isCollapsed ? 'System & PDF Reports' : undefined}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>System & PDF Reports</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('staff-management')}
                  className={itemClass('staff-management')}
                  title={isCollapsed ? 'Staff Management' : undefined}
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>Staff Management</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('telegram-config')}
                  className={itemClass('telegram-config')}
                  title={isCollapsed ? 'Telegram Alert Bot' : undefined}
                >
                  <Send className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>Telegram Alert Bot</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </nav>

      {/* ACTIVE SESSION / LOGOUT */}
      <div className="shrink-0 border-t border-slate-800 bg-[#0f172a] p-3">
        <div
          className={`
            flex
            items-center
            rounded-xl
            border
            border-slate-800
            bg-slate-900/90
            p-2.5
            ${isCollapsed ? 'gap-3 lg:justify-center lg:gap-0 lg:p-2' : 'gap-3'}
          `}
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-emerald-600
              text-xs
              font-black
              text-white
            "
          >
            {currentRole === 'admin' ? 'AD' : 'CG'}
          </div>

          <div
            className={`min-w-0 flex-1 ${
              isCollapsed ? 'lg:hidden' : ''
            }`}
          >
            <p className="truncate text-xs font-semibold text-white">
              Active Session
            </p>

            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              {currentRole} Staff
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className={`
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-800
              hover:text-rose-400
              ${isCollapsed ? 'lg:hidden' : ''}
            `}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="
              mt-2
              hidden
              w-full
              items-center
              justify-center
              rounded-lg
              p-2.5
              text-slate-400
              transition
              hover:bg-slate-800
              hover:text-rose-400
              lg:flex
            "
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

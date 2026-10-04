/** 
 * Golden Care - Elderly Care Management System
 * Pusat Jagaan Warga Emas dan Terapi Fitrah
 */

import React, { useCallback, useEffect, useState } from 'react';
import { User, Resident, Vital, Visitor } from './types';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { ResidentList } from './components/ResidentList';
import { ResidentProfile } from './components/ResidentProfile';
import { RecordVitalsModal } from './components/RecordVitalsModal';
import { AddResidentModal } from './components/AddResidentModal';
import { AddResidentView } from './components/AddResidentView';
import { VisitorLogsView } from './components/VisitorLogsView';
import { StaffManagementView } from './components/StaffManagementView';
import { ReportsView } from './components/ReportsView';
import { TelegramAlertConfig } from './components/TelegramAlertConfig';
import { VitalsMonitoringView } from './components/VitalsMonitoringView';
import {
  createResident,
  getResidents,
  ResidentInput,
} from './services/residentService';
import {
  createVital,
  CreateVitalResult,
  getVitals,
  VitalInput,
} from './services/vitalService';
import {
  checkInVisitor,
  checkOutVisitor,
  createVisitor,
  getVisitors,
  VisitorInput,
} from './services/visitorService';
import {
  AdminSummary,
  getAdminSummary,
} from './services/reportService';
import { logoutUser } from './services/authService';
import {
  createStaff,
  deleteStaff,
  getStaff,
  StaffCreateInput,
  StaffUpdateInput,
  updateStaff,
} from './services/staffService';

const ADMIN_ONLY_VIEWS: NavView[] = [
  'admin-dashboard',
  'add-resident',
  'staff-management',
  'reports',
  'telegram-config',
];

export default function App() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [residents, setResidents] = useState<Resident[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);

  // Active View State
  const [activeView, setActiveView] = useState<NavView>('admin-dashboard');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  // Modals
  const [isRecordVitalOpen, setIsRecordVitalOpen] = useState(false);
  const [vitalTargetResidentId, setVitalTargetResidentId] = useState<number | undefined>(undefined);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const refreshAdminSummary = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      setAdminSummary(null);
      return;
    }

    try {
      const summary = await getAdminSummary();
      setAdminSummary(summary);
    } catch (error) {
      console.error('Failed to load admin summary from Laravel:', error);
    }
  }, [isAuthenticated, currentUser?.role]);

  useEffect(() => {
    void refreshAdminSummary();
  }, [refreshAdminSummary]);

  // Central role-aware navigation guard.
  const handleNavigate = (view: NavView) => {
    if (currentUser?.role !== 'admin' && ADMIN_ONLY_VIEWS.includes(view)) {
      setSelectedResident(null);
      setActiveView('caregiver-dashboard');
      return;
    }

    setSelectedResident(null);

    if (view === 'record-vitals') {
      setIsRecordVitalOpen(true);
      return;
    }

    setActiveView(view);
  };

  // Extra safety: if a caregiver somehow lands on an admin-only state,
  // immediately return them to the caregiver dashboard.
  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser?.role === 'caregiver' &&
      ADMIN_ONLY_VIEWS.includes(activeView)
    ) {
      setSelectedResident(null);
      setActiveView('caregiver-dashboard');
    }
  }, [activeView, currentUser?.role, isAuthenticated]);

  // Load residents from Laravel after a real Sanctum login.
  useEffect(() => {
    if (!isAuthenticated) {
      setResidents([]);
      return;
    }

    let isActive = true;

    const loadResidents = async () => {
      try {
        const apiResidents = await getResidents();

        if (isActive) {
          setResidents(apiResidents);
        }
      } catch (error) {
        console.error('Failed to load residents from Laravel:', error);
      }
    };

    loadResidents();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  // Load visitor records from Laravel after login.
  useEffect(() => {
    if (!isAuthenticated) {
      setVisitors([]);
      return;
    }

    let isActive = true;

    const loadVisitors = async () => {
      try {
        const apiVisitors = await getVisitors();

        if (isActive) {
          setVisitors(apiVisitors);
        }
      } catch (error) {
        console.error('Failed to load visitors from Laravel:', error);
      }
    };

    loadVisitors();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  // Load vitals from Laravel after a real Sanctum login.
  useEffect(() => {
    if (!isAuthenticated) {
      setVitals([]);
      return;
    }

    let isActive = true;

    const loadVitals = async () => {
      try {
        const apiVitals = await getVitals();

        if (isActive) {
          setVitals(apiVitals);
        }
      } catch (error) {
        console.error('Failed to load vitals from Laravel:', error);
      }
    };

    loadVitals();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  // Load staff accounts from Laravel for the authenticated administrator.
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setAllUsers([]);
      return;
    }

    if (currentUser.role !== 'admin') {
      setAllUsers([currentUser]);
      return;
    }

    let isActive = true;

    const loadStaff = async () => {
      try {
        const apiStaff = await getStaff();

        if (isActive) {
          setAllUsers(apiStaff);
        }
      } catch (error) {
        console.error('Failed to load staff from Laravel:', error);
      }
    };

    void loadStaff();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, currentUser?.id, currentUser?.role]);

  // Authentication Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAllUsers([user]);
    setIsAuthenticated(true);

    if (user.role === 'admin') {
      setActiveView('admin-dashboard');
    } else {
      setActiveView('caregiver-dashboard');
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Laravel logout request failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');

      setIsAuthenticated(false);
      setCurrentUser(null);
      setAllUsers([]);
      setSelectedResident(null);
      setAdminSummary(null);
      setResidents([]);
      setVitals([]);
      setVisitors([]);

      setIsRecordVitalOpen(false);
      setVitalTargetResidentId(undefined);
      setIsAddResidentOpen(false);
    }
  };

  const handleAddStaff = async (input: StaffCreateInput): Promise<User> => {
    const created = await createStaff(input);
    setAllUsers((prev) => [created, ...prev]);
    void refreshAdminSummary();
    return created;
  };

  const handleUpdateStaff = async (
    userId: number,
    input: StaffUpdateInput,
  ): Promise<User> => {
    const updated = await updateStaff(userId, input);

    setAllUsers((prev) =>
      prev.map((user) => (user.id === updated.id ? updated : user)),
    );

    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }

    void refreshAdminSummary();
    return updated;
  };

  const handleDeleteStaff = async (userId: number): Promise<void> => {
    await deleteStaff(userId);
    setAllUsers((prev) => prev.filter((user) => user.id !== userId));
    void refreshAdminSummary();
  };

  // Critical Alerts count
  const activeAlerts = vitals.filter(
    (v) => v.bp_systolic > 140 || v.temperature > 37.5,
  );

  // Handle new vital submission
  const handleAddVital = async (
    newVital: VitalInput,
  ): Promise<CreateVitalResult> => {
    const result = await createVital(newVital);

    setVitals((prev) => [
      result.vital,
      ...prev.filter((vital) => vital.id !== result.vital.id),
    ]);

    void refreshAdminSummary();

    return result;
  };

  // Handle new resident registration
  const handleAddResident = async (newRes: ResidentInput): Promise<void> => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Only administrators can register residents.');
    }

    const created = await createResident(newRes);

    setResidents((prev) =>
      [...prev, created].sort((a, b) =>
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true }),
      ),
    );

    void refreshAdminSummary();
  };

  // Handle visitor registration
  const handleAddVisitor = async (newVisitor: VisitorInput): Promise<void> => {
    const created = await createVisitor(newVisitor);

    setVisitors((prev) => [
      created,
      ...prev.filter((visitor) => visitor.id !== created.id),
    ]);

    void refreshAdminSummary();
  };

  const handleCheckInVisitor = async (visitorId: number): Promise<void> => {
    const updated = await checkInVisitor(visitorId);

    setVisitors((prev) =>
      prev.map((visitor) => (visitor.id === updated.id ? updated : visitor)),
    );

    void refreshAdminSummary();
  };

  const handleCheckOutVisitor = async (visitorId: number): Promise<void> => {
    const updated = await checkOutVisitor(visitorId);

    setVisitors((prev) =>
      prev.map((visitor) => (visitor.id === updated.id ? updated : visitor)),
    );

    void refreshAdminSummary();
  };

  // Unauthenticated Barrier
  if (!isAuthenticated || !currentUser) {
    return (
      <AuthView
        allUsers={allUsers}
        onLogin={handleLogin}
        onRegister={() => undefined}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-[#f5f6f4] font-sans text-slate-800 antialiased">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeAlertsCount={activeAlerts.length}
        onOpenAlerts={() => handleNavigate('vitals-history')}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[1px] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
          />
        )}

        {/* Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          activeView={activeView}
          onSelectView={handleNavigate}
          onLogout={handleLogout}
          activeAlertsCount={activeAlerts.length}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() =>
            setIsSidebarCollapsed((prev) => !prev)
          }
        />

        {/* Main Content Stage */}
        <main className="min-h-0 w-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {selectedResident ? (
              <ResidentProfile
                resident={selectedResident}
                vitals={vitals}
                visitors={visitors}
                users={allUsers}
                onBack={() => setSelectedResident(null)}
                onOpenRecordVital={(resId) => {
                  setVitalTargetResidentId(resId);
                  setIsRecordVitalOpen(true);
                }}
                onAddVisitor={handleAddVisitor}
              />
            ) : (
              <>
                {isAdmin && activeView === 'admin-dashboard' && (
                  <AdminDashboard
                    residents={residents}
                    vitals={vitals}
                    users={allUsers}
                    summary={adminSummary}
                    onNavigate={handleNavigate}
                    onOpenRecordVital={() => setIsRecordVitalOpen(true)}
                    onOpenAddResident={() => handleNavigate('add-resident')}
                  />
                )}

                {!isAdmin && activeView === 'caregiver-dashboard' && (
                  <CaregiverDashboard
                    currentUser={currentUser}
                    residents={residents}
                    vitals={vitals}
                    onOpenRecordVital={() => setIsRecordVitalOpen(true)}
                    onSelectResident={(res) => setSelectedResident(res)}
                    onNavigate={handleNavigate}
                  />
                )}

                {activeView === 'residents-list' && (
                  <ResidentList
                    residents={residents}
                    currentRole={currentUser.role}
                    onSelectResident={(res) => setSelectedResident(res)}
                    onOpenAddModal={() => handleNavigate('add-resident')}
                  />
                )}

                {isAdmin && activeView === 'add-resident' && (
                  <AddResidentView
                    onAddResident={handleAddResident}
                    onNavigate={handleNavigate}
                    onSelectResident={(res) => setSelectedResident(res)}
                  />
                )}

                {activeView === 'vitals-history' && (
                  <VitalsMonitoringView
                    vitals={vitals}
                    residents={residents}
                    users={allUsers}
                    onOpenRecordVital={(resId) => {
                      setVitalTargetResidentId(resId);
                      setIsRecordVitalOpen(true);
                    }}
                    onSelectResident={(res) => setSelectedResident(res)}
                  />
                )}

                {activeView === 'visitor-logs' && (
                  <VisitorLogsView
                    visitors={visitors}
                    residents={residents}
                    onAddVisitor={handleAddVisitor}
                    onCheckInVisitor={handleCheckInVisitor}
                    onCheckOutVisitor={handleCheckOutVisitor}
                  />
                )}

                {isAdmin && activeView === 'staff-management' && (
                  <StaffManagementView
                    users={allUsers}
                    onAddUser={handleAddStaff}
                    onUpdateUser={handleUpdateStaff}
                    onDeleteUser={handleDeleteStaff}
                  />
                )}

                {isAdmin && activeView === 'reports' && (
                  <ReportsView
                    residents={residents}
                    vitals={vitals}
                    visitors={visitors}
                    users={allUsers}
                    summary={adminSummary}
                    onSelectResident={(res) => setSelectedResident(res)}
                  />
                )}

                {isAdmin && activeView === 'telegram-config' && (
                  <TelegramAlertConfig />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Record Vitals Modal */}
      {isRecordVitalOpen && (
        <RecordVitalsModal
          residents={residents}
          currentUser={currentUser}
          initialResidentId={vitalTargetResidentId}
          onClose={() => {
            setIsRecordVitalOpen(false);
            setVitalTargetResidentId(undefined);
          }}
          onSubmitVital={handleAddVital}
        />
      )}

      {/* Add Resident Modal - admin only */}
      {isAdmin && isAddResidentOpen && (
        <AddResidentModal
          onClose={() => setIsAddResidentOpen(false)}
          onAddResident={handleAddResident}
        />
      )}
    </div>
  );
}

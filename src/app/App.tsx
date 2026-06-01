import { useState, useEffect, useCallback } from 'react';
import { ComplianceRecord, EmployeeDetails } from './types/compliance';
import {
  loadComplianceRecords,
  saveComplianceRecord,
  saveComplianceRecords,
  createEmployeeRecord,
  deleteEmployeeRecord
} from './utils/storage';
import { Dashboard } from './components/Dashboard';
import { Checklist } from './components/Checklist';
import { Archives } from './components/Archives';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { EmployeesList } from './components/EmployeesList';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SetNewPasswordModal } from './components/auth/SetNewPasswordModal';
import { RegisterPage } from './components/auth/RegisterPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { InactivityWarning } from './components/InactivityWarning';
import { FloatingChat } from './components/FloatingChat';
import { DatabaseConfigGuard } from './components/DatabaseConfigGuard';
import { getSession, logout, onAuthStateChange, detectPasswordRecoveryFromUrl } from './utils/authService';
import { withTimeout, TimeoutError } from '../lib/withTimeout';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { LayoutDashboard, ClipboardCheck, Archive, UserPlus, Users, Home, LogOut } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import type { AuthSession } from './types/auth';
import { isBusinessUnitId, getBusinessUnitLabel, type BusinessUnitId } from './constants/businessUnits';
import React from 'react';

type Tab = 'dashboard' | 'checklist' | 'archives' | 'employees';
type AuthView = 'login' | 'register';

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() =>
    detectPasswordRecoveryFromUrl()
  );
  const [selectedSystem, setSelectedSystem] = useState<BusinessUnitId | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [currentRecord, setCurrentRecord] = useState<ComplianceRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!isSupabaseConfigured) {
          return;
        }
        const current = await withTimeout(
          getSession(),
          12_000,
          'Connection timed out. Check your network or Supabase project status.'
        );
        if (!cancelled) {
          setSession(current);
        }
      } catch (err) {
        console.error('[auth] bootstrap failed', err);
        if (!cancelled) {
          setSession(null);
          const message =
            err instanceof TimeoutError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Failed to connect to the server';
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    })();

    const { unsubscribe } = onAuthStateChange(next => {
      if (!cancelled && !detectPasswordRecoveryFromUrl()) {
        setSession(next);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (detectPasswordRecoveryFromUrl()) {
      setPasswordRecoveryMode(true);
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadRecords = useCallback(async (businessUnit: BusinessUnitId) => {
    setRecordsLoading(true);
    try {
      const loaded = await withTimeout(
        loadComplianceRecords(businessUnit),
        12_000,
        'Loading compliance data timed out. Please try again.'
      );
      setRecords(loaded);
      setSelectedEmployeeId('all');
      setCurrentRecord(null);
    } catch (err) {
      const message =
        err instanceof TimeoutError
          ? err.message
          : (err as Error).message || 'Failed to load compliance records';
      toast.error(message);
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && session.user.role !== 'admin' && selectedSystem) {
      loadRecords(selectedSystem);
    }
  }, [session, selectedSystem, loadRecords]);

  const handleSelectSystem = (systemId: string) => {
    if (!isBusinessUnitId(systemId)) return;
    setSelectedSystem(systemId);
    setActiveTab('dashboard');
    setRecords([]);
    setSelectedEmployeeId('all');
    setCurrentRecord(null);
  };

  const handleBackToHome = () => {
    setSelectedSystem(null);
    setActiveTab('dashboard');
    setRecords([]);
    setSelectedEmployeeId('all');
    setCurrentRecord(null);
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    if (employeeId === 'all') {
      setCurrentRecord(null);
    } else {
      const record = records.find(r => r.employee.id === employeeId);
      if (record) setCurrentRecord(record);
    }
  };

  const handleChecklistUpdate = async (updatedItems: ComplianceRecord['checklist']) => {
    if (!currentRecord || !selectedSystem) return;

    const updatedRecord = {
      ...currentRecord,
      checklist: updatedItems,
      lastUpdated: new Date().toISOString()
    };

    try {
      await saveComplianceRecord(updatedRecord, selectedSystem);
      setCurrentRecord(updatedRecord);
      setRecords(records.map(r =>
        r.employee.id === currentRecord.employee.id ? updatedRecord : r
      ));
      toast.success('Checklist updated successfully');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save checklist');
    }
  };

  const handleAddEmployee = async (employee: EmployeeDetails) => {
    if (!selectedSystem) return;
    try {
      const newRecord = await createEmployeeRecord(employee, selectedSystem);
      setRecords([...records, newRecord]);
      setSelectedEmployeeId(newRecord.employee.id);
      setCurrentRecord(newRecord);
      setShowAddModal(false);
      toast.success(`Added employee: ${employee.name}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add employee');
    }
  };

  const handleArchiveSaved = (month: string, year: number) => {
    toast.success(`Archive saved for ${month} ${year}`);
    if (selectedSystem) loadRecords(selectedSystem);
  };

  const handleLoginSuccess = async () => {
    const current = await getSession();
    setSession(current);
  };

  const handleRegisterSuccess = async () => {
    const current = await getSession();
    setSession(current);
    toast.success('Account created successfully! Welcome to Compliance Management System.');
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setSelectedSystem(null);
    toast.info('You have been logged out');
  };

  const handleInactivityLogout = async () => {
    await logout();
    setSession(null);
    setSelectedSystem(null);
    toast.warning('You have been logged out due to inactivity');
  };

  const { showWarning, secondsRemaining, extendSession } = useInactivityTimeout({
    timeout: 5 * 60 * 1000,
    warningTime: 4 * 60 * 1000,
    onTimeout: handleInactivityLogout
  });

  const handleSaveEditEmployee = async (updatedEmployee: EmployeeDetails) => {
    if (!selectedSystem) return;
    const updatedRecords = records.map(r => {
      if (r.employee.id === updatedEmployee.id) {
        return { ...r, employee: updatedEmployee, lastUpdated: new Date().toISOString() };
      }
      return r;
    });

    try {
      await saveComplianceRecords(updatedRecords, selectedSystem);
      setRecords(updatedRecords);
      if (currentRecord?.employee.id === updatedEmployee.id) {
        setCurrentRecord({ ...currentRecord, employee: updatedEmployee });
      }
      setShowEditModal(false);
      setEmployeeToEdit(null);
      toast.success(`Updated employee: ${updatedEmployee.name}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!selectedSystem) return;
    try {
      await deleteEmployeeRecord(employeeId, selectedSystem);
      const updatedRecords = records.filter(r => r.employee.id !== employeeId);
      setRecords(updatedRecords);
      if (currentRecord?.employee.id === employeeId) {
        if (updatedRecords.length > 0) {
          setSelectedEmployeeId(updatedRecords[0].employee.id);
          setCurrentRecord(updatedRecords[0]);
        } else {
          setSelectedEmployeeId('all');
          setCurrentRecord(null);
        }
      }
      toast.success('Employee deleted successfully');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete employee');
    }
  };

  const handleBulkImportEmployees = async (employees: EmployeeDetails[]) => {
    if (!selectedSystem) return;
    try {
      const newRecords: ComplianceRecord[] = [];
      for (const employee of employees) {
        newRecords.push(await createEmployeeRecord(employee, selectedSystem));
      }
      setRecords([...records, ...newRecords]);
      if (newRecords.length > 0) {
        setSelectedEmployeeId(newRecords[0].employee.id);
        setCurrentRecord(newRecords[0]);
      }
      toast.success(`Imported ${newRecords.length} employee(s)`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to import employees');
    }
  };

  const getSystemName = () =>
    selectedSystem ? getBusinessUnitLabel(selectedSystem) : 'Compliance Management System';

  if (passwordRecoveryMode) {
    return (
      <DatabaseConfigGuard>
        <Toaster position="top-right" />
        <SetNewPasswordModal
          onComplete={() => {
            setPasswordRecoveryMode(false);
            setSession(null);
            setAuthView('login');
          }}
        />
      </DatabaseConfigGuard>
    );
  }

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-gray-600 text-sm">Connecting to Compliance Management System...</p>
      </div>
    );
  }

  return (
    <DatabaseConfigGuard>
      {!session ? (
        authView === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onRegisterClick={() => setAuthView('register')}
          />
        ) : (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onLoginClick={() => setAuthView('login')}
          />
        )
      ) : session.user.role === 'admin' ? (
        <>
          <AdminPortal onLogout={handleLogout} session={session} />
          {showWarning && (
            <InactivityWarning secondsRemaining={secondsRemaining} onExtend={extendSession} />
          )}
        </>
      ) : !selectedSystem ? (
        <>
          <LandingPage onSelectSystem={handleSelectSystem} />
          {showWarning && (
            <InactivityWarning secondsRemaining={secondsRemaining} onExtend={extendSession} />
          )}
        </>
      ) : recordsLoading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading compliance data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <AddEmployeeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddEmployee} />
            <EditEmployeeModal
              isOpen={showEditModal}
              onClose={() => { setShowEditModal(false); setEmployeeToEdit(null); }}
              onSave={handleSaveEditEmployee}
              employee={employeeToEdit}
            />

            <div className="bg-gradient-to-r from-[#5B9BD5] to-[#4682B4] text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold">{getSystemName()}</h1>
                  <div className="flex gap-2">
                    <button onClick={handleBackToHome} className="bg-white/20 hover:bg-white/30 p-3 rounded-lg" title="Back to Home">
                      <Home size={22} />
                    </button>
                    <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 p-3 rounded-lg" title="Logout">
                      <LogOut size={22} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[300px]">
                    <label className="block text-sm font-semibold mb-2">Select Employee</label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="all">All Employees - Overview</option>
                      {records.map(record => (
                        <option key={record.employee.id} value={record.employee.id}>
                          {record.employee.name} - {record.employee.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="bg-[#FFE54D] text-gray-900 hover:bg-[#FFD700] px-6 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2 mt-7">
                    <UserPlus size={20} />
                    Add New Employee
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex gap-1">
                  {(['dashboard', 'checklist', 'archives', 'employees'] as Tab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors capitalize ${
                        activeTab === tab ? 'text-[#5B9BD5] border-b-2 border-[#5B9BD5] bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {tab === 'dashboard' && <LayoutDashboard size={20} />}
                      {tab === 'checklist' && <ClipboardCheck size={20} />}
                      {tab === 'archives' && <Archive size={20} />}
                      {tab === 'employees' && <Users size={20} />}
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
              {activeTab === 'dashboard' && (
                <Dashboard record={currentRecord} allRecords={selectedEmployeeId === 'all' ? records : undefined} />
              )}
              {activeTab === 'checklist' && currentRecord && (
                <Checklist items={currentRecord.checklist} onUpdate={handleChecklistUpdate} employeeName={currentRecord.employee.name} record={currentRecord} />
              )}
              {activeTab === 'checklist' && !currentRecord && selectedEmployeeId === 'all' && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <ClipboardCheck size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Employee</h3>
                  <p className="text-gray-600">Please select a specific employee to view and manage their checklist</p>
                </div>
              )}
              {activeTab === 'checklist' && !currentRecord && selectedEmployeeId !== 'all' && records.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <ClipboardCheck size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Employees Yet</h3>
                  <p className="text-gray-600">Add your first employee to start tracking compliance checklists.</p>
                </div>
              )}
              {activeTab === 'archives' && selectedSystem && (
                <Archives businessUnit={selectedSystem} onSaveArchive={handleArchiveSaved} />
              )}
              {activeTab === 'employees' && (
                <EmployeesList
                  records={records}
                  onEdit={(e) => { setEmployeeToEdit(e); setShowEditModal(true); }}
                  onDelete={handleDeleteEmployee}
                  onView={(id) => { handleEmployeeChange(id); setActiveTab('dashboard'); }}
                  onAddNew={() => setShowAddModal(true)}
                  onBulkImport={handleBulkImportEmployees}
                />
              )}
            </div>
          </div>

          {showWarning && <InactivityWarning secondsRemaining={secondsRemaining} onExtend={extendSession} />}
          {session && selectedSystem && (
            <FloatingChat currentUserId={session.user.id} currentUserName={session.user.name} />
          )}
        </>
      )}
    </DatabaseConfigGuard>
  );
}

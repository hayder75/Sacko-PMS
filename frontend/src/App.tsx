import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { mapBackendRoleToFrontend } from './lib/roleMapper';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { CEODashboard } from './pages/CEODashboard';
import { AreaManagerDashboard } from './pages/AreaManagerDashboard';
import { BranchManagerDashboard } from './pages/BranchManagerDashboard';
import { SupervisorDashboard } from './pages/SupervisorDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { Tasks } from './pages/Tasks';
import { TaskEntryForm } from './pages/TaskEntryForm';
import { MappingManagement } from './pages/MappingManagement';
import { KPIDashboard } from './pages/KPIDashboard';
import { Reports } from './pages/Reports';
import { MonthlyScorecard } from './pages/MonthlyScorecard';
import { Settings } from './pages/Settings';
import { RoutesGuide } from './pages/RoutesGuide';
import { UserManagement } from './pages/hq/UserManagement';
import { BranchManagement } from './pages/hq/BranchManagement';
import { PlanCascade } from './pages/hq/PlanCascade';
import { PlansOverview } from './pages/hq/PlansOverview';
import { CBSValidation } from './pages/hq/CBSValidation';
import { AuditTrail } from './pages/hq/AuditTrail';
import { KPIFramework } from './pages/hq/KPIFramework';
import { CompetencyFramework } from './pages/hq/CompetencyFramework';
import { JuneBalanceImport } from './pages/hq/JuneBalanceImport';
import { ProductMapping } from './pages/hq/ProductMapping';
import { AreaPerformance } from './pages/AreaPerformance';
import { BranchMonitoring } from './pages/BranchMonitoring';
import { BehavioralEvaluation } from './pages/BehavioralEvaluation';
import { BehavioralInput } from './pages/BehavioralInput';
import { BulkMappingUpload } from './pages/BulkMappingUpload';
import { MappedAccounts } from './pages/MappedAccounts';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, role } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-600 font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function DashboardRoute() {
  const { role, user } = useUser();
  const mappedRole = user?.role ? mapBackendRoleToFrontend(user.role) : role;

  switch (mappedRole) {
    case 'admin':
      return <CEODashboard />;
    case 'areaManager':
      return <AreaManagerDashboard />;
    case 'branchManager':
      return <BranchManagerDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'staff':
      return <StaffDashboard />;
    default:
      return <StaffDashboard />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
      <Route path="/dashboard/hq" element={<ProtectedRoute allowedRoles={['admin']}><CEODashboard /></ProtectedRoute>} />
      <Route path="/dashboard/area" element={<ProtectedRoute allowedRoles={['areaManager']}><AreaManagerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/branch" element={<ProtectedRoute allowedRoles={['branchManager', 'supervisor']}><BranchManagerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/supervisor" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute allowedRoles={['staff', 'supervisor']}><Tasks /></ProtectedRoute>} />
      <Route path="/tasks/new" element={<ProtectedRoute allowedRoles={['staff']}><TaskEntryForm /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/mapping" element={<ProtectedRoute allowedRoles={['admin', 'branchManager', 'supervisor']}><MappingManagement /></ProtectedRoute>} />
      <Route path="/bulk-mapping-upload" element={<ProtectedRoute allowedRoles={['branchManager']}><BulkMappingUpload /></ProtectedRoute>} />
      <Route path="/kpi" element={<ProtectedRoute allowedRoles={['staff', 'supervisor']}><KPIDashboard /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'areaManager', 'branchManager', 'supervisor', 'staff']}><Reports /></ProtectedRoute>} />
      <Route path="/reports/scorecard" element={<ProtectedRoute allowedRoles={['staff']}><MonthlyScorecard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'areaManager', 'branchManager', 'supervisor', 'staff']}><Settings /></ProtectedRoute>} />
      <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
      <Route path="/branch-management" element={<ProtectedRoute allowedRoles={['admin']}><BranchManagement /></ProtectedRoute>} />
      <Route path="/plan-cascade" element={<ProtectedRoute allowedRoles={['admin']}><PlanCascade /></ProtectedRoute>} />
      <Route path="/plan-cascade/overview" element={<ProtectedRoute allowedRoles={['admin']}><PlansOverview /></ProtectedRoute>} />
      <Route path="/plan-cascade/create" element={<ProtectedRoute allowedRoles={['admin']}><PlanCascade /></ProtectedRoute>} />
      <Route path="/plan-cascade/upload" element={<ProtectedRoute allowedRoles={['admin']}><PlanCascade /></ProtectedRoute>} />
      <Route path="/cbs-validation" element={<ProtectedRoute allowedRoles={['admin', 'branchManager']}><CBSValidation /></ProtectedRoute>} />
      <Route path="/audit-trail" element={<ProtectedRoute allowedRoles={['admin']}><AuditTrail /></ProtectedRoute>} />
      <Route path="/kpi-framework" element={<ProtectedRoute allowedRoles={['admin']}><KPIFramework /></ProtectedRoute>} />
      <Route path="/competency-framework" element={<ProtectedRoute allowedRoles={['admin']}><CompetencyFramework /></ProtectedRoute>} />
      <Route path="/routes" element={<ProtectedRoute allowedRoles={['admin', 'areaManager', 'branchManager', 'supervisor', 'staff']}><RoutesGuide /></ProtectedRoute>} />
      <Route path="/area-performance" element={<ProtectedRoute allowedRoles={['areaManager']}><AreaPerformance /></ProtectedRoute>} />
      <Route path="/branch-monitoring" element={<ProtectedRoute allowedRoles={['areaManager']}><BranchMonitoring /></ProtectedRoute>} />
      <Route path="/behavioral-evaluation" element={<ProtectedRoute allowedRoles={['admin', 'areaManager', 'branchManager', 'supervisor']}><BehavioralEvaluation /></ProtectedRoute>} />
      <Route path="/behavioral-input" element={<ProtectedRoute allowedRoles={['supervisor']}><BehavioralInput /></ProtectedRoute>} />
      <Route path="/june-balance-import" element={<ProtectedRoute allowedRoles={['admin']}><JuneBalanceImport /></ProtectedRoute>} />
      <Route path="/product-mapping" element={<ProtectedRoute allowedRoles={['admin']}><ProductMapping /></ProtectedRoute>} />
      <Route path="/mapped-accounts" element={<ProtectedRoute allowedRoles={['branchManager', 'supervisor', 'staff']}><MappedAccounts /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout><AppRoutes /></MainLayout>} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;

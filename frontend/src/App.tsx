import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { mapBackendRoleToFrontend } from './lib/roleMapper';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { HQDashboard } from './pages/HQDashboard';
import { RegionalDirectorDashboard } from './pages/RegionalDirectorDashboard';
import { AreaManagerDashboard } from './pages/AreaManagerDashboard';
import { BranchManagerDashboard } from './pages/BranchManagerDashboard';
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
import { CBSValidation } from './pages/hq/CBSValidation';
import { AuditTrail } from './pages/hq/AuditTrail';
import { KPIFramework } from './pages/hq/KPIFramework';
import { CompetencyFramework } from './pages/hq/CompetencyFramework';
import { HierarchyManagement } from './pages/HierarchyManagement';
import { JuneBalanceImport } from './pages/hq/JuneBalanceImport';
import { PlanShareConfig } from './pages/hq/PlanShareConfig';
import { ProductMapping } from './pages/hq/ProductMapping';
import { AreaPerformance } from './pages/AreaPerformance';
import { BranchMonitoring } from './pages/BranchMonitoring';
import { TeamPerformance } from './pages/TeamPerformance';
import { BehavioralEvaluation } from './pages/BehavioralEvaluation';
import { TeamTasks } from './pages/TeamTasks';
import { BehavioralInput } from './pages/BehavioralInput';
import { TeamManagement } from './pages/TeamManagement';
import { BulkMappingUpload } from './pages/BulkMappingUpload';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUser } = useUser();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function DashboardRoute() {
  const { role, user } = useUser();
  
  // Ensure role is mapped correctly (in case user object has backend role)
  const mappedRole = user?.role ? mapBackendRoleToFrontend(user.role) : role;
  
  switch (mappedRole) {
    case 'admin':
      return <HQDashboard />;
    case 'regionalDirector':
      return <RegionalDirectorDashboard />;
    case 'areaManager':
      return <AreaManagerDashboard />;
    case 'branchManager':
      return <BranchManagerDashboard />;
    case 'lineManager':
      return <BranchManagerDashboard />; // Line managers see branch dashboard
    case 'subTeamLeader':
      return <StaffDashboard />; // Sub-team leaders see staff dashboard
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/hq"
        element={
          <ProtectedRoute>
            <HQDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/regional"
        element={
          <ProtectedRoute>
            <RegionalDirectorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/area"
        element={
          <ProtectedRoute>
            <AreaManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/branch"
        element={
          <ProtectedRoute>
            <BranchManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/staff"
        element={
          <ProtectedRoute>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <ProtectedRoute>
            <TaskEntryForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mapping"
        element={
          <ProtectedRoute>
            <MappingManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bulk-mapping-upload"
        element={
          <ProtectedRoute>
            <BulkMappingUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kpi"
        element={
          <ProtectedRoute>
            <KPIDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/scorecard"
        element={
          <ProtectedRoute>
            <MonthlyScorecard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/branch-management"
        element={
          <ProtectedRoute>
            <BranchManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-cascade"
        element={
          <ProtectedRoute>
            <PlanCascade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-cascade/upload"
        element={
          <ProtectedRoute>
            <PlanCascade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-cascade/hierarchy"
        element={
          <ProtectedRoute>
            <PlanCascade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-cascade/plan-share"
        element={
          <ProtectedRoute>
            <PlanCascade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cbs-validation"
        element={
          <ProtectedRoute>
            <CBSValidation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-trail"
        element={
          <ProtectedRoute>
            <AuditTrail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kpi-framework"
        element={
          <ProtectedRoute>
            <KPIFramework />
          </ProtectedRoute>
        }
      />
      <Route
        path="/competency-framework"
        element={
          <ProtectedRoute>
            <CompetencyFramework />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hierarchy"
        element={
          <ProtectedRoute>
            <HierarchyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routes"
        element={
          <ProtectedRoute>
            <RoutesGuide />
          </ProtectedRoute>
        }
      />
      <Route
        path="/area-performance"
        element={
          <ProtectedRoute>
            <AreaPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/branch-monitoring"
        element={
          <ProtectedRoute>
            <BranchMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-performance"
        element={
          <ProtectedRoute>
            <TeamPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/behavioral-evaluation"
        element={
          <ProtectedRoute>
            <BehavioralEvaluation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-tasks"
        element={
          <ProtectedRoute>
            <TeamTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/behavioral-input"
        element={
          <ProtectedRoute>
            <BehavioralInput />
          </ProtectedRoute>
        }
      />
      <Route
        path="/june-balance-import"
        element={
          <ProtectedRoute>
            <JuneBalanceImport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-share-config"
        element={
          <ProtectedRoute>
            <PlanShareConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product-mapping"
        element={
          <ProtectedRoute>
            <ProductMapping />
          </ProtectedRoute>
        }
      />
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
          <Route
            path="/*"
            element={
              <MainLayout>
                <AppRoutes />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;

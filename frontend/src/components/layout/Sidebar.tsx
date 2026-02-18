import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Network,
  Target,
  FileText,
  Settings,
  Menu,
  X,
  BookOpen,
  Upload,
  Users,
  Shield,
  BarChart3,
  ClipboardList,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  children?: { title: string; path: string }[];
}

const getNavItems = (role: string): NavItem[] => {
  // Admin
  if (role === 'admin') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/hq' },
      {
        title: 'PLAN MANAGEMENT',
        icon: Upload,
        path: '/plan-cascade',
        children: [
          { title: 'Create Plans', path: '/plan-cascade' },
          { title: 'Plan Share Config', path: '/plan-share-config' },
        ]
      },
      { title: 'BASELINE BALANCE', icon: Upload, path: '/june-balance-import' },
      { title: 'PRODUCT MAPPING', icon: Target, path: '/product-mapping' },
      { title: 'MAPPING MANAGEMENT', icon: Network, path: '/mapping' },
      { title: 'CBS VALIDATION', icon: CheckCircle2, path: '/cbs-validation' },
      { title: 'USER MANAGEMENT', icon: Users, path: '/user-management' },
      { title: 'BRANCH MANAGEMENT', icon: Network, path: '/branch-management' },
      { title: 'KPI FRAMEWORK', icon: Target, path: '/kpi-framework' },
      { title: 'COMPETENCY FRAMEWORK', icon: Shield, path: '/competency-framework' },
      { title: 'AUDIT TRAIL', icon: FileText, path: '/audit-trail' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // regionalDirector
  if (role === 'regionalDirector') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/regional' },
      { title: 'AREA PERFORMANCE', icon: BarChart3, path: '/area-performance' },
      { title: 'BEHAVIORAL EVALUATION', icon: ClipboardList, path: '/behavioral-evaluation' },
      { title: 'REPORTS', icon: FileText, path: '/reports' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // areaManager
  if (role === 'areaManager') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/area' },
      { title: 'BRANCH MONITORING', icon: Eye, path: '/branch-monitoring' },
      { title: 'AREA PERFORMANCE', icon: BarChart3, path: '/area-performance' },
      { title: 'BEHAVIORAL EVALUATION', icon: ClipboardList, path: '/behavioral-evaluation' },
      { title: 'REPORTS', icon: FileText, path: '/reports' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // branchManager
  if (role === 'branchManager') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/branch' },
      { title: 'TEAM PERFORMANCE', icon: BarChart3, path: '/team-performance' },
      { title: 'TEAM TASKS', icon: CheckSquare, path: '/team-tasks' },
      { title: 'HIERARCHY', icon: Users, path: '/hierarchy' },
      { title: 'TEAM MANAGEMENT', icon: Users, path: '/teams' },
      { title: 'MAPPING', icon: Network, path: '/mapping' },
      { title: 'BULK MAPPING UPLOAD', icon: Upload, path: '/bulk-mapping-upload' },
      { title: 'CBS VALIDATION', icon: CheckCircle2, path: '/cbs-validation' },
      { title: 'BEHAVIORAL EVALUATION', icon: ClipboardList, path: '/behavioral-evaluation' },
      { title: 'REPORTS', icon: FileText, path: '/reports' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // lineManager (MSM)
  if (role === 'lineManager') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/branch' },
      { title: 'TEAM TASKS', icon: CheckSquare, path: '/team-tasks' },
      { title: 'TEAM PERFORMANCE', icon: BarChart3, path: '/team-performance' },
      { title: 'HIERARCHY', icon: Users, path: '/hierarchy' },
      { title: 'MAPPING', icon: Network, path: '/mapping' },
      { title: 'BEHAVIORAL INPUT', icon: ClipboardList, path: '/behavioral-input' },
      { title: 'REPORTS', icon: FileText, path: '/reports' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // subTeamLeader (Accountant/Auditor)
  if (role === 'subTeamLeader') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/staff' },
      { title: 'MY TASKS', icon: CheckSquare, path: '/tasks' },
      { title: 'TEAM TASKS', icon: ClipboardList, path: '/team-tasks' },
      { title: 'MAPPING', icon: Network, path: '/mapping' },
      { title: 'MY PERFORMANCE', icon: Target, path: '/kpi' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // Staff
  if (role === 'staff') {
    return [
      { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard/staff' },
      { title: 'TASKS', icon: CheckSquare, path: '/tasks' },
      { title: 'MY PERFORMANCE', icon: Target, path: '/kpi' },
      { title: 'MY SCORECARD', icon: FileText, path: '/reports/scorecard' },
      { title: 'SETTINGS', icon: Settings, path: '/settings' },
    ];
  }

  // Default fallback
  return [
    { title: 'DASHBOARD', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'SETTINGS', icon: Settings, path: '/settings' },
  ];
};

export function Sidebar() {
  const { role } = useUser();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = getNavItems(role);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 bg-slate-50 border-r border-slate-200 z-40 transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">SAKO PMS</h1>
          <p className="text-xs text-slate-500 mt-1">{role}</p>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <div key={item.title}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-200 text-slate-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
                {item.children && active && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "block px-4 py-2 rounded-md text-sm transition-colors",
                          isActive(child.path)
                            ? "bg-slate-200 text-slate-700"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <Link
              to="/routes"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                location.pathname === '/routes'
                  ? "bg-slate-200 text-slate-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <BookOpen className="h-5 w-5" />
              <span>Routes Guide</span>
            </Link>
          </div>
        </nav>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

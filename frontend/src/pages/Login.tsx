import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { mapBackendRoleToFrontend } from '@/lib/roleMapper';
import { AlertCircle, ChevronDown, Check, Lock, BarChart3 } from 'lucide-react';

export function Login() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setRole, setCurrentBranch, setUserName, loadUser } = useUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/public-list');
      const data = await res.json();
      if (data && data.data) setUsers(data.data);
      else if (Array.isArray(data)) setUsers(data);
    } catch (_) {}
  };

  const groupedUsers = users.reduce((acc: any, u: any) => {
    const role = u.position || u.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(u);
    return acc;
  }, {});

  const roleOrder = ['Regional_Director', 'Area_Manager', 'Branch_Manager', 'Member_Service_Manager', 'Accountant', 'Member_Service_Officer_I', 'Member_Service_Officer_II', 'Member_Service_Officer_III'];

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setShowDropdown(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedUser) { setError('Please select a user'); return; }
    if (!password) { setError('Please enter password'); return; }
    setLoading(true);

    try {
      const response = await authAPI.login(selectedUser.email, password);
      
      if (response.success && response.data) {
        // Map backend role to frontend role
        const frontendRole = mapBackendRoleToFrontend(response.data.role);
        
        // Update user context immediately
        setRole(frontendRole);
        setUserName(response.data.name);
        if (response.data.branch_code) {
          setCurrentBranch(response.data.branch_code);
        } else if (response.data.branchId?.name) {
          setCurrentBranch(response.data.branchId.name);
        } else {
          setCurrentBranch(''); // Default
        }

        // Reload user to set authentication state
        await loadUser();

        // Small delay to ensure state is updated
        setTimeout(() => {
          // Navigate based on mapped role
          const dashboardPath = getDashboardPath(frontendRole);
          navigate(dashboardPath, { replace: true });
        }, 100);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'admin':
        return '/dashboard/hq';
      case 'regionalDirector':
        return '/dashboard/regional';
      case 'areaManager':
        return '/dashboard/area';
      case 'branchManager':
        return '/dashboard/branch';
      case 'staff':
        return '/dashboard/staff';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]">
        <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="white">
            <polyline points="0,700 100,650 200,680 300,550 400,480 500,500 600,380 700,420 800,300 900,250 1000,280 1100,180 1200,220 1300,100 1440,120" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,750 100,720 200,740 300,650 400,600 500,620 600,520 700,550 800,450 900,400 1000,420 1100,340 1200,370 1300,280 1440,300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <polyline points="0,600 100,580 200,610 300,500 400,440 500,460 600,350 700,390 800,280 900,220 1000,250 1100,150 1200,190 1300,80 1440,90" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
          </g>
          <g fill="white" opacity="0.15">
            <rect x="50" y="500" width="20" height="200" rx="2" />
            <rect x="150" y="450" width="20" height="250" rx="2" />
            <rect x="280" y="380" width="20" height="320" rx="2" />
            <rect x="420" y="320" width="20" height="380" rx="2" />
            <rect x="560" y="250" width="20" height="450" rx="2" />
            <rect x="700" y="200" width="20" height="500" rx="2" />
            <rect x="850" y="150" width="20" height="550" rx="2" />
            <rect x="1000" y="180" width="20" height="520" rx="2" />
            <rect x="1150" y="100" width="20" height="600" rx="2" />
            <rect x="1300" y="60" width="20" height="640" rx="2" />
          </g>
          <g fill="none" stroke="white" opacity="0.08">
            <line x1="0" y1="200" x2="1440" y2="200" strokeWidth="1" strokeDasharray="4,6" />
            <line x1="0" y1="400" x2="1440" y2="400" strokeWidth="1" strokeDasharray="4,6" />
            <line x1="0" y1="600" x2="1440" y2="600" strokeWidth="1" strokeDasharray="4,6" />
            <line x1="0" y1="800" x2="1440" y2="800" strokeWidth="1" strokeDasharray="4,6" />
          </g>
        </svg>
      </div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />
      <Card className="w-full max-w-md shadow-2xl border-0 relative">
        <div className="h-2 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-t-xl" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center shadow-sm">
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-800 tracking-tight">SACCOS PMS</CardTitle>
          <p className="text-slate-500 mt-1 text-sm">Performance Management System</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="text-sm font-medium text-slate-700">Select User</label>
              <div className="relative">
                <div
                  className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2.5 cursor-pointer bg-white hover:border-primary-400 transition-colors shadow-sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {selectedUser ? (
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{selectedUser.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-medium">{selectedUser.position || selectedUser.role}</span>
                      {selectedUser.location && <span className="text-xs text-slate-400">{selectedUser.location.replace(/_/g, ' ')}</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">Select a user...</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
                {showDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {roleOrder.map(role => {
                      const roleUsers = groupedUsers[role];
                      if (!roleUsers || roleUsers.length === 0) return null;
                      return (
                        <div key={role}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-100">
                            {role.replace(/_/g, ' ')}
                          </div>
                          {roleUsers.map((u: any) => (
                            <div
                              key={u._id || u.id}
                              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm hover:bg-primary-50 transition-colors ${selectedUser?._id === u._id || selectedUser?.id === u.id ? 'bg-primary-50 border-l-2 border-primary-600' : 'border-l-2 border-transparent'}`}
                              onClick={() => selectUser(u)}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-slate-800">{u.name}</span>
                                {u.location && <span className="text-xs text-slate-400 ml-2">{u.location.replace(/_/g, ' ')}</span>}
                              </div>
                              {(selectedUser?._id === u._id || selectedUser?.id === u.id) && (
                                <Check className="h-4 w-4 text-primary-600 shrink-0 ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {Object.keys(groupedUsers).length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-400">No users available</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pl-10 rounded-lg shadow-sm"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold rounded-lg shadow-md" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-center text-xs text-slate-400 mt-6">
              Secure System &copy; {new Date().getFullYear()} SACCOS
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


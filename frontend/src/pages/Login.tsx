import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { mapBackendRoleToFrontend } from '@/lib/roleMapper';
import { AlertCircle, Search, Check } from 'lucide-react';

export function Login() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState('');
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

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.position || u.role || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setSearch(user.name);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-slate-800">SAKO PMS</CardTitle>
          <p className="text-slate-600 mt-2">Performance Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-sm font-medium text-slate-700">Select User</label>
              <div className="relative">
                <div
                  className="flex items-center border border-slate-300 rounded-md px-3 py-2 cursor-pointer bg-white hover:border-slate-400 transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Search className="h-4 w-4 text-slate-400 mr-2" />
                  <span className={selectedUser ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedUser ? (
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{selectedUser.name}</span>
                        <span className="text-xs text-slate-500">({selectedUser.position || selectedUser.role})</span>
                        {selectedUser.location && <span className="text-xs text-slate-400">- {selectedUser.location.replace(/_/g, ' ')}</span>}
                      </span>
                    ) : 'Search and select a user...'}
                  </span>
                </div>
                {showDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100">
                      <Input
                        placeholder="Type name, email, branch..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-400">No users found</div>
                      ) : (
                        filteredUsers.map((u) => (
                          <div
                            key={u._id || u.id}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-slate-50 transition-colors ${selectedUser?._id === u._id || selectedUser?.id === u.id ? 'bg-blue-50' : ''}`}
                            onClick={() => selectUser(u)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800 truncate">{u.name}</span>
                                <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{u.position || u.role}</span>
                              </div>
                              {u.location && (
                                <div className="text-xs text-slate-400 mt-0.5">{u.location.replace(/_/g, ' ')}</div>
                              )}
                            </div>
                            {(selectedUser?._id === u._id || selectedUser?.id === u.id) && (
                              <Check className="h-4 w-4 text-blue-500 shrink-0 ml-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-1.5 border-t border-slate-100 text-center text-xs text-slate-400 bg-slate-50">
                      {users.length} users
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


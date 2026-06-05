import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { authAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Profile() {
  const { user, userName, role, currentBranch } = useUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const roleBadgeColor = (r: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      regionalDirector: 'bg-blue-100 text-blue-800',
      areaManager: 'bg-indigo-100 text-indigo-800',
      branchManager: 'bg-green-100 text-green-800',
      lineManager: 'bg-teal-100 text-teal-800',
      subTeamLeader: 'bg-orange-100 text-orange-800',
      staff: 'bg-slate-100 text-slate-800',
    };
    return colors[r] || 'bg-slate-100 text-slate-800';
  };

  const formatRole = (r: string) => {
    return r.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  };

  const msgBg = message?.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    try {
      setLoading(true);
      await authAPI.updatePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-600 mt-1">View your account information and update your password</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-blue-500 text-white text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-800">{userName}</h2>
              <Badge className={roleBadgeColor(role)} variant="secondary">
                {formatRole(role)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-500 text-sm">Full Name</Label>
              <p className="text-slate-800 font-medium">{user?.name || userName}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-sm">Email</Label>
              <p className="text-slate-800 font-medium">{user?.email || '-'}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-sm">Employee ID</Label>
              <p className="text-slate-800 font-medium">{user?.employeeId || '-'}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-sm">Role</Label>
              <p className="text-slate-800 font-medium">{formatRole(role)}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-sm">Branch</Label>
              <p className="text-slate-800 font-medium">{currentBranch || user?.branch?.name || '-'}</p>
            </div>
            <div>
              <Label className="text-slate-500 text-sm">Position</Label>
              <p className="text-slate-800 font-medium">{user?.position || '-'}</p>
            </div>
          </div>
          {user?.region && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-500 text-sm">Region</Label>
                <p className="text-slate-800 font-medium">{user.region.name}</p>
              </div>
              {user?.area && (
                <div>
                  <Label className="text-slate-500 text-sm">Area</Label>
                  <p className="text-slate-800 font-medium">{user.area.name}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={'p-3 rounded-md mb-4 text-sm ' + msgBg}>
              {message.text}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

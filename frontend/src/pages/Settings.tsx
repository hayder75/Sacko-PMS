import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/contexts/UserContext';
import { authAPI } from '@/lib/api';

export function Settings() {
  const { currentBranch, role, setRole } = useUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('English');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await authAPI.updatePassword(currentPassword, newPassword);
      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email">Email Notifications</Label>
              <p className="text-sm text-slate-500">Receive notifications via email</p>
            </div>
            <Switch
              id="email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms">SMS Notifications</Label>
              <p className="text-sm text-slate-500">Receive notifications via SMS</p>
            </div>
            <Switch
              id="sms"
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push">Push Notifications</Label>
              <p className="text-sm text-slate-500">Receive push notifications in browser</p>
            </div>
            <Switch
              id="push"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branch Info */}
      {currentBranch && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Current Branch</Label>
              <p className="text-sm font-medium text-slate-800">{currentBranch}</p>
              <p className="text-sm text-slate-500 mt-2">
                Branch information is managed by your administrator
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Language Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Amharic">Amharic (አማርኛ)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 mt-2">
              Choose your preferred interface language
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role Switcher (for testing) */}
      <Card>
        <CardHeader>
          <CardTitle>Role Selection (Testing)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="role">Current Role</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="areaManager">areaManager</SelectItem>
                <SelectItem value="areaManager">areaManager</SelectItem>
                <SelectItem value="branchManager">branchManager</SelectItem>
                <SelectItem value="lineManager">lineManager</SelectItem>
                <SelectItem value="subTeamLeader">subTeamLeader</SelectItem>
                <SelectItem value="staff">staff</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 mt-2">
              Switch roles to test different dashboard views (for development only)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

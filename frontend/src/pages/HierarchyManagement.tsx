import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { usersAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function HierarchyManagement() {
  const { user, role } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: '',
    position: '',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      // Determine which users to show based on role
      let params: any = { isActive: 'true' };
      
      if (role === 'subTeamLeader') {
        // Sub-team leader can see staff under them
        params.role = 'staff';
        if (user?.branchId) params.branchId = user.branchId;
      } else if (role === 'lineManager') {
        // Line manager can see sub-team leaders and staff
        params.role = ['subTeamLeader', 'staff'];
        if (user?.branchId) params.branchId = user.branchId;
      } else if (role === 'branchManager') {
        // Branch manager can see all in branch
        if (user?.branchId) params.branchId = user.branchId;
      }

      const response = await usersAPI.getAll(params);
      if (response.success) {
        setStaff(response.data || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = () => {
    if (role === 'regionalDirector') {
      return [{ value: 'areaManager', label: 'Area Manager' }];
    } else if (role === 'areaManager') {
      return [{ value: 'branchManager', label: 'Branch Manager' }];
    } else if (role === 'subTeamLeader') {
      return [{ value: 'staff', label: 'Staff' }];
    } else if (role === 'lineManager') {
      return [
        { value: 'subTeamLeader', label: 'Sub-Team Leader' },
        { value: 'staff', label: 'Staff' }
      ];
    } else if (role === 'branchManager') {
      return [
        { value: 'lineManager', label: 'Line Manager (MSM)' },
        { value: 'subTeamLeader', label: 'Sub-Team Leader (Accountant/Auditor)' },
        { value: 'staff', label: 'Staff (MSO)' }
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userData = {
        ...formData,
        branch_code: user?.branch_code || user?.branchId?.code,
        branchId: user?.branchId,
        areaId: user?.areaId,
        regionId: user?.regionId,
      };

      await usersAPI.create(userData);
      setShowForm(false);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        role: '',
        position: '',
      });
      loadStaff();
    } catch (error: any) {
      alert(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hierarchy Management</h1>
          <p className="text-slate-600 mt-1">
            {role === 'regionalDirector' && 'Manage Area Managers in your region'}
            {role === 'areaManager' && 'Manage Branch Managers in your area'}
            {role === 'subTeamLeader' && 'Manage Staff accounts'}
            {role === 'lineManager' && 'Manage subTeamLeaders and Staff'}
            {role === 'branchManager' && 'Manage all team members in your branch'}
          </p>
        </div>
        {getAvailableRoles().length > 0 && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                    required
                    disabled={!formData.role}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder={formData.role ? "Select position" : "Select role first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.role === 'areaManager' && (
                        <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                      )}
                      {formData.role === 'branchManager' && (
                        <>
                          <SelectItem value="Member Service Manager (MSM)">Member Service Manager (MSM)</SelectItem>
                          <SelectItem value="Accountant">Accountant</SelectItem>
                          <SelectItem value="Member Service Officer I">Member Service Officer I</SelectItem>
                          <SelectItem value="Member Service Officer II">Member Service Officer II</SelectItem>
                          <SelectItem value="Member Service Officer III">Member Service Officer III</SelectItem>
                        </>
                      )}
                      {formData.role === 'lineManager' && (
                        <>
                          <SelectItem value="Member Service Officer I">Member Service Officer I</SelectItem>
                          <SelectItem value="Member Service Officer II">Member Service Officer II</SelectItem>
                          <SelectItem value="Member Service Officer III">Member Service Officer III</SelectItem>
                        </>
                      )}
                      {formData.role === 'subTeamLeader' && (
                        <>
                          <SelectItem value="Member Service Officer I">Member Service Officer I</SelectItem>
                          <SelectItem value="Member Service Officer II">Member Service Officer II</SelectItem>
                          <SelectItem value="Member Service Officer III">Member Service Officer III</SelectItem>
                        </>
                      )}
                      {formData.role === 'staff' && (
                        <>
                          <SelectItem value="Member Service Officer I">Member Service Officer I</SelectItem>
                          <SelectItem value="Member Service Officer II">Member Service Officer II</SelectItem>
                          <SelectItem value="Member Service Officer III">Member Service Officer III</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  Create Account
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No team members found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">{member.employeeId}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>{member.position || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? 'success' : 'destructive'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


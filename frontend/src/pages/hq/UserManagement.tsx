import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Key, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api';

export function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: '',
    position: '',
    branch_code: '',
    sub_team: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await usersAPI.create(formData);
      setShowForm(false);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        role: '',
        position: '',
        branch_code: '',
        sub_team: '',
      });
      loadUsers();
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
          <h1 className="text-3xl font-bold text-slate-800">User & Role Management</h1>
          <p className="text-slate-600 mt-1">Create, edit, and manage staff accounts and roles</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
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
                      <SelectItem value="regionalDirector">Regional Director</SelectItem>
                      <SelectItem value="areaManager">Area Manager</SelectItem>
                      <SelectItem value="branchManager">Branch Manager</SelectItem>
                      <SelectItem value="lineManager">Line Manager (MSM)</SelectItem>
                      <SelectItem value="subTeamLeader">Sub-Team Leader</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
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
                      {formData.role === 'regionalDirector' && (
                        <SelectItem value="Regional Director">Regional Director</SelectItem>
                      )}
                      {formData.role === 'areaManager' && (
                        <SelectItem value="Area Manager">Area Manager</SelectItem>
                      )}
                      {formData.role === 'branchManager' && (
                        <>
                          <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                          <SelectItem value="Member Service Manager (MSM)">Member Service Manager (MSM)</SelectItem>
                          <SelectItem value="Accountant">Accountant</SelectItem>
                          <SelectItem value="Member Service Officer I">Member Service Officer I</SelectItem>
                          <SelectItem value="Member Service Officer II">Member Service Officer II</SelectItem>
                          <SelectItem value="Member Service Officer III">Member Service Officer III</SelectItem>
                        </>
                      )}
                      {formData.role === 'lineManager' && (
                        <>
                          <SelectItem value="Member Service Manager (MSM)">Member Service Manager (MSM)</SelectItem>
                          <SelectItem value="Member Service Officer I">Member Service Officer I</SelectItem>
                          <SelectItem value="Member Service Officer II">Member Service Officer II</SelectItem>
                          <SelectItem value="Member Service Officer III">Member Service Officer III</SelectItem>
                        </>
                      )}
                      {formData.role === 'subTeamLeader' && (
                        <>
                          <SelectItem value="Accountant">Accountant</SelectItem>
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
                <div className="space-y-2">
                  <Label htmlFor="branch_code">Branch Code *</Label>
                  <Input
                    id="branch_code"
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    placeholder="e.g., ATOTE"
                    required
                    disabled={loading || formData.role === 'admin'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_team">Sub-Team</Label>
                  <Input
                    id="sub_team"
                    value={formData.sub_team}
                    onChange={(e) => setFormData({ ...formData, sub_team: e.target.value })}
                    placeholder="e.g., ATOTE-SUBTEAM5"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>Create User</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={loading}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
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
                  <TableHead>Branch</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-mono text-xs font-bold text-blue-600">
                        {user.employeeId}
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.branch_code || user.branchId?.name || 'N/A'}</TableCell>
                      <TableCell>{user.position || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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

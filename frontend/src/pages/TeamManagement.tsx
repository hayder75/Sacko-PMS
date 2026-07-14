import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { teamsAPI, usersAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function TeamManagement() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);

  const [teamForm, setTeamForm] = useState({ name: '', code: '', managerId: 'unassigned' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const branchId = typeof user?.branchId === 'string' ? user.branchId : (user as any)?.branchId?._id || (user as any)?.branchId;
      const branchParam = branchId ? { branchId } : {};
      const [tRes, supRes] = await Promise.all([
        teamsAPI.getAll(branchParam),
        usersAPI.getAll({ role: 'supervisor' }),
      ]);
      if (tRes.success) setTeams(tRes.data || []);
      if (supRes.success) setSupervisors(supRes.data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!teamForm.name || !teamForm.code) {
      alert('Name and code are required');
      return;
    }
    try {
      setLoading(true);
      const branchId = typeof user?.branchId === 'string' ? user.branchId : (user as any)?.branchId?._id || (user as any)?.branchId;
      await teamsAPI.create({
        ...teamForm,
        managerId: teamForm.managerId === 'unassigned' ? undefined : (teamForm.managerId || undefined),
        branchId,
      });
      setTeamForm({ name: '', code: '', managerId: 'unassigned' });
      await loadAll();
      alert('Team created');
    } catch (err: any) {
      alert(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Deactivate this team?')) return;
    try {
      await teamsAPI.delete(id);
      await loadAll();
      alert('Team deactivated');
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate team');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Team Management</h1>
        <p className="text-slate-600 mt-1">Create teams and assign supervisors to lead them</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input id="team-name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-code">Team Code</Label>
              <Input id="team-code" value={teamForm.code} onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Supervisor (Team Manager)</Label>
              <Select value={teamForm.managerId} onValueChange={(value) => setTeamForm({ ...teamForm, managerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                  {supervisors.map((s: any) => (
                    <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createTeam} disabled={loading}>Create Team</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Supervisor (Manager)</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-slate-500">No teams</TableCell></TableRow>
              ) : teams.map((t: any) => (
                <TableRow key={t._id || t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.code}</TableCell>
                  <TableCell>{t.managerId?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => deleteTeam(t._id || t.id)}>Deactivate</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

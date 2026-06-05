import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { teamsAPI, subTeamsAPI, usersAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function TeamManagement() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [subTeams, setSubTeams] = useState<any[]>([]);
  const [lineManagers, setLineManagers] = useState<any[]>([]);
  const [accountants, setAccountants] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [teamForm, setTeamForm] = useState({ name: '', code: '', managerId: 'unassigned' });
  const [subTeamForm, setSubTeamForm] = useState({ name: '', code: '', teamId: '', leaderId: 'unassigned', memberIds: [] as string[] });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tRes, stRes, lmRes, acctRes, staffRes] = await Promise.all([
        teamsAPI.getAll(),
        subTeamsAPI.getAll(),
        usersAPI.getAll({ role: 'lineManager' }),
        usersAPI.getAll({ role: 'subTeamLeader' }),
        usersAPI.getAll({ role: 'staff' }),
      ]);
      if (tRes.success) setTeams(tRes.data || []);
      if (stRes.success) setSubTeams(stRes.data || []);
      if (lmRes.success) setLineManagers(lmRes.data || []);
      if (acctRes.success) setAccountants(acctRes.data || []);
      if (staffRes.success) setStaff(staffRes.data || []);
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
      await teamsAPI.create({
        ...teamForm,
        managerId: teamForm.managerId === 'unassigned' ? undefined : (teamForm.managerId || undefined),
        branchId: typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId,
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

  const createSubTeam = async () => {
    if (!subTeamForm.name || !subTeamForm.code || !subTeamForm.teamId) {
      alert('Name, code, and team are required');
      return;
    }
    try {
      setLoading(true);
      await subTeamsAPI.create({
        ...subTeamForm,
        leaderId: subTeamForm.leaderId === 'unassigned' ? undefined : (subTeamForm.leaderId || undefined),
        memberIds: subTeamForm.memberIds || [],
        branchId: typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId,
      });
      setSubTeamForm({ name: '', code: '', teamId: '', leaderId: 'unassigned', memberIds: [] });
      await loadAll();
      alert('Sub-team created');
    } catch (err: any) {
      alert(err.message || 'Failed to create sub-team');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSubTeamForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter(m => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Team & Sub-Team Management</h1>
        <p className="text-slate-600 mt-1">Create teams, sub-teams, assign leaders and members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Form */}
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
              <Label>Line Manager (optional)</Label>
              <Select value={teamForm.managerId} onValueChange={(value) => setTeamForm({ ...teamForm, managerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Line Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                  {lineManagers.map((lm: any) => (
                    <SelectItem key={lm._id} value={lm._id}>{lm.name} ({lm.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createTeam} disabled={loading}>Create Team</Button>
          </CardContent>
        </Card>

        {/* Sub-Team Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Sub-Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="st-name">Sub-Team Name</Label>
              <Input id="st-name" value={subTeamForm.name} onChange={(e) => setSubTeamForm({ ...subTeamForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-code">Sub-Team Code</Label>
              <Input id="st-code" value={subTeamForm.code} onChange={(e) => setSubTeamForm({ ...subTeamForm, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={subTeamForm.teamId} onValueChange={(value) => setSubTeamForm({ ...subTeamForm, teamId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sub-Team Leader (Accountant)</Label>
              <Select value={subTeamForm.leaderId} onValueChange={(value) => setSubTeamForm({ ...subTeamForm, leaderId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Accountant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                  {accountants.map((a: any) => (
                    <SelectItem key={a._id} value={a._id}>{a.name} ({a.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Members (MSOs)</Label>
              <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                {staff.map((s: any) => (
                  <label key={s._id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={subTeamForm.memberIds.includes(s._id)}
                      onChange={() => toggleMember(s._id)}
                    />
                    {s.name} ({s.email})
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={createSubTeam} disabled={loading}>Create Sub-Team</Button>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
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
                <TableHead>Line Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-slate-500">No teams</TableCell></TableRow>
              ) : teams.map((t: any) => (
                <TableRow key={t._id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.code}</TableCell>
                  <TableCell>{t.managerId?.name || 'Unassigned'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sub-Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Members</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subTeams.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No sub-teams</TableCell></TableRow>
              ) : subTeams.map((st: any) => (
                <TableRow key={st._id}>
                  <TableCell>{st.name}</TableCell>
                  <TableCell>{st.code}</TableCell>
                  <TableCell>{st.teamId?.name || 'N/A'}</TableCell>
                  <TableCell>{st.leaderId?.name || 'Unassigned'}</TableCell>
                  <TableCell>{(st.members || []).map((m: any) => m.name).join(', ') || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


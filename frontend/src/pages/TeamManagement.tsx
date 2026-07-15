import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { teamsAPI, usersAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export function TeamManagement() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [teamForm, setTeamForm] = useState({ name: '', code: '', managerId: 'unassigned', memberIds: [] as string[] });
  const [editTeam, setEditTeam] = useState<any>(null);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const getBranchId = () => {
    return typeof user?.branchId === 'string' ? user.branchId : (user as any)?.branchId?._id || (user as any)?.branchId || '';
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const branchId = getBranchId();
      const branchParam = branchId ? { branchId } : {};
      const [tRes, supRes, staffRes] = await Promise.all([
        teamsAPI.getAll(branchParam),
        usersAPI.getAll({ role: 'supervisor' }),
        usersAPI.getAll({ role: 'staff', branchId }),
      ]);
      if (tRes.success) setTeams(tRes.data || []);
      if (supRes.success) setSupervisors(supRes.data || []);
      if (staffRes.success) setStaffList(staffRes.data || []);
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
      const branchId = getBranchId();
      await teamsAPI.create({
        name: teamForm.name,
        code: teamForm.code,
        managerId: teamForm.managerId === 'unassigned' ? undefined : (teamForm.managerId || undefined),
        memberIds: teamForm.memberIds,
        branchId,
      });
      setTeamForm({ name: '', code: '', managerId: 'unassigned', memberIds: [] });
      await loadAll();
      alert('Team created');
    } catch (err: any) {
      alert(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const editTeamMembers = async () => {
    if (!editTeam) return;
    try {
      setLoading(true);
      await teamsAPI.update(editTeam._id || editTeam.id, { memberIds: editMemberIds });
      setEditTeam(null);
      setEditMemberIds([]);
      await loadAll();
      alert('Team members updated');
    } catch (err: any) {
      alert(err.message || 'Failed to update team');
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

  const toggleMember = (id: string) => {
    setTeamForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter(x => x !== id)
        : [...prev.memberIds, id],
    }));
  };

  const toggleEditMember = (id: string) => {
    setEditMemberIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openEdit = (team: any) => {
    setEditTeam(team);
    setEditMemberIds((team.members || []).map((m: any) => m.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Team Management</h1>
        <p className="text-slate-600 mt-1">Create teams, assign supervisors, and pick which staff are on each team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Team Code</Label>
              <Input value={teamForm.code} onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })} />
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
            <div className="space-y-2">
              <Label>Staff Members</Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {staffList.length === 0 ? (
                  <p className="text-sm text-slate-400 p-2">No staff available</p>
                ) : (
                  staffList.map((s: any) => {
                    const sid = s._id || s.id;
                    const checked = teamForm.memberIds.includes(sid);
                    return (
                      <label key={sid} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm">
                        <Checkbox checked={checked} onCheckedChange={() => toggleMember(sid)} />
                        <span>{s.name}</span>
                        <span className="text-xs text-slate-400 ml-auto">{s.position?.replace(/_/g, ' ') || ''}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {teamForm.memberIds.length > 0 && (
                <p className="text-xs text-slate-500">{teamForm.memberIds.length} member(s) selected</p>
              )}
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
                <TableHead>Supervisor</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No teams</TableCell></TableRow>
              ) : teams.map((t: any) => (
                <TableRow key={t._id || t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.code}</TableCell>
                  <TableCell>{t.managerId?.name || <span className="text-slate-400">Unassigned</span>}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="font-mono">
                          {t.memberCount || (t.members || []).length}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t.name} — Members</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {(t.members || []).length === 0 ? (
                            <p className="text-sm text-slate-400">No members</p>
                          ) : (t.members || []).map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between py-1">
                              <span className="text-sm font-medium">{m.name}</span>
                              <span className="text-xs text-slate-500">{m.position?.replace(/_/g, ' ') || ''}</span>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEdit(t)}>Edit Members</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editTeam?.name} — Edit Members</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 max-h-60 overflow-y-auto py-2">
                            {staffList.map((s: any) => {
                              const sid = s._id || s.id;
                              const checked = editMemberIds.includes(sid);
                              return (
                                <label key={sid} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm">
                                  <Checkbox checked={checked} onCheckedChange={() => toggleEditMember(sid)} />
                                  <span>{s.name}</span>
                                  <span className="text-xs text-slate-400 ml-auto">{s.position?.replace(/_/g, ' ') || ''}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setEditTeam(null)}>Cancel</Button>
                            <Button onClick={editTeamMembers} disabled={loading}>Save Members</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => deleteTeam(t._id || t.id)}>Deactivate</Button>
                    </div>
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

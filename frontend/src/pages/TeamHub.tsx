import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Pencil, CheckCircle2, XCircle, Users } from 'lucide-react';
import { dashboardAPI, tasksAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  mappedAccounts: number;
  kpiAchievement: number;
}

export function TeamHub() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamKpi, setTeamKpi] = useState<Record<string, any>>({});
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const branchId = typeof user?.branchId === 'string' ? user.branchId : (user as any)?.branchId?._id || (user as any)?.branchId;
      const [dashboardRes, editRes] = await Promise.all([
        dashboardAPI.getSupervisor(),
        tasksAPI.getAll({ hasEditRequest: 'true' }),
      ]);

      if (dashboardRes.success && dashboardRes.data) {
        setTeamMembers(dashboardRes.data.teamMembers || []);
        setTeamKpi(dashboardRes.data.teamKpi || {});
      }
      if (editRes.success && Array.isArray(editRes.data)) {
        setEditRequests(editRes.data);
      }

      const memberIds = (dashboardRes.data?.teamMembers || []).map((m: any) => m.id);
      if (memberIds.length > 0 && branchId) {
        const tasksRes = await tasksAPI.getAll({ branchId, limit: 20 });
        if (tasksRes.success && Array.isArray(tasksRes.data)) {
          const memberIdSet = new Set(memberIds);
          setRecentTasks(tasksRes.data.filter((t: any) => memberIdSet.has(t.submittedById)));
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  const handleReviewEdit = async (taskId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(taskId);
      await tasksAPI.reviewEdit(taskId, action);
      fetchData();
    } catch (error) {
      console.error('Error reviewing edit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading Team Hub...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">Full view of your team's performance, tasks, and activity</p>
        </div>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-center py-6 text-slate-500">No team members assigned</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Position</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">Mapped Accounts</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">KPI Achievement</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => {
                    const pct = member.kpiAchievement;
                    const statusLabel = pct >= 80 ? 'On Track' : pct >= 60 ? 'Needs Focus' : 'At Risk';
                    const statusColor = pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                    return (
                      <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2 font-medium text-slate-800">{member.name}</td>
                        <td className="py-3 px-2 text-slate-600">{member.position || '—'}</td>
                        <td className="py-3 px-2 text-center">{member.mappedAccounts}</td>
                        <td className="py-3 px-2 text-center font-medium">{pct.toFixed(1)}%</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team KPI Breakdown */}
      {Object.keys(teamKpi).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(teamKpi).map(([cat, data]: [string, any]) => {
            const pct = data.percent || 0;
            const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
            const statusLabel = pct >= 80 ? 'On Track' : pct >= 60 ? 'Needs Focus' : 'At Risk';
            const statusColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
            return (
              <div key={cat} className="rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{cat.replace(/_/g, ' ')}</span>
                  <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-800">{pct}%</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    {data.actual?.toLocaleString() || 0} / {data.target?.toLocaleString() || 0}
                    {pct >= 80 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Team Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Team Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-center py-6 text-slate-500">No recent tasks from team members</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTasks.slice(0, 10).map((task: any) => (
                  <TableRow key={task._id || task.id}>
                    <TableCell className="font-medium">{task.submittedBy?.name || '—'}</TableCell>
                    <TableCell className="text-slate-600">{(task.taskType || '').replace(/_/g, ' ')}</TableCell>
                    <TableCell className="font-mono text-xs">{task.accountNumber || '—'}</TableCell>
                    <TableCell className="text-right">{task.amount ? `${task.amount.toLocaleString()}` : '—'}</TableCell>
                    <TableCell className="text-slate-500">{task.taskDate ? new Date(task.taskDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={
                        task.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        task.approvalStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }>
                        {task.approvalStatus || 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Edit Requests */}
      {editRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" />
              Pending Edit Requests
              <Badge className="bg-amber-100 text-amber-800 ml-2">{editRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Proposed Changes</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editRequests.map((task: any) => {
                  const editData = task.requestedEditData || {};
                  const changes = Object.entries(editData)
                    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${v}`)
                    .join(', ');
                  return (
                    <TableRow key={task._id}>
                      <TableCell className="font-medium">{task.submittedBy?.name || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{task.taskType}</TableCell>
                      <TableCell className="font-mono text-xs">{task.accountNumber}</TableCell>
                      <TableCell className="text-xs text-amber-700 max-w-[200px] truncate" title={changes}>{changes}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleReviewEdit(task._id, 'approve')} disabled={actionLoading === task._id}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleReviewEdit(task._id, 'reject')} disabled={actionLoading === task._id}>
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

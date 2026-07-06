import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, CheckCircle, Clock, TrendingUp, TrendingDown, Pencil, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { dashboardAPI, tasksAPI } from '@/lib/api';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  mappedAccounts: number;
  kpiAchievement: number;
}

export function SupervisorDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, totalMappedAccounts: 0, averageKpiAchievement: 0 });
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [ownKpi, setOwnKpi] = useState<Record<string, any>>({});
  const [teamKpi, setTeamKpi] = useState<Record<string, any>>({});
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, tasksRes, editRes] = await Promise.all([
        dashboardAPI.getSupervisor(),
        tasksAPI.getAll({ approvalStatus: 'Pending', limit: 10 }),
        tasksAPI.getAll({ hasEditRequest: 'true' }),
      ]);
      if (dashboardRes.success && dashboardRes.data) {
        setTeamMembers(dashboardRes.data.teamMembers || []);
        setStats(dashboardRes.data.teamStats || { totalMembers: 0, totalMappedAccounts: 0, averageKpiAchievement: 0 });
        setOwnKpi(dashboardRes.data.ownKpi || {});
        setTeamKpi(dashboardRes.data.teamKpi || {});
      }
      if (tasksRes.success && Array.isArray(tasksRes.data)) {
        setPendingApprovals(tasksRes.data.length);
      }
      if (editRes.success && Array.isArray(editRes.data)) {
        setEditRequests(editRes.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  const handleReviewEdit = async (taskId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(taskId);
      await tasksAPI.reviewEdit(taskId, action);
      fetchDashboard();
    } catch (error) {
      console.error('Error reviewing edit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { title: 'Team Members', value: stats.totalMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Mapped Accounts', value: stats.totalMappedAccounts, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Avg KPI Achievement', value: `${stats.averageKpiAchievement.toFixed(1)}%`, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supervisor Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track team approvals and log personal daily tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => window.location.href = '/tasks/new'}>
            <Plus className="w-4 h-4 mr-1" /> Log Daily Task
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/behavioral-input'}>
            Behavioral Evaluation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.title}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supervisor's Own KPI */}
      {Object.keys(ownKpi).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Individual KPI Progress</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ownKpi).map(([key, kpi]: [string, any]) => {
              const pct = kpi.percent || 0;
              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
              const statusLabel = pct >= 80 ? 'On Track' : pct >= 60 ? 'Needs Focus' : 'At Risk';
              const statusColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
              return (
                <div key={key} className="rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-slate-800">{pct}%</span>
                    <div className="text-right text-xs text-slate-500">
                      <div>{kpi.actual?.toLocaleString() || 0} / {kpi.target?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Team KPI Breakdown */}
      {Object.keys(teamKpi).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team KPI Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No team members assigned</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Position</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">Mapped Accounts</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">KPI Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-medium text-slate-800">{member.name}</td>
                      <td className="py-3 px-2 text-slate-600">{member.position}</td>
                      <td className="py-3 px-2 text-center">{member.mappedAccounts}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-medium ${member.kpiAchievement >= 100 ? 'text-emerald-600' : member.kpiAchievement >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          {member.kpiAchievement.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Staff</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Task Type</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Account</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Proposed Changes</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editRequests.map((task) => {
                    const editData = task.requestedEditData || {};
                    const changes = Object.entries(editData)
                      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${v}`)
                      .join(', ');
                    return (
                      <tr key={task._id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2 font-medium text-slate-800">{task.submittedBy?.name || 'N/A'}</td>
                        <td className="py-3 px-2 text-slate-600">{task.taskType}</td>
                        <td className="py-3 px-2 font-mono text-xs">{task.accountNumber}</td>
                        <td className="py-3 px-2 text-xs text-amber-700 max-w-[200px] truncate" title={changes}>{changes}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleReviewEdit(task._id, 'approve')}
                              disabled={actionLoading === task._id}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => handleReviewEdit(task._id, 'reject')}
                              disabled={actionLoading === task._id}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
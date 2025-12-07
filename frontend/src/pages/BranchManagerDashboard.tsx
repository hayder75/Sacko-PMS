import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { dashboardAPI, tasksAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'good':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case 'critical':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return null;
  }
};

export function BranchManagerDashboard() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, tasksRes] = await Promise.all([
        dashboardAPI.getBranch(),
        tasksAPI.getAll({ approvalStatus: 'Pending', limit: 10 }),
      ]);

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }
      if (tasksRes.success) {
        setPendingTasks(tasksRes.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  const data = dashboardData || {
    totalStaff: 0,
    mappedAccounts: 0,
    dailyDepositTarget: 0,
    todayAchievement: 0,
    kpiData: [],
    teamPerformance: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Branch Manager Dashboard</h1>
        <p className="text-slate-600 mt-1">{user?.branchId?.name || user?.branch_code || 'Branch'} Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.totalStaff || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Mapped Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{(data.mappedAccounts || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Daily Deposit Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{(data.dailyDepositTarget || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Birr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{(data.todayAchievement || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Birr ({data.todayAchievementPercent || data.achievementPercent || 0}%)</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Visuals */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.kpiData && data.kpiData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.kpiData.map((kpi: any) => (
                <div key={kpi.name || kpi.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{kpi.name || kpi.category}</span>
                    <span className="text-sm font-bold text-slate-800">{kpi.value || kpi.percent || 0}%</span>
                  </div>
                  <Progress value={kpi.value || kpi.percent || 0} className="h-3" />
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{
                        background: `conic-gradient(from 0deg, #3b82f6 0% ${kpi.value || kpi.percent || 0}%, #e2e8f0 ${kpi.value || kpi.percent || 0}% 100%)`,
                      }}
                    >
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                        {kpi.value || kpi.percent || 0}%
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Target: 100%</p>
                      <p className="text-xs text-slate-500">Status: {(kpi.value || kpi.percent || 0) >= 80 ? 'On Track' : 'Needs Attention'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">No KPI data available</div>
          )}
        </CardContent>
      </Card>

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Mapped Accounts</TableHead>
                <TableHead>Deposit %</TableHead>
                <TableHead>Digital %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teamPerformance && data.teamPerformance.length > 0 ? (
                data.teamPerformance.map((member: any) => (
                  <TableRow key={member._id || member.id || member.name}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role || member.position || 'N/A'}</TableCell>
                    <TableCell>{(member.mappedAccounts || member.mappedAccountsCount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={member.deposit >= 80 ? 'success' : member.deposit >= 60 ? 'warning' : 'destructive'}>
                        {member.deposit || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.digital >= 80 ? 'success' : 'warning'}>
                        {member.digital || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusIcon(member.status || 'good')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No team performance data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasks.length > 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} awaiting your approval
                </p>
                <p className="text-xs text-amber-700 mt-1">Review and approve pending submissions</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">No pending approvals</p>
                <p className="text-xs text-green-700 mt-1">All tasks have been processed</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardAPI, mappingsAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { mapBackendRoleToFrontend } from '@/lib/roleMapper';

export function StaffDashboard() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load data in background, don't block UI
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      const userRole = mapBackendRoleToFrontend(user?.role || '');

      // If subTeamLeader, we want to explicitly filter by their ID to see THEIR mappings
      // because the backend might return branch-wide mappings for managers.
      if (userRole === 'subTeamLeader') {
        params.mappedTo = user?._id;
      }

      const [dashboardRes, mappingRes] = await Promise.all([
        dashboardAPI.getStaff(),
        mappingsAPI.getAll(params),
      ]);

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }
      if (mappingRes.success) {
        setMappings(mappingRes.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'Pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending...</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const performanceScore = dashboardData?.performanceScore;
  const kpiScores = performanceScore?.kpiScores || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">My Performance Dashboard</h1>
        <p className="text-slate-600 mt-1">Track your personal KPIs and daily tasks</p>
      </div>

      {/* Personal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">My Deposit Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {kpiScores.deposit?.target?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Birr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {kpiScores.deposit?.actual?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Birr ({kpiScores.deposit?.percent || 0}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Incremental Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {dashboardData?.depositGrowth?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-slate-500 mt-1">From June 30 baseline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Active Accounts (≥500 ETB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {dashboardData?.mappedAccounts || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Rank in Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {dashboardData?.rank || 0}/{dashboardData?.teamSize || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {performanceScore?.rating || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Progress Bars */}
      {performanceScore && (
        <Card>
          <CardHeader>
            <CardTitle>KPI Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(kpiScores).map(([key, kpi]: [string, any]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{kpi.percent || 0}%</span>
                </div>
                <Progress value={kpi.percent || 0} className="h-3" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Actual: {kpi.actual?.toLocaleString() || 0}</span>
                  <span>Target: {kpi.target?.toLocaleString() || 0}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Mapped Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Mapped Accounts</CardTitle>
          <div className="flex gap-2">
            <Link to="/tasks/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account #</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">June 30 Balance</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No mapped accounts found
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => {
                  const growth = mapping.current_balance - mapping.june_balance;
                  return (
                    <TableRow key={mapping._id}>
                      <TableCell className="font-mono text-sm font-bold text-blue-600">
                        {mapping.accountNumber}
                      </TableCell>
                      <TableCell className="font-medium">{mapping.customerName}</TableCell>
                      <TableCell className="text-right">
                        {mapping.june_balance?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {mapping.current_balance?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {growth > 0 ? '+' : ''}{growth.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Link to={`/tasks/new?accountNumber=${mapping.accountNumber}`}>
                          <Button variant="outline" size="sm">Add Task</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

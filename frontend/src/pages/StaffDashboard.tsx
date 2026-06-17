import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardAPI, mappedAccountsAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function StaffDashboard() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, mappingRes] = await Promise.all([
        dashboardAPI.getStaff(),
        mappedAccountsAPI.getDashboard(user?.id),
      ]);

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }
      if (mappingRes.success) {
        setAccounts(mappingRes.data?.accounts || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const performanceScore = dashboardData?.performanceScore;
  const kpiScores = performanceScore?.kpiScores || dashboardData?.kpiBreakdown || {};

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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Accounts Mapped to You
            <span className="ml-2 text-sm font-normal text-slate-400">({accounts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Account #</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">June Balance</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Current Balance</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Difference</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">No accounts mapped to you yet</td>
                  </tr>
                ) : (
                  accounts.map((acct: any) => (
                    <tr key={acct.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{acct.accountNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{acct.customerName}</span>
                      </td>
                      <td className="px-4 py-3">
                        {acct.phoneNumber ? (
                          <a href={`tel:${acct.phoneNumber}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                            <Phone className="h-3 w-3" />
                            <span>{acct.phoneNumber}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{acct.juneBalance?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{acct.currentBalance?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-0.5 font-mono text-sm ${(acct.difference || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {(acct.difference || 0) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {(acct.difference || 0) > 0 ? '+' : ''}{(acct.difference || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={acct.activeStatus ? 'default' : 'secondary'} className="text-xs">
                          {acct.activeStatus ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link to={`/tasks/new?accountNumber=${acct.accountNumber}`}>
                          <Button variant="outline" size="sm" className="text-xs">Add Task</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

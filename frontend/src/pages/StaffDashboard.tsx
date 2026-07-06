import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, TrendingUp, TrendingDown, Minus, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardAPI, mappedAccountsAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function StaffDashboard() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');

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
        if (dashboardRes.data?.accounts) {
          setAccounts(dashboardRes.data.accounts);
        }
      }
      if (mappingRes.success && mappingRes.data?.accounts && !dashboardRes.data?.accounts) {
        setAccounts(mappingRes.data.accounts);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePhoneNumber = async (accountNumber: string) => {
    try {
      await mappedAccountsAPI.update(accountNumber, { phoneNumber: phoneValue });
      setEditingPhone(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error saving phone:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const performanceScore = dashboardData?.performanceScore;
  const kpiScores = performanceScore?.kpiScores || dashboardData?.kpiBreakdown || {};
  const comparative = dashboardData?.comparative || {};
  const dayChange = comparative.dayChange || {};
  const monthChange = comparative.monthChange || {};

  const trendIcon = (val: number) => {
    if (val > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (val < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const trendColor = (val: number) => val > 0 ? 'text-emerald-600' : val < 0 ? 'text-red-600' : 'text-slate-500';

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
            <CardTitle className="text-sm font-medium text-slate-600">Active Accounts (≥1,000 ETB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {dashboardData?.mappedAccounts || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today vs Yesterday */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Today <span className="text-xs text-slate-400 ml-1">vs Yesterday</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-3xl font-bold text-slate-800">{comparative.today?.tasks || 0}</div>
                <p className="text-xs text-slate-500">Tasks completed</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-800">{(comparative.today?.amount || 0).toLocaleString()}</div>
                <p className="text-xs text-slate-500">Birr amount</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {trendIcon(dayChange.tasks)}
                <span className={trendColor(dayChange.tasks)}>
                  {dayChange.tasks >= 0 ? '+' : ''}{dayChange.tasks} tasks
                </span>
                <span className={trendColor(dayChange.amount)}>
                  ({dayChange.amount >= 0 ? '+' : ''}{dayChange.amountPercent}% amt)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              This Month <span className="text-xs text-slate-400 ml-1">vs Last Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-3xl font-bold text-slate-800">{comparative.thisMonth?.tasks || 0}</div>
                <p className="text-xs text-slate-500">This month tasks</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-500">{comparative.lastMonth?.tasks || 0}</div>
                <p className="text-xs text-slate-500">Last month</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {trendIcon(monthChange.tasks)}
                <span className={trendColor(monthChange.tasks)}>
                  {monthChange.tasks >= 0 ? '+' : ''}{monthChange.tasks} ({monthChange.tasksPercent}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Progress */}
      {Object.keys(kpiScores).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>KPI Progress</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(kpiScores).map(([key, kpi]: [string, any]) => {
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
                  <th className="text-center px-4 py-3 font-medium text-slate-600">vs June</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Productivity</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">No accounts mapped to you yet</td>
                  </tr>
                ) : (
                  accounts.map((acct: any) => {
                    const juneBal = acct.juneBalance || acct.june_balance || 0;
                    const currBal = acct.currentBalance || acct.current_balance || 0;
                    const diff = currBal - juneBal;
                    return (
                      <tr key={acct.id || acct.accountNumber} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{acct.accountNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{acct.customerName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {editingPhone === acct.accountNumber ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={phoneValue}
                                onChange={(e) => setPhoneValue(e.target.value)}
                                className="h-7 text-xs w-28"
                                placeholder="+251..."
                              />
                              <button onClick={() => savePhoneNumber(acct.accountNumber)} className="p-1 hover:bg-green-50 rounded">
                                <Save className="h-3 w-3 text-green-600" />
                              </button>
                              <button onClick={() => setEditingPhone(null)} className="p-1 hover:bg-red-50 rounded">
                                <X className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingPhone(acct.accountNumber); setPhoneValue(acct.phoneNumber || ''); }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              {acct.phoneNumber ? (
                                <><Phone className="h-3 w-3" /><span>{acct.phoneNumber}</span></>
                              ) : (
                                <span className="text-slate-400 italic text-xs">+ Add</span>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">{juneBal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm">{currBal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 font-mono text-sm ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={acct.activeStatus || acct.active_status ? 'default' : 'secondary'} className="text-xs">
                            {acct.activeStatus || acct.active_status ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={acct.isProductive ? 'default' : 'outline'} className={`text-xs ${acct.isProductive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                            {acct.isProductive ? 'Productive' : 'Non-Productive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link to={`/tasks/new?accountNumber=${acct.accountNumber}`}>
                            <Button variant="outline" size="sm" className="text-xs">Add Task</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
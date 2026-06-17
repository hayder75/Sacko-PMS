import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { mappedAccountsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, TrendingUp, TrendingDown, Banknote, Target, Users, PiggyBank } from 'lucide-react';

const KPI_COLORS: Record<string, string> = {
  Deposit_Mobilization: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Digital_Channel_Growth: 'bg-blue-50 border-blue-200 text-blue-700',
  Member_Registration: 'bg-purple-50 border-purple-200 text-purple-700',
  Shareholder_Recruitment: 'bg-amber-50 border-amber-200 text-amber-700',
  Loan_NPL: 'bg-rose-50 border-rose-200 text-rose-700',
  Customer_Base: 'bg-cyan-50 border-cyan-200 text-cyan-700',
};

const KPI_ICONS: Record<string, any> = {
  Deposit_Mobilization: PiggyBank,
  Digital_Channel_Growth: TrendingUp,
  Member_Registration: Users,
  Shareholder_Recruitment: Users,
  Loan_NPL: Banknote,
  Customer_Base: Target,
};

export function MappedAccounts() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    mappedAccountsAPI.getDashboard(user.id)
      .then(res => {
        if (res.success && res.data) setData(res.data);
        else setError('Failed to load data');
      })
      .catch(() => setError('Failed to load mapped accounts'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-600 bg-red-50 rounded-md">{error}</div>
  );

  if (!data) return null;

  const { stats, accounts, planProgress } = data;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mapped Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">{data.user.name} - {data.user.position} {data.user.branchName ? `@ ${data.user.branchName}` : ''}</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Accounts</p>
              <p className="text-xl font-bold text-slate-800">{stats.totalAccounts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <PiggyBank className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Deposits Collected</p>
              <p className="text-xl font-bold text-slate-800">{stats.totalDeposits.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50">
              <Banknote className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Loans Processed</p>
              <p className="text-xl font-bold text-slate-800">{stats.totalLoans.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.totalDifference >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {stats.totalDifference >= 0
                ? <TrendingUp className={`h-5 w-5 ${stats.totalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                : <TrendingDown className="h-5 w-5 text-red-600" />
              }
            </div>
            <div>
              <p className="text-xs text-slate-500">Net Growth</p>
              <p className={`text-xl font-bold ${stats.totalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.totalDifference >= 0 ? '+' : ''}{stats.totalDifference.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Progress */}
      {planProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Performance Plan Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planProgress.map((plan: any) => {
              const Icon = KPI_ICONS[plan.kpi] || Target;
              const colorClass = KPI_COLORS[plan.kpi] || 'bg-slate-50 border-slate-200 text-slate-700';
              return (
                <Card key={plan.kpi} className={`border ${colorClass}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{plan.label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{plan.period}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Target</span>
                        <span className="font-semibold">{plan.target.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Achieved</span>
                        <span className="font-semibold">{plan.achieved.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Remaining</span>
                        <span className={`font-semibold ${plan.remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {plan.remaining.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-semibold">{plan.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${plan.progress >= 100 ? 'bg-green-500' : plan.progress >= 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${plan.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Mapped Accounts Table */}
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
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">No accounts mapped to you yet</td>
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
                        {acct.difference !== 0 && (
                          <span className={`inline-flex items-center gap-0.5 font-mono text-sm ${acct.difference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {acct.difference > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {acct.difference > 0 ? '+' : ''}{acct.difference.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={acct.activeStatus ? 'default' : 'secondary'} className="text-xs">
                          {acct.activeStatus ? 'Active' : 'Inactive'}
                        </Badge>
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

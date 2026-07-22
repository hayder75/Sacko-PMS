import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { mappedAccountsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Banknote, PiggyBank, RefreshCw } from 'lucide-react';

function formatBirr(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function JuneBalanceDifference() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    mappedAccountsAPI.getDashboard(user.id)
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
          setAccounts(res.data.accounts || []);
        } else {
          setError(res.message || 'Failed to load data');
        }
      })
      .catch(() => setError('Failed to load mapped accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const accountsWithDiff = accounts.filter(a => a.juneBalance != null || a.currentBalance != null);
  const totalJune = accountsWithDiff.reduce((s, a) => s + (a.juneBalance || 0), 0);
  const totalCurrent = accountsWithDiff.reduce((s, a) => s + (a.currentBalance || 0), 0);
  const totalDiff = totalCurrent - totalJune;
  const positiveCount = accountsWithDiff.filter(a => (a.difference || 0) > 0).length;
  const negativeCount = accountsWithDiff.filter(a => (a.difference || 0) < 0).length;
  const zeroCount = accountsWithDiff.filter(a => (a.difference || 0) === 0).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
    </div>
  );

  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">June Balance Difference</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.user?.name || user?.name} @ {data?.user?.branchName || user?.branch_code || ''}
            <span className="ml-2 text-xs text-slate-400">({accountsWithDiff.length} accounts)</span>
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-slate-500">Total Accounts</p>
              <p className="text-xl font-bold text-slate-800">{accountsWithDiff.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50"><PiggyBank className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-slate-500">June Balance</p>
              <p className="text-xl font-bold text-slate-800">{formatBirr(totalJune)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50"><Banknote className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <p className="text-xs text-slate-500">Current Balance</p>
              <p className="text-xl font-bold text-slate-800">{formatBirr(totalCurrent)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className={`p-4 flex items-center gap-3 ${totalDiff >= 0 ? '' : ''}`}>
            <div className={`p-2 rounded-lg ${totalDiff >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {totalDiff >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
            </div>
            <div>
              <p className="text-xs text-slate-500">Net Difference</p>
              <p className={`text-xl font-bold ${totalDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalDiff >= 0 ? '+' : ''}{formatBirr(totalDiff)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-emerald-600 font-medium">Positive Growth</p>
              <p className="text-xl font-bold text-emerald-700">{positiveCount} accounts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-red-200 bg-red-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-red-600 font-medium">Negative Growth</p>
              <p className="text-xl font-bold text-red-700">{negativeCount} accounts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-slate-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">No Change</p>
              <p className="text-xl font-bold text-slate-700">{zeroCount} accounts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Account Balance Comparison
            <span className="ml-2 text-sm font-normal text-slate-400">({accountsWithDiff.length} accounts)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accountsWithDiff.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No accounts with balance data found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">#</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Account Number</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Customer Name</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">June Balance</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Current Balance</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Difference</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Change %</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsWithDiff.map((acct: any, i: number) => {
                    const juneBal = acct.juneBalance || 0;
                    const currBal = acct.currentBalance || 0;
                    const diff = acct.difference || 0;
                    const pctChange = juneBal > 0 ? ((diff / juneBal) * 100) : (currBal > 0 ? 100 : 0);
                    return (
                      <tr key={acct.id || acct.accountNumber} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{acct.accountNumber}</td>
                        <td className="px-4 py-3"><span className="font-medium text-slate-800">{acct.customerName}</span></td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-600">{formatBirr(juneBal)}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-800">{formatBirr(currBal)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-0.5 font-mono text-sm ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                            {diff > 0 ? '+' : ''}{formatBirr(diff)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono text-sm ${pctChange > 0 ? 'text-emerald-600' : pctChange < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={acct.activeStatus ? 'default' : 'secondary'} className="text-xs">
                            {acct.activeStatus ? 'Active' : 'Inactive'}
                          </Badge>
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
    </div>
  );
}

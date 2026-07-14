import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { nplAPI } from '@/lib/api';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const parColor = (val: number) => {
  if (val < 5) return 'text-emerald-600';
  if (val < 10) return 'text-amber-600';
  return 'text-red-600';
};

export function BranchNplDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await nplAPI.getBranch();
      if (res.success) setData(res.data);
    } catch (e) {
      console.error('Failed to load branch NPL', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading branch NPL data...</div>;
  if (!data) return <div className="text-center py-8 text-red-500">Failed to load NPL data</div>;

  const { parMetrics, agingLadder, staffBreakdown, dpdDetails, trendData } = data;

  const trendIcon = (val: number) => {
    if (val > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (val < 0) return <TrendingDown className="h-4 w-4 text-emerald-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };
  const maxBucket = Math.max(...agingLadder.map((b: any) => b.amount), 1);

  const formatBirr = (v: number) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Branch Portfolio at Risk</h1>
          <p className="text-slate-600 mt-1">NPL monitoring and collection tracking</p>
        </div>
        <button onClick={loadData} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md">
          Refresh
        </button>
      </div>

      {/* PAR Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">PAR 1 (Watch)</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${parColor(parMetrics?.par1Ratio)}`}>
              {parMetrics?.par1Ratio?.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">{formatBirr(parMetrics?.par1Amount)} — {parMetrics?.par1Count} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">PAR 30 (Substandard)</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${parColor(parMetrics?.par30Ratio)}`}>
              {parMetrics?.par30Ratio?.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">{formatBirr(parMetrics?.par30Amount)} — {parMetrics?.par30Count} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">PAR 90 (NPL — Doubtful)</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${parColor(parMetrics?.par90Ratio)}`}>
              {parMetrics?.par90Ratio?.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">{formatBirr(parMetrics?.par90Amount)} — {parMetrics?.par90Count} accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Ladder */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Ladder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agingLadder?.map((bucket: any) => (
              <div key={bucket.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{bucket.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-600">{formatBirr(bucket.amount)}</span>
                    <span className="text-xs text-slate-400 w-8 text-right">{bucket.count} accts</span>
                    <span className={`text-xs font-semibold w-16 text-right ${parColor(bucket.min >= 90 ? bucket.amount / maxBucket * 100 : 0)}`}>
                      {maxBucket > 0 ? Math.round((bucket.amount / maxBucket) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <Progress value={maxBucket > 0 ? (bucket.amount / maxBucket) * 100 : 0}
                  className={`h-2 ${bucket.min >= 90 ? 'bg-red-100' : bucket.min >= 30 ? 'bg-amber-100' : 'bg-emerald-100'}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Collection Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Staff</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Accounts</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Portfolio</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Overdue</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffBreakdown?.map((s: any) => (
                  <tr key={s.staffId} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{s.staffName}</div>
                      <div className="text-xs text-slate-400">{s.position?.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{s.accountCount}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatBirr(s.totalBalance)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{s.overdueAccounts}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={s.overdueAccounts > 0 ? 'destructive' : 'default'} className="text-xs">
                        {s.overdueAccounts > 0 ? `${s.overdueAccounts} Overdue` : 'Clear'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!staffBreakdown || staffBreakdown.length === 0) && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No staff data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PAR 90 Trend */}
      {trendData?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PAR 90 Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendData.slice(-20).map((d: any, i: number) => {
                const prev = trendData[Math.max(0, i - 1)];
                const change = prev ? d.par90Ratio - prev.par90Ratio : 0;
                return (
                  <div key={d.date} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span className="text-slate-600">{new Date(d.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-semibold ${parColor(d.par90Ratio)}`}>
                        {d.par90Ratio?.toFixed(2)}%
                      </span>
                      <div className="flex items-center gap-1 w-20">
                        {trendIcon(change)}
                        <span className={`text-xs ${change > 0 ? 'text-red-600' : change < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {change > 0 ? '+' : ''}{change?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Loans Detail */}
      {dpdDetails?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Overdue Loans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Account</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Balance</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">DPD</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {dpdDetails.map((d: any) => (
                    <tr key={d.accountId} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{d.accountNumber}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatBirr(d.currentBalance)}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">{d.dpd}d</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={d.dpd >= 90 ? 'destructive' : d.dpd >= 30 ? 'warning' : 'secondary'} className="text-xs">
                          {d.classification}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { dashboardAPI } from '@/lib/api';

const getColor = (value: number) => {
  if (value >= 100) return '#10b981'; // emerald-500
  if (value >= 80) return '#3b82f6'; // blue-500
  if (value >= 60) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

export function HQDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getHQ();
      if (response.success) {
        setDashboardData(response.data);
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

  const hqData = dashboardData || {
    totalBranches: 0,
    totalStaff: 0,
    avgPlanAchievement: 0,
    cbsValidationRate: 0,
    branchKPIHeatmap: [],
    performanceDistribution: [],
    topBranches: [],
    bottomBranches: [],
    activityFeed: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">SAKO HQ Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of all branches and performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{hqData.totalBranches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{hqData.totalStaff?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Avg. Plan Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{hqData.avgPlanAchievement}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">CBS Validation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{hqData.cbsValidationRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch KPI Achievement Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Branch KPI Achievement Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            {hqData.branchKPIHeatmap && hqData.branchKPIHeatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hqData.branchKPIHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deposit" fill="#3b82f6" name="Deposit %" />
                  <Bar dataKey="digital" fill="#10b981" name="Digital %" />
                  <Bar dataKey="loan" fill="#f59e0b" name="Loan %" />
                  <Bar dataKey="customer" fill="#8b5cf6" name="Customer %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No branch KPI data available</div>
            )}
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {hqData.performanceDistribution && hqData.performanceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hqData.performanceDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="rating" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {hqData.performanceDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getColor(entry.count / 10)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No performance distribution data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top & Bottom Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hqData.topBranches && hqData.topBranches.length > 0 ? (
                  hqData.topBranches.map((b: any) => (
                    <TableRow key={b.branch || b.id}>
                      <TableCell className="font-medium">{b.branch || b.name}</TableCell>
                      <TableCell>{b.region || b.area || 'N/A'}</TableCell>
                      <TableCell>{b.depositTarget?.toLocaleString() || b.target?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{b.actual?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <Badge variant={b.percent >= 80 ? 'success' : 'warning'}>
                          {b.percent}%
                        </Badge>
                      </TableCell>
                      <TableCell>{b.rating || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No top branches data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bottom 5 Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hqData.bottomBranches && hqData.bottomBranches.length > 0 ? (
                  hqData.bottomBranches.map((b: any) => (
                    <TableRow key={b.branch || b.id}>
                      <TableCell className="font-medium">{b.branch || b.name}</TableCell>
                      <TableCell>{b.region || b.area || 'N/A'}</TableCell>
                      <TableCell>{b.depositTarget?.toLocaleString() || b.target?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{b.actual?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <Badge variant={b.percent < 60 ? 'destructive' : 'warning'}>
                          {b.percent}%
                        </Badge>
                      </TableCell>
                      <TableCell>{b.rating || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No bottom branches data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hqData.activityFeed && hqData.activityFeed.length > 0 ? (
              hqData.activityFeed.map((activity: any) => (
                <div key={activity.id || activity._id} className="flex items-start gap-3 pb-4 border-b border-slate-200 last:border-0">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{activity.message || activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time || activity.createdAt || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

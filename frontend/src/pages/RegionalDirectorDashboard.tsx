import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function RegionalDirectorDashboard() {
  useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getRegional();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = dashboardData || {
    branchCount: 0,
    areaManagerCount: 0,
    totalStaff: 0,
    avgBranchAchievement: 0,
    mappingCoverage: 0,
    totalAccounts: 0,
    topBranches: [],
    bottomBranches: [],
    branches: [],
    branchChartData: [],
    trendData: [],
    mappingData: [],
    areaManagers: [],
  };

  const getStatusBadge = (achievement: number) => {
    if (achievement >= 80) return { label: 'Good', color: 'bg-green-100 text-green-800' };
    if (achievement >= 60) return { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' };
    if (achievement > 0) return { label: 'Critical', color: 'bg-red-100 text-red-800' };
    return { label: 'No Data', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Regional Director Dashboard</h1>
        <p className="text-slate-600 mt-1">Regional Performance Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.branchCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Area Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.areaManagerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Avg. Branch Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.avgBranchAchievement}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Mapping Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.mappingCoverage}</div>
            <p className="text-xs text-slate-500 mt-1">of {data.totalAccounts || 0} Total Accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branch KPI Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {data.branchChartData && data.branchChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.branchChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deposit" fill="#3b82f6" name="Deposit %" />
                  <Bar dataKey="digital" fill="#10b981" name="Digital %" />
                  <Bar dataKey="member" fill="#f59e0b" name="Member %" />
                  <Bar dataKey="customer" fill="#8b5cf6" name="Customer %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No branch data available</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>30-Day Deposit Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trendData && data.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="deposit" stroke="#3b82f6" strokeWidth={2} name="Daily Deposit (Birr)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No trend data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapping Coverage Pie */}
      <Card>
        <CardHeader>
          <CardTitle>Account Mapping Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            {data.mappingData && data.mappingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.mappingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {data.mappingData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No mapping data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Achievement %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.branches.length > 0 ? (
                  data.branches.map((branch: any) => {
                    const status = getStatusBadge(branch.achievement);
                    return (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>{branch.area}</TableCell>
                        <TableCell>{branch.achievement}%</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">
                      No branch data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 / Bottom 5 Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Branches</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topBranches.length > 0 ? (
              <div className="space-y-3">
                {data.topBranches.map((branch: any, index: number) => {
                  const status = getStatusBadge(branch.achievement);
                  return (
                    <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{branch.name}</div>
                          <div className="text-sm text-slate-500">{branch.area}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{branch.achievement}%</div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bottom 5 Branches</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bottomBranches.length > 0 ? (
              <div className="space-y-3">
                {data.bottomBranches.map((branch: any, index: number) => {
                  const status = getStatusBadge(branch.achievement);
                  return (
                    <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-800 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{branch.name}</div>
                          <div className="text-sm text-slate-500">{branch.area}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{branch.achievement}%</div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Area Managers List */}
      {data.areaManagers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Area Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.areaManagers.map((am: any) => (
                <div key={am.id} className="p-4 bg-slate-50 rounded-md">
                  <div className="font-medium">{am.name}</div>
                  <div className="text-sm text-slate-500">{am.email}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


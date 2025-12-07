import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '@/lib/api';

export function AreaManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getArea();
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

  const data = dashboardData || {
    branchCount: 0,
    staffCount: 0,
    avgBranchAchievement: 0,
    lowPerformersCount: 0,
    branches: [],
    branchComparison: [],
    trendData: [],
    mappingData: [],
    branchTableData: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">areaManager Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of branches under your management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Branches Under Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.branchCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Avg. Branch Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{data.avgBranchAchievement || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Staff with &lt;60% Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{data.lowPerformersCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {data.branchComparison && data.branchComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.branchComparison}>
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
              <div className="text-center text-slate-500 py-16">No branch comparison data available</div>
            )}
          </CardContent>
        </Card>

        {/* 30-Day Trend */}
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
                  <Line type="monotone" dataKey="deposit" stroke="#3b82f6" name="Daily Deposit (Birr)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No trend data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapping Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Mapping Coverage</CardTitle>
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
                    fill="#8884d8"
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

      {/* Branch Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Deposit %</TableHead>
                <TableHead>Digital %</TableHead>
                <TableHead>Loan %</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.branchTableData && data.branchTableData.length > 0 ? (
                data.branchTableData.map((branch: any) => (
                  <TableRow key={branch.id || branch.name}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.region || branch.area || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={branch.deposit >= 80 ? 'success' : 'warning'}>
                        {branch.deposit}%
                      </Badge>
                    </TableCell>
                    <TableCell>{branch.digital || 0}%</TableCell>
                    <TableCell>{branch.loan || 0}%</TableCell>
                    <TableCell>{branch.teamSize || 0}</TableCell>
                    <TableCell>
                      <Badge variant={branch.status === 'Good' ? 'success' : 'warning'}>
                        {branch.status || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    No branch data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


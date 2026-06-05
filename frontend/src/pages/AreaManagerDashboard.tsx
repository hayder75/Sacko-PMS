import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
    avgBranchAchievement: 0,
    mappingData: [],
    branches: [],
  };

  const getStatusBadge = (achievement: number) => {
    if (achievement >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (achievement >= 60) return { label: 'On Track', color: 'bg-blue-100 text-blue-800' };
    if (achievement > 0) return { label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'No Data', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Area Manager Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of branches under your management</p>
      </div>

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
            <CardTitle className="text-sm font-medium text-slate-600">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {data.branches?.reduce((sum: number, b: any) => sum + (b.staff || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Branch Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {data.branches && data.branches.length > 0 ? (
              <div className="space-y-4">
                {data.branches.map((branch: any) => {
                  const status = getStatusBadge(branch.achievement);
                  return (
                    <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div>
                        <div className="font-medium text-slate-800">{branch.name}</div>
                        <div className="text-sm text-slate-500">{branch.staff || 0} staff</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Progress value={branch.achievement || 0} className="w-20 h-2" />
                          <span className="font-bold text-slate-800">{branch.achievement || 0}%</span>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16">No branch data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.branches && data.branches.length > 0 ? (
                data.branches.map((branch: any) => {
                  const status = getStatusBadge(branch.achievement);
                  return (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.staff || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={branch.achievement || 0} className="w-24" />
                          <span className="text-sm font-medium">{branch.achievement || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
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

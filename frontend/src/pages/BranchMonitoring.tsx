import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dashboardAPI } from '@/lib/api';

export function BranchMonitoring() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await dashboardAPI.getArea();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading branch monitoring:', error);
    }
  };

  const branches = data?.branches || [];

  const getStatusColor = (achievement: number) => {
    if (achievement >= 80) return 'bg-green-100 text-green-800';
    if (achievement >= 60) return 'bg-blue-100 text-blue-800';
    if (achievement > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (achievement: number) => {
    if (achievement >= 80) return 'Excellent';
    if (achievement >= 60) return 'On Track';
    if (achievement > 0) return 'Needs Attention';
    return 'No Data';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Branch Monitoring</h1>
        <p className="text-slate-600 mt-2">Monitor all branches under your area</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{branches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {branches.length > 0 ? branches.reduce((sum: number, b: any) => sum + (b.staff || 0), 0) : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Average Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {branches.length > 0 ? Math.round(branches.reduce((sum: number, b: any) => sum + (b.achievement || 0), 0) / branches.length) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length > 0 ? (
                branches.map((branch: any, index: number) => (
                  <TableRow key={branch.id || index}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.staff || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={branch.achievement || 0} className="w-24" />
                        <span className="text-sm font-medium">{branch.achievement || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(branch.achievement || 0)}>
                        {getStatusLabel(branch.achievement || 0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
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

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, AlertCircle } from 'lucide-react';
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
      // Use default data
    }
  };

  const branches = data?.branches || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-green-100 text-green-800';
      case 'On Track':
        return 'bg-blue-100 text-blue-800';
      case 'Needs Attention':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Branch Monitoring</h1>
        <p className="text-slate-600 mt-2">Monitor all branches under your area</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {branches.length > 0 ? branches.reduce((sum: number, b: any) => sum + (b.alerts || 0), 0) : 0}
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
                <TableHead>Alerts</TableHead>
                <TableHead>Action</TableHead>
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
                      <Badge className={getStatusColor(branch.status || 'N/A')}>{branch.status || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {branch.alerts > 0 ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertCircle className="h-3 w-3" />
                          {branch.alerts}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
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


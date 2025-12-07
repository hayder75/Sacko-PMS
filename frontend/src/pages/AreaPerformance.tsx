import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '@/lib/api';

export function AreaPerformance() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // AreaPerformance is for Regional Director, so use getRegional endpoint
      const response = await dashboardAPI.getRegional();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading area performance:', error);
    }
  };

  const areas = data?.areas || [];

  const chartData = areas.map((area: any) => ({
    name: area.name,
    achievement: area.achievement || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Area Performance</h1>
        <p className="text-slate-600 mt-2">Regional overview of all areas under your management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{areas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {areas.length > 0 ? areas.reduce((sum: number, area: any) => sum + (area.branches || 0), 0) : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Average Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {areas.length > 0 ? Math.round(areas.reduce((sum: number, area: any) => sum + (area.achievement || 0), 0) / areas.length) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Area Performance Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="achievement" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-500 py-16">No area performance data available</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Area Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area Name</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.length > 0 ? (
                areas.map((area: any, index: number) => (
                  <TableRow key={area.id || index}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.branches || 0}</TableCell>
                    <TableCell>{area.staff || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={area.achievement || 0} className="w-24" />
                        <span className="text-sm font-medium">{area.achievement || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.rating === 'Outstanding' ? 'default' : 'secondary'}>
                        {area.rating || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No area data available
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


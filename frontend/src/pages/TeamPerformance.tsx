import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '@/lib/api';

export function TeamPerformance() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await dashboardAPI.getBranch();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      // Use default data
    }
  };

  const teamMembers = data?.teamPerformance || data?.teamMembers || [];

  const chartData = teamMembers.map((member: any) => ({
    name: member.name.split(' ')[0],
    deposit: member.deposit,
    digital: member.digital,
    loan: member.loan,
    customer: member.customer,
  }));

  const getRatingColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Team Performance</h1>
        <p className="text-slate-600 mt-2">Performance overview of your team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{teamMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {teamMembers.length > 0 ? Math.round(teamMembers.reduce((sum: number, m: any) => sum + (m.overall || 0), 0) / teamMembers.length) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {teamMembers.filter((m: any) => (m.overall || 0) >= 85).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Needs Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {teamMembers.filter((m: any) => (m.overall || 0) < 70).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance Chart</CardTitle>
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
                <Bar dataKey="deposit" fill="#3b82f6" name="Deposit" />
                <Bar dataKey="digital" fill="#10b981" name="Digital" />
                <Bar dataKey="loan" fill="#f59e0b" name="Loan" />
                <Bar dataKey="customer" fill="#8b5cf6" name="Customer" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-500 py-16">No team performance data available</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Member Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Digital</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Overall</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length > 0 ? (
                teamMembers.map((member: any, index: number) => (
                  <TableRow key={member._id || member.id || index}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role || member.position || 'N/A'}</TableCell>
                    <TableCell>{member.deposit || 0}%</TableCell>
                    <TableCell>{member.digital || 0}%</TableCell>
                    <TableCell>{member.loan || 0}%</TableCell>
                    <TableCell>{member.customer || 0}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={member.overall || 0} className="w-24" />
                        <span className="text-sm font-medium">{member.overall || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: getRatingColor(member.overall || 0), color: 'white' }}>
                        {(member.overall || 0) >= 90 ? 'A+' : (member.overall || 0) >= 80 ? 'A' : (member.overall || 0) >= 70 ? 'B' : 'C'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    No team member data available
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


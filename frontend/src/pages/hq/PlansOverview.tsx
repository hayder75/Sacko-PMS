import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { plansAPI, staffPlansAPI } from '@/lib/api';
import { Target, Users, TrendingUp, Building2 } from 'lucide-react';

const KPI_COLORS: Record<string, string> = {
  'Deposit Mobilization': '#3b82f6',
  'Digital Channel Growth': '#10b981',
  'Member Registration': '#f59e0b',
  'Shareholder Recruitment': '#8b5cf6',
  'Loan & NPL': '#ef4444',
  'Customer Base': '#06b6d4',
};

const periodOptions = ['2025-H2', 'Q4-2025', 'December-2025', '2025'];

export function PlansOverview() {
  const [plans, setPlans] = useState<any[]>([]);
  const [staffPlans, setStaffPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('2025-H2');

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, staffRes] = await Promise.all([
        plansAPI.getAll({ period: selectedPeriod }),
        staffPlansAPI.getAll({ period: selectedPeriod }),
      ]);
      if (plansRes.success) setPlans(plansRes.data || []);
      if (staffRes.success) setStaffPlans(staffRes.data || []);
    } catch (error) {
      console.error('Error loading plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTarget = plans.reduce((s, p) => s + p.target_value, 0);
  const activePlans = plans.filter(p => p.status === 'Active').length;
  const totalStaffPlans = staffPlans.length;
  const totalStaffTarget = staffPlans.reduce((s, p) => s + p.individual_target, 0);

  const targetByBranch = plans.reduce((acc: any[], plan) => {
    const existing = acc.find(a => a.name === plan.branch_code);
    if (existing) {
      existing.value += plan.target_value;
    } else {
      acc.push({ name: plan.branch_code, value: plan.target_value, fill: '#3b82f6' });
    }
    return acc;
  }, []);

  const targetByKPI = plans.reduce((acc: any[], plan) => {
    const label = plan.kpi_category?.replace(/_/g, ' ');
    const existing = acc.find(a => a.name === label);
    if (existing) {
      existing.value += plan.target_value;
    } else {
      acc.push({ name: label, value: plan.target_value, fill: KPI_COLORS[label] || '#6b7280' });
    }
    return acc;
  }, []);

  const staffPlanByUser = staffPlans.reduce((acc: any[], sp) => {
    const existing = acc.find(a => a.name === sp.user?.name);
    if (existing) {
      existing.target += sp.individual_target;
      existing.plans += 1;
    } else {
      acc.push({
        name: sp.user?.name || 'Unknown',
        role: sp.position?.replace(/_/g, ' '),
        branch: sp.branch_code,
        target: sp.individual_target,
        plans: 1,
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading plan data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Plans Overview</h1>
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Plans</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{plans.length}</div>
            <p className="text-xs text-slate-500 mt-1">{activePlans} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Target Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalTarget.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Birr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Staff Plans</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalStaffPlans}</div>
            <p className="text-xs text-slate-500 mt-1">Across {staffPlanByUser.length} staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Staff Target Total</CardTitle>
            <Building2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalStaffTarget.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Birr</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Target by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            {targetByBranch.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={targetByBranch} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Bar dataKey="value" name="Target Value" radius={[4, 4, 0, 0]}>
                    {targetByBranch.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-8">No branch data for {selectedPeriod}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Target by KPI Category</CardTitle>
          </CardHeader>
          <CardContent>
            {targetByKPI.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={targetByKPI} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Bar dataKey="value" name="Target Value" radius={[4, 4, 0, 0]}>
                    {targetByKPI.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-8">No KPI data for {selectedPeriod}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Branch Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>KPI Category</TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan._id || plan.id}>
                    <TableCell className="font-medium">{plan.branch_code}</TableCell>
                    <TableCell>{plan.kpi_category?.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{plan.target_value?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={plan.status === 'Active' ? 'success' : plan.status === 'Draft' ? 'warning' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{plan.createdBy?.name || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-slate-400 py-8">No plans found for {selectedPeriod}</div>
          )}
        </CardContent>
      </Card>

      {/* Staff Plans Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Staff Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {staffPlanByUser.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Plans</TableHead>
                  <TableHead>Total Individual Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffPlanByUser.map((sp, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell>{sp.role}</TableCell>
                    <TableCell>{sp.branch}</TableCell>
                    <TableCell>{sp.plans}</TableCell>
                    <TableCell>{sp.target.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-slate-400 py-8">No staff plans for {selectedPeriod}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

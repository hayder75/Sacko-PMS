import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { plansAPI, staffPlansAPI } from '@/lib/api';

const kpiCategories = [
  'Deposit Mobilization',
  'Digital Channel Growth',
  'Member Registration',
  'Shareholder Recruitment',
  'Loan & NPL',
  'Customer Base',
];

const periods = ['2025-H2', 'Q4-2025', 'December-2025', '2025'];

export function PlanCascade() {
  const [activeTab, setActiveTab] = useState('manual');
  const [plans, setPlans] = useState<any[]>([]);
  const [staffPlans, setStaffPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffPlansLoading, setStaffPlansLoading] = useState(false);
  const [staffPlansFilter, setStaffPlansFilter] = useState({ branch_code: 'ATOTE', period: '2025-H2' });
  const [formData, setFormData] = useState({
    branch_code: '',
    kpi_category: '',
    period: '',
    target_value: '',
    target_type: 'incremental',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadPlans();
    if (activeTab === 'staff-plans') {
      loadStaffPlans();
    }
  }, [activeTab]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await plansAPI.getAll();
      if (response.success) {
        setPlans(response.data || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffPlans = async () => {
    try {
      setStaffPlansLoading(true);
      const params: any = {};
      if (staffPlansFilter.branch_code) params.branch_code = staffPlansFilter.branch_code;
      if (staffPlansFilter.period) params.period = staffPlansFilter.period;
      const response = await staffPlansAPI.getAll(params);
      if (response.success) {
        setStaffPlans(response.data || []);
      }
    } catch (error) {
      console.error('Error loading staff plans:', error);
    } finally {
      setStaffPlansLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await plansAPI.create({
        ...formData,
        target_value: parseFloat(formData.target_value),
      });
      if (response.success) {
        alert('Plan created and cascaded successfully!');
        setFormData({
          branch_code: '',
          kpi_category: '',
          period: '',
          target_value: '',
          target_type: 'incremental',
        });
        loadPlans();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const response = await plansAPI.upload(file);
      if (response.success) {
        const { created, errors, processed } = response.data || {};
        let message = `Successfully created ${created || 0} plans!`;
        if (processed !== undefined) {
          message += `\nProcessed ${processed} rows.`;
        }
        if (errors && errors.length > 0) {
          message += `\n\nErrors (${errors.length}):\n${errors.slice(0, 10).join('\n')}`;
          if (errors.length > 10) {
            message += `\n... and ${errors.length - 10} more errors.`;
          }
        }
        alert(message);
        setFile(null);
        loadPlans();
      } else {
        alert(response.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload plan file';
      alert(errorMessage);
      console.error('Plan upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Plan Management</h1>
        <p className="text-slate-600 mt-1">Create and manage branch-level plans</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="upload">Upload Excel</TabsTrigger>
          <TabsTrigger value="plans">View Plans</TabsTrigger>
          <TabsTrigger value="staff-plans">Staff Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Plan Manually</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch_code">Branch Code *</Label>
                    <Input
                      id="branch_code"
                      value={formData.branch_code}
                      onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                      placeholder="e.g., ATOTE"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kpi_category">KPI Category *</Label>
                    <Select
                      value={formData.kpi_category}
                      onValueChange={(value) => setFormData({ ...formData, kpi_category: value })}
                    >
                      <SelectTrigger id="kpi_category">
                        <SelectValue placeholder="Select KPI category" />
                      </SelectTrigger>
                      <SelectContent>
                        {kpiCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Period *</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => setFormData({ ...formData, period: value })}
                    >
                      <SelectTrigger id="period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_value">Target Value *</Label>
                    <Input
                      id="target_value"
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="Enter target value"
                      required
                      disabled={loading}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_type">Target Type</Label>
                  <Input
                    id="target_type"
                    value={formData.target_type}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">Only incremental targets are supported</p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({
                      branch_code: '',
                      kpi_category: '',
                      period: '',
                      target_value: '',
                      target_type: 'incremental',
                    })}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Plan File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planFile">Select Plan File (.xlsx or .csv)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="planFile"
                    type="file"
                    accept=".xlsx,.csv"
                    className="flex-1"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={loading}
                  />
                  <Button onClick={handleFileUpload} disabled={loading || !file}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  Excel file must contain columns: branch_code, kpi_category, period, target_value, target_type
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Plans (Cascaded Plans)</CardTitle>
              <p className="text-sm text-slate-600 mt-1">View individual plans assigned to staff members</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter_branch">Branch Code</Label>
                  <Input
                    id="filter_branch"
                    value={staffPlansFilter.branch_code}
                    onChange={(e) => setStaffPlansFilter({ ...staffPlansFilter, branch_code: e.target.value })}
                    placeholder="e.g., ATOTE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter_period">Period</Label>
                  <Select
                    value={staffPlansFilter.period}
                    onValueChange={(value) => setStaffPlansFilter({ ...staffPlansFilter, period: value })}
                  >
                    <SelectTrigger id="filter_period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={loadStaffPlans} disabled={staffPlansLoading}>
                {staffPlansLoading ? 'Loading...' : 'Load Staff Plans'}
              </Button>

              {staffPlansLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>KPI Category</TableHead>
                      <TableHead>Individual Target</TableHead>
                      <TableHead>Plan Share %</TableHead>
                      <TableHead>Daily Target</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                          No staff plans found. Make sure plans are cascaded and filters are correct.
                        </TableCell>
                      </TableRow>
                    ) : (
                      staffPlans.map((sp) => (
                        <TableRow key={sp._id}>
                          <TableCell className="font-medium">
                            {sp.userId?.name || 'N/A'} ({sp.userId?.employeeId || 'N/A'})
                          </TableCell>
                          <TableCell>{sp.position}</TableCell>
                          <TableCell>{sp.kpi_category}</TableCell>
                          <TableCell>{sp.individual_target?.toLocaleString()}</TableCell>
                          <TableCell>{sp.plan_share_percent?.toFixed(2)}%</TableCell>
                          <TableCell>{sp.daily_target?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={sp.status === 'Active' ? 'default' : 'outline'}>
                              {sp.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Code</TableHead>
                      <TableHead>KPI Category</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Target Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                          No plans found
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans.map((plan) => (
                        <TableRow key={plan._id}>
                          <TableCell className="font-medium">{plan.branch_code}</TableCell>
                          <TableCell>{plan.kpi_category}</TableCell>
                          <TableCell>{plan.period}</TableCell>
                          <TableCell>{plan.target_value?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={plan.status === 'Active' ? 'default' : 'outline'}>
                              {plan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

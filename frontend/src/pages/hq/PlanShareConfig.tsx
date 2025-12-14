import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X } from 'lucide-react';
import { planShareConfigAPI } from '@/lib/api';

const kpiCategories = [
  'Deposit Mobilization',
  'Digital Channel Growth',
  'Member Registration',
  'Shareholder Recruitment',
  'Loan & NPL',
  'Customer Base',
];

const positions = [
  'Branch Manager',
  'Member Service Manager (MSM)',
  'Accountant',
  'MSO', // This percentage is divided equally among all MSOs (I, II, III) in the branch
];

export function PlanShareConfig() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    branch_code: '',
    kpi_category: '',
    planShares: {
      'Branch Manager': 30,
      'Member Service Manager (MSM)': 25,
      'Accountant': 13,
      'MSO': 32, // This percentage is divided equally among all MSOs (I, II, III) in the branch
    },
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await planShareConfigAPI.getAll();
      if (response.success) {
        setConfigs(response.data || []);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return Object.values(formData.planShares).reduce((sum, val) => sum + (val || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = calculateTotal();
    if (Math.abs(total - 100) > 0.01) {
      alert(`Plan share percentages must total 100%. Current total: ${total}%`);
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await planShareConfigAPI.update(editingId, formData);
      } else {
        await planShareConfigAPI.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        branch_code: '',
        kpi_category: '',
                      planShares: {
                        'Branch Manager': 30,
                        'Member Service Manager (MSM)': 25,
                        'Accountant': 13,
                        'MSO': 32,
                      },
      });
      loadConfigs();
    } catch (error: any) {
      alert(error.message || 'Failed to save plan share config');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: any) => {
    setEditingId(config._id);
    setFormData({
      branch_code: config.branch_code || '',
      kpi_category: config.kpi_category,
      planShares: config.planShares,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Plan Share Configuration</h1>
          <p className="text-slate-600 mt-1">Configure plan-share percentages per KPI category and position</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} Plan Share Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_code">Branch Code (optional)</Label>
                  <Input
                    id="branch_code"
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    placeholder="Leave empty for default"
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
              </div>

              <div className="space-y-4">
                <Label>Plan Share Percentages (must total 100%)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {positions.map((position) => (
                    <div key={position} className="space-y-2">
                      <Label htmlFor={position}>
                        {position}
                        {position === 'MSO' && (
                          <span className="text-xs text-slate-500 ml-2">
                            (Divided equally among all MSOs in branch)
                          </span>
                        )}
                      </Label>
                      <Input
                        id={position}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.planShares[position as keyof typeof formData.planShares] || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          planShares: {
                            ...formData.planShares,
                            [position]: parseFloat(e.target.value) || 0,
                          },
                        })}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total:</span>
                    <Badge variant={Math.abs(calculateTotal() - 100) < 0.01 ? 'default' : 'destructive'}>
                      {calculateTotal().toFixed(2)}%
                    </Badge>
                  </div>
                  {Math.abs(calculateTotal() - 100) > 0.01 && (
                    <p className="text-xs text-red-600 mt-1">
                      Total must equal 100%
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading || Math.abs(calculateTotal() - 100) > 0.01}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      branch_code: '',
                      kpi_category: '',
                      planShares: {
                        'Branch Manager': 30,
                        'Member Service Manager (MSM)': 25,
                        'Accountant': 13,
                        'MSO': 32,
                      },
                    });
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Configurations</CardTitle>
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
                  <TableHead>Total %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config._id}>
                      <TableCell>{config.branch_code || 'Default'}</TableCell>
                      <TableCell className="font-medium">{config.kpi_category}</TableCell>
                      <TableCell>
                        <Badge>{config.total_percent}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.isActive ? 'default' : 'outline'}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


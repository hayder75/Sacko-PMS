import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, X, Check } from 'lucide-react';

const DEFAULT_KPI_DATA = [
  { id: 'Account_Productivity', kpiId: 'Account_Productivity', name: 'Account Productivity', weight: 30, minBalance: 1000 },
  { id: 'Deposit_Mobilization', kpiId: 'Deposit_Mobilization', name: 'Deposit Mobilization', weight: 24, minBalance: 1000 },
  { id: 'Internal_Operations', kpiId: 'Internal_Operations', name: 'Internal Operations', weight: 12, minBalance: 0 },
  { id: 'Share_Capital_Growth', kpiId: 'Share_Capital_Growth', name: 'Share Capital Growth', weight: 9, minBalance: 0 },
  { id: 'New_Member_Registration', kpiId: 'New_Member_Registration', name: 'New Member Registration', weight: 6, minBalance: 0 },
  { id: 'New_Account_Opening', kpiId: 'New_Account_Opening', name: 'New Account Opening', weight: 6, minBalance: 0 },
  { id: 'Mobile_Banking_Users', kpiId: 'Mobile_Banking_Users', name: 'Mobile Banking Users', weight: 5, minBalance: 0 },
  { id: 'Billers_Recruitment', kpiId: 'Billers_Recruitment', name: 'Billers Recruitment', weight: 5, minBalance: 0 },
  { id: 'Merchant_POS_Growth', kpiId: 'Merchant_POS_Growth', name: 'Merchant POS Growth', weight: 3, minBalance: 0 },
];

const thresholds = [
  { label: 'Outstanding', min: 120, max: 100, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Exceeds Expectations', min: 100, max: 119, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Meets Expectations', min: 90, max: 99, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Needs Improvement', min: 80, max: 89, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Unsatisfactory', min: 0, max: 79, color: 'text-red-600', bg: 'bg-red-50' },
];

export function KPIFramework() {
  const [kpiCategories, setKpiCategories] = useState(DEFAULT_KPI_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeights, setEditWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/kpi-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setKpiCategories(data.data.map((c: any) => ({
          id: c.id || c.kpiId,
          kpiId: c.kpiId,
          name: c.name,
          weight: c.weight,
          minBalance: c.minBalance,
        })));
      }
    } catch (_) {}
  };

  const startEdit = (id: string, weight: number) => {
    setEditingId(id);
    setEditWeights((prev) => ({ ...prev, [id]: weight }));
  };

  const saveWeight = async (id: string, weight: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/kpi-config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weight }),
      });
      setEditingId(null);
      loadConfig();
    } catch (_) {}
  };

  const saveEdit = async (id: string) => {
    const newWeight = editWeights[id];
    if (newWeight && newWeight > 0 && newWeight <= 100) {
      await saveWeight(id, newWeight);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const totalWeight = kpiCategories.reduce((sum, kpi) => sum + kpi.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">KPI Framework</h1>
        <p className="text-slate-600 mt-1">Define KPI categories, weights, and scoring logic</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>KPI Categories & Weights</CardTitle>
            <div className="text-sm">
              <span className="text-slate-600">Total Weight: </span>
              <span className={totalWeight === 100 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                {totalWeight}%
              </span>
              {totalWeight !== 100 && (
                <span className="text-red-500 text-xs ml-2">Must equal 100%</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI Category</TableHead>
                <TableHead>Weight (%)</TableHead>
                <TableHead>Min Balance (ETB)</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiCategories.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell className="font-medium">{kpi.name}</TableCell>
                  <TableCell>
                    {editingId === kpi.id ? (
                      <Input
                        type="number"
                        className="w-20 h-8"
                        value={editWeights[kpi.id] ?? kpi.weight}
                        onChange={(e) => setEditWeights({ ...editWeights, [kpi.id]: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={100}
                      />
                    ) : (
                      <Badge variant="outline">{kpi.weight}%</Badge>
                    )}
                  </TableCell>
                  <TableCell>{(kpi.minBalance ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {editingId === kpi.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(kpi.id)}>
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(kpi.id, kpi.weight)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {editingId && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
              Edit the weight percentage and click ✓ to save or ✗ to cancel.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threshold Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Rating Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {thresholds.map((t) => (
              <div key={t.label} className={`p-3 rounded-lg border ${t.bg}`}>
                <span className={`text-xs font-bold ${t.color}`}>{t.label}</span>
                <p className="text-lg font-bold text-slate-800 mt-1">&ge; {t.min}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

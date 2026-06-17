import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, X, Check } from 'lucide-react';

const defaultKpiCategories = [
  { id: 'Deposit_Mobilization', name: 'Deposit Mobilization', weight: 25, description: 'Total deposit collection vs target', minBalance: 500 },
  { id: 'Digital_Channel_Growth', name: 'Digital Channel Growth', weight: 20, description: 'Digital account activations and usage', minBalance: 0 },
  { id: 'Loan_NPL', name: 'Loan & NPL', weight: 20, description: 'Loan disbursement and NPL management', minBalance: 0 },
  { id: 'Customer_Base', name: 'Customer Base', weight: 15, description: 'New customer acquisition', minBalance: 0 },
  { id: 'Member_Registration', name: 'Member Registration', weight: 10, description: 'New member registrations', minBalance: 0 },
  { id: 'Shareholder_Recruitment', name: 'Shareholder Recruitment', weight: 10, description: 'Shareholder recruitment', minBalance: 0 },
];

const thresholds = [
  { label: 'Outstanding', min: 90, max: 100, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Very Good', min: 80, max: 89, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Good', min: 60, max: 79, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Needs Support', min: 0, max: 59, color: 'text-red-600', bg: 'bg-red-50' },
];

export function KPIFramework() {
  const [kpiCategories, setKpiCategories] = useState(defaultKpiCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeights, setEditWeights] = useState<Record<string, number>>({});

  const totalWeight = kpiCategories.reduce((sum, kpi) => sum + kpi.weight, 0);

  const startEdit = (id: string, currentWeight: number) => {
    setEditingId(id);
    setEditWeights({ ...editWeights, [id]: currentWeight });
  };

  const saveEdit = (id: string) => {
    const newWeight = editWeights[id];
    if (newWeight && newWeight > 0 && newWeight <= 100) {
      setKpiCategories(prev => prev.map(k => k.id === id ? { ...k, weight: newWeight } : k));
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

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
                <TableHead>Description</TableHead>
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
                        value={editWeights[kpi.id] || kpi.weight}
                        onChange={(e) => setEditWeights({ ...editWeights, [kpi.id]: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={100}
                      />
                    ) : (
                      <Badge variant="outline">{kpi.weight}%</Badge>
                    )}
                  </TableCell>
                  <TableCell>{kpi.minBalance.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-slate-600">{kpi.description}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Scoring Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {thresholds.map((t) => (
              <div key={t.label} className={`p-4 rounded-lg border ${t.bg}`}>
                <p className={`font-semibold ${t.color}`}>{t.label}</p>
                <p className="text-2xl font-bold text-slate-800">{t.min}% - {t.max}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <p><strong>KPI Score (85% of final):</strong> Sum of (Category Achievement% × Category Weight) × 0.85</p>
            <p><strong>Behavioral Score (15% of final):</strong> Average of competency scores normalized to 15</p>
            <p><strong>Final Score:</strong> KPI Score + Behavioral Score</p>
            <p className="text-xs text-slate-500 mt-2">Note: Weight changes affect all future performance calculations.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

const kpiCategories = [
  { id: 1, name: 'Deposit Mobilization', weight: 25, description: 'Total deposit collection vs target' },
  { id: 2, name: 'Digital Channels', weight: 20, description: 'Digital account activations and usage' },
  { id: 3, name: 'Loan & NPL', weight: 20, description: 'Loan disbursement and NPL management' },
  { id: 4, name: 'Customer Base', weight: 15, description: 'New customer acquisition' },
  { id: 5, name: 'Member Registration', weight: 10, description: 'New member registrations' },
  { id: 6, name: 'Other', weight: 10, description: 'Additional KPIs' },
];

export function KPIFramework() {
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI Category</TableHead>
                <TableHead>Weight (%)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiCategories.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell className="font-medium">{kpi.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{kpi.weight}%</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{kpi.description}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Logic Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Performance Thresholds</Label>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="p-3 border border-slate-200 rounded-md">
                <p className="font-semibold text-emerald-600">Outstanding</p>
                <p className="text-slate-600">≥ 90%</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <p className="font-semibold text-blue-600">Very Good</p>
                <p className="text-slate-600">80% - 89%</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <p className="font-semibold text-amber-600">Good</p>
                <p className="text-slate-600">60% - 79%</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-md">
                <p className="font-semibold text-red-600">Needs Support</p>
                <p className="text-slate-600">&lt; 60%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


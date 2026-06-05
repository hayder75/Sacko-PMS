import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

const competencies = [
  { id: 1, name: 'Communication', weight: 15, indicators: ['Clear verbal communication', 'Written reports quality'] },
  { id: 2, name: 'Teamwork', weight: 12, indicators: ['Collaboration', 'Conflict resolution'] },
  { id: 3, name: 'Problem Solving', weight: 15, indicators: ['Analytical thinking', 'Solution implementation'] },
  { id: 4, name: 'Adaptability', weight: 10, indicators: ['Change management', 'Flexibility'] },
  { id: 5, name: 'Leadership', weight: 15, indicators: ['Team motivation', 'Decision making'] },
  { id: 6, name: 'Customer Focus', weight: 18, indicators: ['Customer satisfaction', 'Service quality'] },
  { id: 7, name: 'Initiative', weight: 10, indicators: ['Proactive approach', 'Self-direction'] },
  { id: 8, name: 'Reliability', weight: 5, indicators: ['Punctuality', 'Consistency'] },
];

export function CompetencyFramework() {
  const totalWeight = competencies.reduce((sum, comp) => sum + comp.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Competency Framework</h1>
        <p className="text-slate-600 mt-1">Manage behavioral indicators and set weights per role</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Behavioral Competencies</CardTitle>
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
                <TableHead>Competency</TableHead>
                <TableHead>Weight (%)</TableHead>
                <TableHead>Indicators</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell className="font-medium">{comp.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{comp.weight}%</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {comp.indicators.join(', ')}
                  </TableCell>
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
          <CardTitle>Role-Specific Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Configure which competencies apply to each role and their relative weights
          </p>
          <div className="space-y-3">
            <div className="p-3 border border-slate-200 rounded-md">
              <p className="font-semibold mb-2">staff</p>
              <p className="text-sm text-slate-600">All 8 competencies, total weight: 15% of final score</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-md">
              <p className="font-semibold mb-2">branchManager</p>
              <p className="text-sm text-slate-600">Leadership, Communication, Problem Solving emphasized</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


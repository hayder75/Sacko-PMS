import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, Check, X } from 'lucide-react';

const defaultCompetencies = [
  { id: 1, name: 'Communication', weight: 15, indicators: ['Clear verbal communication', 'Written reports quality', 'Active listening'] },
  { id: 2, name: 'Teamwork', weight: 12, indicators: ['Collaboration with colleagues', 'Conflict resolution', 'Knowledge sharing'] },
  { id: 3, name: 'Problem Solving', weight: 15, indicators: ['Analytical thinking', 'Solution implementation', 'Decision making'] },
  { id: 4, name: 'Adaptability', weight: 10, indicators: ['Change management', 'Flexibility', 'Learning agility'] },
  { id: 5, name: 'Leadership', weight: 15, indicators: ['Team motivation', 'Delegation', 'Mentoring'] },
  { id: 6, name: 'Customer Focus', weight: 18, indicators: ['Customer satisfaction', 'Service quality', 'Response time'] },
  { id: 7, name: 'Initiative', weight: 10, indicators: ['Proactive approach', 'Self-direction', 'Innovation'] },
  { id: 8, name: 'Reliability', weight: 5, indicators: ['Punctuality', 'Consistency', 'Accountability'] },
];

const roleWeights = [
  { role: 'staff', label: 'Staff / MSO', competencies: 'All 8', weight: 15, note: 'All competencies apply at 100%' },
  { role: 'subTeamLeader', label: 'Accountant', competencies: 'All 8', weight: 15, note: 'Leadership and Communication emphasized' },
  { role: 'lineManager', label: 'Line Manager (MSM)', competencies: 'All 8', weight: 15, note: 'Leadership, Problem Solving emphasized' },
  { role: 'branchManager', label: 'Branch Manager', competencies: 'All 8', weight: 15, note: 'Leadership, Customer Focus emphasized' },
  { role: 'areaManager', label: 'Area Manager', competencies: 'All 8', weight: 15, note: 'Leadership, Adaptability emphasized' },
  { role: 'regionalDirector', label: 'Regional Director', competencies: 'All 8', weight: 15, note: 'All competencies at senior level' },
  { role: 'admin', label: 'Admin / HQ', competencies: 'All 8', weight: 15, note: 'Full competency framework applies' },
];

export function CompetencyFramework() {
  const [competencies, setCompetencies] = useState(defaultCompetencies);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editWeights, setEditWeights] = useState<Record<number, number>>({});

  const totalWeight = competencies.reduce((sum, comp) => sum + comp.weight, 0);

  const startEdit = (id: number, currentWeight: number) => {
    setEditingId(id);
    setEditWeights({ ...editWeights, [id]: currentWeight });
  };

  const saveEdit = (id: number) => {
    const newWeight = editWeights[id];
    if (newWeight && newWeight > 0 && newWeight <= 100) {
      setCompetencies(prev => prev.map(c => c.id === id ? { ...c, weight: newWeight } : c));
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Competency Framework</h1>
        <p className="text-slate-600 mt-1">Manage behavioral indicators and set weights per role</p>
      </div>

      <Tabs defaultValue="competencies">
        <TabsList>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="roles">Role Weights</TabsTrigger>
        </TabsList>

        <TabsContent value="competencies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Behavioral Competencies</CardTitle>
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
                    <TableHead>Competency</TableHead>
                    <TableHead>Weight (%)</TableHead>
                    <TableHead>Behavioral Indicators</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencies.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell>
                        {editingId === comp.id ? (
                          <Input
                            type="number"
                            className="w-20 h-8"
                            value={editWeights[comp.id] || comp.weight}
                            onChange={(e) => setEditWeights({ ...editWeights, [comp.id]: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={100}
                          />
                        ) : (
                          <Badge variant="outline">{comp.weight}%</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <ul className="list-disc list-inside">
                          {comp.indicators.map((ind, i) => (
                            <li key={i}>{ind}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        {editingId === comp.id ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => saveEdit(comp.id)}>
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEdit}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => startEdit(comp.id, comp.weight)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role-Specific Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Applicable Competencies</TableHead>
                    <TableHead>Weight in Final Score</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleWeights.map((rw) => (
                    <TableRow key={rw.role}>
                      <TableCell className="font-medium">{rw.label}</TableCell>
                      <TableCell>{rw.competencies}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rw.weight}%</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{rw.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

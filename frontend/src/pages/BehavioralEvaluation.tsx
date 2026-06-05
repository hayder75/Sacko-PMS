import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { behavioralAPI } from '@/lib/api';

export function BehavioralEvaluation() {
  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const response = await behavioralAPI.getAll();
      if (response.success) {
        setEvaluations(response.data || []);
      }
    } catch (error) {
      // Use default data
      setEvaluations([
        {
          _id: '1',
          employeeName: 'John Doe',
          period: '2024-Q1',
          overallScore: 85,
          status: 'Pending',
          submittedBy: 'branchManager',
          submittedAt: '2024-01-15',
        },
        {
          _id: '2',
          employeeName: 'Jane Smith',
          period: '2024-Q1',
          overallScore: 92,
          status: 'Approved',
          submittedBy: 'branchManager',
          submittedAt: '2024-01-14',
        },
      ]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'Pending':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await behavioralAPI.approve(id, 'Approved');
      loadEvaluations();
    } catch (error) {
      console.error('Error approving evaluation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Behavioral Evaluation</h1>
        <p className="text-slate-600 mt-2">Review and approve behavioral evaluations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{evaluations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {evaluations.filter((e: any) => e.status === 'Pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {evaluations.filter((e: any) => e.status === 'Approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    No evaluations found
                  </TableCell>
                </TableRow>
              ) : (
                evaluations.map((evaluation: any) => (
                  <TableRow key={evaluation._id}>
                    <TableCell className="font-medium">{evaluation.employeeName}</TableCell>
                    <TableCell>{evaluation.period}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{evaluation.overallScore || 0}/100</Badge>
                    </TableCell>
                    <TableCell>{evaluation.submittedBy}</TableCell>
                    <TableCell>{new Date(evaluation.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {evaluation.status === 'Pending' && (
                          <Button size="sm" onClick={() => handleApprove(evaluation._id)}>
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


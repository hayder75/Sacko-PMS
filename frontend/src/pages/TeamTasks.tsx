import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
export function TeamTasks() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll({ limit: 50 });
      if (response.success) {
        setTasks(response.data || []);
      }
    } catch (error) {
      // Use default data
      setTasks([
        {
          _id: '1',
          taskType: 'Deposit Collection',
          accountId: 'ACC001',
          amount: 5000,
          submittedBy: { name: 'John Doe' },
          status: 'Pending',
          submittedAt: '2024-01-15',
        },
        {
          _id: '2',
          taskType: 'Loan Disbursement',
          accountId: 'ACC002',
          amount: 10000,
          submittedBy: { name: 'Jane Smith' },
          status: 'Approved',
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
      await tasksAPI.approve(id, 'Approved');
      loadTasks();
    } catch (error) {
      console.error('Error approving task:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Team Tasks</h1>
        <p className="text-slate-600 mt-2">View and manage tasks from your team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {tasks.filter((t: any) => t.status === 'Pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter((t: any) => t.status === 'Approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {tasks.filter((t: any) => t.status === 'Rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task: any) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">{task.taskType}</TableCell>
                    <TableCell>{task.accountId}</TableCell>
                    <TableCell>ETB {task.amount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{task.submittedBy?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(task.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {task.status === 'Pending' && (
                          <Button size="sm" onClick={() => handleApprove(task._id)}>
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


import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Approved':
      return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
    case 'Pending':
      return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    case 'Rejected':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
    default:
      return null;
  }
};

export function Tasks() {
  const { role } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getAll();
      if (response.success) {
        setTasks(response.data || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Daily Tasks</h1>
          <p className="text-slate-600 mt-1">View and manage your daily task submissions</p>
        </div>
        {role === 'staff' && (
          <Link to="/tasks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Account #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
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
                  tasks.map((task) => (
                    <TableRow key={task._id}>
                      <TableCell className="font-medium">{task.taskType}</TableCell>
                      <TableCell>{task.accountNumber}</TableCell>
                      <TableCell>
                        {task.amount ? `${task.amount.toLocaleString()} Birr` : '-'}
                      </TableCell>
                      <TableCell>{task.submittedBy?.name || 'N/A'}</TableCell>
                      <TableCell>{new Date(task.taskDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(task.approvalStatus)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
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

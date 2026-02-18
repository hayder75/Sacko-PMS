import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CheckCircle2, Clock, XCircle, Info, FileText } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function Tasks() {
  const { role } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'Rejected':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCurrentStep = (chain: any[]) => {
    if (!chain || chain.length === 0) return 'N/A';
    const pendingStep = chain.find(s => s.status === 'Pending');
    if (!pendingStep) return 'Finalized';
    return pendingStep.role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Daily Tasks</h1>
          <p className="text-slate-600 mt-1">Track the status and approval progress of your submissions</p>
        </div>
        {(role === 'staff' || role === 'subTeamLeader') && (
          <Link to="/tasks/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg">Recent Task Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Task Type</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Execution Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                        <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p>You haven't submitted any tasks yet.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task._id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-700">
                          {task.taskType}
                        </TableCell>
                        <TableCell>
                          <code className="text-blue-600 font-bold">{task.accountNumber}</code>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {task.amount > 0 ? `${task.amount.toLocaleString()} ETB` : '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {getCurrentStep(task.approvalChain)}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(task.taskDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(task.approvalStatus)}</TableCell>
                        <TableCell className="text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                                onClick={() => setSelectedTask(task)}
                              >
                                <Info className="h-3 w-3" /> Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  Task Details & Approval Chain
                                </DialogTitle>
                              </DialogHeader>

                              {selectedTask && (
                                <div className="space-y-6 mt-4">
                                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-500 font-bold uppercase">Account</p>
                                      <p className="font-mono font-bold text-blue-600">{selectedTask.accountNumber}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Name</p>
                                      <p className="font-bold text-slate-800">{selectedTask.accountId?.customerName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-500 font-bold uppercase">Amount</p>
                                      <p className="font-bold text-slate-800">{selectedTask.amount?.toLocaleString() || 0} ETB</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-500 font-bold uppercase">Task Type</p>
                                      <p className="font-medium text-slate-700">{selectedTask.taskType}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                      <p className="text-[10px] text-slate-500 font-bold uppercase">Submission Date</p>
                                      <p className="font-medium text-slate-700">{new Date(selectedTask.taskDate).toLocaleDateString()}</p>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      Approval Progress
                                    </h4>
                                    <div className="space-y-3">
                                      {selectedTask.approvalChain?.map((step: any, idx: number) => (
                                        <div key={step._id} className="relative pl-6 pb-2">
                                          {idx < selectedTask.approvalChain.length - 1 && (
                                            <div className="absolute left-[7px] top-4 w-[2px] h-full bg-slate-200"></div>
                                          )}
                                          <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${step.status === 'Approved' ? 'bg-emerald-500 border-emerald-500' :
                                            step.status === 'Rejected' ? 'bg-rose-500 border-rose-500' :
                                              'bg-white border-slate-300'
                                            }`}>
                                            {step.status === 'Approved' && <CheckCircle2 className="h-3 w-3 text-white absolute inset-0 m-auto" />}
                                            {step.status === 'Rejected' && <XCircle className="h-3 w-3 text-white absolute inset-0 m-auto" />}
                                          </div>
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <p className="text-sm font-bold text-slate-800">{step.role}</p>
                                              <p className="text-xs text-slate-500">
                                                {step.status === 'Approved' ? `Approved on ${new Date(step.approvedAt).toLocaleDateString()}` :
                                                  step.status === 'Rejected' ? `Rejected: ${step.comments || 'No comments'}` :
                                                    `Waiting for review...`}
                                              </p>
                                            </div>
                                            {getStatusBadge(step.status)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {selectedTask.remarks && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-bold text-slate-800">Submitter Remarks</h4>
                                      <p className="text-sm text-slate-600 bg-blue-50/50 p-3 rounded-md italic">
                                        "{selectedTask.remarks}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

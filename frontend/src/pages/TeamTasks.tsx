import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock, XCircle, AlertCircle, UserCheck, ShieldCheck, FileText, Info } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function TeamTasks() {
  const { user } = useUser();
  const [myApprovals, setMyApprovals] = useState<any[]>([]);
  const [teamTasks, setTeamTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [myRes, teamRes] = await Promise.all([
        tasksAPI.getAll({ pendingApprovalByMe: 'true' }),
        tasksAPI.getAll({ limit: 100 })
      ]);

      if (myRes.success) {
        const allPendingMe = myRes.data || [];
        // Filter to only those where it's actually my turn (sequential approval)
        const actionable = allPendingMe.filter((t: any) => isMyTurn(t));
        setMyApprovals(actionable);
      }
      if (teamRes.success) setTeamTasks(teamRes.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    let comments = '';
    if (status === 'Rejected') {
      comments = prompt('Please enter a reason for rejection:') || '';
      if (!comments) return;
    }

    try {
      await tasksAPI.approve(id, status, comments);
      loadAllData();
    } catch (error: any) {
      alert(error.message || `Failed to ${status.toLowerCase()} task`);
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

  const renderApprovalChain = (chain: any[]) => {
    if (!chain || chain.length === 0) return <span className="text-slate-400 text-xs italic">No chain defined</span>;

    return (
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {chain.map((step, idx) => (
          <div key={step._id} className="flex items-center">
            <div className={`flex flex-col items-center px-2 py-1 rounded border ${step.status === 'Approved' ? 'bg-emerald-50 border-emerald-200' :
              step.status === 'Rejected' ? 'bg-rose-50 border-rose-200' :
                'bg-slate-50 border-slate-200'
              }`}>
              <span className="text-[10px] uppercase font-bold text-slate-500">{step.role}</span>
              <div className="flex items-center gap-1">
                {step.status === 'Approved' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
                  step.status === 'Rejected' ? <XCircle className="h-3 w-3 text-rose-500" /> :
                    <Clock className="h-3 w-3 text-amber-500" />}
                <span className={`text-[11px] font-medium ${step.status === 'Approved' ? 'text-emerald-700' :
                  step.status === 'Rejected' ? 'text-rose-700' :
                    'text-slate-600'
                  }`}>{step.status}</span>
              </div>
            </div>
            {idx < chain.length - 1 && <div className="w-2 h-[1px] bg-slate-200 mx-1"></div>}
          </div>
        ))}
      </div>
    );
  };

  const isMyTurn = (task: any) => {
    if (!task || !user) return false;
    const chain = task.approvalChain || [];

    // Find my position in the chain by matching ID
    const myIndex = chain.findIndex((a: any) => {
      const approverId = a.approverId?._id || a.approverId?.id || a.approverId;
      return approverId === user._id || approverId === user.id;
    });

    if (myIndex === -1) return false;

    // Sequential logic: Only my turn if all previous steps are Approved
    for (let i = 0; i < myIndex; i++) {
      if (chain[i].status !== 'Approved') return false;
    }

    // And my own current status must be Pending
    return chain[myIndex].status === 'Pending';
  };

  const TaskTable = ({ data, showActions = false }: { data: any[], showActions?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitter</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Account #</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Approval Chain Status</TableHead>
            <TableHead>Overall Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                <AlertCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p>No tasks found in this section.</p>
              </TableCell>
            </TableRow>
          ) : (
            data.map((task: any) => (
              <TableRow key={task._id} className={isMyTurn(task) ? 'bg-blue-50/30' : ''}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{task.submittedBy?.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{task.submittedBy?.position?.replace(/_/g, ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{task.taskType}</span>
                    <span className="text-[10px] text-slate-500">{new Date(task.taskDate).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {task.accountNumber}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {task.amount > 0 ? `${task.amount.toLocaleString()} ETB` : '-'}
                </TableCell>
                <TableCell>
                  {renderApprovalChain(task.approvalChain)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(task.approvalStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {showActions && isMyTurn(task) ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 h-8"
                          onClick={() => handleAction(task._id, 'Approved')}
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() => handleAction(task._id, 'Rejected')}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
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
                              Task Details & Approval History
                            </DialogTitle>
                          </DialogHeader>

                          {selectedTask && (
                            <div className="space-y-6 mt-4">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Submitter</p>
                                  <p className="font-bold text-slate-800">{selectedTask.submittedBy?.name}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Position</p>
                                  <p className="text-xs text-slate-600">{selectedTask.submittedBy?.position?.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Account Number</p>
                                  <p className="font-mono font-bold text-blue-600">{selectedTask.accountNumber}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Name</p>
                                  <p className="font-bold text-slate-800">{selectedTask.accountId?.customerName || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Task Type</p>
                                  <p className="font-medium text-slate-700">{selectedTask.taskType}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Amount</p>
                                  <p className="font-bold text-slate-900">{selectedTask.amount?.toLocaleString() || 0} ETB</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                  Approval Chain Progress
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
                                                `Waiting...`}
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

                              {isMyTurn(selectedTask) && (
                                <div className="flex gap-3 pt-4 border-t">
                                  <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold"
                                    onClick={() => handleAction(selectedTask._id, 'Approved')}
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Quick Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1 font-bold"
                                    onClick={() => handleAction(selectedTask._id, 'Rejected')}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Task
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Task Approvals & Monitoring</h1>
          <p className="text-slate-600 mt-1">Hierarchical approval for daily operational tasks</p>
        </div>
        <Button variant="outline" onClick={loadAllData} disabled={loading} className="w-fit">
          <Clock className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Lists
        </Button>
      </div>

      <Tabs defaultValue="my-approvals" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="my-approvals" className="relative font-bold">
            Pending My Approval
            {myApprovals.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                {myApprovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-tasks">All Team Tasks</TabsTrigger>
        </TabsList>

        <Card className="mt-6 border-slate-200 shadow-sm">
          <TabsContent value="my-approvals" className="m-0">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Tasks Waiting for Your Action</CardTitle>
              </div>
              <CardDescription>
                These tasks are at your level in the approval chain and require your review.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TaskTable data={myApprovals} showActions={true} />
            </CardContent>
          </TabsContent>

          <TabsContent value="all-tasks" className="m-0">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-lg">Full Branch Task Monitoring</CardTitle>
              </div>
              <CardDescription>
                Overview of all tasks being processed in the branch and their current approval status.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TaskTable data={teamTasks} />
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}

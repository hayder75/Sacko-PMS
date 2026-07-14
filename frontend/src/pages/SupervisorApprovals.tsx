import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { tasksAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Home, CheckCircle2, XCircle, Clock, MessageSquare, CheckCheck } from 'lucide-react';

export function SupervisorApprovals() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await tasksAPI.getAll({ pendingApprovalByMe: 'true' });
      if (res.success) setTasks(res.data || []);
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      await tasksAPI.approve(taskId, 'Approved');
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setSelected(prev => { const next = new Set(prev); next.delete(taskId); return next; });
    } catch (_) {} finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      await tasksAPI.approve(taskId, 'Rejected', rejectComment[taskId] || '');
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setShowReject(null);
      setSelected(prev => { const next = new Set(prev); next.delete(taskId); return next; });
    } catch (_) {} finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Approve ${selected.size} task${selected.size > 1 ? 's' : ''}?`)) return;
    try {
      setBulkLoading(true);
      await Promise.all(
        Array.from(selected).map(id => tasksAPI.approve(id, 'Approved'))
      );
      setTasks(prev => prev.filter(t => !selected.has(t._id)));
      setSelected(new Set());
    } catch (_) {} finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === tasks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tasks.map(t => t._id)));
    }
  };

  const allSelected = tasks.length > 0 && selected.size === tasks.length;

  const canAct = (taskId: string) => actionLoading === taskId;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-white px-4 py-2.5 border border-slate-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Home / Approvals / {user?.name || 'Approver'}</span>
        </div>
        <div className="text-xs text-slate-400">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {tasks.length > 0
              ? `${tasks.length} task${tasks.length > 1 ? 's' : ''} awaiting your review`
              : 'No tasks pending your approval'}
          </p>
        </div>
        {selected.size > 0 && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleBulkApprove}
            disabled={bulkLoading}
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            {bulkLoading ? 'Approving...' : `Approve ${selected.size} Selected`}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No pending approvals for you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All row */}
          {tasks.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer select-none">
                {allSelected ? 'Deselect all' : `Select all ${tasks.length} tasks`}
              </label>
            </div>
          )}

          {tasks.map((task) => (
            <Card key={task._id} className={`border shadow-sm transition-colors ${selected.has(task._id) ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selected.has(task._id)}
                    onCheckedChange={() => toggleSelect(task._id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                      <span className="text-sm font-semibold text-slate-800">{task.taskType?.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">Staff</p>
                        <p className="font-medium text-slate-700">{task.submittedBy?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Account</p>
                        <p className="font-mono font-medium text-slate-700">{task.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Amount</p>
                        <p className="font-medium text-slate-700">{task.amount ? `${task.amount.toLocaleString()} ETB` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Date</p>
                        <p className="font-medium text-slate-700">{new Date(task.taskDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {task.remarks && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{task.remarks}</span>
                      </div>
                    )}

                    {task.customerName && (
                      <p className="text-xs text-slate-500">Customer: <span className="font-medium text-slate-700">{task.customerName}</span></p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                      onClick={() => handleApprove(task._id)}
                      disabled={canAct(task._id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    {showReject === task._id ? (
                      <div className="space-y-1.5">
                        <Textarea
                          placeholder="Reason for rejection..."
                          value={rejectComment[task._id] || ''}
                          onChange={(e) => setRejectComment(prev => ({ ...prev, [task._id]: e.target.value }))}
                          className="h-16 text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => handleReject(task._id)}
                            disabled={canAct(task._id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setShowReject(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 text-xs"
                        onClick={() => setShowReject(task._id)}
                        disabled={canAct(task._id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

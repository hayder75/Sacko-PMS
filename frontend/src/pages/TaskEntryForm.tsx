import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { tasksAPI } from '@/lib/api';

const taskTypes = [
  'Deposit Mobilization',
  'Loan Follow-up',
  'New Customer',
  'Digital Activation',
  'Member Registration',
  'Shareholder Recruitment',
];

// Real products from CBS system
const productTypes: Record<string, string[]> = {
  'Deposit Mobilization': [
    'Felagot Saving',
    'Weekly Sa 360',
    'Medebegna Savin',
    'Special Saving',
    'Taxi Saving',
    'Fixed Time 1Y',
  ],
  'Digital Channel Growth': [
    'Digital Saving',
  ],
  'Loan & NPL': [
    'Sixty Days L Sa',
    'Thirty Days L S',
    'Revol Loan Savi',
  ],
  'Customer Base': [
    'Non Member',
  ],
  'Shareholder Recruitment': [
    'Share Account',
  ],
  // Note: Member Registration and New Customer don't have specific products
  // They are tracked by task type only
};

export function TaskEntryForm() {
  const navigate = useNavigate();
  const [taskType, setTaskType] = useState('');
  const [productType, setProductType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);
  const [submittedTask, setSubmittedTask] = useState<any>(null);
  const [mappingInfo, setMappingInfo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        taskType,
        productType,
        accountNumber,
        amount: amount ? parseFloat(amount) : 0,
        remarks,
        taskDate,
      };

      const response = await tasksAPI.create(taskData);
      
      if (response.success) {
        setSubmittedTask(response.data);
        setMappingStatus(response.mappingInfo?.status || response.data.mappingStatus);
        setMappingInfo(response.mappingInfo);
        // Navigate back to tasks after 2 seconds
        setTimeout(() => {
          navigate('/tasks');
        }, 2000);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const getMappingBadge = () => {
    if (!mappingStatus) return null;
    
    switch (mappingStatus) {
      case 'Mapped to You':
        return (
          <Badge variant="success" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Mapped to You
          </Badge>
        );
      case 'Mapped to Another Staff':
        return (
          <Badge variant="warning" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Mapped to Another Staff
          </Badge>
        );
      case 'Unmapped':
        return (
          <Badge variant="destructive" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Unmapped – Requires BM Approval
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Daily Task Entry</h1>
        <p className="text-slate-600 mt-1">Submit your daily tasks and activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Task Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type *</Label>
              <Select value={taskType} onValueChange={(value) => {
                setTaskType(value);
                setProductType('');
              }}>
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {taskType && productTypes[taskType] && (
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger id="productType">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes[taskType].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setMappingStatus(null);
                  setMappingInfo(null);
                }}
                onBlur={() => {
                  // Mapping status will be checked on submit
                  // For now, just clear any previous status
                  if (!accountNumber) {
                    setMappingStatus(null);
                    setMappingInfo(null);
                  }
                }}
                placeholder="Enter account number"
                required
                disabled={loading}
              />
              {mappingStatus && !submittedTask && (
                <div className="mt-2">
                  {getMappingBadge()}
                  {mappingInfo?.canCountForKPI === false && (
                    <p className="text-xs text-red-600 mt-1">
                      This task will not count toward your KPI until mapping is resolved.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Birr)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (optional)"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDate">Task Date *</Label>
              <Input
                id="taskDate"
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any additional remarks..."
                rows={4}
                disabled={loading}
              />
            </div>

            {mappingStatus && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <p className="text-sm font-medium text-slate-700 mb-2">Mapping Status:</p>
                {getMappingBadge()}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Task'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/tasks')} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Search, User } from 'lucide-react';
import { tasksAPI, mappingsAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

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
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  const [taskType, setTaskType] = useState('');
  const [productType, setProductType] = useState('');
  const [accountNumber, setAccountNumber] = useState(searchParams.get('accountNumber') || '');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);
  const [submittedTask, setSubmittedTask] = useState<any>(null);
  const [mappingInfo, setMappingInfo] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [showMappedOnly, setShowMappedOnly] = useState(true);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      // Fetch user's mapped accounts for quick selection
      const response = await mappingsAPI.getAll({ mappedTo: user?._id });
      if (response.success) {
        setMappings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
    }
  };

  const selectedMapping = mappings.find(m => m.accountNumber === accountNumber);
  const isNewAccount = !selectedMapping && accountNumber.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        taskType,
        productType,
        accountNumber,
        customerName: isNewAccount ? customerName : undefined,
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

            <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-blue-900 font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select Mapped Account
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-700">Show My Mappings</span>
                  <input
                    type="checkbox"
                    checked={showMappedOnly}
                    onChange={(e) => setShowMappedOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-blue-300"
                  />
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search your accounts by name or number..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pl-10 bg-white border-blue-200 focus:ring-blue-500"
                />
              </div>

              {mappings.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-blue-100 rounded-md bg-white">
                  {mappings
                    .filter(m =>
                      m.accountNumber.includes(accountSearch) ||
                      m.customerName.toLowerCase().includes(accountSearch.toLowerCase())
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-blue-50 last:border-0 ${accountNumber === m.accountNumber ? 'bg-blue-100' : ''
                          }`}
                        onClick={() => {
                          setAccountNumber(m.accountNumber);
                          setAccountSearch('');
                        }}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{m.accountNumber}</p>
                          <p className="text-xs text-slate-500">{m.customerName}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-blue-50">
                          {m.balance?.toLocaleString()} ETB
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="flex items-center gap-2">
                  Account Number * {selectedMapping && <Badge variant="success">Found</Badge>}
                </Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setMappingStatus(null);
                    setMappingInfo(null);
                  }}
                  placeholder="Or enter manually here"
                  required
                  disabled={loading}
                  className={selectedMapping ? 'border-green-500 bg-green-50/30' : ''}
                />
              </div>

              {isNewAccount && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="customerName" className="text-blue-700">Customer Name (Required for new accounts) *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter full customer name"
                    required={isNewAccount}
                    className="border-blue-300 bg-blue-50/20"
                  />
                  <p className="text-[11px] text-blue-600 italic">This is an unmapped account. It will be added to the system as "Unmapped" for approval.</p>
                </div>
              )}

              {selectedMapping && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold">Matched Customer:</p>
                    <p className="text-sm font-bold text-emerald-900">{selectedMapping.customerName}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              )}

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

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, UserPlus, RefreshCw } from 'lucide-react';
import { mappingsAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function MappingManagement() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMappings();
  }, [statusFilter]);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await mappingsAPI.getAll(params);
      if (response.success) {
        setMappings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBalance = async () => {
    try {
      if (!user?.branchId) {
        alert('Branch ID not found');
        return;
      }
      const response = await mappingsAPI.autoBalance(user?.branchId || '');
      if (response.success) {
        alert(response.message || 'Auto-balance completed');
        loadMappings();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to auto-balance');
    }
  };

  const filteredMappings = mappings.filter((mapping) => {
    const matchesSearch =
      mapping.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Mapping Management</h1>
        <p className="text-slate-600 mt-1">Manage account mappings and assignments</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by account number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Mapped</SelectItem>
                <SelectItem value="Unmapped">Unmapped</SelectItem>
              </SelectContent>
            </Select>
            {(user?.role === 'branchManager' || user?.role === 'admin') && (
              <Button onClick={handleAutoBalance}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-Balance Mapping
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle>Account Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account #</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">June 30 Balance</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead>Mapped To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping._id}>
                      <TableCell className="font-medium">{mapping.accountNumber}</TableCell>
                      <TableCell>{mapping.customerName}</TableCell>
                      <TableCell>{mapping.accountType}</TableCell>
                      <TableCell className="text-right">{mapping.june_balance?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-right font-bold">{mapping.current_balance?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        {mapping.mappedTo?.name || (
                          <span className="text-slate-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mapping.status === 'Active' ? 'success' : 'destructive'}>
                          {mapping.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {mapping.status === 'Unmapped' && (user?.role === 'branchManager' || user?.role === 'admin') && (
                            <Button variant="outline" size="sm">
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
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

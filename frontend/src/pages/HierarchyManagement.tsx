import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, MapPin, ChevronDown, ChevronRight, Users, User as UserIcon } from 'lucide-react';
import { usersAPI, subTeamsAPI, regionsAPI, areasAPI, branchesAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
 '@/lib/utils';

export function HierarchyManagement() {
  const { user, role } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [subTeams, setSubTeams] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: '',
    position: '',
    sub_team: '',
    branchId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStaff(),
        loadSubTeams(),
        loadHierarchy(),
        loadRegions(),
        loadAreas(),
        loadBranches(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      let params: any = { isActive: 'true' };
      
      if (role === 'subTeamLeader') {
        params.role = 'staff';
        const bid = typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId;
        if (bid) params.branchId = bid;
      } else if (role === 'lineManager') {
        params.role = 'staff';
        const bid = typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId;
        if (bid) params.branchId = bid;
      } else if (role === 'branchManager') {
        const bid = typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId;
        if (bid) params.branchId = bid;
      }

      const response = await usersAPI.getAll(params);
      if (response.success) {
        setStaff(response.data || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadSubTeams = async () => {
    try {
      const bid = typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId;
      if (bid) {
        const response = await subTeamsAPI.getAll({ branchId: bid });
        if (response.success) {
          setSubTeams(response.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading sub-teams:', error);
    }
  };

  const loadRegions = async () => {
    try {
      const response = await regionsAPI.getAll({ isActive: 'true' });
      if (response.success) setRegions(response.data || []);
    } catch (_) {}
  };

  const loadAreas = async () => {
    try {
      const params: any = { isActive: 'true' };
      if (role === 'regionalDirector') {
        const rid = typeof user?.regionId === 'string' ? user.regionId : user?.regionId?._id || user?.regionId;
        if (rid) params.regionId = rid;
      }
      const response = await areasAPI.getAll(params);
      if (response.success) setAreas(response.data || []);
    } catch (_) {}
  };

  const loadBranches = async () => {
    try {
      const params: any = { isActive: 'true' };
      if (role === 'areaManager') {
        const aid = typeof user?.areaId === 'string' ? user.areaId : user?.areaId?._id || user?.areaId;
        if (aid) params.areaId = aid;
      }
      const response = await branchesAPI.getAll(params);
      if (response.success) setBranches(response.data || []);
    } catch (_) {}
  };

  const loadHierarchy = async () => {
    try {
      const response = await usersAPI.getHierarchy();
      if (response.success) {
        setHierarchy(response.data);
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    }
  };

  const getAvailableRoles = () => {
    if (role === 'admin') {
      return [
        { value: 'regionalDirector', label: 'Regional Director' },
        { value: 'areaManager', label: 'Area Manager' },
        { value: 'branchManager', label: 'Branch Manager' },
      ];
    }
    if (role === 'regionalDirector') {
      return [{ value: 'areaManager', label: 'Area Manager' }];
    }
    if (role === 'areaManager') {
      return [{ value: 'branchManager', label: 'Branch Manager' }];
    }
    if (role === 'subTeamLeader') {
      return [{ value: 'staff', label: 'Staff' }];
    }
    if (role === 'lineManager') {
      return [
        { value: 'subTeamLeader', label: 'Sub-Team Leader' },
        { value: 'staff', label: 'Staff' }
      ];
    }
    if (role === 'branchManager') {
      return [
        { value: 'lineManager', label: 'Line Manager (MSM)' },
        { value: 'subTeamLeader', label: 'Sub-Team Leader (Accountant/Auditor)' },
        { value: 'staff', label: 'Staff (MSO)' }
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const bid = formData.role === 'branchManager'
        ? formData.branchId || (typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId)
        : (typeof user?.branchId === 'string' ? user.branchId : user?.branchId?._id || user?.branchId);

      const resolvedRegionId = selectedRegionId || user?.regionId?._id || user?.regionId || null;
      const resolvedAreaId = selectedAreaId || user?.areaId?._id || user?.areaId || null;

      const userData = {
        ...formData,
        branch_code: formData.role === 'branchManager'
          ? branches.find(b => (b._id || b.id) === formData.branchId)?.code || user?.branch_code
          : user?.branch_code || user?.branchId?.code,
        branchId: bid,
        areaId: resolvedAreaId,
        regionId: resolvedRegionId,
        sub_team: formData.sub_team || undefined,
      };

      await usersAPI.create(userData);
      setShowForm(false);
      setFormData({ employeeId: '', name: '', email: '', password: '', role: '', position: '', sub_team: '', branchId: '' });
      setSelectedRegionId('');
      setSelectedAreaId('');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatRole = (r: string) => {
    return r.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  };

  const roleColor = (r: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      regionalDirector: 'bg-blue-100 text-blue-800',
      areaManager: 'bg-indigo-100 text-indigo-800',
      branchManager: 'bg-green-100 text-green-800',
      lineManager: 'bg-teal-100 text-teal-800',
      subTeamLeader: 'bg-orange-100 text-orange-800',
      staff: 'bg-slate-100 text-slate-800',
    };
    return colors[r] || 'bg-slate-100 text-slate-800';
  };

  const renderHierarchyTree = () => {
    if (!hierarchy) return null;

    if (hierarchy.regions) {
      return hierarchy.regions.map((region: any) => (
        <div key={region.id} className="mb-6">
          <div
            className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
            onClick={() => toggleExpand('region-' + region.id)}
          >
            {expanded['region-' + region.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">{region.name}</span>
            <Badge className="bg-blue-100 text-blue-800">Region</Badge>
            {region.director && (
              <span className="text-sm text-slate-600 ml-2">
                Director: {region.director.name}
              </span>
            )}
          </div>
          {expanded['region-' + region.id] && region.areas && (
            <div className="ml-8 mt-2 space-y-3">
              {region.areas.map((area: any) => (
                <div key={area.id}>
                  <div
                    className="flex items-center gap-2 p-2.5 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100"
                    onClick={() => toggleExpand('area-' + area.id)}
                  >
                    {expanded['area-' + area.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-indigo-800">{area.name}</span>
                    <Badge className="bg-indigo-100 text-indigo-800">Area</Badge>
                    {area.manager && (
                      <span className="text-sm text-slate-600 ml-2">
                        Manager: {area.manager.name}
                      </span>
                    )}
                  </div>
                  {expanded['area-' + area.id] && area.branches && (
                    <div className="ml-8 mt-2 space-y-2">
                      {area.branches.map((branch: any) => (
                        <div key={branch.id}>
                          <div
                            className="flex items-center gap-2 p-2 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
                            onClick={() => toggleExpand('branch-' + branch.id)}
                          >
                            {expanded['branch-' + branch.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Building2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">{branch.name}</span>
                            <Badge className="bg-green-100 text-green-800">Branch</Badge>
                            {branch.manager && (
                              <span className="text-sm text-slate-600 ml-2">
                                Manager: {branch.manager.name}
                              </span>
                            )}
                          </div>
                          {expanded['branch-' + branch.id] && branch.users && branch.users.length > 0 && (
                            <div className="ml-8 mt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {branch.users.map((u: any) => (
                                <div key={u.id} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                                  <UserIcon className="h-4 w-4 text-slate-400" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate">{u.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{u.position || formatRole(u.role)}</div>
                                  </div>
                                  <Badge className={roleColor(u.role) + ' text-xs'}>{formatRole(u.role)}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ));
    }

    if (hierarchy.areas) {
      return hierarchy.areas.map((area: any) => (
        <div key={area.id} className="mb-6">
          <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg mb-3">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-indigo-800">{area.name}</span>
            <Badge className="bg-indigo-100 text-indigo-800">Area</Badge>
            {area.region && <span className="text-sm text-slate-500">under {area.region.name}</span>}
            {area.manager && <span className="text-sm text-slate-600 ml-2">Manager: {area.manager.name}</span>}
          </div>
          <div className="ml-6 space-y-2">
            {area.branches?.map((branch: any) => (
              <div key={branch.id}>
                <div
                  className="flex items-center gap-2 p-2 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
                  onClick={() => toggleExpand('branch-' + branch.id)}
                >
                  {expanded['branch-' + branch.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">{branch.name}</span>
                  {branch.manager && <span className="text-sm text-slate-600">Manager: {branch.manager.name}</span>}
                </div>
                {expanded['branch-' + branch.id] && branch.users && (
                  <div className="ml-8 mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {branch.users.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.employeeId} - {u.position || formatRole(u.role)}</div>
                        </div>
                        <Badge className={roleColor(u.role) + ' text-xs'}>{formatRole(u.role)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ));
    }

    if (hierarchy.branches) {
      return hierarchy.branches.map((branch: any) => (
        <div key={branch.id} className="mb-6">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-3">
            <Building2 className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">{branch.name}</span>
            <Badge className="bg-green-100 text-green-800">Branch</Badge>
            {branch.area && <span className="text-sm text-slate-500">under {branch.area.name}</span>}
            {branch.manager && <span className="text-sm text-slate-600 ml-2">Manager: {branch.manager.name}</span>}
          </div>
          <div className="ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {branch.users?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                <UserIcon className="h-4 w-4 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.position || formatRole(u.role)}</div>
                </div>
                <Badge className={roleColor(u.role) + ' text-xs'}>{formatRole(u.role)}</Badge>
              </div>
            ))}
          </div>
        </div>
      ));
    }

    return <div className="text-center text-slate-500 py-8">No hierarchy data available</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Organization Hierarchy</h1>
          <p className="text-slate-600 mt-1">
            {role === 'admin' && 'Full organization structure'}
            {role === 'regionalDirector' && 'Your region - Areas, Branches, and Staff'}
            {role === 'areaManager' && 'Your area - Branches and Staff'}
            {role === 'branchManager' && 'Your branch - Teams and Staff'}
            {role === 'subTeamLeader' && 'Staff under your supervision'}
            {role === 'lineManager' && 'Staff under your supervision'}
          </p>
        </div>
        {getAvailableRoles().length > 0 && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create New Account</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID *</Label>
                  <Input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required disabled={loading} minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position *</Label>
                  <Select value={formData.position} onValueChange={v => setFormData({...formData, position: v})} required disabled={!formData.role}>
                    <SelectTrigger><SelectValue placeholder={formData.role ? "Select position" : "Select role first"} /></SelectTrigger>
                    <SelectContent>
                      {formData.role === 'regionalDirector' && <SelectItem value="Regional Director">Regional Director</SelectItem>}
                      {formData.role === 'areaManager' && <SelectItem value="Area Manager">Area Manager</SelectItem>}
                      {formData.role === 'branchManager' && <SelectItem value="Branch Manager">Branch Manager</SelectItem>}
                      {formData.role === 'lineManager' && (
                        <><SelectItem value="Member Service Manager (MSM)">MSM</SelectItem><SelectItem value="Member Service Officer I">MSO I</SelectItem></>
                      )}
                      {formData.role === 'subTeamLeader' && (
                        <><SelectItem value="Accountant">Accountant</SelectItem><SelectItem value="Member Service Officer I">MSO I</SelectItem></>
                      )}
                      {formData.role === 'staff' && (
                        <><SelectItem value="Member Service Officer I">MSO I</SelectItem><SelectItem value="Member Service Officer II">MSO II</SelectItem></>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {(formData.role === 'staff' || ['Member Service Officer I', 'Member Service Officer II'].includes(formData.position)) && (
                  <div className="space-y-2 col-span-2">
                    <Label>Sub-Team *</Label>
                    <Select value={formData.sub_team} onValueChange={v => setFormData({...formData, sub_team: v})} required>
                      <SelectTrigger><SelectValue placeholder={formData.position ? "Select sub-team" : "Select position first"} /></SelectTrigger>
                      <SelectContent>
                        {subTeams.length === 0 ? (
                          <SelectItem value="no-subteams" disabled>No sub-teams available</SelectItem>
                        ) : (
                          subTeams.map((st: any) => (
                            <SelectItem key={st._id} value={st.code}>{st.name} ({st.code})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(formData.role === 'regionalDirector' && role === 'admin') && (
                  <div className="space-y-2">
                    <Label>Region *</Label>
                    <Select value={selectedRegionId} onValueChange={v => setSelectedRegionId(v)} required>
                      <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {regions.map(r => (
                          <SelectItem key={r.id || r._id} value={r.id || r._id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.role === 'areaManager' && (
                  <div className="space-y-2">
                    <Label>Area *</Label>
                    <Select value={selectedAreaId} onValueChange={v => setSelectedAreaId(v)} required>
                      <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                      <SelectContent>
                        {areas.map(a => (
                          <SelectItem key={a.id || a._id} value={a.id || a._id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.role === 'branchManager' && (
                  <div className="space-y-2">
                    <Label>Branch *</Label>
                    <Select value={formData.branchId} onValueChange={v => setFormData({...formData, branchId: v})} required>
                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {branches.map(b => {
                          const bId = b.id || b._id;
                          return <SelectItem key={bId} value={bId}>{b.name}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>Create Account</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Org Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading hierarchy...</div>
          ) : hierarchy ? (
            renderHierarchyTree()
          ) : (
            <div className="text-center py-8 text-slate-500">No hierarchy data available</div>
          )}
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Sub-Team</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">No team members found</TableCell></TableRow>
                ) : (
                  staff.map(member => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">{member.employeeId}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell><Badge className={roleColor(member.role)}>{formatRole(member.role)}</Badge></TableCell>
                      <TableCell>{member.position || '-'}</TableCell>
                      <TableCell>{member.sub_team || '-'}</TableCell>
                      <TableCell><Badge variant={member.isActive ? 'default' : 'destructive'}>{member.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
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

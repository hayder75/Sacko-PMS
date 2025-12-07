/**
 * Maps backend role names to frontend role names
 * Handles both old and new role formats from the backend
 */
export type UserRole = 
  | 'admin'
  | 'regionalDirector'
  | 'areaManager'
  | 'branchManager'
  | 'lineManager'
  | 'subTeamLeader'
  | 'staff';

export function mapBackendRoleToFrontend(backendRole: string): UserRole {
  if (!backendRole) return 'staff';

  const role = backendRole.trim();

  // Map old role names to new role names
  if (role === 'admin' || role === 'SAKO HQ / Admin' || role.toLowerCase().includes('admin')) {
    return 'admin';
  }
  
  if (role === 'regionalDirector' || role === 'Regional Director' || role === 'Regional Manager' || role.toLowerCase().includes('regional director') || role.toLowerCase().includes('regional manager')) {
    return 'regionalDirector';
  }
  
  if (role === 'areaManager' || role === 'Area Manager' || role.toLowerCase().includes('area manager')) {
    return 'areaManager';
  }
  
  if (role === 'branchManager' || role === 'Branch Manager' || role.toLowerCase().includes('branch manager')) {
    return 'branchManager';
  }
  
  if (role === 'lineManager' || role === 'Line Manager' || role === 'MSM' || role.toLowerCase().includes('line manager') || role.toLowerCase().includes('msm')) {
    return 'lineManager';
  }
  
  if (role === 'subTeamLeader' || role === 'Sub-Team Leader' || role === 'Accountant' || role === 'Auditor' || role.toLowerCase().includes('sub-team') || role.toLowerCase().includes('accountant') || role.toLowerCase().includes('auditor')) {
    return 'subTeamLeader';
  }
  
  if (role === 'staff' || role === 'Staff / MSO' || role === 'MSO' || role.toLowerCase().includes('staff') || role.toLowerCase().includes('mso')) {
    return 'staff';
  }

  // Default fallback
  return 'staff';
}


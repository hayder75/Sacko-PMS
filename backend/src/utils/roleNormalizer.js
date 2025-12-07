/**
 * Normalizes role names from old format to new format
 * Handles both 'Branch Manager' → 'branchManager' and 'branchManager' → 'branchManager'
 */
export function normalizeRole(role) {
  if (!role) return null;

  const roleMap = {
    // Old format → New format
    'SAKO HQ / Admin': 'admin',
    'Admin': 'admin',
    'admin': 'admin',
    'Regional Director': 'regionalDirector',
    'Regional Manager': 'regionalDirector',
    'regionalDirector': 'regionalDirector',
    'Area Manager': 'areaManager',
    'areaManager': 'areaManager',
    'Branch Manager': 'branchManager',
    'branchManager': 'branchManager',
    'Line Manager': 'lineManager',
    'MSM': 'lineManager',
    'lineManager': 'lineManager',
    'Sub-Team Leader': 'subTeamLeader',
    'Accountant': 'subTeamLeader',
    'Auditor': 'subTeamLeader',
    'subTeamLeader': 'subTeamLeader',
    'Staff / MSO': 'staff',
    'MSO': 'staff',
    'staff': 'staff',
  };

  // Try exact match first
  if (roleMap[role]) {
    return roleMap[role];
  }

  // Try case-insensitive match
  const lowerRole = role.toLowerCase().trim();
  for (const [key, value] of Object.entries(roleMap)) {
    if (key.toLowerCase() === lowerRole) {
      return value;
    }
  }

  // Default fallback
  return role;
}


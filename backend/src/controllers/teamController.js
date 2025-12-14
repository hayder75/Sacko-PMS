import { asyncHandler } from '../middleware/asyncHandler.js';
import Team from '../models/Team.js';
import SubTeam from '../models/SubTeam.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

// Helpers
const ensureBranchAccess = async (req, branchId) => {
  if (!branchId) return false;
  // Admin can access all; branch/line managers only their branch
  if (req.user.role === 'admin' || req.user.role === 'SAKO HQ / Admin') return true;
  if (req.user.branchId && req.user.branchId.toString() === branchId.toString()) return true;
  return false;
};

// @desc    Get all teams for a branch
// @route   GET /api/teams
// @access  Private (Branch Manager, Line Manager, Admin)
export const getTeams = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const targetBranchId = branchId || req.user.branchId;

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const teams = await Team.find({ branchId: targetBranchId, isActive: true })
    .populate('managerId', 'name email role position')
    .sort({ name: 1 });

  res.status(200).json({ success: true, count: teams.length, data: teams });
});

// @desc    Create team
// @route   POST /api/teams
// @access  Private (Branch Manager, Admin)
export const createTeam = asyncHandler(async (req, res) => {
  const { name, code, managerId, branchId } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const branch = await Branch.findById(targetBranchId);
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Branch not found' });
  }

  // Optional: validate managerId is lineManager in this branch
  if (managerId) {
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'lineManager') {
      return res.status(400).json({ success: false, message: 'Manager must be a Line Manager (MSM)' });
    }
  }

  const team = await Team.create({
    name,
    code,
    branchId: targetBranchId,
    managerId: managerId || undefined,
  });

  await logAudit(req.user._id, 'Team Created', 'Team', team._id, team.name, `Created team ${team.name}`, req);

  res.status(201).json({ success: true, message: 'Team created', data: team });
});

// @desc    Get sub-teams
// @route   GET /api/sub-teams
// @access  Private (Branch Manager, Line Manager, Admin)
export const getSubTeams = asyncHandler(async (req, res) => {
  const { teamId, branchId } = req.query;
  const targetBranchId = branchId || req.user.branchId;

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const query = { branchId: targetBranchId, isActive: true };
  if (teamId) query.teamId = teamId;

  const subTeams = await SubTeam.find(query)
    .populate('teamId', 'name code')
    .populate('leaderId', 'name email role position')
    .populate('members', 'name email role position')
    .sort({ name: 1 });

  res.status(200).json({ success: true, count: subTeams.length, data: subTeams });
});

// @desc    Create sub-team
// @route   POST /api/sub-teams
// @access  Private (Branch Manager, Admin)
export const createSubTeam = asyncHandler(async (req, res) => {
  const { name, code, teamId, branchId, leaderId, memberIds } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  if (!name || !code || !teamId) {
    return res.status(400).json({ success: false, message: 'Name, code, and teamId are required' });
  }

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const team = await Team.findById(teamId);
  if (!team || team.branchId.toString() !== targetBranchId.toString()) {
    return res.status(400).json({ success: false, message: 'Team not found in this branch' });
  }

  // Validate leader is Accountant
  if (leaderId) {
    const leader = await User.findById(leaderId);
    if (!leader || leader.position !== 'Accountant') {
      return res.status(400).json({ success: false, message: 'Leader must be an Accountant (Sub-Team Leader)' });
    }
  }

  // Validate members are staff
  let members = [];
  if (memberIds && memberIds.length > 0) {
    members = await User.find({ _id: { $in: memberIds }, role: 'staff' }).select('_id');
  }

  const subTeam = await SubTeam.create({
    name,
    code,
    teamId,
    branchId: targetBranchId,
    leaderId: leaderId || undefined,
    members: members.map(m => m._id),
  });

  await logAudit(req.user._id, 'SubTeam Created', 'SubTeam', subTeam._id, subTeam.name, `Created sub-team ${subTeam.name}`, req);

  res.status(201).json({ success: true, message: 'Sub-team created', data: subTeam });
});

// @desc    Update sub-team members/leader
// @route   PUT /api/sub-teams/:id
// @access  Private (Branch Manager, Admin)
export const updateSubTeam = asyncHandler(async (req, res) => {
  const subTeam = await SubTeam.findById(req.params.id);
  if (!subTeam) {
    return res.status(404).json({ success: false, message: 'Sub-team not found' });
  }

  if (!(await ensureBranchAccess(req, subTeam.branchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const { leaderId, memberIds, name, code } = req.body;

  // Validate leader
  if (leaderId) {
    const leader = await User.findById(leaderId);
    if (!leader || leader.position !== 'Accountant') {
      return res.status(400).json({ success: false, message: 'Leader must be an Accountant (Sub-Team Leader)' });
    }
  }

  // Validate members
  let members = undefined;
  if (memberIds) {
    members = await User.find({ _id: { $in: memberIds }, role: 'staff' }).select('_id');
  }

  if (name) subTeam.name = name;
  if (code) subTeam.code = code;
  if (leaderId !== undefined) subTeam.leaderId = leaderId || undefined;
  if (members !== undefined) subTeam.members = members.map(m => m._id);

  await subTeam.save();

  await logAudit(req.user._id, 'SubTeam Updated', 'SubTeam', subTeam._id, subTeam.name, `Updated sub-team ${subTeam.name}`, req);

  res.status(200).json({ success: true, message: 'Sub-team updated', data: subTeam });
});


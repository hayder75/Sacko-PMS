import { asyncHandler } from '../middleware/asyncHandler.js';
import prisma from '../config/database.js';
import { POSITION_MAP } from '../utils/prismaHelpers.js';
import { normalizeRole } from '../utils/roleNormalizer.js';

const ensureBranchAccess = async (req, branchId) => {
  if (!branchId) return false;
  const role = normalizeRole(req.user.role);
  if (role === 'admin') return true;
  if (req.user.branchId && req.user.branchId === branchId) return true;
  return false;
};

export const getTeams = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const targetBranchId = branchId || req.user.branchId;

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const teams = await prisma.team.findMany({
    where: { branchId: targetBranchId, isActive: true },
    include: {
      manager: { select: { id: true, name: true, email: true, role: true, position: true } },
    },
    orderBy: { name: 'asc' },
  });

  const mappedTeams = teams.map(team => ({
    ...team,
    _id: team.id,
    managerId: team.manager ? {
      ...team.manager,
      _id: team.manager.id,
      position: POSITION_MAP[team.manager.position] || team.manager.position
    } : null,
  }));

  res.status(200).json({ success: true, count: mappedTeams.length, data: mappedTeams });
});

export const createTeam = asyncHandler(async (req, res) => {
  const { name, code, managerId, branchId } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const branch = await prisma.branch.findUnique({ where: { id: targetBranchId } });
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Branch not found' });
  }

  if (managerId) {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager || normalizeRole(manager.role) !== 'supervisor') {
      return res.status(400).json({ success: false, message: 'Manager must be a Supervisor' });
    }
  }

  const team = await prisma.team.create({
    data: {
      name,
      code,
      branchId: targetBranchId,
      managerId: managerId || null,
    },
  });

  res.status(201).json({ success: true, message: 'Team created', data: { ...team, _id: team.id } });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await prisma.team.findUnique({ where: { id: req.params.id } });
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (!(await ensureBranchAccess(req, team.branchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await prisma.team.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.status(200).json({ success: true, message: 'Team deactivated' });
});

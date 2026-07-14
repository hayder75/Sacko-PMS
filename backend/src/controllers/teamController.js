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

export const getSubTeams = asyncHandler(async (req, res) => {
  const { teamId, branchId } = req.query;
  const targetBranchId = branchId || req.user.branchId;

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const where = { branchId: targetBranchId, isActive: true };
  if (teamId) where.teamId = teamId;

  const subTeams = await prisma.subTeam.findMany({
    where,
    include: {
      team: { select: { id: true, name: true, code: true } },
      leader: { select: { id: true, name: true, email: true, role: true, position: true } },
      members: { select: { id: true, name: true, email: true, role: true, position: true } },
    },
    orderBy: { name: 'asc' },
  });

  const mappedSubTeams = subTeams.map(subTeam => ({
    ...subTeam,
    _id: subTeam.id,
    teamId: subTeam.team ? { ...subTeam.team, _id: subTeam.team.id } : null,
    leaderId: subTeam.leader ? {
      ...subTeam.leader,
      _id: subTeam.leader.id,
      position: POSITION_MAP[subTeam.leader.position] || subTeam.leader.position
    } : null,
    members: subTeam.members.map(m => ({
      ...m,
      _id: m.id,
      position: POSITION_MAP[m.position] || m.position,
    })),
  }));

  res.status(200).json({ success: true, count: mappedSubTeams.length, data: mappedSubTeams });
});

export const createSubTeam = asyncHandler(async (req, res) => {
  const { name, code, teamId, branchId, leaderId, memberIds } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  if (!name || !code || !teamId) {
    return res.status(400).json({ success: false, message: 'Name, code, and teamId are required' });
  }

  if (!(await ensureBranchAccess(req, targetBranchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.branchId !== targetBranchId) {
    return res.status(400).json({ success: false, message: 'Team not found in this branch' });
  }

  if (leaderId) {
    const leader = await prisma.user.findUnique({ where: { id: leaderId } });
    if (!leader || normalizeRole(leader.role) !== 'staff') {
      return res.status(400).json({ success: false, message: 'Sub-team leader must be a staff member' });
    }
  }

  let memberConnections = undefined;
  if (memberIds && memberIds.length > 0) {
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds }, role: 'staff' },
      select: { id: true },
    });
    memberConnections = { connect: members.map(m => ({ id: m.id })) };
  }

  const subTeam = await prisma.subTeam.create({
    data: {
      name,
      code,
      teamId,
      branchId: targetBranchId,
      leaderId: leaderId || null,
      ...(memberConnections && { members: memberConnections }),
    },
  });

  res.status(201).json({ success: true, message: 'Sub-team created', data: { ...subTeam, _id: subTeam.id } });
});

export const updateSubTeam = asyncHandler(async (req, res) => {
  const subTeam = await prisma.subTeam.findUnique({ where: { id: req.params.id } });
  if (!subTeam) {
    return res.status(404).json({ success: false, message: 'Sub-team not found' });
  }

  if (!(await ensureBranchAccess(req, subTeam.branchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this branch' });
  }

  const { leaderId, memberIds, name, code } = req.body;
  const updateData = {};

  if (leaderId !== undefined) {
    if (leaderId) {
      const leader = await prisma.user.findUnique({ where: { id: leaderId } });
      if (!leader || normalizeRole(leader.role) !== 'staff') {
        return res.status(400).json({ success: false, message: 'Sub-team leader must be a staff member' });
      }
    }
    updateData.leaderId = leaderId || null;
  }

  if (memberIds !== undefined) {
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds }, role: 'staff' },
      select: { id: true },
    });
    updateData.members = { set: members.map(m => ({ id: m.id })) };
  }

  if (name) updateData.name = name;
  if (code) updateData.code = code;

  const updatedSubTeam = await prisma.subTeam.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.status(200).json({ success: true, message: 'Sub-team updated', data: { ...updatedSubTeam, _id: updatedSubTeam.id } });
});

export const deleteSubTeam = asyncHandler(async (req, res) => {
  const subTeam = await prisma.subTeam.findUnique({ where: { id: req.params.id } });
  if (!subTeam) return res.status(404).json({ success: false, message: 'Sub-team not found' });

  if (!(await ensureBranchAccess(req, subTeam.branchId))) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await prisma.subTeam.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.status(200).json({ success: true, message: 'Sub-team deactivated' });
});

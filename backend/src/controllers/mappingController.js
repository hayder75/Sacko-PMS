import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import XLSX from 'xlsx';
import fs from 'fs';
import { ACCOUNT_TYPE_TO_ENUM } from '../utils/prismaHelpers.js';

// @desc    Get all account mappings
// @route   GET /api/mappings
// @access  Private
export const getMappings = asyncHandler(async (req, res) => {
  const { branchId, mappedTo, status, accountNumber } = req.query;

  const where = {};

  if (req.user.role === 'staff') {
    where.mappedToId = req.user.id;
  } else if (branchId) {
    where.branchId = branchId;
  } else if (req.user.branchId) {
    where.branchId = req.user.branchId;
  }

  if (mappedTo) where.mappedToId = mappedTo;
  if (status) where.status = status;
  if (accountNumber) {
    where.accountNumber = { contains: accountNumber, mode: 'insensitive' };
  }

  const mappings = await prisma.accountMapping.findMany({
    where,
    include: {
      mappedTo: { select: { id: true, name: true, employeeId: true, role: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    count: mappings.length,
    data: mappings.map(m => ({
      ...m,
      _id: m.id,
      mappedTo: m.mappedTo ? { ...m.mappedTo, _id: m.mappedTo.id } : null,
      branchId: m.branch ? { ...m.branch, _id: m.branch.id } : null,
    })),
  });
});

// @desc    Create account mapping
// @route   POST /api/mappings
// @access  Private (Branch Manager, HQ Admin)
export const createMapping = asyncHandler(async (req, res) => {
  const accountType = ACCOUNT_TYPE_TO_ENUM[req.body.accountType] || req.body.accountType;

  const mapping = await prisma.accountMapping.create({
    data: {
      accountNumber: req.body.accountNumber,
      customerName: req.body.customerName,
      accountType: accountType || 'Savings',
      balance: parseFloat(req.body.balance || 0),
      june_balance: parseFloat(req.body.june_balance || 0),
      current_balance: parseFloat(req.body.current_balance || req.body.balance || 0),
      phoneNumber: req.body.phoneNumber || null,
      notes: req.body.notes || null,
      status: req.body.status || 'Active',
      mappedToId: req.body.mappedTo || req.body.mappedToId,
      mappedById: req.user.id,
      branchId: req.body.branchId || req.user.branchId,
    },
  });

  await logAudit(
    req.user.id,
    'Mapping Created',
    'Mapping',
    mapping.id,
    mapping.accountNumber,
    `Created mapping for account ${mapping.accountNumber}`,
    req
  );

  res.status(201).json({
    success: true,
    data: { ...mapping, _id: mapping.id },
  });
});

// @desc    Update account mapping
// @route   PUT /api/mappings/:id
// @access  Private (Branch Manager, HQ Admin)
export const updateMapping = asyncHandler(async (req, res) => {
  const existingMapping = await prisma.accountMapping.findUnique({
    where: { id: req.params.id }
  });

  if (!existingMapping) {
    return res.status(404).json({
      success: false,
      message: 'Mapping not found',
    });
  }

  const updateData = { ...req.body };
  if (updateData.accountType) updateData.accountType = ACCOUNT_TYPE_TO_ENUM[updateData.accountType] || updateData.accountType;
  if (updateData.mappedTo) {
    updateData.mappedToId = updateData.mappedTo;
    delete updateData.mappedTo;
  }
  if (updateData.branchId) {
    updateData.branchId = updateData.branchId;
  }

  const mapping = await prisma.accountMapping.update({
    where: { id: req.params.id },
    data: updateData,
  });

  await logAudit(
    req.user.id,
    'Mapping Updated',
    'Mapping',
    mapping.id,
    mapping.accountNumber,
    `Updated mapping for account ${mapping.accountNumber}`,
    req
  );

  res.status(200).json({
    success: true,
    data: { ...mapping, _id: mapping.id },
  });
});

// @desc    Auto-balance mapping
// @route   POST /api/mappings/auto-balance
// @access  Private (Branch Manager, HQ Admin)
export const autoBalanceMapping = asyncHandler(async (req, res) => {
  const { branchId } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  const unmappedAccounts = await prisma.accountMapping.findMany({
    where: {
      branchId: targetBranchId,
      status: 'Inactive', // Mapping status for unmapped in schema is status
    },
  });

  const staff = await prisma.user.findMany({
    where: {
      branchId: targetBranchId,
      role: 'staff',
      isActive: true,
    },
  });

  if (staff.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No active staff found in branch',
    });
  }

  const accountsPerStaff = Math.floor(unmappedAccounts.length / staff.length);
  let accountIndex = 0;
  let updateCount = 0;

  for (let i = 0; i < staff.length && accountIndex < unmappedAccounts.length; i++) {
    const endIndex = Math.min(accountIndex + accountsPerStaff, unmappedAccounts.length);

    for (let j = accountIndex; j < endIndex; j++) {
      await prisma.accountMapping.update({
        where: { id: unmappedAccounts[j].id },
        data: {
          mappedToId: staff[i].id,
          status: 'Active',
          isAutoBalanced: true,
          mappedById: req.user.id,
        }
      });
      updateCount++;
    }

    accountIndex = endIndex;
  }

  await logAudit(
    req.user.id,
    'Mapping Updated',
    'Mapping',
    null,
    'Auto-Balance',
    `Auto-balanced ${updateCount} accounts`,
    req
  );

  res.status(200).json({
    success: true,
    message: `Auto-balanced ${updateCount} accounts`,
    data: {
      accountsBalanced: updateCount,
      staffCount: staff.length,
    },
  });
});

// @desc    Bulk upload account mappings from Excel
// @route   POST /api/mappings/bulk-upload
// @access  Private (Branch Manager, HQ Admin)
export const bulkUploadMappings = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an Excel file',
    });
  }

  const targetBranchId = req.body.branchId || req.user.branchId;
  const branch = await prisma.branch.findUnique({ where: { id: targetBranchId } });
  if (!branch) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(404).json({
      success: false,
      message: 'Branch not found',
    });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid',
      });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const accountNumber = String(row.accountNumber || row['Account Number'] || '').trim();
        const customerName = String(row.customerName || row['Customer Name'] || '').trim();
        const balance = parseFloat(row.balance || row['Balance'] || row.current_balance || row['Current Balance'] || 0);
        const juneBalance = parseFloat(row.june_balance || row['June Balance'] || row.juneBalance || 0);
        const staffID = String(row.staffID || row['Staff ID'] || row.staffId || row.employeeId || '').trim();
        const phoneNumber = String(row.phoneNumber || row['Phone Number'] || '').trim();

        if (!accountNumber || !customerName || !staffID) {
          results.errors.push({ row: i + 2, error: 'Account Number, Customer Name, and Staff ID are required' });
          continue;
        }

        const staffMember = await prisma.user.findFirst({
          where: {
            employeeId: staffID,
            branchId: targetBranchId,
            isActive: true,
          }
        });

        if (!staffMember) {
          results.errors.push({ row: i + 2, error: `Staff with ID '${staffID}' not found in branch` });
          continue;
        }

        const existingMapping = await prisma.accountMapping.findUnique({ where: { accountNumber } });

        if (existingMapping) {
          await prisma.accountMapping.update({
            where: { id: existingMapping.id },
            data: {
              customerName,
              balance,
              current_balance: balance,
              june_balance: juneBalance,
              mappedToId: staffMember.id,
              branchId: targetBranchId,
              mappedById: req.user.id,
              phoneNumber: phoneNumber || undefined,
              status: 'Active',
            }
          });
          results.updated++;
        } else {
          await prisma.accountMapping.create({
            data: {
              accountNumber,
              customerName,
              accountType: 'Savings',
              balance,
              current_balance: balance,
              june_balance: juneBalance,
              mappedToId: staffMember.id,
              branchId: targetBranchId,
              mappedById: req.user.id,
              phoneNumber: phoneNumber || undefined,
              status: 'Active',
            }
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    await logAudit(
      req.user.id,
      'Bulk Mapping Upload',
      'Mapping',
      null,
      'Bulk Upload',
      `Processed mappings: ${results.created} created, ${results.updated} updated`,
      req
    );

    res.status(200).json({
      success: true,
      message: `Bulk upload completed`,
      data: results,
    });
  } catch (error) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: error.message });
  }
});

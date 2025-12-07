import AccountMapping from '../models/AccountMapping.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all account mappings
// @route   GET /api/mappings
// @access  Private
export const getMappings = asyncHandler(async (req, res) => {
  const { branchId, mappedTo, status, accountNumber } = req.query;
  
  const query = {};
  
  // Role-based filtering
  if (req.user.role === 'Staff / MSO') {
    query.mappedTo = req.user._id;
  } else if (branchId) {
    query.branchId = branchId;
  } else if (req.user.branchId) {
    query.branchId = req.user.branchId;
  }

  if (mappedTo) query.mappedTo = mappedTo;
  if (status) query.status = status;
  if (accountNumber) query.accountNumber = { $regex: accountNumber, $options: 'i' };

  const mappings = await AccountMapping.find(query)
    .populate('mappedTo', 'name employeeId role')
    .populate('branchId', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: mappings.length,
    data: mappings,
  });
});

// @desc    Create account mapping
// @route   POST /api/mappings
// @access  Private (Branch Manager, HQ Admin)
export const createMapping = asyncHandler(async (req, res) => {
  const mapping = await AccountMapping.create({
    ...req.body,
    mappedBy: req.user._id,
    branchId: req.body.branchId || req.user.branchId,
  });

  await logAudit(
    req.user._id,
    'Mapping Created',
    'Mapping',
    mapping._id,
    mapping.accountNumber,
    `Created mapping for account ${mapping.accountNumber}`,
    req
  );

  res.status(201).json({
    success: true,
    data: mapping,
  });
});

// @desc    Update account mapping
// @route   PUT /api/mappings/:id
// @access  Private (Branch Manager, HQ Admin)
export const updateMapping = asyncHandler(async (req, res) => {
  let mapping = await AccountMapping.findById(req.params.id);

  if (!mapping) {
    return res.status(404).json({
      success: false,
      message: 'Mapping not found',
    });
  }

  mapping = await AccountMapping.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(
    req.user._id,
    'Mapping Updated',
    'Mapping',
    mapping._id,
    mapping.accountNumber,
    `Updated mapping for account ${mapping.accountNumber}`,
    req
  );

  res.status(200).json({
    success: true,
    data: mapping,
  });
});

// @desc    Auto-balance mapping
// @route   POST /api/mappings/auto-balance
// @access  Private (Branch Manager, HQ Admin)
export const autoBalanceMapping = asyncHandler(async (req, res) => {
  const { branchId } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  // Get all unmapped accounts in branch
  const unmappedAccounts = await AccountMapping.find({
    branchId: targetBranchId,
    status: 'Unmapped',
  });

  // Get all active staff in branch
  const staff = await User.find({
    branchId: targetBranchId,
    role: 'Staff / MSO',
    isActive: true,
  });

  if (staff.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No active staff found in branch',
    });
  }

  // Distribute accounts evenly
  const accountsPerStaff = Math.floor(unmappedAccounts.length / staff.length);
  let accountIndex = 0;

  for (let i = 0; i < staff.length && accountIndex < unmappedAccounts.length; i++) {
    const endIndex = Math.min(accountIndex + accountsPerStaff, unmappedAccounts.length);
    
    for (let j = accountIndex; j < endIndex; j++) {
      unmappedAccounts[j].mappedTo = staff[i]._id;
      unmappedAccounts[j].status = 'Active';
      unmappedAccounts[j].isAutoBalanced = true;
      unmappedAccounts[j].mappedBy = req.user._id;
      await unmappedAccounts[j].save();
    }
    
    accountIndex = endIndex;
  }

  await logAudit(
    req.user._id,
    'Mapping Updated',
    'Mapping',
    null,
    'Auto-Balance',
    `Auto-balanced ${unmappedAccounts.length} accounts`,
    req
  );

  res.status(200).json({
    success: true,
    message: `Auto-balanced ${unmappedAccounts.length} accounts`,
    data: {
      accountsBalanced: unmappedAccounts.length,
      staffCount: staff.length,
    },
  });
});


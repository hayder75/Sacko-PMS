import CBSValidation from '../models/CBSValidation.js';
import DailyTask from '../models/DailyTask.js';
import AccountMapping from '../models/AccountMapping.js';
import JuneBalance from '../models/JuneBalance.js';
import ProductKpiMapping from '../models/ProductKpiMapping.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import XLSX from 'xlsx';
import fs from 'fs';

// Helper: Update account balances and active status from CBS data
const updateAccountBalances = async (cbsData, branch_code, validationDate) => {
  const validationDateObj = new Date(validationDate);
  const fifteenDaysAgo = new Date(validationDateObj);
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  let updated = 0;
  let created = 0;

  for (const record of cbsData) {
    const accountNumber = record.accountNumber || record['Account Number'] || record.account_id;
    const currentBalance = parseFloat(record.balance || record.Balance || record.current_balance || 0);
    const transactionDate = record.transactionDate || record['Transaction Date'] || validationDate;

    if (!accountNumber) continue;

    // Update or create account mapping
    const accountMapping = await AccountMapping.findOneAndUpdate(
      { accountNumber: String(accountNumber) },
      {
        accountNumber: String(accountNumber),
        current_balance: currentBalance,
        last_transaction_date: new Date(transactionDate),
        active_status: new Date(transactionDate) >= fifteenDaysAgo,
        branchId: branch_code, // Will need ObjectId conversion if needed
      },
      { upsert: true, new: true }
    );

    // Get active baseline balance if exists
    const juneBalance = await JuneBalance.findOne({
      $or: [
        { account_id: accountNumber },
        { accountNumber: accountNumber },
      ],
      is_active: true, // Use active baseline
    });

    if (juneBalance && !accountMapping.june_balance) {
      accountMapping.june_balance = juneBalance.june_balance;
      await accountMapping.save();
    }

    if (accountMapping.isNew) {
      created++;
    } else {
      updated++;
    }
  }

  return { updated, created };
};

// Helper: Detect unmapped products from CBS data
const detectUnmappedProducts = async (cbsData) => {
  // Get all unique product names from CBS
  const productMap = new Map();

  for (const record of cbsData) {
    const productName = record.product || record.Product || record.productName || record['Product Name'];
    const accountNumber = record.accountNumber || record['Account Number'] || record.account_id;
    const balance = parseFloat(record.balance || record.Balance || record.current_balance || 0);

    if (!productName || !accountNumber) continue;

    if (!productMap.has(productName)) {
      productMap.set(productName, {
        productName: String(productName).trim(),
        accountCount: 0,
        totalBalance: 0,
        accounts: new Set(),
      });
    }

    const productData = productMap.get(productName);
    if (!productData.accounts.has(accountNumber)) {
      productData.accountCount++;
      productData.totalBalance += balance;
      productData.accounts.add(accountNumber);
    }
  }

  // Get all mapped products
  const mappedProducts = await ProductKpiMapping.find({
    status: 'active',
  }).select('cbs_product_name');

  const mappedProductNames = new Set(
    mappedProducts.map(p => p.cbs_product_name.trim())
  );

  // Find unmapped products
  const unmappedProducts = [];
  for (const [productName, data] of productMap) {
    if (!mappedProductNames.has(productName.trim())) {
      unmappedProducts.push({
        productName: data.productName,
        accountCount: data.accountCount,
        totalBalance: data.totalBalance,
        firstSeenAt: new Date(),
      });
    }
  }

  return unmappedProducts;
};

// Helper: Auto-map new accounts ≥ 500 ETB to task creators
const autoMapNewAccounts = async (cbsData, branch_code, validationDate) => {
  const validationDateObj = new Date(validationDate);
  const mapped = [];

  for (const record of cbsData) {
    const accountNumber = record.accountNumber || record['Account Number'] || record.account_id;
    const currentBalance = parseFloat(record.balance || record.Balance || record.current_balance || 0);

    if (!accountNumber || currentBalance < 500) continue;

    // Check if already mapped
    const existingMapping = await AccountMapping.findOne({ accountNumber: String(accountNumber) });
    if (existingMapping && existingMapping.mappedTo) continue;

    // Find pending task for this account in same branch
    const pendingTask = await DailyTask.findOne({
      accountNumber: String(accountNumber),
      branch_code,
      approvalStatus: 'Approved',
      mappingStatus: 'Unmapped',
      taskDate: {
        $gte: new Date(validationDateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(validationDateObj.setHours(23, 59, 59, 999)),
      },
    }).populate('submittedBy', 'sub_team');

    if (pendingTask && pendingTask.submittedBy) {
      // Auto-map to task creator
      await AccountMapping.findOneAndUpdate(
        { accountNumber: String(accountNumber) },
        {
          mappedTo: pendingTask.submittedBy._id,
          mappedBy: pendingTask.submittedBy._id,
          mappedAt: new Date(),
          status: 'Active',
        },
        { upsert: true }
      );

      // Update task mapping status
      pendingTask.mappingStatus = 'Mapped to You';
      await pendingTask.save();

      mapped.push({
        accountNumber,
        mappedTo: pendingTask.submittedBy._id,
        taskId: pendingTask._id,
      });
    }
  }

  return mapped;
};

// Helper: Validate CBS data against PMS tasks
const validateCBS = async (cbsData, branch_code, validationDate, validationId) => {
  const date = new Date(validationDate);
  const startDate = new Date(date.setHours(0, 0, 0, 0));
  const endDate = new Date(date.setHours(23, 59, 59, 999));

  // Get all approved tasks for the date
  const tasks = await DailyTask.find({
    branch_code,
    taskDate: { $gte: startDate, $lt: endDate },
    approvalStatus: 'Approved',
  });

  const discrepancies = [];
  let matchedRecords = 0;
  let unmatchedRecords = 0;

  // Match CBS records with tasks
  for (const cbsRecord of cbsData) {
    const accountNumber = cbsRecord.accountNumber || cbsRecord['Account Number'] || cbsRecord.account_id;
    const cbsAmount = parseFloat(cbsRecord.amount || cbsRecord.Amount || 0);

    if (!accountNumber) continue;

    const matchingTask = tasks.find(
      t => t.accountNumber === String(accountNumber) && Math.abs(t.amount - cbsAmount) < 0.01
    );

    if (matchingTask) {
      matchedRecords++;
      // Mark task as CBS validated
      matchingTask.cbsValidated = true;
      matchingTask.cbsValidatedAt = new Date();
      matchingTask.cbsValidationId = validationId;
      await matchingTask.save();
    } else {
      unmatchedRecords++;
      // Find task with same account but different amount
      const taskWithAccount = tasks.find(t => t.accountNumber === String(accountNumber));
      
      if (taskWithAccount) {
        discrepancies.push({
          accountNumber,
          taskId: taskWithAccount._id,
          cbsAmount,
          pmsAmount: taskWithAccount.amount,
          difference: Math.abs(cbsAmount - taskWithAccount.amount),
          type: 'Amount Mismatch',
          resolved: false,
        });
      } else {
        discrepancies.push({
          accountNumber,
          cbsAmount,
          pmsAmount: 0,
          difference: cbsAmount,
          type: 'Missing in PMS',
          resolved: false,
        });
      }
    }
  }

  // Check for tasks not in CBS
  for (const task of tasks) {
    if (!task.cbsValidated) {
      const cbsRecord = cbsData.find(
        r => {
          const cbsAccount = r.accountNumber || r['Account Number'] || r.account_id;
          return cbsAccount && String(cbsAccount) === task.accountNumber;
        }
      );
      
      if (!cbsRecord) {
        discrepancies.push({
          accountNumber: task.accountNumber,
          taskId: task._id,
          cbsAmount: 0,
          pmsAmount: task.amount,
          difference: task.amount,
          type: 'Missing in CBS',
          resolved: false,
        });
      }
    }
  }

  return {
    totalRecords: cbsData.length,
    matchedRecords,
    unmatchedRecords,
    discrepancies,
  };
};

// @desc    Upload CBS file and validate
// @route   POST /api/cbs/upload
// @access  Private (Manager+)
export const uploadCBS = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a CBS file',
    });
  }

  const { branch_code, validationDate } = req.body;
  const targetBranchCode = branch_code || req.user.branch_code;

  if (!targetBranchCode) {
    return res.status(400).json({
      success: false,
      message: 'branch_code is required',
    });
  }

  try {
    // Parse CBS file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const cbsData = XLSX.utils.sheet_to_json(worksheet);

    if (!cbsData || cbsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid',
      });
    }

    // Create validation record
    const validation = await CBSValidation.create({
      branchId: req.user.branchId,
      validationDate: validationDate || new Date(),
      fileName: req.file.filename,
      filePath: req.file.path,
      uploadedBy: req.user._id,
      status: 'Processing',
    });

    // Step 1: Detect unmapped products
    const unmappedProducts = await detectUnmappedProducts(cbsData);

    // Step 2: Update account balances and active status
    const balanceUpdate = await updateAccountBalances(cbsData, targetBranchCode, validationDate || new Date());

    // Step 3: Auto-map new accounts ≥ 500 ETB
    const autoMapped = await autoMapNewAccounts(cbsData, targetBranchCode, validationDate || new Date());

    // Step 4: Validate against PMS tasks
    const validationResult = await validateCBS(cbsData, targetBranchCode, validationDate || new Date(), validation._id);

    // Update validation record
    validation.totalRecords = validationResult.totalRecords;
    validation.matchedRecords = validationResult.matchedRecords;
    validation.unmatchedRecords = validationResult.unmatchedRecords;
    validation.discrepancyCount = validationResult.discrepancies.length;
    validation.discrepancies = validationResult.discrepancies;
    validation.unmappedProducts = unmappedProducts;
    validation.status = (validationResult.discrepancies.length > 0 || unmappedProducts.length > 0) ? 'Partial' : 'Completed';
    validation.validatedAt = new Date();
    validation.validationRate = validationResult.totalRecords > 0 
      ? (validationResult.matchedRecords / validationResult.totalRecords) * 100 
      : 0;

    await validation.save();

    // Delete uploaded file after processing
    fs.unlinkSync(req.file.path);

    await logAudit(
      req.user._id,
      'CBS Upload',
      'CBS',
      validation._id,
      `CBS Validation ${validationDate || new Date()}`,
      `Uploaded and validated CBS file. Updated ${balanceUpdate.updated} accounts, created ${balanceUpdate.created}, auto-mapped ${autoMapped.length}`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'CBS file processed successfully',
      data: {
        validation,
        balanceUpdate,
        autoMapped: autoMapped.length,
        validationResult,
        unmappedProducts: unmappedProducts.length > 0 ? {
          count: unmappedProducts.length,
          products: unmappedProducts.map(p => ({
            productName: p.productName,
            accountCount: p.accountCount,
            totalBalance: p.totalBalance,
          })),
          warning: unmappedProducts.length > 0 
            ? `⚠️ ${unmappedProducts.length} unmapped product(s) found. Please map them in Product Mapping page.`
            : null,
        } : null,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Get CBS validations
// @route   GET /api/cbs
// @access  Private
export const getCBSValidations = asyncHandler(async (req, res) => {
  const { branchId, status, validationDate } = req.query;
  
  const query = {};
  
  if (branchId) query.branchId = branchId;
  else if (req.user.branchId && req.user.role !== 'admin') {
    query.branchId = req.user.branchId;
  }

  if (status) query.status = status;
  if (validationDate) {
    const date = new Date(validationDate);
    query.validationDate = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    };
  }

  const validations = await CBSValidation.find(query)
    .populate('branchId', 'name code')
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: validations.length,
    data: validations,
  });
});

// @desc    Resolve discrepancy
// @route   PUT /api/cbs/:id/resolve/:discrepancyId
// @access  Private
export const resolveDiscrepancy = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  
  const validation = await CBSValidation.findById(req.params.id);

  if (!validation) {
    return res.status(404).json({
      success: false,
      message: 'Validation not found',
    });
  }

  const discrepancy = validation.discrepancies.id(req.params.discrepancyId);
  if (!discrepancy) {
    return res.status(404).json({
      success: false,
      message: 'Discrepancy not found',
    });
  }

  discrepancy.resolved = true;
  discrepancy.resolvedBy = req.user._id;
  discrepancy.resolvedAt = new Date();
  discrepancy.resolutionNotes = resolutionNotes;

  await validation.save();

  res.status(200).json({
    success: true,
    data: validation,
  });
});

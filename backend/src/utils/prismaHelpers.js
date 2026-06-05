import bcrypt from 'bcryptjs';

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} enteredPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (enteredPassword, hashedPassword) => {
    return bcrypt.compare(enteredPassword, hashedPassword);
};

/**
 * Position enum values mapping (Prisma enum to display string)
 */
export const POSITION_MAP = {
    'Regional_Director': 'Regional Director',
    'Area_Manager': 'Area Manager',
    'Branch_Manager': 'Branch Manager',
    'Member_Service_Manager': 'Member Service Manager (MSM)',
    'Accountant': 'Accountant',
    'Member_Service_Officer_I': 'Member Service Officer I',
    'Member_Service_Officer_II': 'Member Service Officer II',
    'Member_Service_Officer_III': 'Member Service Officer III',
};

/**
 * Position string to enum value mapping
 */
export const POSITION_TO_ENUM = {
    'Regional Director': 'Regional_Director',
    'Area Manager': 'Area_Manager',
    'Branch Manager': 'Branch_Manager',
    'Member Service Manager (MSM)': 'Member_Service_Manager',
    'Accountant': 'Accountant',
    'Member Service Officer I': 'Member_Service_Officer_I',
    'Member Service Officer II': 'Member_Service_Officer_II',
    'Member Service Officer III': 'Member_Service_Officer_III',
};

/**
 * KPI Category mapping
 */
export const KPI_CATEGORY_MAP = {
    'Deposit_Mobilization': 'Deposit Mobilization',
    'Digital_Channel_Growth': 'Digital Channel Growth',
    'Member_Registration': 'Member Registration',
    'Shareholder_Recruitment': 'Shareholder Recruitment',
    'Loan_NPL': 'Loan & NPL',
    'Customer_Base': 'Customer Base',
};

export const KPI_CATEGORY_TO_ENUM = {
    'Deposit Mobilization': 'Deposit_Mobilization',
    'Digital Channel Growth': 'Digital_Channel_Growth',
    'Member Registration': 'Member_Registration',
    'Shareholder Recruitment': 'Shareholder_Recruitment',
    'Loan & NPL': 'Loan_NPL',
    'Customer Base': 'Customer_Base',
};

/**
 * Task Type mapping
 */
export const TASK_TYPE_TO_ENUM = {
    'Deposit Mobilization': 'Deposit_Mobilization',
    'Loan Follow-up': 'Loan_Follow_up',
    'New Customer': 'New_Customer',
    'Digital Activation': 'Digital_Activation',
    'Member Registration': 'Member_Registration',
    'Shareholder Recruitment': 'Shareholder_Recruitment',
};

export const TASK_TYPE_MAP = {
    'Deposit_Mobilization': 'Deposit Mobilization',
    'Loan_Follow_up': 'Loan Follow-up',
    'New_Customer': 'New Customer',
    'Digital_Activation': 'Digital Activation',
    'Member_Registration': 'Member Registration',
    'Shareholder_Recruitment': 'Shareholder Recruitment',
};

/**
 * Account Type mapping
 */
export const ACCOUNT_TYPE_TO_ENUM = {
    'Savings': 'Savings',
    'Current': 'Current',
    'Fixed Deposit': 'Fixed_Deposit',
    'Recurring Deposit': 'Recurring_Deposit',
    'Loan': 'Loan',
};

export const ACCOUNT_TYPE_MAP = {
    'Savings': 'Savings',
    'Current': 'Current',
    'Fixed_Deposit': 'Fixed Deposit',
    'Recurring_Deposit': 'Recurring Deposit',
    'Loan': 'Loan',
};

/**
 * Mapping Status
 */
export const MAPPING_STATUS_TO_ENUM = {
    'Mapped to You': 'Mapped_to_You',
    'Mapped to Another Staff': 'Mapped_to_Another_Staff',
    'Unmapped': 'Unmapped',
};

export const MAPPING_STATUS_MAP = {
    'Mapped_to_You': 'Mapped to You',
    'Mapped_to_Another_Staff': 'Mapped to Another Staff',
    'Unmapped': 'Unmapped',
};

/**
 * Approval Status
 */
export const APPROVAL_STATUS_TO_ENUM = {
    'Pending': 'Pending',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Requested Edit': 'Requested_Edit',
};

export const APPROVAL_STATUS_MAP = {
    'Pending': 'Pending',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Requested_Edit': 'Requested Edit',
};

/**
 * Audit Action mapping
 */
export const AUDIT_ACTION_TO_ENUM = {
    'Plan Upload': 'Plan_Upload',
    'Plan Update': 'Plan_Update',
    'User Created': 'User_Created',
    'User Updated': 'User_Updated',
    'User Deleted': 'User_Deleted',
    'Mapping Updated': 'Mapping_Updated',
    'Mapping Created': 'Mapping_Created',
    'Task Created': 'Task_Created',
    'Task Approved': 'Task_Approved',
    'Task Rejected': 'Task_Rejected',
    'Approval': 'Approval',
    'KPI Framework Updated': 'KPI_Framework_Updated',
    'Competency Framework Updated': 'Competency_Framework_Updated',
    'CBS Upload': 'CBS_Upload',
    'CBS Validation': 'CBS_Validation',
    'Behavioral Evaluation': 'Behavioral_Evaluation',
    'Password Reset': 'Password_Reset',
    'Login': 'Login',
    'Logout': 'Logout',
};

/**
 * Discrepancy Type mapping
 */
export const DISCREPANCY_TYPE_TO_ENUM = {
    'Amount Mismatch': 'Amount_Mismatch',
    'Missing in CBS': 'Missing_in_CBS',
    'Missing in PMS': 'Missing_in_PMS',
    'Account Mismatch': 'Account_Mismatch',
};

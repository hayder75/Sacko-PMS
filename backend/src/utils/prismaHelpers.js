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
    'CEO': 'CEO',
    'Area_Manager': 'Area Manager',
    'Branch_Manager': 'Branch Manager',
    'Operation_Supervisor': 'Operation Supervisor',
    'Customer_Service_Officer_I': 'Customer Service Officer I',
    'Customer_Service_Officer_II': 'Customer Service Officer II',
    'Customer_Relationship_Supervisor': 'Customer Relationship Supervisor',
    'Sales_Marketing_Officer_I': 'Sales & Marketing Officer I',
    'Customer_Relationship_Officer_I': 'Customer Relationship Officer I',
    'Internal_Auditor': 'Internal Auditor',
};

/**
 * Position string to enum value mapping
 */
export const POSITION_TO_ENUM = {
    'CEO': 'CEO',
    'Area Manager': 'Area_Manager',
    'Branch Manager': 'Branch_Manager',
    'Operation Supervisor': 'Operation_Supervisor',
    'Customer Service Officer I': 'Customer_Service_Officer_I',
    'Customer Service Officer II': 'Customer_Service_Officer_II',
    'Customer Relationship Supervisor': 'Customer_Relationship_Supervisor',
    'Sales & Marketing Officer I': 'Sales_Marketing_Officer_I',
    'Customer Relationship Officer I': 'Customer_Relationship_Officer_I',
    'Internal Auditor': 'Internal_Auditor',
};

/**
 * KPI Category mapping
 */
export const KPI_CATEGORY_MAP = {
    'Deposit_Mobilization': 'Deposit Mobilization',
    'Digital_Channel_Growth': 'Digital Channel Growth',
    'New_Member_Registration': 'New Member Registration',
    'Share_Capital_Growth': 'Share Capital Growth',
    'Account_Productivity': 'Account Productivity',
    'New_Account_Opening': 'New Account Opening',
    'Mobile_Banking_Users': 'Mobile Banking Users',
    'Merchant_POS_Growth': 'Merchant POS Growth',
    'Billers_Recruitment': 'Billers Recruitment',
    'Internal_Operations': 'Internal Operations',
};

export const KPI_CATEGORY_TO_ENUM = {
    'Deposit Mobilization': 'Deposit_Mobilization',
    'Digital Channel Growth': 'Digital_Channel_Growth',
    'New Member Registration': 'New_Member_Registration',
    'Share Capital Growth': 'Share_Capital_Growth',
    'Account Productivity': 'Account_Productivity',
    'New Account Opening': 'New_Account_Opening',
    'Mobile Banking Users': 'Mobile_Banking_Users',
    'Merchant POS Growth': 'Merchant_POS_Growth',
    'Billers Recruitment': 'Billers_Recruitment',
    'Internal Operations': 'Internal_Operations',
};

/**
 * Task Type mapping (Ghion SACCOS)
 * Maps display names and legacy names to new enum values
 */
export const TASK_TYPE_TO_ENUM = {
    'Deposit Mobilization': 'Deposit_Mobilization',
    'Loan Follow-up': 'Deposit_Mobilization',
    'New Customer': 'New_Member_Registration',
    'New Member Registration': 'New_Member_Registration',
    'Digital Activation': 'Mobile_Banking_Activation',
    'Mobile Banking Activation': 'Mobile_Banking_Activation',
    'Member Registration': 'New_Member_Registration',
    'Shareholder Recruitment': 'Share_Capital',
    'Share Capital': 'Share_Capital',
    'Account Productivity': 'Account_Productivity',
    'Account Productivity Improvement': 'Account_Productivity',
    'New Account Opening': 'New_Account_Opening',
    'Merchant POS Activation': 'Merchant_POS_Activation',
    'Biller Recruitment': 'Biller_Recruitment',
    'Transaction Processing': 'Transaction_Processing',
    'SMS Alert Configuration': 'SMS_Alert_Config',
    'Complaint Resolution': 'Complaint_Resolution',
};

export const TASK_TYPE_MAP = {
    'Deposit_Mobilization': 'Deposit Mobilization',
    'New_Member_Registration': 'New Member Registration',
    'Mobile_Banking_Activation': 'Mobile Banking Activation',
    'Share_Capital': 'Share Capital',
    'Account_Productivity': 'Account Productivity',
    'New_Account_Opening': 'New Account Opening',
    'Merchant_POS_Activation': 'Merchant POS Activation',
    'Biller_Recruitment': 'Biller Recruitment',
    'Transaction_Processing': 'Transaction Processing',
    'SMS_Alert_Config': 'SMS Alert Configuration',
    'Complaint_Resolution': 'Complaint Resolution',
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

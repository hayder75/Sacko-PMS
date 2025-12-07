const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
  
  register: async (userData: any) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  getMe: async () => {
    return apiRequest('/auth/me');
  },
  
  updateDetails: async (details: any) => {
    return apiRequest('/auth/updatedetails', {
      method: 'PUT',
      body: JSON.stringify(details),
    });
  },
  
  updatePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Users API
export const usersAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/users${queryString}`);
  },
  
  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },
  
  create: async (userData: any) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  update: async (id: string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  resetPassword: async (id: string, newPassword: string) => {
    return apiRequest(`/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },
};

// Plans API
export const plansAPI = {
  create: async (planData: any) => {
    return apiRequest('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },
  
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('planFile', file);

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/plans/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },
  
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/plans${queryString}`);
  },
  
  getById: async (id: string) => {
    return apiRequest(`/plans/${id}`);
  },
  
  update: async (id: string, planData: any) => {
    return apiRequest(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  },
};

// Staff Plans API
export const staffPlansAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/staff-plans${queryString}`);
  },
  
  getByUser: async (userId: string, period: string) => {
    return apiRequest(`/staff-plans?userId=${userId}&period=${period}`);
  },
};

// Tasks API
export const tasksAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/tasks${queryString}`);
  },
  
  getById: async (id: string) => {
    return apiRequest(`/tasks/${id}`);
  },
  
  create: async (taskData: any) => {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },
  
  approve: async (id: string, status: string, comments?: string) => {
    return apiRequest(`/tasks/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments }),
    });
  },
};

// Mappings API
export const mappingsAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/mappings${queryString}`);
  },
  
  create: async (mappingData: any) => {
    return apiRequest('/mappings', {
      method: 'POST',
      body: JSON.stringify(mappingData),
    });
  },
  
  update: async (id: string, mappingData: any) => {
    return apiRequest(`/mappings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappingData),
    });
  },
  
  autoBalance: async (branchId: string) => {
    return apiRequest('/mappings/auto-balance', {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    });
  },
};

// Performance API
export const performanceAPI = {
  calculate: async (userId: string, period: string) => {
    return apiRequest('/performance/calculate', {
      method: 'POST',
      body: JSON.stringify({ userId, period }),
    });
  },
  
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/performance${queryString}`);
  },
  
  getById: async (id: string) => {
    return apiRequest(`/performance/${id}`);
  },
};

// Behavioral API
export const behavioralAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/behavioral${queryString}`);
  },
  
  create: async (evaluationData: any) => {
    return apiRequest('/behavioral', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  },
  
  approve: async (id: string, status: string, comments?: string) => {
    return apiRequest(`/behavioral/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments }),
    });
  },
};

// CBS API
export const cbsAPI = {
  upload: async (file: File, branch_code: string, validationDate: string) => {
    const formData = new FormData();
    formData.append('cbsFile', file);
    formData.append('branch_code', branch_code);
    formData.append('validationDate', validationDate);

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/cbs/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },
  
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/cbs${queryString}`);
  },
  
  resolveDiscrepancy: async (validationId: string, discrepancyId: string, notes: string) => {
    return apiRequest(`/cbs/${validationId}/resolve/${discrepancyId}`, {
      method: 'PUT',
      body: JSON.stringify({ resolutionNotes: notes }),
    });
  },
};

// June Balance API
export const juneBalanceAPI = {
  import: async (file: File, baseline_period: string, baseline_date: string, make_active: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('baseline_period', baseline_period);
    formData.append('baseline_date', baseline_date);
    formData.append('make_active', make_active.toString());

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/june-balance/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Import failed' }));
      throw new Error(error.message || 'Import failed');
    }

    return response.json();
  },
  
  getPeriods: async () => {
    return apiRequest('/june-balance/periods/list');
  },
  
  activatePeriod: async (period: string) => {
    return apiRequest(`/june-balance/periods/${period}/activate`, {
      method: 'PUT',
    });
  },
  
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/june-balance${queryString}`);
  },
  
  getByAccount: async (accountId: string) => {
    return apiRequest(`/june-balance/${accountId}`);
  },
};

// Plan Share Config API
export const planShareConfigAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/plan-share-config${queryString}`);
  },
  
  getById: async (id: string) => {
    return apiRequest(`/plan-share-config/${id}`);
  },
  
  create: async (configData: any) => {
    return apiRequest('/plan-share-config', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  },
  
  update: async (id: string, configData: any) => {
    return apiRequest(`/plan-share-config/${id}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/plan-share-config/${id}`, {
      method: 'DELETE',
    });
  },
};

// Product KPI Mapping API
export const productMappingAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/product-mappings${queryString}`);
  },
  
  getUnmapped: async () => {
    return apiRequest('/product-mappings/unmapped');
  },
  
  create: async (mappingData: any) => {
    return apiRequest('/product-mappings', {
      method: 'POST',
      body: JSON.stringify(mappingData),
    });
  },
  
  bulkCreate: async (mappings: any[]) => {
    return apiRequest('/product-mappings/bulk', {
      method: 'POST',
      body: JSON.stringify({ mappings }),
    });
  },
  
  delete: async (id: string) => {
    return apiRequest(`/product-mappings/${id}`, {
      method: 'DELETE',
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getHQ: async () => {
    return apiRequest('/dashboard/hq');
  },
  getRegional: async () => {
    return apiRequest('/dashboard/regional');
  },
  getArea: async () => {
    return apiRequest('/dashboard/area');
  },
  getBranch: async () => {
    return apiRequest('/dashboard/branch');
  },
  
  getStaff: async () => {
    return apiRequest('/dashboard/staff');
  },
};

// Audit API
export const auditAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/audit${queryString}`);
  },
  
  getById: async (id: string) => {
    return apiRequest(`/audit/${id}`);
  },
};


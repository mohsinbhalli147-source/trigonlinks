import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trigonlink.pakdata.net/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with automatic token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('API Error:', message);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Use axios directly to avoid interceptor loop
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        // Clear storage and redirect to login only if refresh fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  get: async (url: string, params?: any) => {
    try {
      const response = await api.get(url, { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  post: async (url: string, data?: any) => {
    try {
      const response = await api.post(url, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  put: async (url: string, data?: any) => {
    try {
      const response = await api.put(url, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  delete: async (url: string) => {
    try {
      const response = await api.delete(url);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
};

// Specific API endpoints
export const authApi = {
  login: (email: string, password: string) => apiService.post('/api/auth/login', { email, password }),
  customerLogin: (username: string, cnic: string) => apiService.post('/api/auth/customer-login', { username, cnic }),
  register: (data: any) => apiService.post('/api/auth/register', data),
  logout: (refreshToken: string) => apiService.post('/api/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) => apiService.post('/api/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => apiService.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => apiService.post('/api/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => apiService.post('/api/auth/change-password', { currentPassword, newPassword }),
};

export const usersApi = {
  getAll: (params?: any) => apiService.get('/api/users', params),
  getById: (id: string) => apiService.get(`/api/users/${id}`),
  create: (data: any) => apiService.post('/api/users', data),
  update: (id: string, data: any) => apiService.put(`/api/users/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/users/${id}`),
  getProfile: () => apiService.get('/api/users/profile/me'),
  updateProfile: (data: any) => apiService.put('/api/users/profile/me', data),
};

export const customersApi = {
  getAll: (params?: any) => apiService.get('/api/customers', params),
  getById: (id: string) => apiService.get(`/api/customers/${id}`),
  create: (data: any) => apiService.post('/api/customers', data),
  update: (id: string, data: any) => apiService.put(`/api/customers/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/customers/${id}`),
};

export const packagesApi = {
  getAll: (params?: any) => apiService.get('/api/packages', params),
  getById: (id: string) => apiService.get(`/api/packages/${id}`),
  create: (data: any) => apiService.post('/api/packages', data),
  update: (id: string, data: any) => apiService.put(`/api/packages/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/packages/${id}`),
};

export const connectionsApi = {
  getAll: (params?: any) => apiService.get('/api/connections', params),
  getById: (id: string) => apiService.get(`/api/connections/${id}`),
  create: (data: any) => apiService.post('/api/connections', data),
  update: (id: string, data: any) => apiService.put(`/api/connections/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/connections/${id}`),
};

export const invoicesApi = {
  getAll: (params?: any) => apiService.get('/api/invoices', params),
  getById: (id: string) => apiService.get(`/api/invoices/${id}`),
  create: (data: any) => apiService.post('/api/invoices', data),
  update: (id: string, data: any) => apiService.put(`/api/invoices/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/invoices/${id}`),
  getApprovalRequests: (params?: { status?: string; page?: string; limit?: string }) =>
    apiService.get('/api/invoices/approval-requests', params),
  approve: (id: string) => apiService.put(`/api/invoices/${id}/approve`, {}),
  reject: (id: string, reason?: string) => apiService.put(`/api/invoices/${id}/reject`, { reason }),
  recordPayment: (id: string, data: any) => apiService.post(`/api/invoices/${id}/payment`, data),
};

export const inventoryApi = {
  getAll: (params?: any) => apiService.get('/api/inventory', params),
  getById: (id: string) => apiService.get(`/api/inventory/${id}`),
  getAlerts: (params?: any) => apiService.get('/api/inventory/alerts', params),
  getTransactions: (params?: any) => apiService.get('/api/inventory/transactions', params),
  create: (data: any) => apiService.post('/api/inventory', data),
  update: (id: string, data: any) => apiService.put(`/api/inventory/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/inventory/${id}`),
  createTransaction: (data: any) => apiService.post('/api/inventory/transactions', data),
};

export const newCustomersApi = {
  getAll: (params?: any) => apiService.get('/api/new-customers', params),
  getById: (id: string) => apiService.get(`/api/new-customers/${id}`),
  create: (data: any) => apiService.post('/api/new-customers', data),
  update: (id: string, data: any) => apiService.put(`/api/new-customers/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/new-customers/${id}`),
  getExpenses: (params?: any) => apiService.get('/api/new-customers/expenses', params),
  getCollections: (params?: any) => apiService.get('/api/new-customers/collections', params),
  deleteExpense: (id: string) => apiService.delete(`/api/new-customers/expenses/${id}`),
  deleteCollection: (id: string) => apiService.delete(`/api/new-customers/collections/${id}`),
};

export const staffApi = {
  getAll: (params?: any) => apiService.get('/api/staff', params),
  getById: (id: string) => apiService.get(`/api/staff/${id}`),
  create: (data: any) => apiService.post('/api/staff', data),
  update: (id: string, data: any) => apiService.put(`/api/staff/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/staff/${id}`),
  getReports: (params?: { month?: string; role?: string }) => apiService.get('/api/staff/reports', params),
  getActivity: (params?: any) => apiService.get('/api/logs', params),
  getPayments: (params?: any) => apiService.get('/api/billing/payments/staff-records', params),
};

export const expensesApi = {
  getAll: (params?: any) => apiService.get('/api/expenses', params),
  getById: (id: string) => apiService.get(`/api/expenses/${id}`),
  create: (data: any) => apiService.post('/api/expenses', data),
  update: (id: string, data: any) => apiService.put(`/api/expenses/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/expenses/${id}`),
  getCategories: (params?: any) => apiService.get('/api/expenses/categories', params),
  createCategory: (data: any) => apiService.post('/api/expenses/categories', data),
  updateCategory: (id: string, data: any) => apiService.put(`/api/expenses/categories/${id}`, data),
  deleteCategory: (id: string) => apiService.delete(`/api/expenses/categories/${id}`),
};

export const areasApi = {
  getAll: (params?: any) => apiService.get('/api/areas', params),
  getById: (id: string) => apiService.get(`/api/areas/${id}`),
  getCustomers: (id: string, params?: any) => apiService.get(`/api/areas/${id}/customers`, params),
  getRevenue: (id: string, year?: string) => apiService.get(`/api/areas/${id}/revenue`, year ? { year } : undefined),
  getReport: (id: string) => apiService.get(`/api/areas/${id}/report`),
  create: (data: any) => apiService.post('/api/areas', data),
  update: (id: string, data: any) => apiService.put(`/api/areas/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/areas/${id}`),
};


export const complaintsApi = {
  getAll: (params?: any) => apiService.get('/api/complaints', params),
  getById: (id: string) => apiService.get(`/api/complaints/${id}`),
  getByStatus: (status: string) => apiService.get(`/api/complaints/status/${status}`),
  getByCustomer: (customerId: string) => apiService.get(`/api/complaints/customer/${customerId}`),
  create: (data: any) => apiService.post('/api/complaints', data),
  update: (id: string, data: any) => apiService.put(`/api/complaints/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/complaints/${id}`),
};

export const announcementsApi = {
  getAll: (params?: any) => apiService.get('/api/announcements', params),
  getById: (id: string) => apiService.get(`/api/announcements/${id}`),
  getActive: () => apiService.get('/api/announcements/active/list'),
  getByTarget: (target: string) => apiService.get(`/api/announcements/target/${target}`),
  create: (data: any) => apiService.post('/api/announcements', data),
  update: (id: string, data: any) => apiService.put(`/api/announcements/${id}`, data),
  delete: (id: string) => apiService.delete(`/api/announcements/${id}`),
};

export const reportsApi = {
  getCustomers: () => apiService.get('/api/reports/customers'),
  getBilling: () => apiService.get('/api/reports/billing'),
  getIncome: () => apiService.get('/api/reports/income'),
  getExpenses: () => apiService.get('/api/reports/expenses'),
  getBusiness: () => apiService.get('/api/reports/business'),
  getProfitability: () => apiService.get('/api/reports/profitability'),
  getConnections: () => apiService.get('/api/reports/connections'),
  getPackages: () => apiService.get('/api/reports/packages'),
  getRevenue: (params?: any) => apiService.get('/api/reports/revenue', params),

  exportPDF: (type: string, params?: any) => {
    // For file downloads, we need to use the raw axios instance
    const url = `${import.meta.env.VITE_API_BASE_URL || 'https://trigonlink.pakdata.net/api'}/api/reports/export/${type}/pdf`;
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return window.fetch(url + queryString, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }).then(response => response.blob());
  },
  exportExcel: (type: string, params?: any) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'https://trigonlink.pakdata.net/api'}/api/reports/export/${type}/excel`;
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return window.fetch(url + queryString, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    }).then(response => response.blob());
  },
};

export const billingApi = {
  generateMonthly: () => apiService.post('/api/billing/generate-monthly'),
  generateCustomerBill: (customerId: string, customDate?: string) => apiService.post(`/api/billing/generate/${customerId}`, { customDate }),
  processPayment: (invoiceId: string, amount: number, paymentMethod: string) => apiService.post(`/api/billing/payment/${invoiceId}`, { amount, paymentMethod }),
  markOverdue: () => apiService.post('/api/billing/mark-overdue'),
  getSummary: (customerId: string) => apiService.get(`/api/billing/summary/${customerId}`),
  getPaymentHistory: (customerId: string, params?: any) => apiService.get(`/api/billing/payments/${customerId}`, params),
};

export const notificationsApi = {
  getAll: (params?: any) => apiService.get('/api/notifications', params),
  getUnreadCount: () => apiService.get('/api/notifications/unread-count'),
  markAsRead: (id: string) => apiService.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => apiService.put('/api/notifications/read-all'),
  delete: (id: string) => apiService.delete(`/api/notifications/${id}`),
  create: (data: any) => apiService.post('/api/notifications', data),
  triggerUnpaidReminders: () => apiService.post('/api/notifications/reminders/unpaid-bills'),
  triggerOverdueReminders: () => apiService.post('/api/notifications/reminders/overdue-bills'),
  cleanup: () => apiService.post('/api/notifications/cleanup'),
};

export const dashboardApi = {
  getStatistics: (params?: any) => apiService.get('/api/dashboard/statistics', params),
};

export const settingsApi = {
  getRoles: () => apiService.get('/api/roles'),
  getLogs: () => apiService.get('/api/logs'),
};

export const googleApi = {
  getAuthUrl: (state?: string) => apiService.get('/api/google/auth-url', { state }),
  handleCallback: (code: string) => apiService.post('/api/google/callback', { code }),
  getStatus: () => apiService.get('/api/google/status'),
  disconnect: () => apiService.post('/api/google/disconnect'),
  changeAccount: () => apiService.post('/api/google/change-account'),
  syncCustomer: (customerId: string) => apiService.post(`/api/google/sync/customer/${customerId}`),
  syncAllCustomers: () => apiService.post('/api/google/sync/all'),
  getSyncStatus: (customerId: string) => apiService.get(`/api/google/sync/status/${customerId}`),
  testConnection: () => apiService.post('/api/google/test-connection'),
};

export default api;

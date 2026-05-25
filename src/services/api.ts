import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create central Axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('woo_admin_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// General responses interceptor for standard error alerts & handling unauthenticated states
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Auto-retry once on connection timeout/network failure
    if (error.code === 'ECONNABORTED' && !originalRequest?._retry) {
      originalRequest._retry = true;
      console.warn('Network timeout. Retrying request...');
      return api(originalRequest);
    }

    // Force secure logout on token expiry/revocation
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Avoid infinite logout loops on login attempts
      if (!originalRequest.url.includes('/auth/login')) {
        console.warn('Session expired or unauthorized. Logging out.');
        localStorage.removeItem('woo_admin_token');
        localStorage.removeItem('woo_admin_user');
        
        // Dynamic location redirect if window exists
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// Export centralized request methods and live endpoint models
export const apiService = {
  // Authentication
  login: (credentials: { username: string; password?: string }) => 
    api.post('/auth/login', credentials),
  getCurrentUser: () => 
    api.get('/auth/me'),
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  logout: () => 
    api.post('/auth/logout'),

  // Dashboard Summary Metrics
  getDashboardStats: () => 
    api.get('/dashboard/stats'),

  // Product Inventory Management
  getProducts: (params?: { search?: string; category?: string; status?: string }) => 
    api.get('/products', { params }),
  createProduct: (data: any) => 
    api.post('/products', data),
  updateProduct: (id: string, data: any) => 
    api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => 
    api.delete(`/products/${id}`),
  bulkProducts: (data: { ids: string[]; action: 'delete' | 'status' | 'stock'; payload?: any }) => 
    api.post('/products/bulk', data),

  // Customer Management
  getUsers: (params?: { search?: string; role?: string; status?: string }) => 
    api.get('/users', { params }),
  updateUser: (id: string, data: any) => 
    api.put(`/users/${id}`, data),
  deleteUser: (id: string) => 
    api.delete(`/users/${id}`),

  // Discount Coupons
  getCoupons: () => 
    api.get('/coupons'),
  createCoupon: (data: any) => 
    api.post('/coupons', data),
  updateCoupon: (id: string, data: any) => 
    api.put(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => 
    api.delete(`/coupons/${id}`),

  // System Settings Module
  getSettings: () => 
    api.get('/settings'),
  updateSettings: (data: any) => 
    api.put('/settings', data),
  testWordPressConnection: () => 
    api.post('/settings/test-connection'),

  // System Log Auditing
  getLogs: () => 
    api.get('/logs'),
  clearLogs: () => 
    api.post('/logs/clear'),

  // Orders Management API
  getOrders: (params?: { search?: string; status?: string }) => 
    api.get('/orders', { params }),
  createOrder: (data: any) => 
    api.post('/orders', data),
  updateOrder: (id: string, data: any) => 
    api.put(`/orders/${id}`, data),
  deleteOrder: (id: string) => 
    api.delete(`/orders/${id}`),

  // Scratchpad Notepad
  getNotes: () => 
    api.get('/admin-notes'),
  saveNotes: (content: string) => 
    api.post('/admin-notes', { content }),

  // Tera Wallet Management API
  getWalletTransactions: () =>
    api.get('/wallet/transactions'),
  createWalletTransaction: (data: { userId: string; amount: number; type: 'credit' | 'debit'; details: string }) =>
    api.post('/wallet/transaction', data),
  getWalletStats: () =>
    api.get('/wallet/stats')
};

export default api;

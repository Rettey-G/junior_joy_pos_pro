import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions
export const registerUser = (userData) => api.post('/api/auth/register', userData);
export const loginUser = (credentials) => api.post('/api/auth/login', credentials);
export const getCurrentUser = () => api.get('/api/auth/me');

// User Management API functions
export const getUsers = () => api.get('/api/users');
export const createUser = (userData) => api.post('/api/users', userData);
export const updateUser = (id, userData) => api.patch(`/api/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/api/users/${id}`);

// Product API functions
export const getProducts = () => api.get('/api/products');
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const createProduct = (productData) => api.post('/api/products', productData);
export const updateProduct = (id, productData) => api.patch(`/api/products/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// Sales API functions
export const createSale = (saleData) => api.post('/api/sales', saleData);
export const getSales = (page = 1, limit = 10) => api.get(`/api/sales?page=${page}&limit=${limit}`);
export const getSale = (id) => api.get(`/api/sales/${id}`);
export const updateSale = (id, saleData) => api.patch(`/api/sales/${id}`, saleData);
export const updateSaleStatus = (id, status) => api.patch(`/api/sales/${id}/status`, { status });
export const deleteSale = (id) => api.delete(`/api/sales/${id}`);
export const getSalesReport = (period, startDate, endDate, timestamp) => {
  // Map client-side period names to server-side period names if needed
  let serverPeriod = period;
  if (period === 'daily') serverPeriod = 'daily';
  if (period === 'weekly') serverPeriod = 'weekly';
  if (period === 'monthly') serverPeriod = 'monthly';
  if (period === 'yearly') serverPeriod = 'yearly';
  
  let url = `/api/sales/reports/${serverPeriod}`;
  let hasParams = false;
  
  // Add date parameters for custom period
  if (period === 'custom' && startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
    hasParams = true;
  }
  
  // Add timestamp to bypass cache
  if (timestamp) {
    url += hasParams ? `&t=${timestamp}` : `?t=${timestamp}`;
  }
  
  return api.get(url);
};

// Employee API functions
export const getEmployees = () => api.get('/api/employees');
export const getEmployee = (id) => api.get(`/api/employees/${id}`);
export const createEmployee = (employeeData) => api.post('/api/employees', employeeData);
export const updateEmployee = (id, employeeData) => api.patch(`/api/employees/${id}`, employeeData);
export const deleteEmployee = (id) => api.delete(`/api/employees/${id}`);

// Customer API functions
export const getCustomers = (page = 1, limit = 10, search = '') => api.get(`/api/customers?page=${page}&limit=${limit}&search=${search}`);
export const getCustomer = (id) => api.get(`/api/customers/${id}`);
export const createCustomer = (customerData) => api.post('/api/customers', customerData);
export const updateCustomer = (id, customerData) => api.put(`/api/customers/${id}`, customerData);
export const deleteCustomer = (id) => api.delete(`/api/customers/${id}`);
export const getCustomerSales = (id) => api.get(`/api/customers/${id}/sales`);

// Inventory Management API functions
export const getInventoryTransactions = (page = 1, limit = 10, filters = {}) => {
  let url = `/api/inventory/transactions?page=${page}&limit=${limit}`;
  
  if (filters.product) url += `&product=${filters.product}`;
  if (filters.type) url += `&type=${filters.type}`;
  if (filters.startDate) url += `&startDate=${filters.startDate}`;
  if (filters.endDate) url += `&endDate=${filters.endDate}`;
  
  return api.get(url);
};

export const getInventoryTransaction = (id) => api.get(`/api/inventory/transactions/${id}`);
export const adjustInventory = (adjustmentData) => api.post('/api/inventory/adjust', adjustmentData);
export const getLowStockProducts = (threshold = 5) => api.get(`/api/inventory/low-stock?threshold=${threshold}`);
export const getOutOfStockProducts = () => api.get('/api/inventory/out-of-stock');
export const getInventoryValue = () => api.get('/api/inventory/value');

// Supplier API functions
export const getSuppliers = (page = 1, limit = 10, search = '', status = '') => {
  let url = `/api/suppliers?page=${page}&limit=${limit}`;
  
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${status}`;
  
  return api.get(url);
};

export const getSupplier = (id) => api.get(`/api/suppliers/${id}`);
export const createSupplier = (supplierData) => api.post('/api/suppliers', supplierData);
export const updateSupplier = (id, supplierData) => api.put(`/api/suppliers/${id}`, supplierData);
export const deleteSupplier = (id) => api.delete(`/api/suppliers/${id}`);

// Purchase Order API functions
export const getPurchaseOrders = (page = 1, limit = 10, filters = {}) => {
  let url = `/api/purchase-orders?page=${page}&limit=${limit}`;
  
  if (filters.status) url += `&status=${filters.status}`;
  if (filters.supplier) url += `&supplier=${filters.supplier}`;
  if (filters.startDate) url += `&startDate=${filters.startDate}`;
  if (filters.endDate) url += `&endDate=${filters.endDate}`;
  
  return api.get(url);
};

export const getPurchaseOrder = (id) => api.get(`/api/purchase-orders/${id}`);
export const createPurchaseOrder = (poData) => api.post('/api/purchase-orders', poData);
export const updatePurchaseOrder = (id, poData) => api.put(`/api/purchase-orders/${id}`, poData);
export const deletePurchaseOrder = (id) => api.delete(`/api/purchase-orders/${id}`);
export const receivePurchaseOrder = (id, receivedData) => api.put(`/api/purchase-orders/${id}/receive`, receivedData);
export const cancelPurchaseOrder = (id, reason) => api.put(`/api/purchase-orders/${id}/cancel`, { reason });

export default api;

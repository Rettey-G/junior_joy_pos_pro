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
export const updateSaleStatus = (id, status) => api.patch(`/api/sales/${id}/status`, { status });
export const getSalesReport = (period, startDate, endDate) => {
  let url = `/api/sales/reports/${period}`;
  if (period === 'custom') {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  return api.get(url);
};

export default api;

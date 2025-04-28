import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://junior-joy-pos-pro.onrender.com',
  timeout: 10000 // 10 second timeout to prevent hanging requests
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data for fallback responses
const mockData = {
  employees: [
    { id: '1', name: 'John Smith', position: 'Manager', salary: 15000, hireDate: '2023-01-15' },
    { id: '2', name: 'Sarah Johnson', position: 'Cashier', salary: 8000, hireDate: '2023-03-20' },
    { id: '3', name: 'Michael Brown', position: 'Inventory Clerk', salary: 9000, hireDate: '2023-02-10' }
  ],
  customers: {
    data: [
      { id: '1', name: 'Customer One', phone: '555-1234', email: 'customer1@example.com' },
      { id: '2', name: 'Customer Two', phone: '555-5678', email: 'customer2@example.com' }
    ],
    totalPages: 1,
    currentPage: 1
  },
  products: [
    { id: '1', name: 'VG GUTTER R2 PIPE CONNECTOR PVC', price: 37.80, stock: 100, category: 'PVC' },
    { id: '2', name: 'VG GUTTER R2 PIPE LOCK BRACKET PVC', price: 29.16, stock: 100, category: 'PVC' },
    { id: '3', name: 'VG GUTTER R2 ELBOW 90DEG PVC', price: 61.00, stock: 100, category: 'PVC' },
    { id: '4', name: 'VG GUTTER R2 PIPE PVC', price: 37.80, stock: 100, category: 'PVC' },
    { id: '5', name: 'VG GUTTER R2Y ELBOW 90DEG PVC', price: 86.40, stock: 100, category: 'PVC' }
  ],
  sales: {
    data: [
      { id: '1', date: '2025-04-25', total: 59.97, customer: { name: 'Customer One' }, items: 3 },
      { id: '2', date: '2025-04-26', total: 39.98, customer: { name: 'Customer Two' }, items: 2 }
    ],
    totalPages: 1,
    currentPage: 1
  },
  salesReport: {
    totalSales: 5997,
    totalItems: 50,
    averageOrderValue: 120,
    topProducts: [
      { name: 'Product 1', quantity: 20, revenue: 399.8 },
      { name: 'Product 2', quantity: 15, revenue: 449.85 }
    ],
    salesByDate: [
      { date: '2025-04-20', sales: 1200 },
      { date: '2025-04-21', sales: 980 },
      { date: '2025-04-22', sales: 1050 },
      { date: '2025-04-23', sales: 890 },
      { date: '2025-04-24', sales: 1100 },
      { date: '2025-04-25', sales: 1300 },
      { date: '2025-04-26', sales: 1477 }
    ],
    salesByCashier: [
      { name: 'John Smith', sales: 2500 },
      { name: 'Sarah Johnson', sales: 3497 }
    ]
  },
  suppliers: {
    data: [
      { id: '1', name: 'Supplier A', contact: 'Contact A', phone: '555-1111', email: 'supplierA@example.com' },
      { id: '2', name: 'Supplier B', contact: 'Contact B', phone: '555-2222', email: 'supplierB@example.com' }
    ],
    totalPages: 1,
    currentPage: 1
  },
  purchaseOrders: {
    data: [
      { id: '1', date: '2025-04-20', supplier: { name: 'Supplier A' }, status: 'Delivered', total: 1500 },
      { id: '2', date: '2025-04-25', supplier: { name: 'Supplier B' }, status: 'Pending', total: 2300 }
    ],
    totalPages: 1,
    currentPage: 1
  },
  inventoryValue: {
    totalValue: 12500,
    totalItems: 180,
    categories: [
      { name: 'Category A', value: 7500 },
      { name: 'Category B', value: 5000 }
    ]
  },
  inventoryTransactions: {
    transactions: [
      { id: '1', date: '2025-04-25', product: { name: 'Demo Product 1' }, type: 'adjustment', quantity: 10, previousQuantity: 90, newQuantity: 100, createdBy: { name: 'Admin' } },
      { id: '2', date: '2025-04-24', product: { name: 'Demo Product 2' }, type: 'adjustment', quantity: -5, previousQuantity: 55, newQuantity: 50, createdBy: { name: 'Admin' } }
    ],
    total: 2,
    pages: 1,
    page: 1
  },
  lowStockProducts: [
    { id: '1', name: 'Low Stock Product 1', price: 25.50, SOH: 3, category: 'Demo' },
    { id: '2', name: 'Low Stock Product 2', price: 45.75, SOH: 2, category: 'Demo' }
  ],
  outOfStockProducts: [
    { id: '3', name: 'Out of Stock Product 1', price: 18.99, SOH: 0, category: 'Demo' },
    { id: '4', name: 'Out of Stock Product 2', price: 32.50, SOH: 0, category: 'Demo' }
  ]
};

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    
    // Check if error is due to network issues or authentication (401)
    if (error.message.includes('Network Error') || !error.response || error.response.status === 401) {
      console.log('Network or auth error detected, using fallback data if available');
      
      // For specific endpoints, we can provide fallback data
      const url = error.config.url;
      
      // Handle auth/me endpoint for getting current user
      if (url.includes('/api/auth/me')) {
        // Check if we have a token and user in localStorage
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token) {
          try {
            const user = userStr ? JSON.parse(userStr) : {
              id: '1000',
              username: 'admin',
              name: 'Admin User',
              role: 'admin'
            };
            localStorage.setItem('user', JSON.stringify(user));
            return Promise.resolve({ data: user });
          } catch (e) {
            // Invalid user JSON
          }
        }
      }
      
      // Handle employees endpoint
      if (url.includes('/api/employees')) {
        return Promise.resolve({ data: mockData.employees });
      }
      
      // Handle customers endpoint
      if (url.includes('/api/customers')) {
        return Promise.resolve({ data: mockData.customers });
      }
      
      // Handle products endpoint
      if (url.includes('/api/products') && !url.includes('/')) {
        return Promise.resolve({ data: mockData.products });
      }
      
      // Handle sales endpoint
      if (url.includes('/api/sales') && !url.includes('/reports')) {
        return Promise.resolve({ data: mockData.sales });
      }
      
      // Handle sales reports endpoint
      if (url.includes('/api/sales/reports')) {
        return Promise.resolve({ data: mockData.salesReport });
      }
      
      // Handle suppliers endpoint
      if (url.includes('/api/suppliers')) {
        return Promise.resolve({ data: mockData.suppliers });
      }
      
      // Handle purchase orders endpoint
      if (url.includes('/api/purchase-orders')) {
        return Promise.resolve({ data: mockData.purchaseOrders });
      }
      
      // Handle inventory value endpoint
      if (url.includes('/api/inventory/value')) {
        return Promise.resolve({ data: mockData.inventoryValue });
      }
      
      // Handle inventory transactions endpoint
      if (url.includes('/api/inventory/transactions')) {
        return Promise.resolve({ data: mockData.inventoryTransactions });
      }
      
      // Handle low stock products endpoint
      if (url.includes('/api/inventory/low-stock')) {
        return Promise.resolve({ data: mockData.lowStockProducts });
      }
      
      // Handle out of stock products endpoint
      if (url.includes('/api/inventory/out-of-stock')) {
        return Promise.resolve({ data: mockData.outOfStockProducts });
      }
      
      // Handle individual sales/invoice endpoint
      if (url.match(/\/api\/sales\/[a-zA-Z0-9]+$/)) {
        const id = url.split('/').pop();
        const invoice = mockData.sales.data.find(s => s.id === id) || {
          id: id,
          billNumber: id,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          customer: { name: 'Demo Customer' },
          cashier: 'Admin User',
          products: [
            { name: 'Demo Product', quantity: 1, price: 50.00 }
          ],
          subtotal: 50.00,
          gst: 8.00,
          serviceCharge: 5.00,
          discount: 0,
          total: 63.00,
          status: 'Completed'
        };
        return Promise.resolve({ data: invoice });
      }
    }
    
    return Promise.reject(error);
  }
);

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

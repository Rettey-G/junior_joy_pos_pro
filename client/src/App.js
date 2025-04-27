import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext.js';
import Login from './Login.js';
import Register from './Register.js';
import Dashboard from './Dashboard.js';
import DirectLogin from './DirectLogin.js';
import Sales from './Sales.js';
import Bills from './Bills.js';
import Employees from './Employees.js';
import SalesReports from './SalesReports.js';
import Invoice from './Invoice.js';
import NewInvoice from './NewInvoice.js';
import Users from './Users.js';
import Invoices from './Invoices.js';
import Customers from './Customers.js';
import InventoryManagement from './InventoryManagement.js';
import Suppliers from './Suppliers.js';
import PurchaseOrders from './PurchaseOrders.js';
import api, { getProducts, createProduct, updateProduct, deleteProduct } from './api';
import { safeRender } from './utils';
import './styles.css';

// Training Page Component
const TrainingPage = () => {
  useEffect(() => {
    // Redirect to the training.html page in the public directory
    window.location.href = '/training.html';
  }, []);

  return (
    <div className="loading-container">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading training page...</span>
      </div>
      <p className="mt-3">Loading training resources...</p>
    </div>
  );
};

// Navigation component
const Navigation = ({ onNavigate, currentPage }) => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleNavigation = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };
  
  // Group navigation buttons into categories for better organization
  const groupedNavButtons = {
    main: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'products', label: 'Products' },
      { id: 'sales', label: 'New Sale' },
      { id: 'bills', label: 'Bills' },
      { id: 'customers', label: 'Customers' },
    ],
    secondary: [
      { id: 'employees', label: 'Employees' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'suppliers', label: 'Suppliers' },
      { id: 'purchase-orders', label: 'Orders' },
    ],
    reports: [
      { id: 'reports', label: 'Reports' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'training', label: 'Training' },
    ],
    admin: isAdmin ? [{ id: 'users', label: 'Users' }] : []
  };
  
  return (
    <nav className="navbar fixed-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img 
            src="/juniorjoy.jpg" 
            alt="Junior Joy Logo" 
            className="navbar-logo" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+';            
            }}
          />
          <span className="brand-text">Junior Joy POS</span>
        </div>
        
        {isAuthenticated ? (
          <>
            <div className="d-flex align-items-center">
              <div className="navbar-welcome">
                {safeRender(user?.name)}
              </div>
              
              {/* Desktop Navigation - Organized by groups */}
              <div className="navbar-nav">
                {/* Main group */}
                {groupedNavButtons.main.map(button => (
                  <button 
                    key={button.id} 
                    className={`nav-button ${currentPage === button.id ? 'active' : ''}`}
                    onClick={() => handleNavigation(button.id)}
                  >
                    {button.label}
                  </button>
                ))}
                
                {/* Secondary group */}
                {groupedNavButtons.secondary.map(button => (
                  <button 
                    key={button.id} 
                    className={`nav-button ${currentPage === button.id ? 'active' : ''}`}
                    onClick={() => handleNavigation(button.id)}
                  >
                    {button.label}
                  </button>
                ))}
                
                {/* Reports group */}
                {groupedNavButtons.reports.map(button => (
                  <button 
                    key={button.id} 
                    className={`nav-button ${currentPage === button.id ? 'active' : ''}`}
                    onClick={() => handleNavigation(button.id)}
                  >
                    {button.label}
                  </button>
                ))}
                
                {/* Admin group */}
                {groupedNavButtons.admin.map(button => (
                  <button 
                    key={button.id} 
                    className={`nav-button admin-button ${currentPage === button.id ? 'active' : ''}`}
                    onClick={() => handleNavigation(button.id)}
                  >
                    {button.label}
                  </button>
                ))}
                
                <button 
                  className="nav-button logout-button"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
              
              {/* Hamburger Menu */}
              <div 
                className={`hamburger-menu ${mobileMenuOpen ? 'active' : ''}`} 
                onClick={toggleMobileMenu}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
              {/* Combine all button groups for mobile navigation */}
              {[...groupedNavButtons.main, ...groupedNavButtons.secondary, ...groupedNavButtons.reports, ...groupedNavButtons.admin].map(button => (
                <button 
                  key={button.id}
                  onClick={() => handleNavigation(button.id)}
                  className={`nav-button ${currentPage === button.id ? 'active' : ''} ${button.id === 'users' ? 'admin-button' : ''}`}
                >
                  {button.label}
                </button>
              ))}
              <button 
                onClick={logout}
                className="nav-button logout-button"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div>
            <button 
              onClick={() => handleNavigation('login')}
              className="nav-button"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

// Main App component wrapper with AuthProvider
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

// Main App component
const MainApp = () => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(isAuthenticated ? 'products' : 'login');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [status, setStatus] = useState('Loading...');

  // Check backend connection
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(api.defaults.baseURL);
        const data = await response.text();
        setStatus(data || 'Connected to backend!');
      } catch (error) {
        setStatus('Error connecting to backend: ' + error.message);
      }
    };

    checkBackend();
  }, []);

  // Render content based on current page
  const renderContent = () => {
    // Check if URL has direct-login parameter
    const urlParams = new URLSearchParams(window.location.search);
    const directLogin = urlParams.get('direct-login');
    
    if (directLogin === 'true') {
      return <DirectLogin />;
    }
    
    if (!isAuthenticated) {
      return showRegisterForm ? (
        <Register onToggleForm={() => setShowRegisterForm(false)} />
      ) : (
        <Login onToggleForm={() => setShowRegisterForm(true)} />
      );
    }

    switch (page) {
      case 'products':
        return <ProductManagement />;
      case 'sales':
        return <Sales />;
      case 'bills':
        return <Bills />;
      case 'customers':
        return <Customers />;
      case 'employees':
        return <Employees />;
      case 'inventory':
        return <InventoryManagement />;
      case 'suppliers':
        return <Suppliers />;
      case 'purchase-orders':
        return <PurchaseOrders />;
      case 'reports':
        return <SalesReports />;
      case 'invoices':
        return <Invoices />;
      case 'dashboard':
        return <Dashboard isAuthenticated={isAuthenticated} />;
      case 'users':
        return <Users isAuthenticated={isAuthenticated} />;
      case 'training':
        return <TrainingPage />;
      default:
        return <ProductManagement />;
    }
  };

  return (
    <div>
      <Navigation onNavigate={setPage} currentPage={page} />
      
      <div className="container">
        {renderContent()}
      </div>
      
      <footer className="footer modern-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img src="/juniorjoy.jpg" alt="Junior Joy Logo" className="footer-logo" />
            <div className="footer-company">
              <h3>Junior Joy POS</h3>
              <p>Professional Point of Sale System</p>
            </div>
          </div>
          <div className="footer-center">
            <p>&copy; {new Date().getFullYear()} Junior Joy POS System. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <p className="backend-status">Backend Status: <span className={status.includes('Error') ? 'status-error' : 'status-success'}>{status}</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Product Management Component
const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    price: '',
    costPrice: '',
    details: '',
    specs: '',
    imageUrl: '',
    SOH: '',
    category: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    // Fetch products
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await createProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        costPrice: parseFloat(newProduct.costPrice) || 0,
        SOH: parseInt(newProduct.SOH, 10)
      });
      setNewProduct({
        code: '',
        name: '',
        price: '',
        costPrice: '',
        details: '',
        specs: '',
        imageUrl: '',
        SOH: '',
        category: ''
      });
      fetchProducts();
    } catch (err) {
      setError('Failed to create product');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(editingProduct._id, {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        costPrice: parseFloat(editingProduct.costPrice) || 0,
        SOH: parseInt(editingProduct.SOH, 10)
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      setError('Failed to update product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  // Get unique categories for the filter dropdown
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesSearch = (
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.details && product.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return matchesCategory && matchesSearch;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="text-center mt-4">Loading products...</div>;
  if (error) return <div className="text-center mt-4 text-danger">{error}</div>;

  return (
    <div className="product-management">
      <h2>Product Management</h2>
      
      {/* Search Bar */}
      <div className="search-container" style={{flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
        <div style={{display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap'}}>
          <select
            className="form-control"
            style={{maxWidth: 180}}
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name, code, or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button className="btn btn-primary" type="button" onClick={() => setShowAddModal(true)}>Add Product</button>
        </div>
      </div>
      
      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card landscape-modal" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Add New Product</h3>
              <button 
                type="button" 
                className="close-button" 
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={e => { handleCreateProduct(e); setShowAddModal(false); }}>
                <div className="form-row">
                  <div className="form-column">
                    <div className="form-group">
                      <label className="form-label">Code:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProduct.code}
                        onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Name:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (MVR):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cost Price (MVR):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.costPrice}
                        onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-column">
                    <div className="form-group">
                      <label className="form-label">Details:</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newProduct.details}
                        onChange={(e) => setNewProduct({...newProduct, details: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specs:</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newProduct.specs}
                        onChange={(e) => setNewProduct({...newProduct, specs: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Image URL:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock on Hand:</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.SOH}
                        onChange={(e) => setNewProduct({...newProduct, SOH: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Product</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Edit Product</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProduct}>
              <div className="form-group">
                <label className="form-label">Code:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingProduct.code}
                  onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price (MVR):</label>
                <input
                  type="number"
                  className="form-control"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price (MVR):</label>
                <input
                  type="number"
                  className="form-control"
                  value={editingProduct.costPrice || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, costPrice: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Details:</label>
                <textarea
                  className="form-control"
                  value={editingProduct.details}
                  onChange={(e) => setEditingProduct({...editingProduct, details: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Specs:</label>
                <textarea
                  className="form-control"
                  value={editingProduct.specs}
                  onChange={(e) => setEditingProduct({...editingProduct, specs: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingProduct.imageUrl}
                  onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock on Hand:</label>
                <input
                  type="number"
                  className="form-control"
                  value={editingProduct.SOH}
                  onChange={(e) => setEditingProduct({...editingProduct, SOH: e.target.value})}
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">Update Product</button>
                <button type="button" className="btn btn-danger" onClick={() => setEditingProduct(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Product List</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Price (MVR)</th>
                  <th>Cost (MVR)</th>
                  <th>Category</th>
                  <th>SOH</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(product => (
                  <tr key={product._id}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.price.toFixed(2)}</td>
                    <td>{(product.costPrice || 0).toFixed(2)}</td>
                    <td>{product.category}</td>
                    <td className={product.SOH > 10 ? 'stock-available' : product.SOH > 0 ? 'stock-low' : 'stock-out'}>
                      {product.SOH}
                    </td>
                    <td className="actions">
                      <button className="btn btn-sm btn-primary" onClick={() => setEditingProduct(product)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1} 
                onClick={() => paginate(i + 1)}
                className={`pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <div className="pagination-info">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppWithAuth;

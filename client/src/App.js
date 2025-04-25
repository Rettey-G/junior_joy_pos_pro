import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext.js';
import Login from './Login.js';
import Register from './Register.js';
import Dashboard from './Dashboard.js';
import Sales from './Sales.js';
import Bills from './Bills.js';
import Employees from './Employees.js';
import SalesReports from './SalesReports.js';
import Invoice from './Invoice.js';
import api, { getProducts, createProduct, updateProduct, deleteProduct } from './api';
import './styles.css';

// Navigation component
const Navigation = ({ onNavigate, currentPage }) => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  
  return (
    <nav className="navbar fixed-navbar">
      <div className="container navbar-container">
        <div className="navbar-brand">
          Junior Joy POS
        </div>
        
        {isAuthenticated ? (
          <div className="d-flex align-items-center">
            <div className="navbar-welcome">
              Welcome, {user.name} ({user.role})
            </div>
            <div className="navbar-nav">
              <button 
                onClick={() => onNavigate('products')}
                className={`nav-button ${currentPage === 'products' ? 'active' : ''}`}
              >
                Products
              </button>
              <button 
                onClick={() => onNavigate('sales')}
                className={`nav-button ${currentPage === 'sales' ? 'active' : ''}`}
              >
                New Sale
              </button>
              <button 
                onClick={() => onNavigate('bills')}
                className={`nav-button ${currentPage === 'bills' ? 'active' : ''}`}
              >
                Bills
              </button>
              <button 
                onClick={() => onNavigate('employees')}
                className={`nav-button ${currentPage === 'employees' ? 'active' : ''}`}
              >
                Employees
              </button>
              <button 
                onClick={() => onNavigate('reports')}
                className={`nav-button ${currentPage === 'reports' ? 'active' : ''}`}
              >
                Sales Reports
              </button>
              <button 
                onClick={() => onNavigate('invoice')}
                className={`nav-button ${currentPage === 'invoice' ? 'active' : ''}`}
              >
                Invoice
              </button>
              <button 
                onClick={() => onNavigate('dashboard')}
                className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </button>
              <button 
                onClick={logout}
                className="nav-button logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button 
              onClick={() => onNavigate('login')}
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
  const [showRegister, setShowRegister] = useState(false);
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
    if (!isAuthenticated) {
      return showRegister ? (
        <Register onToggleForm={() => setShowRegister(false)} />
      ) : (
        <Login onToggleForm={() => setShowRegister(true)} />
      );
    }

    switch (page) {
      case 'products':
        return <ProductManagement />;
      case 'sales':
        return <Sales />;
      case 'bills':
        return <Bills />;
      case 'employees':
        return <Employees />;
      case 'reports':
        return <SalesReports />;
      case 'invoice':
        return <Invoice />;
      case 'dashboard':
        return <Dashboard />;
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
          <span>Junior Joy POS System &copy; {new Date().getFullYear()}</span>
          <span className="backend-status">Backend Status: {status}</span>
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
        SOH: parseInt(newProduct.SOH, 10)
      });
      setNewProduct({
        code: '',
        name: '',
        price: '',
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
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Add New Product</h3>
            </div>
            <div className="card-body">
              <form onSubmit={e => { handleCreateProduct(e); setShowAddModal(false); }}>
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
                  <label className="form-label">Category:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Details:</label>
                  <textarea
                    className="form-control"
                    value={newProduct.details}
                    onChange={(e) => setNewProduct({...newProduct, details: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Specs:</label>
                  <textarea
                    className="form-control"
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
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">Add Product</button>
                  <button type="button" className="btn btn-danger" onClick={() => setShowAddModal(false)}>Cancel</button>
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

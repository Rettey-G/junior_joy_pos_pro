import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext.js';
import Login from './Login.js';
import Register from './Register.js';
import Checkout from './Checkout.js';
import Dashboard from './Dashboard.js';
import Sales from './Sales.js';
import api, { getProducts, createProduct, updateProduct, deleteProduct } from './api';

// Navigation component
const Navigation = ({ onNavigate, currentPage }) => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  
  return (
    <nav style={{ 
      background: '#2196f3', 
      padding: '10px 20px',
      color: 'white',
      marginBottom: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px' }}>
          Junior Joy POS
        </div>
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: '20px' }}>
              Welcome, {user.name} ({user.role})
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => onNavigate('products')}
                style={{ 
                  background: currentPage === 'products' ? 'white' : 'transparent',
                  color: currentPage === 'products' ? '#2196f3' : 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Products
              </button>
              <button 
                onClick={() => onNavigate('sales')}
                style={{ 
                  background: currentPage === 'sales' ? 'white' : 'transparent',
                  color: currentPage === 'sales' ? '#2196f3' : 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                New Sale
              </button>
              <button 
                onClick={() => onNavigate('checkout')}
                style={{ 
                  background: currentPage === 'checkout' ? 'white' : 'transparent',
                  color: currentPage === 'checkout' ? '#2196f3' : 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Checkout
              </button>
              <button 
                onClick={() => onNavigate('dashboard')}
                style={{ 
                  background: currentPage === 'dashboard' ? 'white' : 'transparent',
                  color: currentPage === 'dashboard' ? '#2196f3' : 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Dashboard
              </button>
              <button 
                onClick={logout}
                style={{ 
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button 
              onClick={() => onNavigate('login')}
              style={{ 
                background: 'transparent',
                color: 'white',
                border: '1px solid white',
                padding: '8px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
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
      case 'checkout':
        return <Checkout />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <ProductManagement />;
    }
  };

  return (
    <div>
      <Navigation onNavigate={setPage} currentPage={page} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </div>
      
      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        marginTop: '40px', 
        borderTop: '1px solid #eee',
        color: '#777'
      }}>
        <div>Junior Joy POS System</div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          Backend Status: {status}
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

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    return (
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.details && product.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Product Management</h2>
      
      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search products by name, code, or category..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          style={{ width: '100%', padding: '8px', fontSize: '16px' }}
        />
      </div>
      
      {/* Create Product Form */}
      <div>
        <h3>Add New Product</h3>
        <form onSubmit={handleCreateProduct}>
          <div>
            <label>Code:</label>
            <input
              type="text"
              value={newProduct.code}
              onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
              required
            />
          </div>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label>Price (MVR):</label>
            <input
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              required
            />
          </div>
          <div>
            <label>Category:</label>
            <input
              type="text"
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              required
            />
          </div>
          <div>
            <label>Details:</label>
            <textarea
              value={newProduct.details}
              onChange={(e) => setNewProduct({...newProduct, details: e.target.value})}
            />
          </div>
          <div>
            <label>Specs:</label>
            <textarea
              value={newProduct.specs}
              onChange={(e) => setNewProduct({...newProduct, specs: e.target.value})}
            />
          </div>
          <div>
            <label>Image URL:</label>
            <input
              type="text"
              value={newProduct.imageUrl}
              onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
            />
          </div>
          <div>
            <label>Stock on Hand:</label>
            <input
              type="number"
              value={newProduct.SOH}
              onChange={(e) => setNewProduct({...newProduct, SOH: e.target.value})}
              required
            />
          </div>
          <button type="submit">Add Product</button>
        </form>
      </div>

      {/* Edit Product Form */}
      {editingProduct && (
        <div>
          <h3>Edit Product</h3>
          <form onSubmit={handleUpdateProduct}>
            <div>
              <label>Code:</label>
              <input
                type="text"
                value={editingProduct.code}
                onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Name:</label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Price (MVR):</label>
              <input
                type="number"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Category:</label>
              <input
                type="text"
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Details:</label>
              <textarea
                value={editingProduct.details}
                onChange={(e) => setEditingProduct({...editingProduct, details: e.target.value})}
              />
            </div>
            <div>
              <label>Specs:</label>
              <textarea
                value={editingProduct.specs}
                onChange={(e) => setEditingProduct({...editingProduct, specs: e.target.value})}
              />
            </div>
            <div>
              <label>Image URL:</label>
              <input
                type="text"
                value={editingProduct.imageUrl}
                onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
              />
            </div>
            <div>
              <label>Stock on Hand:</label>
              <input
                type="number"
                value={editingProduct.SOH}
                onChange={(e) => setEditingProduct({...editingProduct, SOH: e.target.value})}
                required
              />
            </div>
            <button type="submit">Update Product</button>
            <button type="button" onClick={() => setEditingProduct(null)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Product List */}
      <div>
        <h3>Product List</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                <td>{product.SOH}</td>
                <td>
                  <button onClick={() => setEditingProduct(product)}>Edit</button>
                  <button onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button 
              key={i + 1} 
              onClick={() => paginate(i + 1)}
              style={{
                margin: '0 5px',
                padding: '5px 10px',
                backgroundColor: currentPage === i + 1 ? '#4CAF50' : '#f1f1f1',
                color: currentPage === i + 1 ? 'white' : 'black',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
        </div>
      </div>
    </div>
  );
};

export default AppWithAuth;

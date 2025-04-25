import React, { useState, useEffect } from 'react';
import api, { getProducts, createProduct, updateProduct, deleteProduct } from './api';

function App() {
  const [status, setStatus] = useState('Loading...');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    // Test connection to backend
    const fetchBackendStatus = async () => {
      try {
        const response = await fetch(api.defaults.baseURL);
        const data = await response.text();
        setStatus(data || 'Connected to backend!');
      } catch (error) {
        setStatus('Error connecting to backend: ' + error.message);
      }
    };

    fetchBackendStatus();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching products: ' + err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Convert string values to numbers where appropriate
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock, 10)
      };
      
      await createProduct(productData);
      setNewProduct({
        name: '',
        price: '',
        category: '',
        description: '',
        stock: ''
      });
      fetchProducts();
    } catch (err) {
      setError('Error adding product: ' + err.message);
      console.error('Error adding product:', err);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      // Convert string values to numbers where appropriate
      const productData = {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock, 10)
      };
      
      await updateProduct(editingProduct._id, productData);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      setError('Error updating product: ' + err.message);
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (err) {
        setError('Error deleting product: ' + err.message);
        console.error('Error deleting product:', err);
      }
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Junior Joy POS</h1>
        <div style={{
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '10px',
          marginTop: '10px'
        }}>
          <p><strong>Backend Status:</strong> {status}</p>
        </div>
      </header>

      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Product List */}
        <div style={{ flex: '2' }}>
          <h2>Products</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No products found. Add your first product!</p>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Stock</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{product.name}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${product.price.toFixed(2)}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{product.category}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{product.stock}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <button 
                          onClick={() => setEditingProduct(product)}
                          style={{ 
                            background: '#2196f3', 
                            color: 'white', 
                            border: 'none', 
                            padding: '5px 10px', 
                            borderRadius: '4px',
                            marginRight: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product._id)}
                          style={{ 
                            background: '#f44336', 
                            color: 'white', 
                            border: 'none', 
                            padding: '5px 10px', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Product Form */}
        <div style={{ flex: '1', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
              <input
                type="text"
                name="name"
                value={editingProduct ? editingProduct.name : newProduct.name}
                onChange={editingProduct ? handleEditInputChange : handleInputChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Price:</label>
              <input
                type="number"
                name="price"
                step="0.01"
                value={editingProduct ? editingProduct.price : newProduct.price}
                onChange={editingProduct ? handleEditInputChange : handleInputChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
              <input
                type="text"
                name="category"
                value={editingProduct ? editingProduct.category : newProduct.category}
                onChange={editingProduct ? handleEditInputChange : handleInputChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                name="description"
                value={editingProduct ? editingProduct.description : newProduct.description}
                onChange={editingProduct ? handleEditInputChange : handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Stock:</label>
              <input
                type="number"
                name="stock"
                value={editingProduct ? editingProduct.stock : newProduct.stock}
                onChange={editingProduct ? handleEditInputChange : handleInputChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="submit"
                style={{ 
                  background: '#4caf50', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 15px', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              {editingProduct && (
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ 
                    background: '#9e9e9e', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 15px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;

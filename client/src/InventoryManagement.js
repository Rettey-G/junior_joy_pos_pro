import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getProducts, 
  getLowStockProducts, 
  getOutOfStockProducts, 
  getInventoryTransactions, 
  adjustInventory,
  getInventoryValue
} from './api';
import { formatCurrency } from './utils';
import './styles.css';

const InventoryManagement = () => {
  // ...existing state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [addProductForm, setAddProductForm] = useState({
    code: '',
    name: '',
    price: '',
    costPrice: '',
    category: '',
    SOH: '',
    details: '',
    specs: '',
    imageUrl: ''
  });
  const [addProductError, setAddProductError] = useState(null);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddProductError(null);
    try {
      await createProduct({
        ...addProductForm,
        price: Number(addProductForm.price),
        costPrice: Number(addProductForm.costPrice),
        SOH: Number(addProductForm.SOH)
      });
      setShowAddProductModal(false);
      setAddProductForm({ code: '', name: '', price: '', costPrice: '', category: '', SOH: '', details: '', specs: '', imageUrl: '' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setAddProductError('Failed to add product.');
    }
  };

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [inventoryValue, setInventoryValue] = useState({
    totalValue: 0,
    totalCost: 0,
    potentialProfit: 0,
    productCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionFilters, setTransactionFilters] = useState({
    product: '',
    type: '',
    startDate: '',
    endDate: ''
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'dashboard') {
          console.log('Fetching inventory dashboard data...');
          // Fetch inventory value statistics
          const valueResponse = await getInventoryValue();
          console.log('Inventory value response:', valueResponse);
          if (valueResponse && valueResponse.data) {
            setInventoryValue(valueResponse.data);
          } else {
            console.log('Using fallback inventory value data');
            setInventoryValue({
              totalValue: 12500,
              totalCost: 10000,
              potentialProfit: 2500,
              productCount: 180
            });
          }
          
          // Fetch low stock products
          const lowStockResponse = await getLowStockProducts();
          console.log('Low stock response:', lowStockResponse);
          if (lowStockResponse && lowStockResponse.data) {
            setLowStockProducts(Array.isArray(lowStockResponse.data) ? lowStockResponse.data : []);
          } else {
            console.log('Using fallback low stock data');
            setLowStockProducts([]);
          }
          
          // Fetch out of stock products
          const outOfStockResponse = await getOutOfStockProducts();
          console.log('Out of stock response:', outOfStockResponse);
          if (outOfStockResponse && outOfStockResponse.data) {
            setOutOfStockProducts(Array.isArray(outOfStockResponse.data) ? outOfStockResponse.data : []);
          } else {
            console.log('Using fallback out of stock data');
            setOutOfStockProducts([]);
          }
        } else if (activeTab === 'products') {
          console.log('Fetching products data...');
          // Fetch all products
          const productsResponse = await getProducts();
          console.log('Products response:', productsResponse);
          if (productsResponse && productsResponse.data) {
            const productsData = Array.isArray(productsResponse.data) ? 
              productsResponse.data : 
              (productsResponse.data.products ? productsResponse.data.products : []);
            
            console.log(`Found ${productsData.length} products`);
            setProducts(productsData);
          } else {
            console.log('Using fallback products data');
            setProducts([]);
          }
        } else if (activeTab === 'transactions') {
          console.log('Fetching inventory transactions data...');
          // Fetch inventory transactions with filters
          const transactionsResponse = await getInventoryTransactions(
            currentPage, 
            10, 
            transactionFilters
          );
          
          console.log('Transactions response:', transactionsResponse);
          if (transactionsResponse && transactionsResponse.data) {
            const transactions = transactionsResponse.data.transactions || 
                               (Array.isArray(transactionsResponse.data) ? transactionsResponse.data : []);
            
            const totalPages = transactionsResponse.data.pages || 
                             (transactionsResponse.data.pagination ? transactionsResponse.data.pagination.totalPages : 1);
            
            setTransactions(transactions);
            setTotalPages(totalPages);
          } else {
            console.log('Using fallback transactions data');
            setTransactions([]);
            setTotalPages(1);
          }
        }
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('Failed to fetch inventory data. Using fallback data. Error: ' + err.message);
        
        // Set fallback data based on active tab
        if (activeTab === 'dashboard') {
          setInventoryValue({
            totalValue: 12500,
            totalCost: 10000,
            potentialProfit: 2500,
            productCount: 180
          });
          setLowStockProducts([]);
          setOutOfStockProducts([]);
        } else if (activeTab === 'products') {
          setProducts([
            { _id: '1', name: 'Demo Product 1', price: 37.80, SOH: 100, category: 'Demo' },
            { _id: '2', name: 'Demo Product 2', price: 29.16, SOH: 50, category: 'Demo' },
            { _id: '3', name: 'Demo Product 3', price: 61.00, SOH: 25, category: 'Demo' }
          ]);
        } else if (activeTab === 'transactions') {
          setTransactions([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, currentPage, transactionFilters, refreshTrigger]);

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchLower)) ||
      (product.code && product.code.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower))
    );
  });

  // Handle inventory adjustment
  const handleAdjustInventory = async () => {
    if (!selectedProduct || adjustmentQuantity === '') {
      return;
    }
    
    const quantity = parseInt(adjustmentQuantity);
    
    try {
      await adjustInventory({
        productId: selectedProduct._id,
        quantity,
        notes: adjustmentNotes
      });
      
      // Reset form and refresh data
      setSelectedProduct(null);
      setAdjustmentQuantity('');
      setAdjustmentNotes('');
      setShowAdjustmentModal(false);
      setRefreshTrigger(prev => prev + 1);
      
    } catch (err) {
      console.error('Error adjusting inventory:', err);
      setError('Failed to adjust inventory. Please try again.');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setTransactionFilters({
      product: '',
      type: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  // Render inventory dashboard
  const renderDashboard = () => (
    <div className="inventory-dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-title">Total Inventory Value</div>
          <div className="stat-value">{formatCurrency(inventoryValue.totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Cost</div>
          <div className="stat-value">{formatCurrency(inventoryValue.totalCost)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Potential Profit</div>
          <div className="stat-value">{formatCurrency(inventoryValue.potentialProfit)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Products</div>
          <div className="stat-value">{inventoryValue.productCount}</div>
        </div>
      </div>
      
      <div className="inventory-alerts">
        <div className="card mb-4">
          <div className="card-header bg-warning text-white">
            <h5 className="mb-0">Low Stock Products</h5>
          </div>
          <div className="card-body p-0">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-3">No low stock products</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product._id}>
                        <td>{product.code}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>
                          <span className="badge bg-warning">{product.SOH}</span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowAdjustmentModal(true);
                            }}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Out of Stock Products</h5>
          </div>
          <div className="card-body p-0">
            {outOfStockProducts.length === 0 ? (
              <div className="text-center py-3">No out of stock products</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outOfStockProducts.map(product => (
                      <tr key={product._id}>
                        <td>{product.code}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowAdjustmentModal(true);
                            }}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render products list
  const renderProducts = () => (
    <div className="inventory-products">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={() => setSearchTerm('')}
            >
              <i className="fa fa-times"></i>
            </button>
          )}
        </div>
        <div>
          <button 
            className="btn btn-success me-2"
            onClick={() => setShowAddProductModal(true)}
          >
            <i className="fa fa-plus"></i> Add Product
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedProduct(null);
              setShowAdjustmentModal(true);
            }}
          >
            <i className="fa fa-wrench"></i> Adjust Inventory
          </button>
        </div>
      </div>
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Product Inventory</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-3">No products found</td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product._id}>
                      <td>{product.code}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`badge ${
                          product.SOH === 0 ? 'bg-danger' : 
                          product.SOH <= 5 ? 'bg-warning' : 'bg-success'
                        }`}>
                          {product.SOH}
                        </span>
                      </td>
                      <td>{formatCurrency(product.costPrice || 0)}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{formatCurrency(product.SOH * product.price)}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowAdjustmentModal(true);
                          }}
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Render transactions list
  const renderTransactions = () => (
    <div className="inventory-transactions">
      <div className="card mb-3">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Transaction Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Transaction Type</label>
              <select 
                className="form-select"
                value={transactionFilters.type}
                onChange={e => setTransactionFilters({
                  ...transactionFilters,
                  type: e.target.value
                })}
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-control"
                value={transactionFilters.startDate}
                onChange={e => setTransactionFilters({
                  ...transactionFilters,
                  startDate: e.target.value
                })}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-control"
                value={transactionFilters.endDate}
                onChange={e => setTransactionFilters({
                  ...transactionFilters,
                  endDate: e.target.value
                })}
              />
            </div>
            <div className="col-md-3 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-secondary me-2"
                onClick={resetFilters}
              >
                Reset
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentPage(1)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Inventory Transactions</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Previous Stock</th>
                  <th>New Stock</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-3">No transactions found</td>
                  </tr>
                ) : (
                  transactions.map(transaction => (
                    <tr key={transaction._id}>
                      <td>{new Date(transaction.date).toLocaleString()}</td>
                      <td>{transaction.product?.name || 'Unknown Product'}</td>
                      <td>
                        <span className={`badge ${
                          transaction.type === 'purchase' ? 'bg-success' :
                          transaction.type === 'sale' ? 'bg-info' :
                          transaction.type === 'adjustment' ? 'bg-warning' :
                          transaction.type === 'return' ? 'bg-secondary' :
                          transaction.type === 'transfer_in' ? 'bg-primary' :
                          transaction.type === 'transfer_out' ? 'bg-danger' : 'bg-dark'
                        }`}>
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={transaction.quantity >= 0 ? 'text-success' : 'text-danger'}>
                          {transaction.quantity >= 0 ? '+' : ''}{transaction.quantity}
                        </span>
                      </td>
                      <td>{transaction.previousQuantity}</td>
                      <td>{transaction.newQuantity}</td>
                      <td>{transaction.reference || '-'}</td>
                      <td>{transaction.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );

  // Render adjustment modal
  const renderAdjustmentModal = () => (
    <div className="modal" style={{ display: showAdjustmentModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Adjust Inventory</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowAdjustmentModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            {selectedProduct ? (
              <div>
                <div className="mb-3">
                  <label className="form-label">Product</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedProduct.name}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Current Stock</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedProduct.SOH}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Adjustment Quantity</label>
                  <div className="input-group">
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setAdjustmentQuantity(prev => {
                        const current = parseInt(prev) || 0;
                        return (current - 1).toString();
                      })}
                    >-</button>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={adjustmentQuantity}
                      onChange={e => setAdjustmentQuantity(e.target.value)}
                      placeholder="Enter quantity (positive to add, negative to remove)"
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setAdjustmentQuantity(prev => {
                        const current = parseInt(prev) || 0;
                        return (current + 1).toString();
                      })}
                    >+</button>
                  </div>
                  <small className="form-text text-muted">
                    Enter a positive number to add stock, or a negative number to remove stock.
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-control" 
                    value={adjustmentNotes}
                    onChange={e => setAdjustmentNotes(e.target.value)}
                    placeholder="Enter reason for adjustment"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label">Select Product</label>
                <select 
                  className="form-select"
                  onChange={e => {
                    const product = products.find(p => p._id === e.target.value);
                    setSelectedProduct(product);
                  }}
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} (Current Stock: {product.SOH})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowAdjustmentModal(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleAdjustInventory}
              disabled={!selectedProduct || adjustmentQuantity === ''}
            >
              Save Adjustment
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="inventory-management-container">
      <h2 className="mb-4">Inventory Management</h2>
      
      {/* Error message */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}
      
      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </li>
      </ul>
      
      {/* Loading indicator */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading inventory data...</p>
        </div>
      ) : (
        <>
          {/* Content based on active tab */}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'transactions' && renderTransactions()}
        </>
      )}
      
      {/* Adjustment Modal */}
      {renderAdjustmentModal()}
    </div>
  );
};

export default InventoryManagement;

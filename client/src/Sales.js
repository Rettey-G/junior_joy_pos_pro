import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.js';
import api from './api';
import './styles.css';

const Sales = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [billNumber, setBillNumber] = useState('');
  const [showBill, setShowBill] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  
  // Constants for tax and service charge
  const GST_RATE = 0.16; // 16%
  const SERVICE_CHARGE_RATE = 0.10; // 10%

  useEffect(() => {
    // Fetch products
    fetchProducts();
    
    // Generate a unique bill number
    generateBillNumber();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const generateBillNumber = () => {
    // Generate a bill number with format: YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    
    setBillNumber(`${year}${month}${day}-${random}`);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    return (
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const addToCart = (product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart with quantity 1
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item._id === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  // Calculate subtotal (before tax and service charge)
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate GST amount
  const calculateGST = () => {
    return calculateSubtotal() * GST_RATE;
  };

  // Calculate service charge amount
  const calculateServiceCharge = () => {
    return calculateSubtotal() * SERVICE_CHARGE_RATE;
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  // Calculate total amount
  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST() + calculateServiceCharge() - calculateDiscount();
  };

  // Calculate change to give to customer
  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    const total = calculateTotal();
    return paid > total ? paid - total : 0;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before checkout');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    try {
      // Prepare sale data
      const saleData = {
        billNumber,
        customer: customerName,
        products: cart.map(item => ({
          product: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: calculateSubtotal(),
        gst: calculateGST(),
        serviceCharge: calculateServiceCharge(),
        discount: calculateDiscount(),
        total: calculateTotal(),
        paymentMethod: 'Cash',
        amountPaid: parseFloat(amountPaid) || 0,
        change: calculateChange(),
        cashier: user.name,
        status: 'Completed',
        notes: ''
      };

      // Save sale to database
      const response = await api.post('/api/sales', saleData);
      
      // Update completed sale state
      setCompletedSale(response.data);
      
      // Show bill
      setShowBill(true);
      
      // Clear cart after successful checkout
      setCart([]);
      setCustomerName('');
      setDiscount(0);
      setAmountPaid('');
      
      // Generate new bill number for next sale
      generateBillNumber();
      
    } catch (err) {
      setError('Failed to process checkout: ' + (err.response?.data?.message || err.message));
    }
  };

  const printBill = () => {
    window.print();
  };

  if (loading) return <div className="text-center mt-4">Loading products...</div>;
  if (error) return <div className="text-center mt-4 text-danger">{error}</div>;

  return (
    <div className="sales-container">
      <h2 className="mb-4">New Sale</h2>
      
      {/* Bill View (shows when checkout is complete) */}
      {showBill && completedSale && (
        <div className="bill-container">
          <div className="bill-header">
            <h2>Junior Joy POS</h2>
            <h3>Sales Receipt</h3>
            <p>Bill #: {completedSale.billNumber}</p>
            <p>Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
          </div>
          
          <div className="bill-info">
            <p><strong>Customer:</strong> {completedSale.customer}</p>
            <p><strong>Cashier:</strong> {completedSale.cashier}</p>
          </div>
          
          <div className="bill-items">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {completedSale.products.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>MVR {item.price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>MVR {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bill-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>MVR {completedSale.subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>GST (16%):</span>
              <span>MVR {completedSale.gst.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Service Charge (10%):</span>
              <span>MVR {completedSale.serviceCharge.toFixed(2)}</span>
            </div>
            {completedSale.discount > 0 && (
              <div className="total-row">
                <span>Discount:</span>
                <span>MVR {completedSale.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>MVR {completedSale.total.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Amount Paid:</span>
              <span>MVR {completedSale.amountPaid.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Change:</span>
              <span>MVR {completedSale.change.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="bill-footer">
            <p>Thank you for your business!</p>
          </div>
          
          <div className="bill-actions">
            <button 
              onClick={printBill}
              className="btn btn-success"
            >
              Print Receipt
            </button>
            <button 
              onClick={() => setShowBill(false)}
              className="btn btn-primary"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
      
      {!showBill && (
        <div className="sales-container">
          {/* Product Selection */}
          <div className="products-section">
            <h3>Products</h3>
            
            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search products by name, code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Product Grid */}
            <div className="product-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product._id} 
                  onClick={() => addToCart(product)}
                  className="product-card"
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div className="product-name">{product.name}</div>
                  <div className="product-category">Code: {product.code}</div>
                  <div className="product-price">MVR {product.price.toFixed(2)}</div>
                  <div className={`product-stock ${product.SOH > 10 ? 'stock-available' : product.SOH > 0 ? 'stock-low' : 'stock-out'}`}>
                    Stock: {product.SOH}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Cart and Checkout */}
          <div className="cart-section">
            <h3>Cart</h3>
            
            {/* Customer Information */}
            <div className="mb-4">
              <div className="form-group">
                <label className="form-label">Customer Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Bill Number:</label>
                <input
                  type="text"
                  className="form-control"
                  value={billNumber}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Discount (%):</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                />
              </div>
            </div>
            
            {/* Cart Items */}
            {cart.length === 0 ? (
              <p className="cart-empty">No items in cart. Click on products to add them.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>MVR {item.price.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="quantity-control">
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="quantity-button"
                            >
                              -
                            </button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="quantity-button"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>MVR {(item.price * item.quantity).toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => removeFromCart(item._id)}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Totals and Checkout */}
            {cart.length > 0 && (
              <div>
                <div style={{ marginLeft: 'auto', width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Subtotal:</span>
                    <span>MVR {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>GST (16%):</span>
                    <span>MVR {calculateGST().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Service Charge (10%):</span>
                    <span>MVR {calculateServiceCharge().toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>Discount ({discount}%):</span>
                      <span>MVR {calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                    <span>Total:</span>
                    <span>MVR {calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Amount Paid:</label>
                    <input
                      type="number"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                      placeholder="Enter amount paid"
                    />
                  </div>
                  
                  {parseFloat(amountPaid) >= calculateTotal() && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontWeight: 'bold', color: '#4CAF50' }}>
                      <span>Change:</span>
                      <span>MVR {calculateChange().toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || !customerName.trim() || parseFloat(amountPaid) < calculateTotal()}
                    style={{ 
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      opacity: (cart.length === 0 || !customerName.trim() || parseFloat(amountPaid) < calculateTotal()) ? 0.5 : 1
                    }}
                  >
                    Complete Sale
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

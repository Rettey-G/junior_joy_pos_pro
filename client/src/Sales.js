import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.js';
import api from './api';

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

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>New Sale</h2>
      
      {/* Bill View (shows when checkout is complete) */}
      {showBill && completedSale && (
        <div className="bill-container" style={{ 
          border: '1px solid #ddd', 
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2>Junior Joy POS</h2>
            <h3>Sales Receipt</h3>
            <p>Bill #: {completedSale.billNumber}</p>
            <p>Date: {new Date(completedSale.createdAt).toLocaleString()}</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Customer:</strong> {completedSale.customer}</p>
            <p><strong>Cashier:</strong> {completedSale.cashier}</p>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {completedSale.products.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.name}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>MVR {item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>MVR {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginLeft: 'auto', width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Subtotal:</span>
              <span>MVR {completedSale.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>GST (16%):</span>
              <span>MVR {completedSale.gst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Service Charge (10%):</span>
              <span>MVR {completedSale.serviceCharge.toFixed(2)}</span>
            </div>
            {completedSale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Discount:</span>
                <span>MVR {completedSale.discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
              <span>Total:</span>
              <span>MVR {completedSale.total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Amount Paid:</span>
              <span>MVR {completedSale.amountPaid.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Change:</span>
              <span>MVR {completedSale.change.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <p>Thank you for your business!</p>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={printBill}
              style={{ 
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Print Receipt
            </button>
            <button 
              onClick={() => setShowBill(false)}
              style={{ 
                background: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              New Sale
            </button>
          </div>
        </div>
      )}
      
      {!showBill && (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Product Selection */}
          <div style={{ flex: '1' }}>
            <h3>Products</h3>
            
            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search products by name, code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              />
            </div>
            
            {/* Product Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {filteredProducts.map(product => (
                <div 
                  key={product._id} 
                  onClick={() => addToCart(product)}
                  style={{ 
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    backgroundColor: 'white'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                  <div style={{ color: '#666', fontSize: '0.9em' }}>Code: {product.code}</div>
                  <div style={{ marginTop: '5px' }}>MVR {product.price.toFixed(2)}</div>
                  <div style={{ color: product.SOH > 0 ? '#4CAF50' : '#f44336', fontSize: '0.9em' }}>
                    Stock: {product.SOH}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Cart and Checkout */}
          <div style={{ flex: '1', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
            <h3>Cart</h3>
            
            {/* Customer Information */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Customer Name:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Bill Number:</label>
                <input
                  type="text"
                  value={billNumber}
                  readOnly
                  style={{ width: '100%', padding: '8px', backgroundColor: '#f5f5f5' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Discount (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>
            
            {/* Cart Items */}
            {cart.length === 0 ? (
              <p>No items in cart. Click on products to add them.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{item.name}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>MVR {item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            style={{ 
                              background: '#f1f1f1',
                              border: 'none',
                              width: '25px',
                              height: '25px',
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          <span style={{ margin: '0 10px' }}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            style={{ 
                              background: '#f1f1f1',
                              border: 'none',
                              width: '25px',
                              height: '25px',
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>MVR {(item.price * item.quantity).toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <button 
                          onClick={() => removeFromCart(item._id)}
                          style={{ 
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

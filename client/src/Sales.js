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
      if (response && response.data) {
        // Make sure all numeric fields are actually numbers
        const processedSale = {
          ...response.data,
          subtotal: Number(response.data.subtotal || 0),
          gst: Number(response.data.gst || 0),
          serviceCharge: Number(response.data.serviceCharge || 0),
          discount: Number(response.data.discount || 0),
          total: Number(response.data.total || 0),
          amountPaid: Number(response.data.amountPaid || 0),
          change: Number(response.data.change || 0),
          // Ensure customer is a string
          customer: String(response.data.customer || ''),
          // Ensure cashier is a string
          cashier: String(response.data.cashier || ''),
          // Ensure products is an array
          products: Array.isArray(response.data.products) ? response.data.products : []
        };
        setCompletedSale(processedSale);
      }
      
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
    <div className="sales-container" style={{flexDirection: 'column', gap: '32px', maxWidth: 1200, margin: '0 auto', padding: '24px 8px'}}>
      <h2 className="mb-4" style={{marginBottom: 32, color: '#1976d2'}}>New Sale</h2>
      <div className="card" style={{marginBottom: 32}}>
        <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <label className="form-label">Customer Name</label>
            <input className="form-control" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name..." required />
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
            <div style={{flex: 2, minWidth: 200}}>
              <label className="form-label">Search Products</label>
              <input className="form-control" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name, code, or category..." />
              <div className="product-grid" style={{marginTop: 16}}>
                {filteredProducts.slice(0, 10).map(product => (
                  <div className="product-card" key={product._id} onClick={() => addToCart(product)} style={{marginBottom: 8}}>
                    <div className="product-name">{product.name}</div>
                    <div className="product-category">{product.category}</div>
                    <div className="product-price">MVR {product.price.toFixed(2)}</div>
                  </div>
                ))}
                {filteredProducts.length === 0 && <div style={{color: '#888', padding: '8px 0'}}>No products found.</div>}
              </div>
            </div>
            <div style={{flex: 1, minWidth: 260}}>
              <label className="form-label">Cart</label>
              <div className="cart-section" style={{background: '#f9fbfd', borderRadius: 8, boxShadow: '0 1px 4px rgba(33,150,243,0.07)', padding: 12}}>
                {cart.length === 0 ? (
                  <div className="cart-empty">Cart is empty</div>
                ) : (
                  cart.map(item => (
                    <div className="cart-item" key={item._id}>
                      <div style={{flex: 1}}>{item.name}</div>
                      <div className="quantity-control">
                        <button className="quantity-button" onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button className="quantity-button" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                      </div>
                      <div style={{width: 60, textAlign: 'right'}}>MVR {(item.price * item.quantity).toFixed(2)}</div>
                      <button className="btn btn-danger btn-sm" style={{marginLeft: 8}} onClick={() => removeFromCart(item._id)}>Remove</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
            <div style={{flex: 1, minWidth: 180}}>
              <label className="form-label">Discount (%)</label>
              <input className="form-control" type="number" min={0} max={100} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
            <div style={{flex: 1, minWidth: 180}}>
              <label className="form-label">Amount Paid</label>
              <input className="form-control" type="number" min={0} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
            </div>
          </div>
          <div className="cart-totals" style={{marginTop: 16}}>
            <div className="total-row"><span>Subtotal:</span> <span>MVR {calculateSubtotal().toFixed(2)}</span></div>
            <div className="total-row"><span>GST (16%):</span> <span>MVR {calculateGST().toFixed(2)}</span></div>
            <div className="total-row"><span>Service Charge (10%):</span> <span>MVR {calculateServiceCharge().toFixed(2)}</span></div>
            <div className="total-row"><span>Discount:</span> <span>- MVR {calculateDiscount().toFixed(2)}</span></div>
            <div className="total-row grand-total"><span>Total:</span> <span>MVR {calculateTotal().toFixed(2)}</span></div>
            <div className="total-row"><span>Change:</span> <span>MVR {calculateChange().toFixed(2)}</span></div>
          </div>
          <button className="btn btn-primary" style={{marginTop: 16, minWidth: 160}} onClick={handleCheckout}>Complete Sale & Generate Bill</button>
        </div>
      </div>
      
      {/* Bill View (shows when checkout is complete) */}
      {showBill && completedSale && (
        <div className="bill-container" style={{marginTop: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,150,243,0.08)', padding: 24, maxWidth: 600, margin: '32px auto'}}>
          <div className="bill-header" style={{marginBottom: 24}}>
            <h2 style={{color: '#1976d2'}}>Junior Joy POS</h2>
            <div style={{fontSize: '1.1rem', marginTop: 8}}>Bill No: {completedSale.billNumber}</div>
            <div style={{fontSize: '1.1rem'}}>Customer: {completedSale.customer}</div>
            <div style={{fontSize: '1.1rem'}}>Cashier: {completedSale.cashier}</div>
          </div>
          <table className="table" style={{marginBottom: 24}}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {completedSale.products.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>MVR {item.price.toFixed(2)}</td>
                  <td>MVR {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cart-totals">
            <div className="total-row"><span>Subtotal:</span> <span>MVR {completedSale.subtotal.toFixed(2)}</span></div>
            <div className="total-row"><span>GST:</span> <span>MVR {completedSale.gst.toFixed(2)}</span></div>
            <div className="total-row"><span>Service Charge:</span> <span>MVR {completedSale.serviceCharge.toFixed(2)}</span></div>
            <div className="total-row"><span>Discount:</span> <span>- MVR {completedSale.discount.toFixed(2)}</span></div>
            <div className="total-row grand-total"><span>Total:</span> <span>MVR {completedSale.total.toFixed(2)}</span></div>
            <div className="total-row"><span>Paid:</span> <span>MVR {completedSale.amountPaid.toFixed(2)}</span></div>
            <div className="total-row"><span>Change:</span> <span>MVR {completedSale.change.toFixed(2)}</span></div>
          </div>
          <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24}}>
            <button className="btn btn-primary" style={{minWidth: 160}} onClick={printBill}>Print Bill</button>
            <button className="btn btn-secondary" style={{minWidth: 160}} onClick={() => setShowBill(false)}>New Sale</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

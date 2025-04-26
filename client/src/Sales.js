import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.js';
import api from './api';
import { safeRender, formatCurrency } from './utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  
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
      setLoading(true);
      const response = await api.get('/api/products?limit=1000'); // Increase limit to get all products
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
    } finally {
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
    if (!searchTerm) return true; // Show all products when no search term
    
    // Safe search that handles null/undefined values
    const productName = (product.name || '').toLowerCase();
    const productCode = (product.code || '').toLowerCase();
    const productCategory = (product.category || '').toLowerCase();
    const productDetails = (product.details || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      productName.includes(searchLower) ||
      productCode.includes(searchLower) ||
      productCategory.includes(searchLower) ||
      productDetails.includes(searchLower)
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
        paymentMethod: paymentMethod,
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
          products: Array.isArray(response.data.products) ? response.data.products : [],
          // Ensure payment method is a string
          paymentMethod: String(response.data.paymentMethod || 'Cash')
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
      setPaymentMethod('Cash');
      
      // Generate new bill number for next sale
      generateBillNumber();
      
    } catch (err) {
      setError('Failed to process checkout: ' + (err.response?.data?.message || err.message));
    }
  };

  const printBill = () => {
    // Add a class to the body for print-specific styling
    document.body.classList.add('printing-bill');
    
    // Print the document
    window.print();
    
    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove('printing-bill');
    }, 500);
  };

  const generatePDF = () => {
    if (!completedSale) {
      alert('No sale data available');
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Add business logo and info
      doc.setFontSize(20);
      doc.setTextColor(25, 118, 210); // #1976d2
      doc.text('Junior Joy POS', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Professional Point of Sale System', 105, 28, { align: 'center' });
      
      // Add invoice details
      doc.setFontSize(14);
      doc.text('INVOICE', 105, 40, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Bill No: ${completedSale.billNumber}`, 20, 50);
      doc.text(`Date: ${new Date(completedSale.createdAt || Date.now()).toLocaleString()}`, 20, 55);
      doc.text(`Customer: ${safeRender(completedSale.customer)}`, 20, 60);
      doc.text(`Cashier: ${safeRender(completedSale.cashier)}`, 20, 65);
      doc.text(`Payment Method: ${safeRender(completedSale.paymentMethod || 'Cash')}`, 20, 70);
      
      // Add products table
      const tableColumn = ["Item", "Qty", "Price", "Total"];
      const tableRows = [];
      
      completedSale.products.forEach(item => {
        const itemData = [
          safeRender(item.name),
          item.quantity,
          `MVR ${Number(item.price).toFixed(2)}`,
          `MVR ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
        ];
        tableRows.push(itemData);
      });
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [25, 118, 210] }
      });
      
      // Add totals
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.text(`Subtotal:`, 130, finalY);
      doc.text(`MVR ${completedSale.subtotal.toFixed(2)}`, 170, finalY, { align: 'right' });
      
      doc.text(`GST (16%):`, 130, finalY + 5);
      doc.text(`MVR ${completedSale.gst.toFixed(2)}`, 170, finalY + 5, { align: 'right' });
      
      doc.text(`Service Charge (10%):`, 130, finalY + 10);
      doc.text(`MVR ${completedSale.serviceCharge.toFixed(2)}`, 170, finalY + 10, { align: 'right' });
      
      doc.text(`Discount:`, 130, finalY + 15);
      doc.text(`MVR ${completedSale.discount.toFixed(2)}`, 170, finalY + 15, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text(`Total:`, 130, finalY + 22);
      doc.text(`MVR ${completedSale.total.toFixed(2)}`, 170, finalY + 22, { align: 'right' });
      
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 130, finalY + 30);
      doc.text(`MVR ${completedSale.amountPaid.toFixed(2)}`, 170, finalY + 30, { align: 'right' });
      
      doc.text(`Change:`, 130, finalY + 35);
      doc.text(`MVR ${completedSale.change.toFixed(2)}`, 170, finalY + 35, { align: 'right' });
      
      // Save the PDF with a proper filename
      doc.save(`Bill-${completedSale.billNumber}-${new Date().getTime()}.pdf`);
    
    // Add footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, finalY + 50, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Please keep this invoice for your records.', 105, finalY + 55, { align: 'center' });
    
    // Save the PDF
    doc.save(`Invoice-${completedSale.billNumber}.pdf`);
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
              <div className="product-container" style={{ width: '100%', height: '400px', overflow: 'auto' }}>
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Products</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-group mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    {loading ? (
                      <div className="text-center">
                        <div className="spinner-border" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="alert alert-danger">{error}</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="alert alert-info">No products found</div>
                    ) : (
                      <div className="product-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredProducts.map(product => (
                          <div key={product._id} className="product-card" onClick={() => addToCart(product)}>
                            <div className="product-name">{product.name}</div>
                            <div className="product-price">{formatCurrency(product.price)}</div>
                            <div className="product-stock">Stock: {product.stock}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
              <label className="form-label">Payment Method</label>
              <select 
                className="form-control" 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
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
          <button 
            className="btn btn-primary" 
            style={{marginTop: 16, minWidth: 160}} 
            onClick={handleCheckout}
            disabled={cart.length === 0 || !customerName.trim() || parseFloat(amountPaid) < calculateTotal()}
          >
            Complete Sale & Generate Bill
          </button>
        </div>
      </div>
      
      {/* Bill View (shows when checkout is complete) */}
      {showBill && completedSale && (
        <div className="bill-container" style={{marginTop: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,150,243,0.08)', padding: 24, maxWidth: 600, margin: '32px auto'}}>
          <div className="bill-header" style={{marginBottom: 24}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h2 style={{color: '#1976d2', margin: 0}}>Junior Joy POS</h2>
                <p style={{margin: '4px 0 0 0', color: '#666'}}>Professional Point of Sale System</p>
              </div>
              <img 
                src="https://i.imgur.com/8bGJQem.png" 
                alt="Junior Joy Logo" 
                style={{width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #bbdefb', boxShadow: '0 2px 8px rgba(33,150,243,0.15)'}} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+';              
                }}
              />
            </div>
            <div style={{fontSize: '1.1rem', marginTop: 16, textAlign: 'center', fontWeight: 'bold'}}>INVOICE</div>
            <div style={{marginTop: 8, textAlign: 'center'}}>Bill No: {completedSale.billNumber}</div>
            <div style={{textAlign: 'center'}}>Date: {new Date(completedSale.createdAt || Date.now()).toLocaleString()}</div>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
            <div>
              <div style={{fontWeight: 'bold', marginBottom: 4}}>Customer:</div>
              <div>{safeRender(completedSale.customer)}</div>
            </div>
            <div>
              <div style={{fontWeight: 'bold', marginBottom: 4}}>Cashier:</div>
              <div>{safeRender(completedSale.cashier)}</div>
            </div>
          </div>
          
          <div style={{marginBottom: 8}}>
            <div style={{fontWeight: 'bold', marginBottom: 4}}>Payment Method:</div>
            <div>{safeRender(completedSale.paymentMethod || 'Cash')}</div>
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
                  <td>{safeRender(item.name)}</td>
                  <td>{item.quantity}</td>
                  <td>MVR {Number(item.price).toFixed(2)}</td>
                  <td>MVR {(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
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
          <div style={{marginTop: 24, textAlign: 'center'}}>
            <div style={{fontWeight: 'bold', marginBottom: 4}}>Thank you for your business!</div>
            <div style={{fontSize: '0.9rem', color: '#666'}}>Please keep this invoice for your records.</div>
          </div>
          <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24}}>
            <button className="btn btn-primary" style={{minWidth: 120}} onClick={printBill}>
              Print Bill
            </button>
            <button className="btn btn-success" style={{minWidth: 120}} onClick={generatePDF}>
              Save as PDF
            </button>
            <button className="btn btn-secondary" style={{minWidth: 120}} onClick={() => setShowBill(false)}>
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

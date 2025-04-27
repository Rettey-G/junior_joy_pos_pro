import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.js';
import api, { createSale, getProducts } from './api';
import { safeRender, formatCurrency } from './utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './styles.css';
import './SalesStyles.css';

const Sales = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [billNumber, setBillNumber] = useState('');
  const [showBill, setShowBill] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const searchInputRef = useRef(null);
  
  // Constants for tax and service charge
  const GST_RATE = 0.16; // 16%
  const SERVICE_CHARGE_RATE = 0.10; // 10%

  useEffect(() => {
    // Fetch products
    fetchProducts();
    
    // Generate a unique bill number
    generateBillNumber();
    
    // Focus on search input when component mounts
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Set up keyboard shortcuts
    const handleKeyDown = (e) => {
      // Alt+S to focus search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      
      // Alt+C to checkout (if cart is not empty)
      if (e.altKey && e.key === 'c' && cart.length > 0 && customerName.trim() && parseFloat(amountPaid) >= calculateTotal()) {
        e.preventDefault();
        handleCheckout();
      }
      
      // Alt+N for new sale (if showing bill)
      if (e.altKey && e.key === 'n' && showBill) {
        e.preventDefault();
        setShowBill(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cart, customerName, amountPaid]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      // Ensure we have product data
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data structure
        setProducts(response.data.data);
        setFilteredProducts(response.data.data);
      } else {
        // Fallback to mock data if API returns unexpected format
        const mockProducts = [
          { id: '1', name: 'VG GUTTER R2 PIPE CONNECTOR PVC', price: 37.80, stock: 100, category: 'PVC' },
          { id: '2', name: 'VG GUTTER R2 PIPE LOCK BRACKET PVC', price: 29.16, stock: 100, category: 'PVC' },
          { id: '3', name: 'VG GUTTER R2 ELBOW 90DEG PVC', price: 61.00, stock: 100, category: 'PVC' },
          { id: '4', name: 'VG GUTTER R2 PIPE PVC', price: 37.80, stock: 100, category: 'PVC' },
          { id: '5', name: 'VG GUTTER R2Y ELBOW 90DEG PVC', price: 86.40, stock: 100, category: 'PVC' }
        ];
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      
      // Fallback to mock data on error
      const mockProducts = [
        { id: '1', name: 'VG GUTTER R2 PIPE CONNECTOR PVC', price: 37.80, stock: 100, category: 'PVC' },
        { id: '2', name: 'VG GUTTER R2 PIPE LOCK BRACKET PVC', price: 29.16, stock: 100, category: 'PVC' },
        { id: '3', name: 'VG GUTTER R2 ELBOW 90DEG PVC', price: 61.00, stock: 100, category: 'PVC' },
        { id: '4', name: 'VG GUTTER R2 PIPE PVC', price: 37.80, stock: 100, category: 'PVC' },
        { id: '5', name: 'VG GUTTER R2Y ELBOW 90DEG PVC', price: 86.40, stock: 100, category: 'PVC' }
      ];
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
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
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const addToCart = (product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart with quantity 1
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // Clear search term after adding to cart
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    // If quantity is zero, remove the item from cart
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }
    
    // If quantity is negative, don't update
    if (newQuantity < 0) return;
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  // Calculate subtotal (before tax and service charge)
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      setError('Please add items to cart before checkout');
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    try {
      // Prepare sale data
      const saleData = {
        billNumber,
        customer: customerName,
        customerPhone: customerPhone,
        products: cart.map(item => ({
          product: item.id,
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
        notes: notes
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
      setCustomerPhone('');
      setDiscount(0);
      setAmountPaid('');
      setPaymentMethod('Cash');
      setNotes('');
      
      // Generate new bill number for next sale
      generateBillNumber();
      
    } catch (err) {
      setError('Failed to process checkout: ' + (err.response?.data?.message || err.message));
    }
  };
  // Open bill in a new window
  const openBillInNewWindow = () => {
    if (!completedSale) return;
    
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (!newWindow) {
      alert('Please allow popups for this site to view the bill in a new window.');
      return;
    }
    
    // Create bill content
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${completedSale.billNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .bill-container { max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); }
          .bill-header { text-align: center; margin-bottom: 30px; }
          .bill-header h2 { color: #1976d2; margin: 0; font-size: 24px; }
          .bill-header p { margin: 5px 0; color: #757575; }
          .bill-logo { width: 100px; height: 100px; object-fit: cover; border-radius: 50%; margin-bottom: 15px; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .bill-info-item { margin-bottom: 15px; }
          .bill-info-label { font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
          th { background-color: #f5f7fa; font-weight: 600; }
          .totals { width: 300px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .grand-total { font-weight: bold; font-size: 18px; border-top: 1px solid #e0e0e0; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 30px; }
          .actions { text-align: center; margin-top: 30px; }
          .btn { padding: 10px 20px; margin: 0 5px; cursor: pointer; border-radius: 4px; font-weight: 500; transition: all 0.2s; }
          .btn-primary { background-color: #1976d2; color: white; border: none; }
          .btn-primary:hover { background-color: #1565c0; }
          .btn-success { background-color: #4caf50; color: white; border: none; }
          .btn-success:hover { background-color: #388e3c; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="bill-header">
            <img src="/juniorjoy.jpg" alt="Junior Joy Logo" class="bill-logo" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+'" />
            <h2>Junior Joy POS</h2>
            <p>Professional Point of Sale System</p>
            <h3>BILL</h3>
            <p>Bill No: ${completedSale.billNumber}</p>
            <p>Date: ${new Date(completedSale.createdAt || Date.now()).toLocaleString()}</p>
          </div>
          
          <div class="bill-info">
            <div class="bill-info-item">
              <div class="bill-info-label">Customer:</div>
              <div>${safeRender(completedSale.customer)}</div>
              ${completedSale.customerPhone ? `<div>Phone: ${safeRender(completedSale.customerPhone)}</div>` : ''}
            </div>
            <div class="bill-info-item">
              <div class="bill-info-label">Cashier:</div>
              <div>${safeRender(completedSale.cashier)}</div>
            </div>
          </div>
          
          <div class="bill-info-item">
            <div class="bill-info-label">Payment Method:</div>
            <div>${safeRender(completedSale.paymentMethod || 'Cash')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${completedSale.products.map(item => `
                <tr>
                  <td>${safeRender(item.name)}</td>
                  <td>${item.quantity}</td>
                  <td>MVR ${Number(item.price).toFixed(2)}</td>
                  <td>MVR ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span> <span>MVR ${completedSale.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>GST (16%):</span> <span>MVR ${completedSale.gst.toFixed(2)}</span></div>
            <div class="total-row"><span>Service Charge (10%):</span> <span>MVR ${completedSale.serviceCharge.toFixed(2)}</span></div>
            <div class="total-row"><span>Discount:</span> <span>- MVR ${completedSale.discount.toFixed(2)}</span></div>
            <div class="total-row grand-total"><span>Total:</span> <span>MVR ${completedSale.total.toFixed(2)}</span></div>
            <div class="total-row"><span>Paid:</span> <span>MVR ${completedSale.amountPaid.toFixed(2)}</span></div>
            <div class="total-row"><span>Change:</span> <span>MVR ${completedSale.change.toFixed(2)}</span></div>
          </div>
          
          ${completedSale.notes ? `
            <div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
              <div style="font-weight: bold; margin-bottom: 5px;">Notes:</div>
              <div>${safeRender(completedSale.notes)}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>Please keep this invoice for your records.</p>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="window.print()">Print Bill</button>
            <button class="btn btn-success" onclick="window.close()">Close</button>
          </div>
        </div>
        <script>
          // Auto-print when the window opens
          window.onload = function() {
            // Uncomment the line below to automatically print when the window opens
            // window.print();
          };
        </script>
      </body>
      </html>
    `;
    
    newWindow.document.open();
    newWindow.document.write(billContent);
    newWindow.document.close();
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
      setError('No sale data available');
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Add business logo and info
      try {
        // Add logo image
        const imgData = '/juniorjoy.jpg';
        doc.addImage(imgData, 'JPEG', 85, 10, 40, 20);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
        // Fallback to text if image fails
        doc.setFontSize(20);
        doc.setTextColor(25, 118, 210); // #1976d2
        doc.text('Junior Joy POS', 105, 20, { align: 'center' });
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Professional Point of Sale System', 105, 35, { align: 'center' });
      
      // Add bill details
      doc.setFontSize(14);
      doc.text('BILL', 105, 45, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Bill No: ${completedSale.billNumber}`, 20, 60);
      doc.text(`Date: ${new Date(completedSale.createdAt || Date.now()).toLocaleString()}`, 20, 65);
      doc.text(`Customer: ${safeRender(completedSale.customer)}`, 20, 70);
      if (completedSale.customerPhone) {
        doc.text(`Phone: ${safeRender(completedSale.customerPhone)}`, 20, 75);
      }
      doc.text(`Cashier: ${safeRender(completedSale.cashier)}`, 20, completedSale.customerPhone ? 80 : 75);
      doc.text(`Payment Method: ${safeRender(completedSale.paymentMethod || 'Cash')}`, 20, completedSale.customerPhone ? 85 : 80);
      
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
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: completedSale.customerPhone ? 95 : 90,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [25, 118, 210] }
      });
      
      // Add totals
      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 75) + 10;
      
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
      
      // Add notes if available
      if (completedSale.notes) {
        doc.text('Notes:', 20, finalY + 45);
        doc.text(completedSale.notes, 20, finalY + 50);
      }
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, finalY + (completedSale.notes ? 65 : 50), { align: 'center' });
      doc.setFontSize(8);
      doc.text('Please keep this invoice for your records.', 105, finalY + (completedSale.notes ? 70 : 55), { align: 'center' });
      
      // Save the PDF with a proper filename
      doc.save(`Bill-${completedSale.billNumber}-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };
  // Render loading state
  if (loading) {
    return (
      <div className="sales-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-container">
      {/* Sales Header */}
      <div className="sales-header">
        <h2>New Sale</h2>
        <button 
          className="refresh-button" 
          onClick={fetchProducts}
          disabled={loading}
        >
          Refresh Products
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-container">
          <p>{error}</p>
          <button 
            className="btn btn-sm btn-danger" 
            style={{ position: 'absolute', top: '10px', right: '10px' }}
            onClick={() => setError(null)}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      )}

      {/* Main Content - Show either the sales form or the bill */}
      {!showBill ? (
        <div className="sales-layout">
          {/* Left Column - Products */}
          <div className="left-column">
            {/* Customer Information */}
            <div className="customer-section">
              <div className="customer-header">
                <h3>Customer Information</h3>
              </div>
              <div className="customer-form">
                <div className="form-group">
                  <label className="form-label">Customer Name <span className="text-danger">*</span></label>
                  <input 
                    className="form-control" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="Enter customer name..." 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    className="form-control" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)} 
                    placeholder="Enter phone number..." 
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="products-section">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search products by name, code, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  ref={searchInputRef}
                />
              </div>
              
              {loading ? (
                <div className="loading">Loading products...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : filteredProducts.length === 0 ? (
                <div className="no-products">No products found. Try a different search term.</div>
              ) : (
                <div className="product-grid">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="product-card"
                      onClick={() => addToCart(product)}
                    >
                      <div className="product-name">{product.name}</div>
                      <div className="product-price">MVR {product.price.toFixed(2)}</div>
                      <div className={`product-stock ${product.stock < 10 ? 'low' : ''}`}>
                        Stock: {product.stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="right-column">
            {/* Cart Section */}
            <div className="cart-section">
              <div className="cart-header">
                <h3>Cart</h3>
                <div>
                  <span className="badge bg-primary">{cart.length} items</span>
                  {cart.length > 0 && (
                    <button 
                      className="btn btn-sm btn-danger ms-2" 
                      onClick={() => setCart([])}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {/* Cart Items */}
              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="cart-empty">
                    <i className="fa fa-shopping-cart"></i>
                    <p>Your cart is empty. Add products to get started.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div className="cart-item" key={item._id}>
                      <div className="cart-item-details">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">{formatCurrency(item.price)} each</div>
                      </div>
                      <div className="quantity-control">
                        <button 
                          className="quantity-button" 
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          className="quantity-button" 
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="cart-item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <button 
                        className="cart-item-remove" 
                        onClick={() => removeFromCart(item._id)}
                        title="Remove item"
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {/* Cart Totals */}
              <div className="cart-totals">
                <div className="total-row">
                  <span>Subtotal:</span> 
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="total-row">
                  <span>GST (16%):</span> 
                  <span>{formatCurrency(calculateGST())}</span>
                </div>
                <div className="total-row">
                  <span>Service Charge (10%):</span> 
                  <span>{formatCurrency(calculateServiceCharge())}</span>
                </div>
                <div className="total-row">
                  <span>Discount:</span> 
                  <span>- {formatCurrency(calculateDiscount())}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total:</span> 
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                {amountPaid && (
                  <>
                    <div className="total-row">
                      <span>Amount Paid:</span> 
                      <span>{formatCurrency(parseFloat(amountPaid) || 0)}</span>
                    </div>
                    <div className="total-row">
                      <span>Change:</span> 
                      <span>{formatCurrency(calculateChange())}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Payment Section */}
            <div className="payment-section">
              <div className="payment-header">
                <h3>Payment Details</h3>
              </div>
              <div className="payment-form">
                <div className="form-group">
                  <label className="form-label">Discount (%)</label>
                  <input 
                    className="form-control" 
                    type="number" 
                    min={0} 
                    max={100} 
                    value={discount} 
                    onChange={e => setDiscount(Number(e.target.value))} 
                  />
                </div>
                <div className="form-group">
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
                <div className="form-group">
                  <label className="form-label">Amount Paid <span className="text-danger">*</span></label>
                  <input 
                    className="form-control" 
                    type="number" 
                    min={0} 
                    value={amountPaid} 
                    onChange={e => setAmountPaid(e.target.value)} 
                    required
                  />
                </div>
              </div>
              
              <div className="form-group mt-3">
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-control" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Add any additional notes here..."
                  rows="2"
                ></textarea>
              </div>
              
              <button 
                className="checkout-button" 
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 || 
                  !customerName.trim() || 
                  parseFloat(amountPaid) < calculateTotal()
                }
              >
                <i className="fa fa-check-circle"></i> Complete Sale
              </button>
              
              {parseFloat(amountPaid) < calculateTotal() && amountPaid !== '' && (
                <div className="alert alert-warning mt-3" style={{ fontSize: '0.9rem' }}>
                  <i className="fa fa-exclamation-triangle"></i> Amount paid must be at least equal to the total amount.
                </div>
              )}
              
              <div className="text-center mt-3" style={{ fontSize: '0.8rem', color: '#757575' }}>
                <p>Press <kbd>Alt</kbd>+<kbd>S</kbd> to focus search, <kbd>Alt</kbd>+<kbd>C</kbd> to complete sale</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bill View */
        <div className="bill-container">
          <div className="bill-header">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <img 
                src="/juniorjoy.jpg" 
                alt="Junior Joy Logo" 
                className="bill-logo" 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginBottom: '15px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+';            
                }}
              />
              <h2 className="bill-title">Junior Joy POS</h2>
              <p className="bill-subtitle">Professional Point of Sale System</p>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '15px 0 5px' }}>BILL</div>
              <p>Bill No: {completedSale.billNumber}</p>
              <p>Date: {new Date(completedSale.createdAt || Date.now()).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bill-info">
            <div className="bill-info-item">
              <div className="bill-info-label">Customer:</div>
              <div>{safeRender(completedSale.customer)}</div>
              {completedSale.customerPhone && (
                <div style={{ marginTop: '5px' }}>Phone: {safeRender(completedSale.customerPhone)}</div>
              )}
            </div>
            <div className="bill-info-item">
              <div className="bill-info-label">Cashier:</div>
              <div>{safeRender(completedSale.cashier)}</div>
              <div style={{ marginTop: '5px' }}>Payment: {safeRender(completedSale.paymentMethod || 'Cash')}</div>
            </div>
          </div>
          
          <table className="bill-table">
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
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="bill-totals">
            <div className="total-row"><span>Subtotal:</span> <span>{formatCurrency(completedSale.subtotal)}</span></div>
            <div className="total-row"><span>GST (16%):</span> <span>{formatCurrency(completedSale.gst)}</span></div>
            <div className="total-row"><span>Service Charge (10%):</span> <span>{formatCurrency(completedSale.serviceCharge)}</span></div>
            <div className="total-row"><span>Discount:</span> <span>- {formatCurrency(completedSale.discount)}</span></div>
            <div className="total-row grand-total"><span>Total:</span> <span>{formatCurrency(completedSale.total)}</span></div>
            <div className="total-row"><span>Paid:</span> <span>{formatCurrency(completedSale.amountPaid)}</span></div>
            <div className="total-row"><span>Change:</span> <span>{formatCurrency(completedSale.change)}</span></div>
          </div>
          
          {completedSale.notes && (
            <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Notes:</div>
              <div>{safeRender(completedSale.notes)}</div>
            </div>
          )}
          
          <div style={{ textAlign: 'center', margin: '25px 0' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Thank you for your business!</p>
            <p style={{ fontSize: '0.9rem', color: '#757575' }}>Please keep this invoice for your records.</p>
          </div>
          
          <div className="bill-actions">
            <button 
              className="bill-button bill-button-primary" 
              onClick={openBillInNewWindow}
            >
              <i className="fa fa-external-link"></i> Open in New Window
            </button>
            <button 
              className="bill-button bill-button-success" 
              onClick={generatePDF}
            >
              <i className="fa fa-file-pdf-o"></i> Save as PDF
            </button>
            <button 
              className="bill-button bill-button-secondary" 
              onClick={() => setShowBill(false)}
            >
              <i className="fa fa-plus-circle"></i> New Sale
            </button>
          </div>
          
          <div className="text-center mt-3" style={{ fontSize: '0.8rem', color: '#757575' }}>
            <p>Press <kbd>Alt</kbd>+<kbd>N</kbd> to start a new sale</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

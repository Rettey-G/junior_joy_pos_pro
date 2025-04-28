import React, { useEffect, useState } from 'react';
import { getSales, updateSale, deleteSale } from './api';
import { safeRender, formatCurrency } from './utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './styles.css';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);
  const [editLines, setEditLines] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fallbackBills = [
    {
      _id: '1001',
      billNumber: '1001',
      createdAt: '2025-04-25',
      customer: { name: 'Demo Customer' },
      total: 100.00,
      products: [
        { name: 'Item 1', quantity: 2, price: 20.00 },
        { name: 'Item 2', quantity: 1, price: 30.00 },
      ],
      cashier: 'Admin User'
    },
    {
      _id: '1002',
      billNumber: '1002',
      createdAt: '2025-04-24',
      customer: { name: 'Test Customer' },
      total: 200.00,
      products: [
        { name: 'Item 3', quantity: 3, price: 40.00 },
        { name: 'Item 4', quantity: 2, price: 50.00 },
      ],
      cashier: 'Admin User'
    }
  ];

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting to fetch bills from API...");
      
      const response = await getSales(1, 100); // fetch up to 100 bills
      console.log("API Response received:", response);
      
      if (response && response.data) {
        // Check various possible response formats
        if (response.data.sales && Array.isArray(response.data.sales)) {
          console.log("Bills found in API response sales array:", response.data.sales.length);
          setBills(response.data.sales);
        } else if (Array.isArray(response.data)) {
          console.log("Bills found in API response array:", response.data.length);
          setBills(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log("Bills found in API response data array:", response.data.data.length);
          setBills(response.data.data);
        } else {
          console.log("No bills array found in response, using fallback data");
          setBills(fallbackBills);
          setError('Could not find bills data in API response - showing demo data.');
        }
      } else {
        console.log("Invalid API response structure, using fallback data");
        setBills(fallbackBills);
        setError('Invalid API response - showing demo data.');
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
      setBills(fallbackBills);
      setError(`API Error: ${err.message} - showing demo data.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bill) => {
    setEditingBillId(bill._id);
    setEditLines(bill.products.map(item => ({ ...item })));
  };

  const handleLineChange = (idx, field, value) => {
    if (field === 'quantity' && Number(value) === 0) {
      // Remove the item if quantity is set to zero
      setEditLines(lines => lines.filter((_, i) => i !== idx));
    } else {
      setEditLines(lines => lines.map((line, i) =>
        i === idx ? { ...line, [field]: field === 'quantity' || field === 'price' ? Number(value) : value } : line
      ));
    }
  };

  // State for editing bill details
  const [editBillDetails, setEditBillDetails] = useState({
    discount: 0,
    gst: 0,
    serviceCharge: 0,
    customer: '',
    notes: ''
  });

  // State for viewing a bill (for printing)
  const [viewingBill, setViewingBill] = useState(null);

  const handleSave = async (bill) => {
    setSaving(true);
    setError(null);
    try {
      // Validate edit lines
      const hasInvalidLines = editLines.some(line => 
        !line.quantity || line.quantity <= 0 || !line.price || line.price <= 0
      );
      
      if (hasInvalidLines) {
        setError('All products must have valid quantity and price');
        setSaving(false);
        return;
      }
      
      // Prepare updated bill data
      const updatedProducts = editLines.map(line => ({
        ...line,
        price: Number(line.price),
        quantity: Number(line.quantity)
      }));
      
      // Calculate new total based on updated products
      const subtotal = updatedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Use the edited values or calculate defaults
      const gst = editBillDetails.gst !== undefined ? Number(editBillDetails.gst) : subtotal * 0.16;
      const serviceCharge = editBillDetails.serviceCharge !== undefined ? Number(editBillDetails.serviceCharge) : subtotal * 0.1;
      const discount = editBillDetails.discount !== undefined ? Number(editBillDetails.discount) : (bill.discount || 0);
      const total = subtotal + gst + serviceCharge - discount;
      
      // Update the bill with new products and totals
      await updateSale(bill._id, { 
        products: updatedProducts,
        subtotal,
        gst,
        serviceCharge,
        discount,
        total,
        customer: editBillDetails.customer || bill.customer,
        notes: editBillDetails.notes || bill.notes
      });
      
      setEditingBillId(null);
      setEditLines([]);
      setEditBillDetails({
        discount: 0,
        gst: 0,
        serviceCharge: 0,
        customer: '',
        notes: ''
      });
      fetchBills();
    } catch (err) {
      console.error('Error saving bill:', err);
      setError('Failed to save bill: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Function to open bill in a new window
  const openBillInNewWindow = (bill) => {
    if (!bill) return;
    
    try {
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (!newWindow) {
        alert('Popup blocked! Please allow popups for this site to view the bill.');
        return;
      }
      
      // Create bill content with inline styles
      const billContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill #${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .bill-container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .bill-header { text-align: center; margin-bottom: 20px; }
            .bill-header h2 { color: #1976d2; margin: 0; }
            .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .bill-info-item { margin-bottom: 10px; }
            .bill-info-label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 250px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grand-total { font-weight: bold; font-size: 1.1em; border-top: 1px solid #ddd; padding-top: 5px; }
            .footer { text-align: center; margin-top: 30px; }
            .actions { text-align: center; margin-top: 30px; }
            .btn { padding: 10px 20px; margin: 0 5px; cursor: pointer; border-radius: 4px; border: none; }
            .btn-primary { background-color: #1976d2; color: white; }
            .btn-success { background-color: #4caf50; color: white; }
            @media print { .actions { display: none; } }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="bill-header">
              <h2>Junior Joy POS</h2>
              <p>Professional Point of Sale System</p>
              <h3>BILL</h3>
              <p>Bill No: ${bill.billNumber}</p>
              <p>Date: ${new Date(bill.createdAt || Date.now()).toLocaleString()}</p>
            </div>
            
            <div class="bill-info">
              <div>
                <p><span class="bill-info-label">Customer:</span> ${typeof bill.customer === 'object' ? safeRender(bill.customer.name) : safeRender(bill.customer)}</p>
                <p><span class="bill-info-label">Cashier:</span> ${typeof bill.cashier === 'object' ? safeRender(bill.cashier.name) : safeRender(bill.cashier)}</p>
              </div>
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
                ${bill.products.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>MVR ${item.price.toFixed(2)}</td>
                    <td>MVR ${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>MVR ${(bill.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>GST (16%):</span>
                <span>MVR ${(bill.gst || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>SC (10%):</span>
                <span>MVR ${(bill.serviceCharge || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Discount:</span>
                <span>MVR ${(bill.discount || 0).toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>MVR ${(bill.total || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Amount Paid:</span>
                <span>MVR ${(bill.amountPaid || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Change:</span>
                <span>MVR ${(bill.change || 0).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>${bill.notes || ''}</p>
            </div>
            
            <div class="actions">
              <button class="btn btn-primary" onclick="window.print()">Print Bill</button>
              <button class="btn btn-success" onclick="window.close()">Close</button>
            </div>
          </div>
        </body>
        </html>
      `;
      
      newWindow.document.open();
      newWindow.document.write(billContent);
      newWindow.document.close();
    } catch (err) {
      console.error('Error opening bill in new window:', err);
      alert('Failed to open bill in new window. Please try again.');
    }
  };

  // Handle delete bill
  const handleDelete = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        await deleteSale(billId);
        // Refresh bills list after deletion
        fetchBills();
      } catch (err) {
        console.error('Error deleting bill:', err);
        setError('Failed to delete bill: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="bills-page" style={{maxWidth: 1200, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Bills Management</h2>
      <div className="bills-header" style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <p style={{fontSize: '1.1rem'}}>View and manage all customer bills</p>
        <button 
          className="btn btn-primary" 
          onClick={fetchBills}
          style={{minWidth: 120}}
        >
          Refresh Bills
        </button>
      </div>
      {loading ? (
        <div>Loading bills...</div>
      ) : error ? (
        <div style={{color: 'red'}}>{error}</div>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table className="table bills-table" style={{minWidth: 800}}>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Products</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill._id}>
                  <td>{safeRender(bill.billNumber)}</td>
                  <td>{bill.createdAt ? new Date(bill.createdAt).toLocaleString() : ''}</td>
                  <td>
                    {typeof bill.customer === 'object' ? 
                      safeRender(bill.customer.name) : 
                      safeRender(bill.customer)}
                  </td>
                  <td>
                    {typeof bill.cashier === 'object' ? 
                      safeRender(bill.cashier.name) : 
                      safeRender(bill.cashier)}
                  </td>
                  <td>
                    {editingBillId === bill._id ? (
                      <div className="bill-edit-form">
                        <table className="table table-sm products-table" style={{background: '#f9f9f9'}}>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editLines.map((line, idx) => (
                              <tr key={idx}>
                                <td>{line.name}</td>
                                <td>
                                  <input type="number" min={0} value={line.quantity} onChange={e => handleLineChange(idx, 'quantity', e.target.value)} style={{width: 60}} />
                                </td>
                                <td>
                                  <input type="number" min={0} value={line.price} onChange={e => handleLineChange(idx, 'price', e.target.value)} style={{width: 80}} />
                                </td>
                                <td>{formatCurrency(line.quantity * line.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="bill-edit-details" style={{display: 'flex', flexWrap: 'wrap'}}>
                          <div className="form-group" style={{marginRight: '20px', minWidth: '200px'}}>
                            <label>Discount:</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={editBillDetails.discount || bill.discount || 0} 
                              onChange={(e) => setEditBillDetails({...editBillDetails, discount: Number(e.target.value)})} 
                            />
                          </div>
                          <div className="form-group" style={{marginRight: '20px', minWidth: '200px'}}>
                            <label>GST (16%):</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={editBillDetails.gst || bill.gst || 0} 
                              onChange={(e) => setEditBillDetails({...editBillDetails, gst: Number(e.target.value)})} 
                            />
                          </div>
                          <div className="form-group" style={{marginRight: '20px', minWidth: '200px'}}>
                            <label>Service Charge (10%):</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={editBillDetails.serviceCharge || bill.serviceCharge || 0} 
                              onChange={(e) => setEditBillDetails({...editBillDetails, serviceCharge: Number(e.target.value)})} 
                            />
                          </div>
                          <div className="form-group" style={{marginRight: '20px', minWidth: '200px'}}>
                            <label>Customer:</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={editBillDetails.customer || (typeof bill.customer === 'object' ? bill.customer.name : bill.customer) || ''} 
                              onChange={(e) => setEditBillDetails({...editBillDetails, customer: e.target.value})} 
                            />
                          </div>
                          <div className="form-group" style={{width: '100%'}}>
                            <label>Notes:</label>
                            <textarea 
                              className="form-control" 
                              value={editBillDetails.notes || bill.notes || ''} 
                              onChange={(e) => setEditBillDetails({...editBillDetails, notes: e.target.value})} 
                              style={{minHeight: '80px'}}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ul style={{paddingLeft: 16}}>
                        {bill.products.map((line, idx) => (
                          <li key={idx}>{line.name} x {line.quantity} @ MVR {line.price.toFixed(2)}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>MVR {typeof bill.total === 'number' ? bill.total.toFixed(2) : '0.00'}</td>
                  <td>
                    {editingBillId === bill._id ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(bill)} disabled={saving}>Save</button>
                        <button className="btn btn-secondary btn-sm" style={{marginLeft: 8}} onClick={() => setEditingBillId(null)}>Cancel</button>
                      </>
                    ) : (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button className="btn btn-sm btn-info mr-2" onClick={() => handleEdit(bill)}>Edit</button>
                        <button className="btn btn-sm btn-primary mr-2" onClick={() => openBillInNewWindow(bill)}>View Bill</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(bill._id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bill View Modal */}
      {viewingBill && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bill #{viewingBill.billNumber}</h5>
                <button type="button" className="close" onClick={() => setViewingBill(null)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="bill-view" id="bill-to-print">
                  <div className="text-center mb-4">
                    <img 
                      src="/juniorjoy.jpg" 
                      alt="Junior Joy Logo" 
                      style={{ height: '70px', marginBottom: '10px' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+';            
                      }}
                    />
                    <h2>Junior Joy POS</h2>
                    <p>Professional Point of Sale System</p>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-6">
                      <p><strong>Bill #:</strong> {viewingBill.billNumber}</p>
                      <p><strong>Date:</strong> {new Date(viewingBill.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="col-6 text-right">
                      <p><strong>Customer:</strong> {typeof viewingBill.customer === 'object' ? 
                        safeRender(viewingBill.customer.name) : 
                        safeRender(viewingBill.customer)}</p>
                      <p><strong>Cashier:</strong> {typeof viewingBill.cashier === 'object' ? 
                        safeRender(viewingBill.cashier.name) : 
                        safeRender(viewingBill.cashier)}</p>
                    </div>
                  </div>
                  
                  <table className="table table-bordered">
                    <thead className="thead-light">
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingBill.products.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Subtotal:</strong></td>
                        <td>{formatCurrency(viewingBill.subtotal || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>GST (16%):</strong></td>
                        <td>{formatCurrency(viewingBill.gst || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Service Charge (10%):</strong></td>
                        <td>{formatCurrency(viewingBill.serviceCharge || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Discount:</strong></td>
                        <td>{formatCurrency(viewingBill.discount || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Total:</strong></td>
                        <td><strong>{formatCurrency(viewingBill.total || 0)}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Amount Paid:</strong></td>
                        <td>{formatCurrency(viewingBill.amountPaid || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right"><strong>Change:</strong></td>
                        <td>{formatCurrency(viewingBill.change || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="text-center mt-4">
                    <p>Thank you for your business!</p>
                    <p>{viewingBill.notes}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setViewingBill(null)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => {
                    const doc = new jsPDF();
                    
                    // Add logo and header
                    doc.setFontSize(20);
                    doc.setTextColor(25, 118, 210);
                    doc.text('Junior Joy POS', 105, 20, { align: 'center' });
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('Professional Point of Sale System', 105, 28, { align: 'center' });
                    
                    // Add bill details
                    doc.setFontSize(14);
                    doc.text('BILL', 105, 40, { align: 'center' });
                    
                    doc.setFontSize(10);
                    doc.text(`Bill #: ${viewingBill.billNumber}`, 20, 50);
                    doc.text(`Date: ${new Date(viewingBill.createdAt).toLocaleString()}`, 20, 55);
                    doc.text(`Customer: ${typeof viewingBill.customer === 'object' ? viewingBill.customer.name : viewingBill.customer}`, 20, 60);
                    doc.text(`Cashier: ${typeof viewingBill.cashier === 'object' ? viewingBill.cashier.name : viewingBill.cashier}`, 20, 65);
                    
                    // Add products table
                    const tableColumn = ["Item", "Qty", "Price", "Total"];
                    const tableRows = [];
                    
                    viewingBill.products.forEach(item => {
                      const itemData = [
                        item.name,
                        item.quantity,
                        formatCurrency(item.price),
                        formatCurrency(item.price * item.quantity)
                      ];
                      tableRows.push(itemData);
                    });
                    
                    autoTable(doc, {
                      head: [tableColumn],
                      body: tableRows,
                      startY: 70,
                      theme: 'grid',
                      styles: { fontSize: 9 },
                      headStyles: { fillColor: [25, 118, 210] }
                    });
                    
                    // Add totals
                    const finalY = doc.lastAutoTable.finalY + 10;
                    
                    doc.text(`Subtotal:`, 130, finalY);
                    doc.text(formatCurrency(viewingBill.subtotal || 0), 170, finalY, { align: 'right' });
                    
                    doc.text(`GST (16%):`, 130, finalY + 5);
                    doc.text(formatCurrency(viewingBill.gst || 0), 170, finalY + 5, { align: 'right' });
                    
                    doc.text(`Service Charge (10%):`, 130, finalY + 10);
                    doc.text(formatCurrency(viewingBill.serviceCharge || 0), 170, finalY + 10, { align: 'right' });
                    
                    doc.text(`Discount:`, 130, finalY + 15);
                    doc.text(formatCurrency(viewingBill.discount || 0), 170, finalY + 15, { align: 'right' });
                    
                    doc.setFontSize(12);
                    doc.text(`Total:`, 130, finalY + 22);
                    doc.text(formatCurrency(viewingBill.total || 0), 170, finalY + 22, { align: 'right' });
                    
                    doc.setFontSize(10);
                    doc.text(`Amount Paid:`, 130, finalY + 30);
                    doc.text(formatCurrency(viewingBill.amountPaid || 0), 170, finalY + 30, { align: 'right' });
                    
                    doc.text(`Change:`, 130, finalY + 35);
                    doc.text(formatCurrency(viewingBill.change || 0), 170, finalY + 35, { align: 'right' });
                    
                    // Add footer
                    doc.setFontSize(8);
                    doc.text('Thank you for your business!', 105, finalY + 45, { align: 'center' });
                    
                    // Save the PDF
                    doc.save(`Bill-${viewingBill.billNumber}.pdf`);
                  }}
                >
                  Save as PDF
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => window.print()}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;

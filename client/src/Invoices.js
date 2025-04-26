import React, { useState, useEffect } from 'react';
import { getSales, getSale, updateSale, deleteSale } from './api';
import { safeRender, formatCurrency } from './utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './styles.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(null);

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getSales(page, 10);
      if (response && response.data) {
        setInvoices(response.data.sales || []);
        setTotalPages(Math.ceil((response.data.total || 0) / 10));
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewInvoice = async (id) => {
    try {
      const response = await getSale(id);
      if (response && response.data) {
        setSelectedInvoice(response.data);
        setShowInvoiceModal(true);
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('Failed to fetch invoice details.');
    }
  };

  const handleEditInvoice = () => {
    setEditedInvoice({
      ...selectedInvoice,
      customer: selectedInvoice.customer?.name || selectedInvoice.customer || '',
      cashier: selectedInvoice.cashier?.name || selectedInvoice.cashier || '',
      discount: selectedInvoice.discount || 0,
      gst: selectedInvoice.gst || 0,
      serviceCharge: selectedInvoice.serviceCharge || 0,
      notes: selectedInvoice.notes || ''
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Calculate new total based on edited values
      const subtotal = selectedInvoice.subtotal || 0;
      const discount = parseFloat(editedInvoice.discount) || 0;
      const gst = parseFloat(editedInvoice.gst) || 0;
      const serviceCharge = parseFloat(editedInvoice.serviceCharge) || 0;
      const total = subtotal + gst + serviceCharge - discount;

      const updatedInvoice = {
        ...editedInvoice,
        total,
        discount,
        gst,
        serviceCharge
      };

      await updateSale(selectedInvoice._id, updatedInvoice);
      
      // Refresh the invoice list and close edit mode
      fetchInvoices(currentPage);
      setSelectedInvoice({...selectedInvoice, ...updatedInvoice});
      setEditMode(false);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Failed to update invoice. Please try again.');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice || !selectedInvoice._id) return;
    
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteSale(selectedInvoice._id);
        setShowInvoiceModal(false);
        fetchInvoices(currentPage);
      } catch (err) {
        console.error('Error deleting invoice:', err);
        setError('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = () => {
    if (!selectedInvoice) return;
    
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
      doc.text(`Bill No: ${selectedInvoice.billNumber || 'N/A'}`, 20, 50);
      doc.text(`Date: ${new Date(selectedInvoice.createdAt || Date.now()).toLocaleString()}`, 20, 55);
      
      const customerName = selectedInvoice.customer?.name || selectedInvoice.customer || 'Walk-in Customer';
      const cashierName = selectedInvoice.cashier?.name || selectedInvoice.cashier || 'Staff';
      
      doc.text(`Customer: ${customerName}`, 20, 60);
      doc.text(`Cashier: ${cashierName}`, 20, 65);
      doc.text(`Payment Method: ${selectedInvoice.paymentMethod || 'Cash'}`, 20, 70);
      
      // Add products table
      const tableColumn = ["Item", "Qty", "Price", "Total"];
      const tableRows = [];
      
      (selectedInvoice.products || []).forEach(item => {
        const itemData = [
          item.name || item.product?.name || 'Unknown Item',
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
      doc.text(`MVR ${Number(selectedInvoice.subtotal || 0).toFixed(2)}`, 170, finalY, { align: 'right' });
      
      doc.text(`GST:`, 130, finalY + 5);
      doc.text(`MVR ${Number(selectedInvoice.gst || 0).toFixed(2)}`, 170, finalY + 5, { align: 'right' });
      
      doc.text(`Service Charge:`, 130, finalY + 10);
      doc.text(`MVR ${Number(selectedInvoice.serviceCharge || 0).toFixed(2)}`, 170, finalY + 10, { align: 'right' });
      
      doc.text(`Discount:`, 130, finalY + 15);
      doc.text(`MVR ${Number(selectedInvoice.discount || 0).toFixed(2)}`, 170, finalY + 15, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text(`Total:`, 130, finalY + 22);
      doc.text(`MVR ${Number(selectedInvoice.total || 0).toFixed(2)}`, 170, finalY + 22, { align: 'right' });
      
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 130, finalY + 30);
      doc.text(`MVR ${Number(selectedInvoice.amountPaid || 0).toFixed(2)}`, 170, finalY + 30, { align: 'right' });
      
      doc.text(`Change:`, 130, finalY + 35);
      doc.text(`MVR ${Number(selectedInvoice.change || 0).toFixed(2)}`, 170, finalY + 35, { align: 'right' });
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, finalY + 50, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Please keep this invoice for your records.', 105, finalY + 55, { align: 'center' });
      
      // Save the PDF
      doc.save(`Invoice-${selectedInvoice.billNumber || 'unknown'}-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="invoices-container">
      <div className="invoices-header" style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{color: '#1976d2', marginBottom: 0}}>Invoices</h2>
        <div className="invoice-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => fetchInvoices(currentPage)}
            disabled={loading}
          >
            <i className="fa fa-refresh"></i> Refresh
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center" style={{padding: 40}}>Loading invoices...</div>
      ) : error ? (
        <div className="text-center" style={{padding: 40, color: 'red'}}>{error}</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Cashier</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No invoices found</td>
                  </tr>
                ) : (
                  invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td>{invoice.billNumber || 'N/A'}</td>
                      <td>{new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td>{safeRender(invoice.customer)}</td>
                      <td>{safeRender(invoice.cashier)}</td>
                      <td>{formatCurrency(invoice.total || 0)}</td>
                      <td>{invoice.paymentMethod || 'Cash'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-info me-2" 
                          onClick={() => handleViewInvoice(invoice._id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container" style={{display: 'flex', justifyContent: 'center', marginTop: 24}}>
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
                {[...Array(totalPages).keys()].map(page => (
                  <li key={page + 1} className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {page + 1}
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
            </div>
          )}
        </>
      )}
      
      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editMode ? 'Edit Invoice' : 'Invoice Details'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setEditMode(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {editMode ? (
                  <div className="edit-invoice-form">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Customer</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editedInvoice.customer} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, customer: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Cashier</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editedInvoice.cashier} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, cashier: e.target.value})}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Discount (MVR)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={editedInvoice.discount} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, discount: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">GST (MVR)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={editedInvoice.gst} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, gst: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Service Charge (MVR)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={editedInvoice.serviceCharge} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, serviceCharge: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea 
                        className="form-control" 
                        value={editedInvoice.notes} 
                        onChange={(e) => setEditedInvoice({...editedInvoice, notes: e.target.value})}
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="invoice-view bill-view">
                    <div className="invoice-header text-center mb-4">
                      <h3 style={{color: '#1976d2', marginBottom: 8}}>Junior Joy POS</h3>
                      <div>Professional Point of Sale System</div>
                      <div style={{marginTop: 16, fontWeight: 'bold', fontSize: '1.2rem'}}>INVOICE</div>
                      <div style={{marginTop: 8}}>Bill No: {selectedInvoice.billNumber || 'N/A'}</div>
                      <div>Date: {new Date(selectedInvoice.createdAt || Date.now()).toLocaleString()}</div>
                    </div>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
                      <div>
                        <div style={{fontWeight: 'bold', marginBottom: 4}}>Customer:</div>
                        <div>{safeRender(selectedInvoice.customer)}</div>
                      </div>
                      <div>
                        <div style={{fontWeight: 'bold', marginBottom: 4}}>Cashier:</div>
                        <div>{safeRender(selectedInvoice.cashier)}</div>
                      </div>
                    </div>
                    
                    <div style={{marginBottom: 8}}>
                      <div style={{fontWeight: 'bold', marginBottom: 4}}>Payment Method:</div>
                      <div>{selectedInvoice.paymentMethod || 'Cash'}</div>
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
                        {(selectedInvoice.products || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>{safeRender(item.name || item.product?.name)}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="invoice-totals">
                      <div className="total-row"><span>Subtotal:</span> <span>{formatCurrency(selectedInvoice.subtotal || 0)}</span></div>
                      <div className="total-row"><span>GST:</span> <span>{formatCurrency(selectedInvoice.gst || 0)}</span></div>
                      <div className="total-row"><span>Service Charge:</span> <span>{formatCurrency(selectedInvoice.serviceCharge || 0)}</span></div>
                      <div className="total-row"><span>Discount:</span> <span>- {formatCurrency(selectedInvoice.discount || 0)}</span></div>
                      <div className="total-row grand-total"><span>Total:</span> <span>{formatCurrency(selectedInvoice.total || 0)}</span></div>
                      <div className="total-row"><span>Paid:</span> <span>{formatCurrency(selectedInvoice.amountPaid || 0)}</span></div>
                      <div className="total-row"><span>Change:</span> <span>{formatCurrency(selectedInvoice.change || 0)}</span></div>
                    </div>
                    
                    {selectedInvoice.notes && (
                      <div style={{marginTop: 16}}>
                        <div style={{fontWeight: 'bold', marginBottom: 4}}>Notes:</div>
                        <div>{selectedInvoice.notes}</div>
                      </div>
                    )}
                    
                    <div style={{marginTop: 24, textAlign: 'center'}}>
                      <div style={{fontWeight: 'bold', marginBottom: 4}}>Thank you for your business!</div>
                      <div style={{fontSize: '0.9rem', color: '#666'}}>Please keep this invoice for your records.</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {editMode ? (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleSaveEdit}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleDeleteInvoice}
                    >
                      Delete
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleEditInvoice}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-success" 
                      onClick={exportToPDF}
                    >
                      Save as PDF
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handlePrint}
                    >
                      Print
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;

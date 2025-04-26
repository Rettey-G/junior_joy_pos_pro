import React, { useState, useEffect } from 'react';
import { getSales, getSale, updateSale, deleteSale } from './api';
import { safeRender, formatCurrency } from './utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const handleDeleteInvoice = async (id) => {
    const invoiceId = id || (selectedInvoice && selectedInvoice._id);
    if (!invoiceId) return;
    
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await deleteSale(invoiceId);
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

  const generatePDF = () => {
    if (!selectedInvoice) return;
    
    try {
      const doc = new jsPDF();
      
      // Add logo and header
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
      
      // Add invoice details
      doc.setFontSize(14);
      doc.text('INVOICE', 105, 45, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Invoice #: ${selectedInvoice.billNumber || 'N/A'}`, 20, 60);
      doc.text(`Date: ${new Date(selectedInvoice.createdAt || Date.now()).toLocaleString()}`, 20, 65);
      doc.text(`Customer: ${typeof selectedInvoice.customer === 'object' ? selectedInvoice.customer.name : selectedInvoice.customer}`, 20, 70);
      doc.text(`Cashier: ${typeof selectedInvoice.cashier === 'object' ? selectedInvoice.cashier.name : selectedInvoice.cashier}`, 20, 75);
      
      // Add products table
      const tableColumn = ["Item", "Qty", "Price", "Total"];
      const tableRows = [];
      
      selectedInvoice.products.forEach(item => {
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
        startY: 85,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [25, 118, 210] }
      });
      
      // Add totals
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.text(`Subtotal:`, 130, finalY);
      doc.text(formatCurrency(selectedInvoice.subtotal || 0), 170, finalY, { align: 'right' });
      
      doc.text(`GST (16%):`, 130, finalY + 5);
      doc.text(formatCurrency(selectedInvoice.gst || 0), 170, finalY + 5, { align: 'right' });
      
      doc.text(`Service Charge (10%):`, 130, finalY + 10);
      doc.text(formatCurrency(selectedInvoice.serviceCharge || 0), 170, finalY + 10, { align: 'right' });
      
      doc.text(`Discount:`, 130, finalY + 15);
      doc.text(formatCurrency(selectedInvoice.discount || 0), 170, finalY + 15, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text(`Total:`, 130, finalY + 22);
      doc.text(formatCurrency(selectedInvoice.total || 0), 170, finalY + 22, { align: 'right' });
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, finalY + 40, { align: 'center' });
      
      // Save the PDF
      doc.save(`Invoice-${selectedInvoice.billNumber}-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="invoices-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      <div className="invoices-header" style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{color: '#1976d2', marginBottom: 0}}>Invoices</h2>
        <div className="invoice-actions">
          <button 
            className="btn btn-success me-2" 
            onClick={() => window.location.href = '/sales'}
          >
            <i className="fa fa-plus"></i> Create New Invoice
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => fetchInvoices(currentPage)}
            disabled={loading}
          >
            <i className="fa fa-refresh"></i> Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger" style={{marginBottom: '20px'}}>
          {error}
          <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {loading ? (
        <div className="text-center" style={{padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{marginTop: '10px'}}>Loading invoices...</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Invoice List</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Cashier</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{width: '200px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">No invoices found</td>
                    </tr>
                  ) : (
                    invoices.map(invoice => (
                      <tr key={invoice._id}>
                        <td><strong>{invoice.billNumber}</strong></td>
                        <td>{new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>{typeof invoice.customer === 'object' ? safeRender(invoice.customer.name) : safeRender(invoice.customer)}</td>
                        <td>{typeof invoice.cashier === 'object' ? safeRender(invoice.cashier.name) : safeRender(invoice.cashier)}</td>
                        <td><strong>{formatCurrency(invoice.total)}</strong></td>
                        <td>
                          <span className={`badge ${invoice.status === 'Completed' ? 'bg-success' : 'bg-warning'}`} style={{padding: '5px 8px'}}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-info me-1" 
                              onClick={() => handleViewInvoice(invoice._id)}
                              title="View Invoice"
                            >
                              View
                            </button>
                            <button 
                              className="btn btn-sm btn-primary me-1" 
                              onClick={() => {
                                handleViewInvoice(invoice._id);
                                setTimeout(() => handleEditInvoice(), 500);
                              }}
                              title="Edit Invoice"
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => handleDeleteInvoice(invoice._id)}
                              title="Delete Invoice"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
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
        </div>
      )}
      
      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editMode ? 'Edit Invoice' : `Invoice #${selectedInvoice.billNumber}`}
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
                        <label className="form-label">GST (16%)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={editedInvoice.gst} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, gst: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Service Charge (10%)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={editedInvoice.serviceCharge} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, serviceCharge: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Discount</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={editedInvoice.discount} 
                          onChange={(e) => setEditedInvoice({...editedInvoice, discount: e.target.value})}
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
                  <div className="invoice-details">
                    <div className="text-center mb-4">
                      <img 
                        src="/juniorjoy.jpg" 
                        alt="Junior Joy Logo" 
                        style={{height: '70px', marginBottom: '10px'}} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+';            
                        }}
                      />
                      <h3>Junior Joy POS</h3>
                      <p>Professional Point of Sale System</p>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-6">
                        <p><strong>Invoice #:</strong> {selectedInvoice.billNumber}</p>
                        <p><strong>Date:</strong> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="col-6 text-end">
                        <p><strong>Customer:</strong> {typeof selectedInvoice.customer === 'object' ? 
                          safeRender(selectedInvoice.customer.name) : 
                          safeRender(selectedInvoice.customer)}</p>
                        <p><strong>Cashier:</strong> {typeof selectedInvoice.cashier === 'object' ? 
                          safeRender(selectedInvoice.cashier.name) : 
                          safeRender(selectedInvoice.cashier)}</p>
                      </div>
                    </div>
                    
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.products && selectedInvoice.products.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                          <td>{formatCurrency(selectedInvoice.subtotal || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>GST (16%):</strong></td>
                          <td>{formatCurrency(selectedInvoice.gst || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Service Charge (10%):</strong></td>
                          <td>{formatCurrency(selectedInvoice.serviceCharge || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Discount:</strong></td>
                          <td>{formatCurrency(selectedInvoice.discount || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                          <td><strong>{formatCurrency(selectedInvoice.total || 0)}</strong></td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Amount Paid:</strong></td>
                          <td>{formatCurrency(selectedInvoice.amountPaid || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Change:</strong></td>
                          <td>{formatCurrency(selectedInvoice.change || 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <div className="text-center mt-4">
                      <p><strong>Thank you for your business!</strong></p>
                      <p>{selectedInvoice.notes}</p>
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
                      className="btn btn-secondary" 
                      onClick={() => setShowInvoiceModal(false)}
                    >
                      Close
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-info" 
                      onClick={handlePrint}
                    >
                      Print
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={generatePDF}
                    >
                      Download PDF
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-warning" 
                      onClick={handleEditInvoice}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => handleDeleteInvoice()}
                    >
                      Delete
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

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
  const [viewingBill, setViewingBill] = useState(null);

  // Default bill structure for fallback
  const fallbackBills = [
    {
      _id: '1001',
      billNumber: '1001',
      createdAt: new Date().toISOString(),
      customer: { name: 'Demo Customer' },
      cashier: { name: 'Demo Cashier' },
      products: [
        { name: 'Demo Product 1', quantity: 2, price: 20.00 },
        { name: 'Demo Product 2', quantity: 1, price: 30.00 }
      ],
      subtotal: 70.00,
      gst: 11.20,
      serviceCharge: 7.00,
      discount: 0,
      total: 88.20,
      amountPaid: 100.00,
      change: 11.80,
      notes: 'Demo Bill'
    }
  ];

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSales(1, 100);
      
      if (response?.data) {
        const billsData = Array.isArray(response.data) ? response.data :
                         Array.isArray(response.data.sales) ? response.data.sales :
                         Array.isArray(response.data.data) ? response.data.data :
                         null;

        if (billsData) {
          setBills(billsData.map(bill => ({
            ...bill,
            products: Array.isArray(bill.products) ? bill.products : [],
            customer: bill.customer || { name: 'Walk-in Customer' },
            cashier: bill.cashier || { name: 'System' }
          })));
        } else {
          console.log('Using fallback data - no valid bills array found');
          setBills(fallbackBills);
        }
      } else {
        console.log('Using fallback data - invalid response');
        setBills(fallbackBills);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      setBills(fallbackBills);
      setError('Failed to fetch bills. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleEdit = (bill) => {
    if (!bill?.products) return;
    setEditingBillId(bill._id);
    setEditLines(bill.products.map(item => ({ ...item })));
  };

  const handleLineChange = (idx, field, value) => {
    setEditLines(prevLines => {
      if (!Array.isArray(prevLines)) return [];
      
      if (field === 'quantity' && Number(value) === 0) {
        return prevLines.filter((_, i) => i !== idx);
      }
      
      return prevLines.map((line, i) =>
        i === idx ? {
          ...line,
          [field]: field === 'quantity' || field === 'price' ? Number(value) || 0 : value
        } : line
      );
    });
  };

  const handleSave = async (bill) => {
    if (!bill?._id || !Array.isArray(editLines)) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedProducts = editLines.map(line => ({
        name: line.name || '',
        quantity: Number(line.quantity) || 0,
        price: Number(line.price) || 0
      }));

      const subtotal = updatedProducts.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
      
      const gst = subtotal * 0.16;
      const serviceCharge = subtotal * 0.10;
      const total = subtotal + gst + serviceCharge;

      await updateSale(bill._id, {
        products: updatedProducts,
        subtotal,
        gst,
        serviceCharge,
        total
      });

      setEditingBillId(null);
      setEditLines([]);
      await fetchBills();
    } catch (err) {
      console.error('Error saving bill:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (billId) => {
    if (!billId || !window.confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      await deleteSale(billId);
      await fetchBills();
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError('Failed to delete bill. Please try again.');
    }
  };

  const openBillInNewWindow = (bill) => {
    if (!bill) return;
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(25, 118, 210);
      doc.text('Junior Joy POS', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Bill Details', 105, 30, { align: 'center' });
      
      // Bill Info
      doc.setFontSize(10);
      doc.text(`Bill #: ${bill.billNumber}`, 20, 40);
      doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`, 20, 45);
      doc.text(`Customer: ${safeRender(bill.customer?.name)}`, 20, 50);
      doc.text(`Cashier: ${safeRender(bill.cashier?.name)}`, 20, 55);
      
      // Products Table
      const tableColumn = ["Item", "Qty", "Price", "Total"];
      const tableRows = (bill.products || []).map(item => [
        item.name,
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity)
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] }
      });
      
      // Totals
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.text(`Subtotal: ${formatCurrency(bill.subtotal || 0)}`, 150, finalY, { align: 'right' });
      doc.text(`GST (16%): ${formatCurrency(bill.gst || 0)}`, 150, finalY + 5, { align: 'right' });
      doc.text(`Service Charge (10%): ${formatCurrency(bill.serviceCharge || 0)}`, 150, finalY + 10, { align: 'right' });
      doc.text(`Total: ${formatCurrency(bill.total || 0)}`, 150, finalY + 15, { align: 'right' });
      
      // Footer
      doc.setFontSize(8);
      doc.text('Thank you for your business!', 105, finalY + 25, { align: 'center' });
      
      // Save PDF
      doc.save(`Bill-${bill.billNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading bills...</div>;
  }

  return (
    <div className="bills-container">
      <div className="bills-header">
        <h2>Bills Management</h2>
        <button className="btn btn-primary" onClick={fetchBills}>
          Refresh Bills
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="bills-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill._id}>
                <td>{safeRender(bill.billNumber)}</td>
                <td>{new Date(bill.createdAt).toLocaleString()}</td>
                <td>{safeRender(bill.customer?.name)}</td>
                <td>
                  {editingBillId === bill._id ? (
                    <div className="edit-products">
                      <table className="table table-sm">
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
                                <input
                                  type="number"
                                  min="0"
                                  value={line.quantity}
                                  onChange={e => handleLineChange(idx, 'quantity', e.target.value)}
                                  className="form-control form-control-sm"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={line.price}
                                  onChange={e => handleLineChange(idx, 'price', e.target.value)}
                                  className="form-control form-control-sm"
                                />
                              </td>
                              <td>{formatCurrency(line.quantity * line.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <ul className="product-list">
                      {(bill.products || []).map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.quantity} @ {formatCurrency(item.price)}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{formatCurrency(bill.total || 0)}</td>
                <td>
                  {editingBillId === bill._id ? (
                    <div className="btn-group">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleSave(bill)}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingBillId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="btn-group">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleEdit(bill)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openBillInNewWindow(bill)}
                      >
                        PDF
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(bill._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bills;

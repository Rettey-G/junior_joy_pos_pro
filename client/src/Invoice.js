import React, { useState, useEffect } from 'react';
import { getSales } from './api';
import { safeRender, formatCurrency } from './utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './styles.css';

// Fallback sample invoice in case no data is available
const sampleInvoice = {
  billNumber: '20250425-1234',
  date: new Date().toLocaleString(),
  customer: 'Sample Customer',
  cashier: 'Admin',
  items: [
    { name: 'Item A', quantity: 2, price: 50 },
    { name: 'Item B', quantity: 1, price: 120 },
    { name: 'Item C', quantity: 3, price: 30 }
  ],
  subtotal: 290,
  gst: 46.4,
  serviceCharge: 29,
  discount: 10,
  total: 355.4,
  paid: 360,
  change: 4.6
};

const Invoice = () => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestInvoice = async () => {
    setLoading(true);
    try {
      // Get the most recent sale/bill
      const response = await getSales(1, 1);
      if (response && response.data && response.data.sales && response.data.sales.length > 0) {
        const latestSale = response.data.sales[0];
        
        // Process customer and cashier data to handle both string and object formats
        let customerName = 'Walk-in Customer';
        if (latestSale.customer) {
          if (typeof latestSale.customer === 'object') {
            customerName = latestSale.customer.name || 'Walk-in Customer';
          } else {
            customerName = String(latestSale.customer);
          }
        }
        
        let cashierName = 'Staff';
        if (latestSale.cashier) {
          if (typeof latestSale.cashier === 'object') {
            cashierName = latestSale.cashier.name || 'Staff';
          } else {
            cashierName = String(latestSale.cashier);
          }
        }
        
        // Format the data for invoice display
        setInvoice({
          billNumber: latestSale.billNumber || 'N/A',
          date: latestSale.createdAt ? new Date(latestSale.createdAt).toLocaleString() : new Date().toLocaleString(),
          customer: customerName,
          cashier: cashierName,
          items: latestSale.products || [],
          subtotal: latestSale.subtotal || 0,
          gst: latestSale.gst || 0,
          serviceCharge: latestSale.serviceCharge || 0,
          discount: latestSale.discount || 0,
          total: latestSale.total || 0,
          paid: latestSale.amountPaid || 0,
          change: latestSale.change || 0
        });
      } else {
        // No sales found, use sample data
        setInvoice(sampleInvoice);
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to fetch invoice data');
      // Fall back to sample data
      setInvoice(sampleInvoice);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestInvoice();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    fetchLatestInvoice();
  };
  
  const exportToPDF = () => {
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
      doc.text(`Bill No: ${inv.billNumber}`, 20, 50);
      doc.text(`Date: ${inv.date}`, 20, 55);
      doc.text(`Customer: ${safeRender(inv.customer)}`, 20, 60);
      doc.text(`Cashier: ${safeRender(inv.cashier)}`, 20, 65);
      doc.text(`Payment Method: ${inv.paymentMethod || 'Cash'}`, 20, 70);
      
      // Add products table
      const tableColumn = ["Item", "Qty", "Price", "Total"];
      const tableRows = [];
      
      inv.items.forEach(item => {
        const itemData = [
          safeRender(item.name || item.product?.name || 'Unknown Item'),
          item.quantity,
          formatCurrency(item.price),
          formatCurrency(item.price * item.quantity)
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
      doc.text(formatCurrency(inv.subtotal), 170, finalY, { align: 'right' });
      
      doc.text(`GST:`, 130, finalY + 5);
      doc.text(formatCurrency(inv.gst), 170, finalY + 5, { align: 'right' });
      
      doc.text(`Service Charge:`, 130, finalY + 10);
      doc.text(formatCurrency(inv.serviceCharge), 170, finalY + 10, { align: 'right' });
      
      doc.text(`Discount:`, 130, finalY + 15);
      doc.text(formatCurrency(inv.discount), 170, finalY + 15, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text(`Total:`, 130, finalY + 22);
      doc.text(formatCurrency(inv.total), 170, finalY + 22, { align: 'right' });
      
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 130, finalY + 30);
      doc.text(formatCurrency(inv.paid), 170, finalY + 30, { align: 'right' });
      
      doc.text(`Change:`, 130, finalY + 35);
      doc.text(formatCurrency(inv.change), 170, finalY + 35, { align: 'right' });
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, finalY + 50, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Please keep this invoice for your records.', 105, finalY + 55, { align: 'center' });
      
      // Save the PDF with a timestamp to ensure uniqueness
      doc.save(`Invoice-${inv.billNumber}-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Use the fetched invoice or fall back to sample
  const inv = invoice || sampleInvoice;

  return (
    <div className="invoice-container">
      <div className="invoice-header" style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2 style={{color: '#1976d2', marginBottom: 0}}>Invoice</h2>
        <div className="invoice-actions">
          <button 
            className="btn btn-secondary mr-2" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="fa fa-refresh"></i> Refresh
          </button>
          <button 
            className="btn btn-success mr-2" 
            onClick={exportToPDF}
            disabled={loading}
          >
            <i className="fa fa-file-pdf-o"></i> Save as PDF
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            disabled={loading}
          >
            Print
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center" style={{padding: 40}}>Loading invoice data...</div>
      ) : error ? (
        <div className="text-center" style={{padding: 40, color: 'red'}}>{error}</div>
      ) : (
        <div className="invoice-page" style={{maxWidth: 600, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,150,243,0.08)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
            <div>
              <h2 style={{color: '#1976d2', marginBottom: 0}}>Junior Joy POS</h2>
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
          
          <div style={{textAlign: 'center', marginBottom: 24}}>
            <div style={{fontSize: '1.1rem', marginTop: 8, fontWeight: 'bold'}}>INVOICE</div>
            <div style={{marginTop: 8}}>Bill No: {safeRender(inv.billNumber)}</div>
            <div>Date: {inv.date}</div>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
            <div>
              <div style={{fontWeight: 'bold', marginBottom: 4}}>Customer:</div>
              <div>{safeRender(inv.customer)}</div>
            </div>
            <div>
              <div style={{fontWeight: 'bold', marginBottom: 4}}>Cashier:</div>
              <div>{safeRender(inv.cashier)}</div>
            </div>
          </div>
          
          <table className="invoice-table" style={{width: '100%', borderCollapse: 'collapse', marginBottom: 20}}>
            <thead>
              <tr style={{background: '#f5f5f5'}}>
                <th style={{padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd'}}>Item</th>
                <th style={{padding: 8, textAlign: 'center', borderBottom: '1px solid #ddd'}}>Qty</th>
                <th style={{padding: 8, textAlign: 'right', borderBottom: '1px solid #ddd'}}>Price</th>
                <th style={{padding: 8, textAlign: 'right', borderBottom: '1px solid #ddd'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{padding: 8, borderBottom: '1px solid #eee'}}>{safeRender(item.name)}</td>
                  <td style={{padding: 8, textAlign: 'center', borderBottom: '1px solid #eee'}}>{item.quantity}</td>
                  <td style={{padding: 8, textAlign: 'right', borderBottom: '1px solid #eee'}}>MVR {item.price.toFixed(2)}</td>
                  <td style={{padding: 8, textAlign: 'right', borderBottom: '1px solid #eee'}}>MVR {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{marginLeft: 'auto', maxWidth: 250}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span>Subtotal:</span>
              <span>MVR {inv.subtotal.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span>GST (16%):</span>
              <span>MVR {inv.gst.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span>Service Charge (10%):</span>
              <span>MVR {inv.serviceCharge.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span>Discount:</span>
              <span>MVR {inv.discount.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: 4}}>
              <span>Total:</span>
              <span>MVR {inv.total.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
              <span>Paid:</span>
              <span>MVR {inv.paid.toFixed(2)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#4CAF50', fontWeight: 'bold'}}>
              <span>Change:</span>
              <span>MVR {inv.change.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{marginTop: 32, textAlign: 'center', borderTop: '1px dashed #ddd', paddingTop: 16}}>
            <div style={{fontWeight: 'bold', marginBottom: 4}}>Thank you for your business!</div>
            <div style={{fontSize: '0.9rem', color: '#666'}}>Please keep this invoice for your records.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;

import React from 'react';
import './styles.css';

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
  const handlePrint = () => {
    window.print();
  };

  const inv = sampleInvoice; // Replace with real data from backend

  return (
    <div className="invoice-page" style={{maxWidth: 600, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(33,150,243,0.08)'}}>
      <div style={{textAlign: 'center', marginBottom: 24}}>
        <h2 style={{color: '#1976d2', marginBottom: 0}}>Junior Joy POS</h2>
        <div style={{fontSize: '1.1rem', marginTop: 8}}>INVOICE</div>
        <div style={{marginTop: 8}}>Bill No: {inv.billNumber}</div>
        <div>Date: {inv.date}</div>
      </div>
      <div style={{marginBottom: 16}}>
        <div><strong>Customer:</strong> {inv.customer}</div>
        <div><strong>Cashier:</strong> {inv.cashier}</div>
      </div>
      <table className="table" style={{marginBottom: 16}}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>MVR {item.price.toFixed(2)}</td>
              <td>MVR {(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cart-totals" style={{marginBottom: 16}}>
        <div className="total-row"><span>Subtotal:</span> <span>MVR {inv.subtotal.toFixed(2)}</span></div>
        <div className="total-row"><span>GST:</span> <span>MVR {inv.gst.toFixed(2)}</span></div>
        <div className="total-row"><span>Service Charge:</span> <span>MVR {inv.serviceCharge.toFixed(2)}</span></div>
        <div className="total-row"><span>Discount:</span> <span>- MVR {inv.discount.toFixed(2)}</span></div>
        <div className="total-row grand-total"><span>Total:</span> <span>MVR {inv.total.toFixed(2)}</span></div>
        <div className="total-row"><span>Paid:</span> <span>MVR {inv.paid.toFixed(2)}</span></div>
        <div className="total-row"><span>Change:</span> <span>MVR {inv.change.toFixed(2)}</span></div>
      </div>
      <div style={{textAlign: 'center', marginTop: 24}}>
        <button className="btn btn-primary" onClick={handlePrint}>Print Invoice</button>
      </div>
      <div style={{marginTop: 32, textAlign: 'center', color: '#888'}}>Thank you for your business!</div>
    </div>
  );
};

export default Invoice;

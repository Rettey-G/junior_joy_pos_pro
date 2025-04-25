import React, { useEffect, useState } from 'react';
import { getSales, updateSale } from './api';
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

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await getSales(1, 100); // fetch up to 100 bills
      setBills(response.data.sales || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bills');
      setLoading(false);
    }
  };

  const handleEdit = (bill) => {
    setEditingBillId(bill._id);
    setEditLines(bill.products.map(item => ({ ...item })));
  };

  const handleLineChange = (idx, field, value) => {
    setEditLines(lines => lines.map((line, i) =>
      i === idx ? { ...line, [field]: field === 'quantity' || field === 'price' ? Number(value) : value } : line
    ));
  };

  const handleSave = async (bill) => {
    setSaving(true);
    try {
      // Prepare updated bill data
      const updatedProducts = editLines.map(line => ({
        ...line,
        price: Number(line.price),
        quantity: Number(line.quantity)
      }));
      // Calculate new total based on updated products
      const subtotal = updatedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const gst = subtotal * 0.16;
      const serviceCharge = subtotal * 0.1;
      const total = subtotal + gst + serviceCharge - (bill.discount || 0);
      
      // Update the bill with new products and totals
      await updateSale(bill._id, { 
        products: updatedProducts,
        subtotal,
        gst,
        serviceCharge,
        total
      });
      setEditingBillId(null);
      setEditLines([]);
      fetchBills();
    } catch (err) {
      setError('Failed to save bill');
    }
    setSaving(false);
  };

  return (
    <div className="bills-page" style={{maxWidth: 1200, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Bills</h2>
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
                  <td>{bill.billNumber}</td>
                  <td>{bill.createdAt ? new Date(bill.createdAt).toLocaleString() : ''}</td>
                  <td>{bill.customer}</td>
                  <td>{bill.cashier}</td>
                  <td>
                    {editingBillId === bill._id ? (
                      <table className="table table-sm" style={{background: '#f9f9f9'}}>
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
                                <input type="number" min={1} value={line.quantity} onChange={e => handleLineChange(idx, 'quantity', e.target.value)} style={{width: 60}} />
                              </td>
                              <td>
                                <input type="number" min={0} value={line.price} onChange={e => handleLineChange(idx, 'price', e.target.value)} style={{width: 80}} />
                              </td>
                              <td>MVR {(line.price * line.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <ul style={{paddingLeft: 16}}>
                        {bill.products.map((line, idx) => (
                          <li key={idx}>{line.name} x {line.quantity} @ MVR {line.price.toFixed(2)}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>MVR {bill.total.toFixed(2)}</td>
                  <td>
                    {editingBillId === bill._id ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(bill)} disabled={saving}>Save</button>
                        <button className="btn btn-secondary btn-sm" style={{marginLeft: 8}} onClick={() => setEditingBillId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(bill)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Bills;

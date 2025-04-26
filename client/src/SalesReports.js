import React, { useEffect, useState } from 'react';
import { getSalesReport, getSales } from './api';
import { safeRender, formatDate, formatCurrency } from './utils';
import './styles.css';
// If you want graphs, you can use a library like chart.js or recharts. Here we use a placeholder.

const periods = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const SalesReports = () => {
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        data = await getSalesReport('custom', startDate, endDate);
      } else {
        data = await getSalesReport(period);
      }
      
      // Check if data exists and has the expected structure
      if (data && data.data) {
        setReport(data.data);
      } else {
        // Handle empty response
        setReport({
          period: period,
          sales: [],
          summary: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
          productSales: []
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to fetch report: ' + (err.response?.data?.message || err.message));
      // Set empty report on error
      setReport(null);
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    window.print(); // Simple browser print for now; can use jsPDF for more advanced export
  };

  return (
    <div className="sales-reports-page" style={{maxWidth: 1100, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Sales Reports</h2>
      <div style={{marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16}}>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="form-control" style={{maxWidth: 160}}>
          {periods.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        {period === 'custom' && (
          <>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={fetchReport}>Get Report</button>
          </>
        )}
        <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>Export as PDF</button>
      </div>
      {loading ? (
        <div>Loading report...</div>
      ) : error ? (
        <div style={{color: 'red'}}>{error}</div>
      ) : report ? (
        <div style={{overflowX: 'auto'}}>
          <table className="table sales-report-table" style={{minWidth: 700}}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill No</th>
                <th>Cashier</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {report.sales && report.sales.map((sale, idx) => (
                <tr key={sale._id || idx}>
                  <td>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : ''}</td>
                  <td>{safeRender(sale.billNumber)}</td>
                  <td>{safeRender(sale.cashier)}</td>
                  <td>{safeRender(sale.customer)}</td>
                  <td>
                    <ul style={{paddingLeft: 16}}>
                      {sale.products.map((item, i) => (
                        <li key={i}>{item.name} x {item.quantity} @ MVR {item.price.toFixed(2)}</li>
                      ))}
                    </ul>
                  </td>
                  <td>MVR {sale.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Placeholder for charts/graphs */}
          <div style={{marginTop: 32, minHeight: 120}}>
            <div style={{background: '#f8fafd', borderRadius: 8, padding: 24, textAlign: 'center', color: '#888'}}>
              Charts and graphs will be shown here (integrate with Chart.js or Recharts for visuals).
            </div>
          </div>
        </div>
      ) : (
        <div>No report data.</div>
      )}
    </div>
  );
};

export default SalesReports;

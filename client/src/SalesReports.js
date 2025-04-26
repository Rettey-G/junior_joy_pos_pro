import React, { useEffect, useState } from 'react';
import { getSalesReport, getSales } from './api';
import { safeRender, formatCurrency } from './utils';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './styles.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const periods = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const reportTypes = [
  { value: 'sales', label: 'Sales Overview' },
  { value: 'products', label: 'Product Performance' },
  { value: 'cashiers', label: 'Cashier Performance' },
  { value: 'hourly', label: 'Hourly Analysis' },
  { value: 'payment', label: 'Payment Methods' }
];

const SalesReports = () => {
  const [period, setPeriod] = useState('month');
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cashierStats, setCashierStats] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [paymentStats, setPaymentStats] = useState([]);

  useEffect(() => {
    fetchReport();
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchReport();
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line
  }, [period, startDate, endDate, reportType]);

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
        
        // Process data for additional reports
        if (data.data.sales && data.data.sales.length > 0) {
          processCashierStats(data.data.sales);
          processHourlyStats(data.data.sales);
          processPaymentStats(data.data.sales);
        }
      } else {
        // Handle empty response
        setReport({
          period: period,
          sales: [],
          summary: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
          productSales: []
        });
        setCashierStats([]);
        setHourlyStats([]);
        setPaymentStats([]);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to fetch report: ' + (err.response?.data?.message || err.message));
      // Set empty report on error
      setReport(null);
      setCashierStats([]);
      setHourlyStats([]);
      setPaymentStats([]);
    }
    setLoading(false);
  };

  // Process sales data to get cashier performance stats
  const processCashierStats = (sales) => {
    const cashierMap = {};
    
    sales.forEach(sale => {
      const cashierName = typeof sale.cashier === 'object' ? 
        (sale.cashier.name || sale.cashier.username || 'Unknown') : 
        (typeof sale.cashier === 'string' ? sale.cashier : 'Unknown');
      
      if (!cashierMap[cashierName]) {
        cashierMap[cashierName] = {
          name: cashierName,
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          transactions: 0
        };
      }
      
      cashierMap[cashierName].totalRevenue += Number(sale.total || 0);
      cashierMap[cashierName].transactions += 1;
    });
    
    // Calculate averages and format data
    const cashierStats = Object.values(cashierMap).map(cashier => ({
      ...cashier,
      averageOrderValue: cashier.transactions > 0 ? 
        cashier.totalRevenue / cashier.transactions : 0
    }));
    
    // Sort by revenue (highest first)
    cashierStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    setCashierStats(cashierStats);
  };

  // Process sales data to get hourly stats
  const processHourlyStats = (sales) => {
    const hourlyMap = {};
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = {
        hour: i,
        count: 0,
        revenue: 0
      };
    }
    
    sales.forEach(sale => {
      if (sale.createdAt) {
        const date = new Date(sale.createdAt);
        const hour = date.getHours();
        
        hourlyMap[hour].count += 1;
        hourlyMap[hour].revenue += Number(sale.total || 0);
      }
    });
    
    setHourlyStats(Object.values(hourlyMap));
  };

  // Process sales data to get payment method stats
  const processPaymentStats = (sales) => {
    const paymentMap = {
      'Cash': { method: 'Cash', count: 0, amount: 0 },
      'Card': { method: 'Card', count: 0, amount: 0 },
      'Bank Transfer': { method: 'Bank Transfer', count: 0, amount: 0 },
      'Other': { method: 'Other', count: 0, amount: 0 }
    };
    
    sales.forEach(sale => {
      const method = sale.paymentMethod || 'Cash';
      
      if (paymentMap[method]) {
        paymentMap[method].count += 1;
        paymentMap[method].amount += Number(sale.total || 0);
      } else {
        paymentMap['Other'].count += 1;
        paymentMap['Other'].amount += Number(sale.total || 0);
      }
    });
    
    setPaymentStats(Object.values(paymentMap));
  };

  const handleExportPDF = () => {
    window.print(); // Simple browser print for now; can use jsPDF for more advanced export
  };

  // Chart data for product performance
  const productChartData = {
    labels: report?.productSales?.slice(0, 10).map(product => product.name) || [],
    datasets: [
      {
        label: 'Revenue (MVR)',
        data: report?.productSales?.slice(0, 10).map(product => product.revenue) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Quantity Sold',
        data: report?.productSales?.slice(0, 10).map(product => product.quantity) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart data for cashier performance
  const cashierChartData = {
    labels: cashierStats.map(cashier => cashier.name),
    datasets: [
      {
        label: 'Revenue (MVR)',
        data: cashierStats.map(cashier => cashier.totalRevenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart data for hourly analysis
  const hourlyChartData = {
    labels: hourlyStats.map(hour => `${hour.hour}:00`),
    datasets: [
      {
        label: 'Sales Count',
        data: hourlyStats.map(hour => hour.count),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Chart data for payment methods
  const paymentChartData = {
    labels: paymentStats.map(payment => payment.method),
    datasets: [
      {
        label: 'Payment Methods',
        data: paymentStats.map(payment => payment.amount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Report'
      }
    }
  };

  return (
    <div className="sales-reports-page" style={{maxWidth: 1100, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Sales Reports</h2>
      
      <div className="report-controls" style={{marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            className="form-control" 
            style={{maxWidth: 160}}
          >
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          
          {period === 'custom' && (
            <>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="form-control"
              />
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="form-control"
              />
              <button 
                className="btn btn-primary btn-sm" 
                onClick={fetchReport}
              >
                Get Report
              </button>
            </>
          )}
        </div>
        
        <div style={{display: 'flex', gap: 16}}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleExportPDF}
          >
            Export as PDF
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={fetchReport}
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Report Type Selector */}
      <div className="report-type-selector" style={{marginBottom: 24}}>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
          {reportTypes.map(type => (
            <button
              key={type.value}
              className={`btn ${reportType === type.value ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
              onClick={() => setReportType(type.value)}
              style={{minWidth: 120}}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container" style={{padding: 40, textAlign: 'center'}}>
          <div className="spinner" style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            borderTop: '4px solid #1976d2',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p>Loading report data...</p>
        </div>
      ) : error ? (
        <div style={{color: 'red', padding: 24, background: '#ffebee', borderRadius: 8, marginBottom: 24}}>
          {error}
          <p style={{marginTop: 16}}>
            Please try refreshing the data or selecting a different time period.
          </p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="summary-cards" style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16,
            marginBottom: 24
          }}>
            <div className="summary-card" style={{
              background: 'white',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 8px 0', color: '#1976d2', fontSize: '1rem'}}>Total Sales</h3>
              <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{report.summary?.totalSales || 0}</div>
              <div style={{color: '#757575', fontSize: '0.9rem'}}>Transactions</div>
            </div>
            
            <div className="summary-card" style={{
              background: 'white',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 8px 0', color: '#1976d2', fontSize: '1rem'}}>Total Revenue</h3>
              <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{formatCurrency(report.summary?.totalRevenue || 0)}</div>
              <div style={{color: '#757575', fontSize: '0.9rem'}}>MVR</div>
            </div>
            
            <div className="summary-card" style={{
              background: 'white',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{margin: '0 0 8px 0', color: '#1976d2', fontSize: '1rem'}}>Average Order</h3>
              <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{formatCurrency(report.summary?.averageOrderValue || 0)}</div>
              <div style={{color: '#757575', fontSize: '0.9rem'}}>Per Transaction</div>
            </div>
          </div>
          
          {/* Report Content Based on Selected Type */}
          {reportType === 'sales' && (
            <div className="sales-overview">
              <div className="card" style={{marginBottom: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 16}}>
                <h3 style={{margin: '0 0 16px 0', color: '#1976d2'}}>Sales Transactions</h3>
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
                          <td>{typeof sale.cashier === 'object' ? safeRender(sale.cashier.name || sale.cashier.username || 'Unknown') : safeRender(sale.cashier || 'Unknown')}</td>
                          <td>{safeRender(sale.customer)}</td>
                          <td>
                            <ul style={{paddingLeft: 16, margin: 0}}>
                              {sale.products && sale.products.map((item, i) => (
                                <li key={i}>{safeRender(item.name)} x {item.quantity} @ MVR {Number(item.price).toFixed(2)}</li>
                              ))}
                            </ul>
                          </td>
                          <td>{formatCurrency(sale.total)}</td>
                        </tr>
                      ))}
                      {(!report.sales || report.sales.length === 0) && (
                        <tr>
                          <td colSpan="6" style={{textAlign: 'center', padding: 24}}>No sales data available for this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'products' && (
            <div className="product-performance">
              <div className="card" style={{marginBottom: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 16}}>
                <h3 style={{margin: '0 0 16px 0', color: '#1976d2'}}>Product Performance</h3>
                
                <div style={{height: 400, marginBottom: 24}}>
                  <Bar data={productChartData} options={chartOptions} />
                </div>
                
                <div style={{overflowX: 'auto'}}>
                  <table className="table product-report-table" style={{minWidth: 500}}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{textAlign: 'center'}}>Quantity Sold</th>
                        <th style={{textAlign: 'right'}}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.productSales && report.productSales.map((product, idx) => (
                        <tr key={idx}>
                          <td>{safeRender(product.name)}</td>
                          <td style={{textAlign: 'center'}}>{product.quantity}</td>
                          <td style={{textAlign: 'right'}}>{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                      {(!report.productSales || report.productSales.length === 0) && (
                        <tr>
                          <td colSpan="3" style={{textAlign: 'center', padding: 24}}>No product data available for this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'cashiers' && (
            <div className="cashier-performance">
              <div className="card" style={{marginBottom: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 16}}>
                <h3 style={{margin: '0 0 16px 0', color: '#1976d2'}}>Cashier Performance</h3>
                
                <div style={{height: 400, marginBottom: 24}}>
                  <Bar data={cashierChartData} options={chartOptions} />
                </div>
                
                <div style={{overflowX: 'auto'}}>
                  <table className="table cashier-report-table" style={{minWidth: 500}}>
                    <thead>
                      <tr>
                        <th>Cashier</th>
                        <th style={{textAlign: 'center'}}>Transactions</th>
                        <th style={{textAlign: 'right'}}>Total Revenue</th>
                        <th style={{textAlign: 'right'}}>Average Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashierStats.map((cashier, idx) => (
                        <tr key={idx}>
                          <td>{safeRender(cashier.name)}</td>
                          <td style={{textAlign: 'center'}}>{cashier.transactions}</td>
                          <td style={{textAlign: 'right'}}>{formatCurrency(cashier.totalRevenue)}</td>
                          <td style={{textAlign: 'right'}}>{formatCurrency(cashier.averageOrderValue)}</td>
                        </tr>
                      ))}
                      {cashierStats.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{textAlign: 'center', padding: 24}}>No cashier data available for this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'hourly' && (
            <div className="hourly-analysis">
              <div className="card" style={{marginBottom: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 16}}>
                <h3 style={{margin: '0 0 16px 0', color: '#1976d2'}}>Hourly Sales Analysis</h3>
                
                <div style={{height: 400, marginBottom: 24}}>
                  <Line data={hourlyChartData} options={chartOptions} />
                </div>
                
                <div style={{overflowX: 'auto'}}>
                  <table className="table hourly-report-table" style={{minWidth: 500}}>
                    <thead>
                      <tr>
                        <th>Hour</th>
                        <th style={{textAlign: 'center'}}>Number of Sales</th>
                        <th style={{textAlign: 'right'}}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hourlyStats
                        .filter(hour => hour.count > 0)
                        .sort((a, b) => a.hour - b.hour)
                        .map((hour, idx) => (
                        <tr key={idx}>
                          <td>{hour.hour}:00 - {hour.hour}:59</td>
                          <td style={{textAlign: 'center'}}>{hour.count}</td>
                          <td style={{textAlign: 'right'}}>{formatCurrency(hour.revenue)}</td>
                        </tr>
                      ))}
                      {hourlyStats.filter(hour => hour.count > 0).length === 0 && (
                        <tr>
                          <td colSpan="3" style={{textAlign: 'center', padding: 24}}>No hourly data available for this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'payment' && (
            <div className="payment-methods">
              <div className="card" style={{marginBottom: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: 16}}>
                <h3 style={{margin: '0 0 16px 0', color: '#1976d2'}}>Payment Methods</h3>
                
                <div style={{height: 400, marginBottom: 24, display: 'flex', justifyContent: 'center'}}>
                  <div style={{width: '50%', minWidth: 300}}>
                    <Pie data={paymentChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div style={{overflowX: 'auto'}}>
                  <table className="table payment-report-table" style={{minWidth: 500}}>
                    <thead>
                      <tr>
                        <th>Payment Method</th>
                        <th style={{textAlign: 'center'}}>Number of Transactions</th>
                        <th style={{textAlign: 'right'}}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentStats.map((payment, idx) => (
                        <tr key={idx}>
                          <td>{payment.method}</td>
                          <td style={{textAlign: 'center'}}>{payment.count}</td>
                          <td style={{textAlign: 'right'}}>{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))}
                      {paymentStats.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{textAlign: 'center', padding: 24}}>No payment method data available for this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{padding: 24, background: '#e3f2fd', borderRadius: 8, textAlign: 'center'}}>
          No report data available. Please select a time period and click "Get Report".
        </div>
      )}
    </div>
  );
};

export default SalesReports;

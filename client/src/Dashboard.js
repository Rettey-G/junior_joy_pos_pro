import React, { useState, useEffect } from 'react';
import { getSalesReport } from './api';
import { useAuth } from './AuthContext';
import { safeRender, formatDate, formatCurrency } from './utils';

const Dashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [reportPeriod, setReportPeriod] = useState('day');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customDates, setCustomDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch report data when period changes or on a timer
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchReportData();
    }, 30000); // 30 seconds
    
    // Initial fetch
    fetchReportData();
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, reportPeriod, customDates]);
  
  const fetchReportData = async () => {
      setLoading(true);
      try {
        let response;
        if (reportPeriod === 'custom') {
          // Ensure dates are valid
          if (!customDates.startDate || !customDates.endDate) {
            throw new Error('Please select valid start and end dates');
          }
          response = await getSalesReport(reportPeriod, customDates.startDate, customDates.endDate);
        } else {
          // Use a try-catch block specifically for the API call
          try {
            // Force cache bypass by adding a timestamp parameter
            const timestamp = new Date().getTime();
            // Make sure we're using the correct period format that backend expects
            const period = reportPeriod === 'daily' ? 'day' : 
                          reportPeriod === 'weekly' ? 'week' : 
                          reportPeriod === 'monthly' ? 'month' : 
                          reportPeriod === 'yearly' ? 'year' : reportPeriod;
            response = await getSalesReport(period, null, null, timestamp);
          } catch (apiError) {
            console.error('API Error:', apiError);
            // Create a fallback response with empty data
            response = {
              data: {
                summary: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
                sales: [],
                productSales: []
              }
            };
          }
        }
        
        // Process the data to ensure all values are of the correct type
        if (response && response.data) {
          // Safely process the data
          const processedData = {
            ...response.data,
            // Ensure summary values are numbers
            summary: response.data.summary ? {
              totalSales: Number(response.data.summary.totalSales || 0),
              totalRevenue: Number(response.data.summary.totalRevenue || 0),
              averageOrderValue: Number(response.data.summary.averageOrderValue || 0)
            } : { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
            // Ensure sales is an array
            sales: Array.isArray(response.data.sales) ? response.data.sales : [],
            // Ensure productSales is an array
            productSales: Array.isArray(response.data.productSales) ? response.data.productSales : []
          };
          setReportData(processedData);
        } else {
          // Set default empty data structure
          setReportData({
            summary: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
            sales: [],
            productSales: []
          });
        }
        
        setError(null);
      } catch (err) {
        setError('Error fetching report: ' + err.message);
        console.error('Error fetching report:', err);
        // Set default empty data structure on error
        setReportData({
          summary: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
          sales: [],
          productSales: []
        });
      } finally {
        setLoading(false);
      }
    };

    // This is now handled by the new useEffect above

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Dashboard</h2>
        <p>Please log in to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Dashboard</h2>
      
      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Report Period</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={() => setReportPeriod('daily')}
            style={{
              background: reportPeriod === 'daily' ? '#2196f3' : '#e0e0e0',
              color: reportPeriod === 'daily' ? 'white' : 'black',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Today
          </button>
          <button
            onClick={() => setReportPeriod('weekly')}
            style={{
              background: reportPeriod === 'weekly' ? '#2196f3' : '#e0e0e0',
              color: reportPeriod === 'weekly' ? 'white' : 'black',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setReportPeriod('monthly')}
            style={{
              background: reportPeriod === 'monthly' ? '#2196f3' : '#e0e0e0',
              color: reportPeriod === 'monthly' ? 'white' : 'black',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            This Month
          </button>
          <button
            onClick={() => setReportPeriod('custom')}
            style={{
              background: reportPeriod === 'custom' ? '#2196f3' : '#e0e0e0',
              color: reportPeriod === 'custom' ? 'white' : 'black',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Custom
          </button>
        </div>
        
        {reportPeriod === 'custom' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Start Date:</label>
              <input
                type="date"
                value={customDates.startDate}
                onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>End Date:</label>
              <input
                type="date"
                value={customDates.endDate}
                onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div>Loading report data...</div>
      ) : reportData ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Summary</h3>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: '1', background: '#e3f2fd', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#555' }}>Total Sales</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData.summary.totalSales}</div>
              </div>
              <div style={{ flex: '1', background: '#e8f5e9', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#555' }}>Total Revenue</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${reportData.summary.totalRevenue.toFixed(2)}</div>
              </div>
              <div style={{ flex: '1', background: '#fff3e0', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#555' }}>Average Order Value</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${reportData.summary.averageOrderValue.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
              Period: {reportData.dateRange && reportData.dateRange.start ? formatDate(reportData.dateRange.start) : ''} to {reportData.dateRange && reportData.dateRange.end ? formatDate(reportData.dateRange.end) : ''}
            </div>
          </div>
          
          <div>
            <h3>Top Products</h3>
            {reportData.productSales.length === 0 ? (
              <p>No sales data for this period</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Quantity Sold</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.productSales.map((product, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{product.name}</td>
                      <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{product.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>${product.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div>No report data available</div>
      )}
    </div>
  );
};

export default Dashboard;

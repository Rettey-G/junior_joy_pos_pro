import React from 'react';
import api from './api';

function App() {
  const [status, setStatus] = React.useState('Loading...');

  React.useEffect(() => {
    // Test connection to backend
    const fetchBackendStatus = async () => {
      try {
        const response = await fetch(api.defaults.baseURL);
        const data = await response.text();
        setStatus(data || 'Connected to backend!');
      } catch (error) {
        setStatus('Error connecting to backend: ' + error.message);
      }
    };

    fetchBackendStatus();
  }, []);

  return (
    <div style={{ 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      <h1>Junior Joy POS</h1>
      <div style={{
        background: '#f5f5f5',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h2>Backend Status</h2>
        <p>{status}</p>
      </div>
      <p style={{ marginTop: '40px' }}>
        Your Point of Sale system is ready for development!
      </p>
    </div>
  );
}

export default App;

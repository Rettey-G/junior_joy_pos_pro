import React, { useState } from 'react';

const DirectLogin = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = (e) => {
    e.preventDefault();
    
    // Create a user object that mimics what would come from the backend
    const user = {
      id: '1',
      username: 'admin',
      name: 'System Admin',
      role: 'admin'
    };
    
    // Create a fake token
    const token = 'direct-login-token-' + Date.now();
    
    // Store in localStorage (same as the real login would do)
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };
  
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', color: '#2196f3', marginBottom: '20px' }}>Emergency Direct Login</h2>
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          This page bypasses the database authentication to help you access the system.
        </p>
      </div>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            readOnly
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', paddingRight: '40px' }}
              readOnly
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              {showPassword ? '🔒' : '👁️'}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Login Directly
        </button>
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        This is a temporary solution to access the system when the database connection is not working.
      </p>
    </div>
  );
};

export default DirectLogin;

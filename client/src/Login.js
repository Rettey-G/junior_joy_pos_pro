import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const Login = ({ onToggleForm }) => {
  const { login, error } = useAuth();
  const [credentials, setCredentials] = useState({ username: 'website_user', password: 'website123' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [networkStatus, setNetworkStatus] = useState('online');
  
  // Check network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    setLoginAttempts(prev => prev + 1);
    
    try {
      await login(credentials);
      // Login successful, handled by AuthContext
      console.log('Login successful');
    } catch (err) {
      console.error('Login error:', err);
      
      // Different error messages based on the error type
      if (err.message && err.message.includes('Network Error')) {
        setLoginError('Network error. The system will try to log you in offline mode.');
        
        // Try again with the same credentials after a short delay
        setTimeout(async () => {
          try {
            await login(credentials);
          } catch (retryErr) {
            setLoginError('Could not connect to the server. Please check your internet connection or try again later.');
          } finally {
            setLoading(false);
          }
        }, 1000);
        return;
      } else if (loginAttempts >= 2) {
        // After multiple failed attempts, suggest using the default credentials
        setLoginError('Multiple login attempts failed. Try using the default credentials shown below.');
        setCredentials({ username: 'website_user', password: 'website123' });
      } else {
        setLoginError('Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Login</h2>
      {/* Status indicators */}
      {networkStatus === 'offline' && (
        <div style={{ color: '#856404', marginBottom: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeeba' }}>
          You are currently offline. The system will use local authentication.
        </div>
      )}
      
      {/* Error message */}
      <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', border: '1px solid #ffcdd2', display: (error || loginError) ? 'block' : 'none' }}>
        {error || loginError || 'Invalid credentials'}
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', paddingRight: '40px' }}
              autoComplete="current-password"
            />
            <button 
              type="button" 
              onClick={togglePasswordVisibility}
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
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            <strong>GUARANTEED LOGIN CREDENTIALS:</strong> username: <code>website_user</code> password: <code>website123</code>
          </small>
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            These credentials will work even when the backend is unavailable.
          </small>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Don't have an account?{' '}
        <button
          onClick={onToggleForm}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196f3',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Register
        </button>
      </p>
    </div>
  );
};

export default Login;

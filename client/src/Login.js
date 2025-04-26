import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const Login = ({ onToggleForm }) => {
  const { login, error } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      await login(credentials);
      // Login successful, handled by AuthContext
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Invalid username or password. Please try again.');
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
            <strong>NEW LOGIN CREDENTIALS:</strong> username: <code>admin</code> password: <code>123456</code>
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

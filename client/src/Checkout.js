import React, { useState, useEffect } from 'react';
import { getProducts, createSale } from './api';
import { useAuth } from './AuthContext';

const Checkout = () => {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts();
        setProducts(response.data);
        setError(null);
      } catch (err) {
        setError('Error fetching products: ' + err.message);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Add product to cart
  const addToCart = (product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.product === product._id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      setCart(cart.map(item => 
        item.product === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart
      setCart([...cart, {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    
    setCart(cart.map(item => 
      item.product === productId 
        ? { ...item, quantity } 
        : item
    ));
  };

  // Calculate cart total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Process checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to process a sale');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Format sale data
      const saleData = {
        products: cart.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        paymentMethod,
        customer: customer.name || customer.phone ? customer : undefined,
        notes: notes || undefined
      };

      // Create sale
      await createSale(saleData);
      
      // Reset cart and form
      setCart([]);
      setCustomer({ name: '', phone: '' });
      setNotes('');
      setSuccess(true);
    } catch (err) {
      setError('Error processing sale: ' + (err.response?.data?.message || err.message));
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Checkout</h2>
      
      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          Sale completed successfully!
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Product List */}
        <div style={{ flex: '1' }}>
          <h3>Products</h3>
          {loading && <p>Loading products...</p>}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {products.map(product => (
              <div 
                key={product._id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '10px',
                  cursor: 'pointer',
                  background: product.stock > 0 ? 'white' : '#f5f5f5'
                }}
                onClick={() => product.stock > 0 && addToCart(product)}
              >
                <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                <div>${product.price.toFixed(2)}</div>
                <div style={{ color: product.stock > 0 ? '#2e7d32' : '#c62828' }}>
                  {product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Cart */}
        <div style={{ flex: '1', background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <h3>Cart</h3>
          
          {cart.length === 0 ? (
            <p>No items in cart</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Item</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Price</th>
                    <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Subtotal</th>
                    <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.product}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.name}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>${item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button 
                            onClick={() => updateQuantity(item.product, item.quantity - 1)}
                            style={{ border: '1px solid #ddd', background: 'white', width: '25px', height: '25px', cursor: 'pointer' }}
                          >-</button>
                          <span style={{ margin: '0 8px' }}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product, item.quantity + 1)}
                            style={{ border: '1px solid #ddd', background: 'white', width: '25px', height: '25px', cursor: 'pointer' }}
                          >+</button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                        <button 
                          onClick={() => removeFromCart(item.product)}
                          style={{ 
                            background: '#f44336', 
                            color: 'white', 
                            border: 'none', 
                            padding: '5px 10px', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>Total:</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>${calculateTotal().toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              
              <div style={{ marginTop: '20px' }}>
                <h4>Customer Information (Optional)</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Phone:</label>
                  <input
                    type="text"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <h4>Payment Method</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                    />
                    Cash
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    Card
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile"
                      checked={paymentMethod === 'mobile'}
                      onChange={() => setPaymentMethod('mobile')}
                    />
                    Mobile Payment
                  </label>
                </div>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Notes:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}
                />
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '4px',
                  cursor: loading || cart.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: loading || cart.length === 0 ? 0.7 : 1,
                  marginTop: '20px',
                  width: '100%',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

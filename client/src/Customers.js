import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerSales } from './api';
import { safeRender, formatCurrency } from './utils';
import './styles.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    membershipType: 'None',
    notes: ''
  });
  const [customerSales, setCustomerSales] = useState([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm]);

  const fallbackCustomers = [
    { id: '1', name: 'Demo Customer', phone: '555-1234', email: 'demo@example.com', address: 'Demo Address', membershipType: 'None', notes: 'Demo notes' },
    { id: '2', name: 'Test Customer', phone: '555-5678', email: 'test@example.com', address: 'Test Address', membershipType: 'VIP', notes: 'Test notes' }
  ];

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCustomers(currentPage, 10, searchTerm);
      if (response && response.data && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.pages || 1);
      } else if (response && response.data && Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
        setTotalPages(1);
      } else {
        setCustomers(fallbackCustomers);
        setTotalPages(1);
      }
    } catch (err) {
      setCustomers(fallbackCustomers);
      setTotalPages(1);
      setError('Failed to fetch customers, showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerSales = async (customerId) => {
    try {
      const response = await getCustomerSales(customerId);
      if (response && response.data) {
        setCustomerSales(response.data);
      } else {
        setCustomerSales([]);
      }
      setShowSalesModal(true);
    } catch (err) {
      console.error('Error fetching customer sales:', err);
      setError('Failed to fetch customer sales: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      membershipType: 'None',
      notes: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      membershipType: customer.membershipType || 'None',
      notes: customer.notes || ''
    });
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedCustomer) {
        await updateCustomer(selectedCustomer._id, formData);
      } else {
        await createCustomer(formData);
      }
      
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Failed to save customer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await deleteCustomer(customerId);
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        setError('Failed to delete customer: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const viewCustomerSales = (customerId) => {
    setSelectedCustomer(customers.find(c => c._id === customerId));
    fetchCustomerSales(customerId);
  };

  // Pagination controls
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="pagination">
        <button 
          className="pagination-button"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {pages}
        <button 
          className="pagination-button"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="customers-page">
      <h2 className="page-title">Customer Management</h2>
      
      <div className="action-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          Add New Customer
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Membership</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No customers found</td>
                  </tr>
                ) : (
                  customers.map(customer => (
                    <tr key={customer._id}>
                      <td>{safeRender(customer.name)}</td>
                      <td>
                        <div>{safeRender(customer.email)}</div>
                        <div>{safeRender(customer.phone)}</div>
                      </td>
                      <td>
                        <span className={`membership-badge ${customer.membershipType.toLowerCase()}`}>
                          {customer.membershipType}
                        </span>
                      </td>
                      <td>{safeRender(customer.address)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-info"
                            onClick={() => openEditModal(customer)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => viewCustomerSales(customer._id)}
                          >
                            View Sales
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(customer._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && renderPagination()}
        </>
      )}
      
      {/* Customer Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="card-header">
              <h3>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button 
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-column">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="form-column">
                    <div className="form-group">
                      <label>Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="3"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Membership Type</label>
                      <select
                        name="membershipType"
                        value={formData.membershipType}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="None">None</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {isEditing ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Customer Sales Modal */}
      {showSalesModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-card landscape-modal">
            <div className="card-header">
              <h3>Sales History for {selectedCustomer.name}</h3>
              <button 
                className="close-button"
                onClick={() => setShowSalesModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="card-body">
              {customerSales.length === 0 ? (
                <div className="text-center">No sales found for this customer</div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bill Number</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSales.map(sale => (
                        <tr key={sale._id}>
                          <td>{safeRender(sale.billNumber)}</td>
                          <td>{new Date(sale.createdAt).toLocaleString()}</td>
                          <td>
                            <ul className="sale-items-list">
                              {sale.products.map((product, idx) => (
                                <li key={idx}>
                                  {product.name} x {product.quantity} @ {formatCurrency(product.price)}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>{formatCurrency(sale.total)}</td>
                          <td>{safeRender(sale.paymentMethod)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="customer-stats">
                <h4>Customer Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Total Purchases</div>
                    <div className="stat-value">{customerSales.length}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value">
                      {formatCurrency(customerSales.reduce((sum, sale) => sum + sale.total, 0))}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Average Purchase</div>
                    <div className="stat-value">
                      {customerSales.length > 0
                        ? formatCurrency(customerSales.reduce((sum, sale) => sum + sale.total, 0) / customerSales.length)
                        : formatCurrency(0)
                      }
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">First Purchase</div>
                    <div className="stat-value">
                      {customerSales.length > 0
                        ? new Date(Math.min(...customerSales.map(s => new Date(s.createdAt)))).toLocaleDateString()
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowSalesModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

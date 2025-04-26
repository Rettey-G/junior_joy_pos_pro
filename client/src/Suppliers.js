import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getSuppliers, 
  getSupplier, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from './api';
import './styles.css';

const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: '',
    notes: '',
    status: 'active'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch suppliers on component mount and when filters change
  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchTerm, statusFilter]);

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await getSuppliers(currentPage, 10, searchTerm, statusFilter);
      if (response && response.data) {
        setSuppliers(response.data.suppliers || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open modal for creating a new supplier
  const handleCreateSupplier = () => {
    setModalMode('create');
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      paymentTerms: '',
      notes: '',
      status: 'active'
    });
    setShowModal(true);
  };

  // Open modal for editing a supplier
  const handleEditSupplier = async (id) => {
    try {
      setLoading(true);
      const response = await getSupplier(id);
      if (response && response.data) {
        setSelectedSupplier(response.data);
        setFormData({
          name: response.data.name || '',
          contactPerson: response.data.contactPerson || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          taxId: response.data.taxId || '',
          paymentTerms: response.data.paymentTerms || '',
          notes: response.data.notes || '',
          status: response.data.status || 'active'
        });
        setModalMode('edit');
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error fetching supplier details:', err);
      setError('Failed to load supplier details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    
    try {
      if (modalMode === 'create') {
        await createSupplier(formData);
      } else {
        await updateSupplier(selectedSupplier._id, formData);
      }
      
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError(`Failed to ${modalMode === 'create' ? 'create' : 'update'} supplier. Please try again.`);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteConfirm(true);
  };

  // Delete supplier
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    
    try {
      await deleteSupplier(selectedSupplier._id);
      setShowDeleteConfirm(false);
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier. Please try again.');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="suppliers-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{color: '#1976d2', margin: 0}}>Suppliers</h2>
        <button 
          className="btn btn-primary" 
          onClick={handleCreateSupplier}
        >
          <i className="fa fa-plus"></i> Add Supplier
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="alert alert-danger mb-4">
          {error}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}
      
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Filter Suppliers</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-5 mb-3">
              <label className="form-label">Search</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name, contact person, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-3 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Suppliers List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading suppliers...</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Suppliers List</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th style={{width: '150px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-3">No suppliers found</td>
                    </tr>
                  ) : (
                    suppliers.map(supplier => (
                      <tr key={supplier._id}>
                        <td>{supplier.name}</td>
                        <td>{supplier.contactPerson || '-'}</td>
                        <td>{supplier.email || '-'}</td>
                        <td>{supplier.phone || '-'}</td>
                        <td>
                          <span className={`badge ${supplier.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {supplier.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-info me-2"
                            onClick={() => handleEditSupplier(supplier._id)}
                            title="Edit Supplier"
                          >
                            <i className="fa fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteClick(supplier)}
                            title="Delete Supplier"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
      
      {/* Supplier Form Modal */}
      <div className="modal" style={{ display: showModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {modalMode === 'create' ? 'Add New Supplier' : 'Edit Supplier'}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowModal(false)}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Supplier Name <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Person</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea 
                    className="form-control" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                  ></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tax ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Payment Terms</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      placeholder="e.g., Net 30, COD"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-control" 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
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
                  {modalMode === 'create' ? 'Add Supplier' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <div className="modal" style={{ display: showDeleteConfirm ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowDeleteConfirm(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete supplier <strong>{selectedSupplier?.name}</strong>?</p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDeleteSupplier}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;

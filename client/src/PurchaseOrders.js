import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getPurchaseOrders, 
  getPurchaseOrder, 
  createPurchaseOrder, 
  updatePurchaseOrder, 
  deletePurchaseOrder,
  receivePurchaseOrder,
  getSuppliers,
  getProducts
} from './api';
import './styles.css';

const PurchaseOrders = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPO, setSelectedPO] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    items: [{ product: '', quantity: 1, unitPrice: 0 }],
    notes: '',
    status: 'pending'
  });
  const [receiveData, setReceiveData] = useState({
    items: []
  });

  // Fetch purchase orders on component mount and when filters change
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchProducts();
  }, [currentPage, searchTerm, statusFilter]);

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await getPurchaseOrders(currentPage, 10, searchTerm, statusFilter);
      if (response && response.data) {
        setPurchaseOrders(response.data.purchaseOrders || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers for dropdown
  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers(1, 100, '', 'active');
      if (response && response.data) {
        setSuppliers(response.data.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response && response.data) {
        setProducts(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
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

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // If product changed, update unit price if possible
    if (field === 'product') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        updatedItems[index].unitPrice = selectedProduct.costPrice || 0;
      }
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Add new item row
  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unitPrice: 0 }]
    });
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      setFormData({
        ...formData,
        items: updatedItems
      });
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0).toFixed(2);
  };

  // Open modal for creating a new purchase order
  const handleCreatePO = () => {
    setModalMode('create');
    setFormData({
      supplier: '',
      expectedDeliveryDate: '',
      items: [{ product: '', quantity: 1, unitPrice: 0 }],
      notes: '',
      status: 'pending'
    });
    setShowModal(true);
  };

  // Open modal for editing a purchase order
  const handleEditPO = async (id) => {
    try {
      setLoading(true);
      const response = await getPurchaseOrder(id);
      if (response && response.data) {
        const po = response.data;
        setSelectedPO(po);
        setFormData({
          supplier: po.supplier._id || '',
          expectedDeliveryDate: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '',
          items: po.items.map(item => ({
            product: item.product._id || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          notes: po.notes || '',
          status: po.status
        });
        setModalMode('edit');
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setError('Failed to load purchase order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open receive modal
  const handleReceivePO = async (id) => {
    try {
      setLoading(true);
      const response = await getPurchaseOrder(id);
      if (response && response.data) {
        const po = response.data;
        setSelectedPO(po);
        setReceiveData({
          items: po.items.map(item => ({
            product: item.product._id,
            productName: item.product.name,
            orderedQuantity: item.quantity,
            receivedQuantity: item.receivedQuantity || 0,
            remainingQuantity: item.quantity - (item.receivedQuantity || 0),
            quantityToReceive: 0
          }))
        });
        setShowReceiveModal(true);
      }
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setError('Failed to load purchase order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle receive quantity change
  const handleReceiveQuantityChange = (index, value) => {
    const updatedItems = [...receiveData.items];
    updatedItems[index].quantityToReceive = parseInt(value) || 0;
    setReceiveData({
      ...receiveData,
      items: updatedItems
    });
  };

  // Submit receive form
  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const itemsToReceive = receiveData.items
        .filter(item => item.quantityToReceive > 0)
        .map(item => ({
          product: item.product,
          quantityToReceive: item.quantityToReceive
        }));
      
      if (itemsToReceive.length === 0) {
        setError('Please enter at least one item quantity to receive');
        return;
      }
      
      await receivePurchaseOrder(selectedPO._id, { items: itemsToReceive });
      setShowReceiveModal(false);
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error receiving purchase order:', err);
      setError('Failed to receive items. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplier) {
      setError('Supplier is required');
      return;
    }
    
    if (formData.items.some(item => !item.product || item.quantity <= 0)) {
      setError('All items must have a product selected and quantity greater than zero');
      return;
    }
    
    try {
      if (modalMode === 'create') {
        await createPurchaseOrder(formData);
      } else {
        await updatePurchaseOrder(selectedPO._id, formData);
      }
      
      setShowModal(false);
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error saving purchase order:', err);
      setError(`Failed to ${modalMode === 'create' ? 'create' : 'update'} purchase order. Please try again.`);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (po) => {
    setSelectedPO(po);
    setShowDeleteConfirm(true);
  };

  // Delete purchase order
  const handleDeletePO = async () => {
    if (!selectedPO) return;
    
    try {
      await deletePurchaseOrder(selectedPO._id);
      setShowDeleteConfirm(false);
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      setError('Failed to delete purchase order. Please try again.');
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'approved':
        return 'bg-info';
      case 'received':
        return 'bg-success';
      case 'partially_received':
        return 'bg-primary';
      case 'cancelled':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="purchase-orders-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{color: '#1976d2', margin: 0}}>Purchase Orders</h2>
        <button 
          className="btn btn-primary" 
          onClick={handleCreatePO}
        >
          <i className="fa fa-plus"></i> Create Purchase Order
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
          <h5 className="mb-0">Filter Purchase Orders</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-5 mb-3">
              <label className="form-label">Search</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by PO number or supplier"
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="partially_received">Partially Received</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
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
      
      {/* Purchase Orders List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading purchase orders...</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Purchase Orders List</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Date Created</th>
                    <th>Expected Delivery</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style={{width: '180px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-3">No purchase orders found</td>
                    </tr>
                  ) : (
                    purchaseOrders.map(po => (
                      <tr key={po._id}>
                        <td>{po.poNumber}</td>
                        <td>{po.supplier?.name || '-'}</td>
                        <td>{formatDate(po.createdAt)}</td>
                        <td>{formatDate(po.expectedDeliveryDate)}</td>
                        <td>${po.totalAmount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(po.status)}`}>
                            {formatStatus(po.status)}
                          </span>
                        </td>
                        <td>
                          {po.status !== 'cancelled' && po.status !== 'received' && (
                            <button 
                              className="btn btn-sm btn-success me-1"
                              onClick={() => handleReceivePO(po._id)}
                              title="Receive Items"
                              disabled={po.status === 'cancelled' || po.status === 'received'}
                            >
                              <i className="fa fa-check"></i>
                            </button>
                          )}
                          {po.status === 'pending' && (
                            <button 
                              className="btn btn-sm btn-info me-1"
                              onClick={() => handleEditPO(po._id)}
                              title="Edit Purchase Order"
                            >
                              <i className="fa fa-edit"></i>
                            </button>
                          )}
                          {po.status === 'pending' && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteClick(po)}
                              title="Cancel Purchase Order"
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          )}
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
      
      {/* Purchase Order Form Modal */}
      <div className="modal" style={{ display: showModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {modalMode === 'create' ? 'Create Purchase Order' : 'Edit Purchase Order'}
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
                    <label className="form-label">Supplier <span className="text-danger">*</span></label>
                    <select 
                      className="form-select" 
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Expected Delivery Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="expectedDeliveryDate"
                      value={formData.expectedDeliveryDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <h6 className="mt-4 mb-3">Order Items</h6>
                {formData.items.map((item, index) => (
                  <div key={index} className="row mb-3 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label">Product <span className="text-danger">*</span></label>
                      <select 
                        className="form-select" 
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Quantity <span className="text-danger">*</span></label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Unit Price ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-2">
                      <button 
                        type="button" 
                        className="btn btn-danger w-100"
                        onClick={() => removeItemRow(index)}
                        disabled={formData.items.length <= 1}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="mb-3">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={addItemRow}
                  >
                    <i className="fa fa-plus"></i> Add Item
                  </button>
                </div>
                
                <div className="row">
                  <div className="col-md-6 offset-md-6">
                    <div className="alert alert-info">
                      <strong>Total Amount:</strong> ${calculateTotal()}
                    </div>
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
                  {modalMode === 'create' ? 'Create Order' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Receive Items Modal */}
      <div className="modal" style={{ display: showReceiveModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Receive Items</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowReceiveModal(false)}
              ></button>
            </div>
            <form onSubmit={handleReceiveSubmit}>
              <div className="modal-body">
                <div className="alert alert-info mb-4">
                  <strong>PO Number:</strong> {selectedPO?.poNumber}<br />
                  <strong>Supplier:</strong> {selectedPO?.supplier?.name}<br />
                  <strong>Status:</strong> {selectedPO && formatStatus(selectedPO.status)}
                </div>
                
                <h6 className="mb-3">Items to Receive</h6>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Ordered</th>
                        <th>Received</th>
                        <th>Remaining</th>
                        <th>Receive Now</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveData.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.orderedQuantity}</td>
                          <td>{item.receivedQuantity}</td>
                          <td>{item.remainingQuantity}</td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={item.quantityToReceive}
                              onChange={(e) => handleReceiveQuantityChange(index, e.target.value)}
                              min="0"
                              max={item.remainingQuantity}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowReceiveModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                >
                  Confirm Receipt
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
              <h5 className="modal-title">Confirm Cancel</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowDeleteConfirm(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel purchase order <strong>{selectedPO?.poNumber}</strong>?</p>
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
                onClick={handleDeletePO}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;

import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee } from './api';
import { safeRender, formatCurrency } from './utils';
import './styles.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    salaryMVR: '',
    position: 'Staff',
    gender: 'Male',
    phone: '',
    email: '',
    hireDate: '',
    dateOfBirth: '',
    pictureUrl: ''
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    salaryMVR: '',
    position: 'Staff',
    gender: 'Male',
    phone: '',
    email: '',
    hireDate: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    pictureUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees: ' + (err.response?.data?.message || err.message));
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp._id);
    setEditData({
      name: emp.name || '',
      salaryMVR: emp.salaryMVR || emp.salary || 0, // Support both new and old field names
      position: emp.position || 'Staff',
      gender: emp.gender || 'Male',
      phone: emp.phone || '',
      email: emp.email || '',
      hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '',
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
      pictureUrl: emp.pictureUrl || ''
    });
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await updateEmployee(id, editData);
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Failed to save employee: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    // Validate input
    if (!newEmployee.name.trim() || !newEmployee.salaryMVR) {
      setError('Name and salary are required');
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await createEmployee(newEmployee);
      setNewEmployee({
        name: '',
        salaryMVR: '',
        position: 'Staff',
        gender: 'Male',
        phone: '',
        email: '',
        hireDate: new Date().toISOString().split('T')[0],
        dateOfBirth: '',
        pictureUrl: ''
      });
      fetchEmployees();
    } catch (err) {
      console.error('Error adding employee:', err);
      setError('Failed to add employee: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleViewEmployee = (emp) => {
    setSelectedEmployee(emp);
  };

  const positions = ['Manager', 'Supervisor', 'Cashier', 'Staff', 'Admin'];
  const genders = ['Male', 'Female', 'Other'];

  // Calculate USD salary based on MVR (approximate conversion)
  const calculateUSD = (mvrSalary) => {
    const rate = 15.42; // Approximate MVR to USD conversion rate
    return (parseFloat(mvrSalary) / rate).toFixed(2);
  };

  return (
    <div className="employees-page" style={{maxWidth: 1100, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Employees Management</h2>
      <div className="employees-header" style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <p style={{fontSize: '1.1rem'}}>View and manage employee information</p>
        <div style={{display: 'flex', gap: 12}}>
          <button 
            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('table')}
            style={{minWidth: 100}}
          >
            Table View
          </button>
          <button 
            className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('card')}
            style={{minWidth: 100}}
          >
            Card View
          </button>
          <button 
            className="btn btn-primary" 
            onClick={fetchEmployees}
            style={{minWidth: 120}}
          >
            Refresh List
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading employees...</div>
      ) : error ? (
        <div style={{color: 'red'}}>{error}</div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="table-responsive">
              <table className="table employees-table" style={{minWidth: 600}}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Phone</th>
                    <th>Hire Date</th>
                    <th>Salary (MVR)</th>
                    <th>Salary (USD)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp._id}>
                      <td>
                        {editingId === emp._id ? (
                          <input 
                            className="form-control" 
                            value={editData.name} 
                            onChange={e => handleEditChange('name', e.target.value)} 
                            placeholder="Employee name"
                            style={{width: '100%'}}
                          />
                        ) : (
                          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                            {emp.pictureUrl ? (
                              <img 
                                src={emp.pictureUrl} 
                                alt={emp.name} 
                                style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'}} 
                              />
                            ) : (
                              <div style={{
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                backgroundColor: '#e0e0e0', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#757575',
                                fontWeight: 'bold'
                              }}>
                                {safeRender(emp.name).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{safeRender(emp.name)}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {editingId === emp._id ? (
                          <select 
                            className="form-control" 
                            value={editData.position} 
                            onChange={e => handleEditChange('position', e.target.value)}
                            style={{width: '100%'}}
                          >
                            {positions.map(pos => (
                              <option key={pos} value={pos}>{pos}</option>
                            ))}
                          </select>
                        ) : (
                          safeRender(emp.position)
                        )}
                      </td>
                      <td>
                        {editingId === emp._id ? (
                          <input 
                            className="form-control" 
                            value={editData.phone} 
                            onChange={e => handleEditChange('phone', e.target.value)} 
                            placeholder="Phone number"
                            style={{width: '100%'}}
                          />
                        ) : (
                          safeRender(emp.phone)
                        )}
                      </td>
                      <td>
                        {editingId === emp._id ? (
                          <input 
                            className="form-control" 
                            type="date" 
                            value={editData.hireDate} 
                            onChange={e => handleEditChange('hireDate', e.target.value)}
                            style={{width: '100%'}}
                          />
                        ) : (
                          emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 
                          emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : ''
                        )}
                      </td>
                      <td>
                        {editingId === emp._id ? (
                          <input 
                            className="form-control" 
                            type="number" 
                            value={editData.salaryMVR} 
                            onChange={e => handleEditChange('salaryMVR', e.target.value)} 
                            placeholder="Salary amount"
                            style={{width: '100%'}}
                          />
                        ) : (
                          formatCurrency(emp.salaryMVR || emp.salary)
                        )}
                      </td>
                      <td>
                        {editingId === emp._id ? (
                          <div style={{color: '#757575', fontSize: '0.9rem'}}>
                            ${calculateUSD(editData.salaryMVR)}
                          </div>
                        ) : (
                          <div>${emp.salaryUSD?.toFixed(2) || calculateUSD(emp.salaryMVR || emp.salary)}</div>
                        )}
                      </td>
                      <td>
                        {editingId === emp._id ? (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleSave(emp._id)} disabled={saving}>Save</button>
                            <button className="btn btn-secondary btn-sm" style={{marginLeft: 8}} onClick={() => setEditingId(null)}>Cancel</button>
                          </>
                        ) : (
                          <div style={{display: 'flex', gap: 8}}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(emp)}>Edit</button>
                            <button className="btn btn-info btn-sm" onClick={() => handleViewEmployee(emp)}>View</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <input 
                        className="form-control" 
                        value={newEmployee.name} 
                        onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} 
                        placeholder="New employee name" 
                        style={{width: '100%'}}
                      />
                    </td>
                    <td>
                      <select 
                        className="form-control" 
                        value={newEmployee.position} 
                        onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                        style={{width: '100%'}}
                      >
                        {positions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        className="form-control" 
                        value={newEmployee.phone} 
                        onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} 
                        placeholder="Phone number" 
                        style={{width: '100%'}}
                      />
                    </td>
                    <td>
                      <input 
                        className="form-control" 
                        type="date" 
                        value={newEmployee.hireDate} 
                        onChange={e => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                        style={{width: '100%'}}
                      />
                    </td>
                    <td>
                      <input 
                        className="form-control" 
                        type="number" 
                        value={newEmployee.salaryMVR} 
                        onChange={e => setNewEmployee({ ...newEmployee, salaryMVR: e.target.value })} 
                        placeholder="Salary (MVR)" 
                        style={{width: '100%'}}
                      />
                    </td>
                    <td>
                      <div style={{color: '#757575', fontSize: '0.9rem'}}>
                        ${calculateUSD(newEmployee.salaryMVR)}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-success btn-sm" 
                        onClick={handleAdd} 
                        disabled={saving}
                        style={{minWidth: '80px'}}
                      >
                        {saving ? 'Adding...' : 'Add'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="employee-cards" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24}}>
              {employees.map(emp => (
                <div key={emp._id} className="employee-card" style={{
                  background: 'white', 
                  borderRadius: 8, 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: 100, 
                    background: '#1976d2', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}>
                    {emp.pictureUrl ? (
                      <img 
                        src={emp.pictureUrl} 
                        alt={emp.name} 
                        style={{width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid white'}} 
                      />
                    ) : (
                      <div style={{
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        backgroundColor: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#1976d2',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                      }}>
                        {safeRender(emp.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{padding: 16}}>
                    <h3 style={{margin: '0 0 8px 0', textAlign: 'center'}}>{safeRender(emp.name)}</h3>
                    <p style={{margin: '0 0 8px 0', textAlign: 'center', color: '#757575'}}>{safeRender(emp.position)}</p>
                    <div style={{marginTop: 16}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                        <span style={{fontWeight: 'bold'}}>Phone:</span>
                        <span>{safeRender(emp.phone)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                        <span style={{fontWeight: 'bold'}}>Hire Date:</span>
                        <span>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 
                              emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                        <span style={{fontWeight: 'bold'}}>Salary (MVR):</span>
                        <span>{formatCurrency(emp.salaryMVR || emp.salary)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                        <span style={{fontWeight: 'bold'}}>Salary (USD):</span>
                        <span>${emp.salaryUSD?.toFixed(2) || calculateUSD(emp.salaryMVR || emp.salary)}</span>
                      </div>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16}}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="btn btn-info btn-sm" onClick={() => handleViewEmployee(emp)}>View</button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Employee Card */}
              <div className="employee-card" style={{
                background: 'white', 
                borderRadius: 8, 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                border: '2px dashed #e0e0e0'
              }}>
                <h3 style={{margin: 0}}>Add New Employee</h3>
                <button 
                  className="btn btn-success" 
                  onClick={() => {
                    // Show the table view when adding a new employee
                    setViewMode('table');
                  }}
                  style={{width: '100%'}}
                >
                  + Add Employee
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: 8,
            width: '90%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 24,
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedEmployee(null)} 
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            
            <div style={{textAlign: 'center', marginBottom: 24}}>
              {selectedEmployee.pictureUrl ? (
                <img 
                  src={selectedEmployee.pictureUrl} 
                  alt={selectedEmployee.name} 
                  style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1976d2'}} 
                />
              ) : (
                <div style={{
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  backgroundColor: '#1976d2', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  margin: '0 auto'
                }}>
                  {safeRender(selectedEmployee.name).charAt(0).toUpperCase()}
                </div>
              )}
              <h2 style={{marginTop: 16, marginBottom: 4}}>{safeRender(selectedEmployee.name)}</h2>
              <p style={{color: '#757575', margin: 0}}>{safeRender(selectedEmployee.position)}</p>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{safeRender(selectedEmployee.phone)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{safeRender(selectedEmployee.email)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{safeRender(selectedEmployee.gender)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">
                  {selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Hire Date:</span>
                <span className="detail-value">
                  {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 
                   selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Employee Since:</span>
                <span className="detail-value">
                  {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Salary (MVR):</span>
                <span className="detail-value">{formatCurrency(selectedEmployee.salaryMVR || selectedEmployee.salary)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Salary (USD):</span>
                <span className="detail-value">
                  ${selectedEmployee.salaryUSD?.toFixed(2) || calculateUSD(selectedEmployee.salaryMVR || selectedEmployee.salary)}
                </span>
              </div>
            </div>
            
            <div style={{marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16}}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  handleEdit(selectedEmployee);
                  setSelectedEmployee(null);
                }}
              >
                Edit Employee
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

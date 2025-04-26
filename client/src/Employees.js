import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee } from './api';
import { safeRender, formatCurrency } from './utils';
import './styles.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', salary: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', salary: '' });
  const [saving, setSaving] = useState(false);

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
    setEditData({ name: emp.name, salary: emp.salary });
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
    if (!newEmployee.name.trim() || !newEmployee.salary) {
      setError('Name and salary are required');
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await createEmployee(newEmployee);
      setNewEmployee({ name: '', salary: '' });
      fetchEmployees();
    } catch (err) {
      console.error('Error adding employee:', err);
      setError('Failed to add employee: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employees-page" style={{maxWidth: 900, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Employees Management</h2>
      <div className="employees-header" style={{marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <p style={{fontSize: '1.1rem'}}>View and manage employee information</p>
        <button 
          className="btn btn-primary" 
          onClick={fetchEmployees}
          style={{minWidth: 120}}
        >
          Refresh List
        </button>
      </div>
      {loading ? (
        <div>Loading employees...</div>
      ) : error ? (
        <div style={{color: 'red'}}>{error}</div>
      ) : (
        <>
          <table className="table employees-table" style={{minWidth: 600}}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Salary (MVR)</th>
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
                      safeRender(emp.name)
                    )}
                  </td>
                  <td>
                    {editingId === emp._id ? (
                      <input 
                        className="form-control" 
                        type="number" 
                        value={editData.salary} 
                        onChange={e => handleEditChange('salary', e.target.value)} 
                        placeholder="Salary amount"
                        style={{width: '100%'}}
                      />
                    ) : (
                      formatCurrency(emp.salary)
                    )}
                  </td>
                  <td>
                    {editingId === emp._id ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleSave(emp._id)} disabled={saving}>Save</button>
                        <button className="btn btn-secondary btn-sm" style={{marginLeft: 8}} onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(emp)}>Edit</button>
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
                  <input 
                    className="form-control" 
                    type="number" 
                    value={newEmployee.salary} 
                    onChange={e => setNewEmployee({ ...newEmployee, salary: e.target.value })} 
                    placeholder="Salary" 
                    style={{width: '100%'}}
                  />
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
        </>
      )}
    </div>
  );
};

export default Employees;

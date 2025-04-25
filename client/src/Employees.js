import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, updateEmployee } from './api';
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
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch employees');
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
    try {
      await updateEmployee(id, editData);
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      setError('Failed to save employee');
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await createEmployee(newEmployee);
      setNewEmployee({ name: '', salary: '' });
      fetchEmployees();
    } catch (err) {
      setError('Failed to add employee');
    }
    setSaving(false);
  };

  return (
    <div className="employees-page" style={{maxWidth: 900, margin: '0 auto', padding: 24}}>
      <h2 style={{color: '#1976d2', marginBottom: 24}}>Employees</h2>
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
                      <input value={editData.name} onChange={e => handleEditChange('name', e.target.value)} />
                    ) : (
                      emp.name
                    )}
                  </td>
                  <td>
                    {editingId === emp._id ? (
                      <input type="number" value={editData.salary} onChange={e => handleEditChange('salary', e.target.value)} />
                    ) : (
                      emp.salary
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
                  <input value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="New employee name" />
                </td>
                <td>
                  <input type="number" value={newEmployee.salary} onChange={e => setNewEmployee({ ...newEmployee, salary: e.target.value })} placeholder="Salary" />
                </td>
                <td>
                  <button className="btn btn-success btn-sm" onClick={handleAdd} disabled={saving}>Add</button>
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

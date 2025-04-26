import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUsers, createUser, updateUser, deleteUser } from './api';
import './styles.css';

const Users = ({ isAuthenticated }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'cashier'
  });
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUsers();
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      password: '' // Don't show the password
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const updatedUser = { ...editingUser };
      
      // Only include password if it was changed
      if (!updatedUser.password) {
        delete updatedUser.password;
      }
      
      await updateUser(updatedUser._id, updatedUser);
      setSuccessMessage('User updated successfully!');
      fetchUsers();
      setEditingUser(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await deleteUser(userId);
      setSuccessMessage('User deleted successfully!');
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      await createUser(newUser);
      setSuccessMessage('User created successfully!');
      fetchUsers();
      setShowNewUserForm(false);
      setNewUser({
        name: '',
        username: '',
        password: '',
        role: 'cashier'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please try again.');
    }
  };

  const handleEditingUserChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Please log in to access the Users Management page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Users Management</h2>
      
      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            className="btn btn-sm btn-outline-danger float-right" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* New User Button */}
      <div className="mb-4">
        <button 
          className="btn btn-primary" 
          onClick={() => setShowNewUserForm(!showNewUserForm)}
        >
          {showNewUserForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>
      
      {/* New User Form */}
      {showNewUserForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h4>Create New User</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="name" 
                  value={newUser.name} 
                  onChange={handleNewUserChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="username" 
                  value={newUser.username} 
                  onChange={handleNewUserChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="password" 
                  value={newUser.password} 
                  onChange={handleNewUserChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  className="form-control" 
                  name="role" 
                  value={newUser.role} 
                  onChange={handleNewUserChange}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                Create User
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Users List */}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="thead-dark">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-info mr-2" 
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button type="button" className="close" onClick={handleCancelEdit}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateUser}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name" 
                      value={editingUser.name} 
                      onChange={handleEditingUserChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="username" 
                      value={editingUser.username} 
                      onChange={handleEditingUserChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password (leave blank to keep current)</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      name="password" 
                      value={editingUser.password} 
                      onChange={handleEditingUserChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select 
                      className="form-control" 
                      name="role" 
                      value={editingUser.role} 
                      onChange={handleEditingUserChange}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

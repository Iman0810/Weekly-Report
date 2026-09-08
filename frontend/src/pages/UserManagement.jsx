import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'TEAM_MEMBER',
    first_name: '',
    last_name: '',
  });
  const [editingUser, setEditingUser] = useState(null);

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data.results || response.data;
    },
    enabled: user?.role === 'MANAGER',
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/register/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      resetForm();
      alert('✅ User created successfully!');
    },
    onError: (error) => {
      alert('❌ Failed to create user: ' + JSON.stringify(error.response?.data || 'Unknown error'));
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/users/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      alert('✅ User deleted successfully!');
    },
    onError: (error) => {
      alert('❌ Failed to delete user: ' + (error.response?.data?.error || 'Unknown error'));
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'TEAM_MEMBER',
      first_name: '',
      last_name: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert('Username and password are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Delete this user? This will also delete their reports.')) {
      deleteMutation.mutate(userId);
    }
  };

  if (user?.role !== 'MANAGER') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>⛔ Access Denied</h4>
          <p>Only managers can manage users.</p>
        </div>
      </div>
    );
  }

  const teamMembers = users?.filter(u => u.role === 'TEAM_MEMBER') || [];
  const managers = users?.filter(u => u.role === 'MANAGER') || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-6 fw-bold mb-0">👥 User Management</h1>
          <p className="text-muted mb-0">Manage team members and their roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Cancel' : '+ Add New User'}
        </button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-header">
            <h5 className="mb-0">Create New User</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-4">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" className="btn btn-success" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">Team Members ({teamMembers.length})</h5>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : teamMembers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td><strong>{member.username}</strong></td>
                      <td>{member.email || 'No email'}</td>
                      <td>{member.first_name || ''} {member.last_name || ''}</td>
                      <td><span className="badge bg-info text-dark">Team Member</span></td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(member.id)}
                          disabled={deleteMutation.isLoading}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No team members found.</div>
          )}
        </div>
      </div>

      {/* Managers List */}
      <div className="card shadow-sm mt-4">
        <div className="card-header">
          <h5 className="mb-0">Managers ({managers.length})</h5>
        </div>
        <div className="card-body p-0">
          {managers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((mgr) => (
                    <tr key={mgr.id}>
                      <td><strong>{mgr.username}</strong></td>
                      <td>{mgr.email || 'No email'}</td>
                      <td>{mgr.first_name || ''} {mgr.last_name || ''}</td>
                      <td><span className="badge bg-danger">Manager</span></td>
                      <td>
                        {mgr.id !== user?.id && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(mgr.id)}
                            disabled={deleteMutation.isLoading}
                          >
                            🗑️ Delete
                          </button>
                        )}
                        {mgr.id === user?.id && (
                          <span className="text-muted">(You)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No managers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
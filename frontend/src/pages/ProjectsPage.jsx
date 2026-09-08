import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_member_ids: [],
  });

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/');
      return response.data.results || response.data;
    },
    enabled: user?.role === 'MANAGER',
  });

  // Fetch all users (for team member assignment)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data.results || response.data;
    },
    enabled: user?.role === 'MANAGER',
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/projects/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      resetForm();
      alert('✅ Project created successfully!');
    },
    onError: (error) => {
      console.error('Create error:', error);
      alert('❌ Failed to create project: ' + (error.response?.data?.error || 'Unknown error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/projects/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      resetForm();
      alert('✅ Project updated successfully!');
    },
    onError: (error) => {
      console.error('Update error:', error);
      alert('❌ Failed to update project: ' + (error.response?.data?.error || 'Unknown error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/projects/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      alert('✅ Project deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('❌ Failed to delete project: ' + (error.response?.data?.error || 'Unknown error'));
    },
  });

  const resetForm = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', team_member_ids: [] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Project name is required');
      return;
    }

    const data = {
      name: formData.name,
      description: formData.description,
      team_member_ids: formData.team_member_ids.map(id => parseInt(id)),
    };

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      team_member_ids: project.team_members?.map(m => m.id) || [],
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project? This will not delete reports.') ) {
      deleteMutation.mutate(id);
    }
  };

  // Only managers can access this page
  if (user?.role !== 'MANAGER') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>⛔ Access Denied</h4>
          <p>Only managers can manage projects.</p>
        </div>
      </div>
    );
  }

  const teamMembers = users?.filter(u => u.role === 'TEAM_MEMBER') || [];

  return (
    <div>
      <h1 className="display-6 fw-bold mb-2">📁 Projects Management</h1>
      <p className="text-muted mb-4">Create and manage projects, assign team members</p>

      <div className="row">
        {/* Form - Left Column */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">{editingProject ? '✏️ Edit Project' : '➕ Create New Project'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Client A, R&D, Marketing"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the project"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Assign Team Members</label>
                  <select
                    className="form-select"
                    multiple
                    size="4"
                    value={formData.team_member_ids}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setFormData({ ...formData, team_member_ids: selected });
                    }}
                  >
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username} ({member.email || 'no email'})
                        </option>
                      ))
                    ) : (
                      <option disabled>No team members available</option>
                    )}
                  </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple team members</small>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                  >
                    {createMutation.isLoading || updateMutation.isLoading ? (
                      <>Saving...</>
                    ) : (
                      editingProject ? 'Update Project' : 'Create Project'
                    )}
                  </button>
                  {editingProject && (
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* List - Right Column */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">All Projects ({projects?.length || 0})</h5>
            </div>
            <div className="card-body p-0">
              {isLoading ? (
                <div className="text-center py-4">Loading projects...</div>
              ) : projects && projects.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3">📁 Name</th>
                        <th className="py-3">📝 Description</th>
                        <th className="py-3">👥 Team Members</th>
                        <th className="py-3 text-center">⚡ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td className="align-middle">
                            <strong>{project.name}</strong>
                          </td>
                          <td className="align-middle">
                            {project.description || <span className="text-muted">No description</span>}
                          </td>
                          <td className="align-middle">
                            {project.team_members?.length > 0 ? (
                              <div>
                                {project.team_members.map(m => (
                                  <span key={m.id} className="badge bg-info me-1 text-dark">
                                    {m.username}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">No members assigned</span>
                            )}
                          </td>
                          <td className="align-middle text-center">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(project)}
                                title="Edit Project"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(project.id)}
                                title="Delete Project"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="text-muted">
                    <h5>📭 No projects created yet</h5>
                    <p>Create your first project using the form on the left.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;
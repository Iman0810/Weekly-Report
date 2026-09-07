import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function TeamDashboard() {
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Fetch all reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', 'all', statusFilter, userFilter],
    queryFn: async () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (userFilter) params.user_id = userFilter;
      const response = await api.get('/reports/', { params });
      return response.data.results || response.data;
    },
  });

  // Fetch all users
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data.results || response.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/reports/stats/');
      return response.data;
    },
  });

  const getStatusBadge = (status) => {
    const classes = {
      'DRAFT': 'badge bg-secondary',
      'SUBMITTED': 'badge bg-primary',
      'NEEDS_CORRECTION': 'badge bg-warning text-dark',
      'APPROVED': 'badge bg-success',
    };
    return <span className={`${classes[status] || 'badge bg-secondary'} px-3 py-2`}>{status}</span>;
  };

  if (isLoading) return <div className="text-center mt-5">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="display-6 fw-bold mb-2">📊 Team Dashboard</h1>
      <p className="text-muted mb-4">Overview of all team reports</p>

      {/* Stats Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Total Reports</h6>
                <h2 className="mb-0">{stats.total_reports}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Needs Correction</h6>
                <h2 className="mb-0">{stats.needs_correction}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Approved</h6>
                <h2 className="mb-0">{stats.approved}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Submitted (Pending)</h6>
                <h2 className="mb-0">{stats.submitted}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">📊 All Statuses</option>
            <option value="DRAFT">📝 Draft</option>
            <option value="SUBMITTED">📤 Submitted</option>
            <option value="NEEDS_CORRECTION">🔄 Needs Correction</option>
            <option value="APPROVED">✅ Approved</option>
          </select>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">👥 All Team Members</option>
            {users?.filter(u => u.role === 'TEAM_MEMBER').map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 text-end">
          <span className="text-muted">
            Showing: <strong>{reports?.length || 0}</strong> reports
          </span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3">👤 Team Member</th>
                  <th className="py-3">📅 Week</th>
                  <th className="py-3">📁 Project</th>
                  <th className="py-3">📌 Status</th>
                  <th className="py-3">🕐 Updated</th>
                  <th className="py-3 text-center">⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td className="align-middle">
                        <strong>{report.user?.username}</strong>
                        <br />
                        <small className="text-muted">{report.user?.email || ''}</small>
                      </td>
                      <td className="align-middle">
                        <strong>{report.week_start}</strong>
                        <br />
                        <small className="text-muted">→ {report.week_end}</small>
                      </td>
                      <td className="align-middle">
                        {report.project?.name || <span className="text-muted">No project</span>}
                      </td>
                      <td className="align-middle">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="align-middle">
                        <small>{new Date(report.updated_at).toLocaleDateString()}</small>
                        <br />
                        <small className="text-muted">{new Date(report.updated_at).toLocaleTimeString()}</small>
                      </td>
                      <td className="align-middle text-center">
                        <div className="btn-group btn-group-sm">
                          <Link 
                            to={`/reports/${report.id}`} 
                            className="btn btn-outline-info"
                            title="View Report"
                          >
                            👁️
                          </Link>
                          {report.status === 'SUBMITTED' && (
                            <Link 
                              to={`/reports/${report.id}/review`} 
                              className="btn btn-outline-primary"
                              title="Review Report"
                            >
                              🔍
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="text-muted">
                        <h5>📭 No reports found</h5>
                        <p>Team members haven't submitted any reports yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamDashboard;
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function ReportList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/reports/', { params });
      let data = response.data.results || response.data;

      // Managers should NOT see DRAFT reports
      if (user?.role === 'MANAGER') {
        data = data.filter(r => r.status !== 'DRAFT');
      }

      console.log('📊 Reports data:', data);
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/reports/${id}/submit/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      alert('✅ Report submitted successfully! Your manager will review it.');
    },
    onError: (error) => {
      console.error('Submit error:', error);
      alert('❌ Failed to submit report: ' + (error.response?.data?.error || 'Unknown error'));
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

  const handleSubmit = async (id) => {
    const report = reports?.find(r => r.id === id);
    const message = report?.status === 'NEEDS_CORRECTION'
      ? 'Resubmit this report after making corrections?'
      : 'Submit this report for review?';
    if (window.confirm(message)) {
      await submitMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <div className="text-center mt-5">Loading reports...</div>;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-6 fw-bold mb-0">📋 My Reports</h1>
          <p className="text-muted mb-0">Manage and track your weekly reports</p>
        </div>
        {user?.role === 'TEAM_MEMBER' && (
          <Link to="/reports/new" className="btn btn-primary btn-lg">
            <span className="fw-bold">+</span> New Report
          </Link>
        )}
      </div>

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
        <div className="col-md-8 text-end">
          <span className="text-muted">
            Total: <strong>{reports?.length || 0}</strong> reports
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
                  {user?.role === 'MANAGER' && <th className="py-3">👤 Team Member</th>}
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
                      {user?.role === 'MANAGER' && (
                        <td className="align-middle">
                          <strong>{report.user?.username}</strong>
                          <br />
                          <small className="text-muted">{report.user?.email || ''}</small>
                        </td>
                      )}
                      <td className="align-middle">
                        <strong>{report.week_start}</strong>
                        <br />
                        <small className="text-muted">→ {report.week_end}</small>
                      </td>
                      <td className="align-middle">
                        {report.project?.name ? (
                          <span className="badge bg-info text-dark">{report.project.name}</span>
                        ) : (
                          <span className="text-muted">No project</span>
                        )}
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

                          {(report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION') && user?.role === 'TEAM_MEMBER' && (
                            <Link to={`/reports/${report.id}/edit`} className="btn btn-outline-primary">
                              ✏️
                            </Link>
                          )}

                          {/* Submit - Only for Team Members on DRAFT */}
                          {report.status === 'DRAFT' && user?.role === 'TEAM_MEMBER' && (
                            <button
                              onClick={() => handleSubmit(report.id)}
                              className="btn btn-outline-success"
                              disabled={submitMutation.isLoading}
                              title="Submit for Review"
                            >
                              📤
                            </button>
                          )}

                          {/* Resubmit - Only for Team Members on NEEDS_CORRECTION */}
                          {report.status === 'NEEDS_CORRECTION' && user?.role === 'TEAM_MEMBER' && (
                            <button
                              onClick={() => handleSubmit(report.id)}
                              className="btn btn-outline-warning"
                              disabled={submitMutation.isLoading}
                              title="Resubmit"
                            >
                              🔄
                            </button>
                          )}

                          {/* Review - Only for Managers on SUBMITTED */}
                          {user?.role === 'MANAGER' && report.status === 'SUBMITTED' && (
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
                    <td colSpan={user?.role === 'MANAGER' ? 6 : 5} className="text-center py-5">
                      <div className="text-muted">
                        <h5>📭 No reports found</h5>
                        <p>Create your first report by clicking the <strong>"New Report"</strong> button above.</p>
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

export default ReportList;
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function ReportList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['reports', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/reports/', { params });
      return response.data.results || response.data;
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
    return <span className={classes[status] || 'badge bg-secondary'}>{status}</span>;
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
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Reports</h2>
        <Link to="/reports/new" className="btn btn-primary">
          + New Report
        </Link>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Week</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.week_start} - {report.week_end}</td>
                      <td>{report.project?.name || 'N/A'}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>{new Date(report.updated_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link to={`/reports/${report.id}`} className="btn btn-outline-info">
                            View
                          </Link>
                          
                          {/* Edit - for DRAFT or NEEDS_CORRECTION */}
                          {(report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION') && (
                            <Link to={`/reports/${report.id}/edit`} className="btn btn-outline-primary">
                              Edit
                            </Link>
                          )}
                          
                          {/* Submit - for DRAFT only */}
                          {report.status === 'DRAFT' && (
                            <button 
                              onClick={() => handleSubmit(report.id)} 
                              className="btn btn-outline-success"
                              disabled={submitMutation.isLoading}
                            >
                              Submit
                            </button>
                          )}
                          
                          {/* Resubmit - for NEEDS_CORRECTION only */}
                          {report.status === 'NEEDS_CORRECTION' && (
                            <button 
                              onClick={() => handleSubmit(report.id)} 
                              className="btn btn-outline-warning"
                              disabled={submitMutation.isLoading}
                            >
                              Resubmit
                            </button>
                          )}
                          
                          {/* Review - for MANAGER only */}
                          {user?.role === 'MANAGER' && report.status === 'SUBMITTED' && (
                            <Link to={`/reports/${report.id}/review`} className="btn btn-outline-primary">
                              Review
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No reports found. Create your first report!
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
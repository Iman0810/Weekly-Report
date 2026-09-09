import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function TeamMemberProfile() {
  const { userId } = useParams();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', 'user', userId],
    queryFn: async () => {
      const response = await api.get(`/reports/?user_id=${userId}`);
      return response.data.results || response.data;
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

  if (isLoading) return <div className="text-center mt-5">Loading...</div>;

  const user = reports?.[0]?.user;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-6 fw-bold mb-0">👤 {user?.username || 'Unknown User'}</h1>
          <p className="text-muted mb-0">{user?.email || 'No email'}</p>
          <p className="text-muted">Role: {user?.role === 'MANAGER' ? 'Manager' : 'Team Member'}</p>
        </div>
        <Link to="/team-dashboard" className="btn btn-secondary">Back to Team Dashboard</Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">📋 All Reports ({reports?.length || 0})</h5>
        </div>
        <div className="card-body p-0">
          {reports && reports.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Week</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.week_start} → {report.week_end}</td>
                      <td>{report.project?.name || 'No project'}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>{new Date(report.updated_at).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/reports/${report.id}`} className="btn btn-sm btn-outline-info">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No reports found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamMemberProfile;
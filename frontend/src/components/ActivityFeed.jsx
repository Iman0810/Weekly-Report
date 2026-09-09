import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

function ActivityFeed() {
  const { data: reports } = useQuery({
    queryKey: ['reports', 'recent'],
    queryFn: async () => {
      const response = await api.get('/reports/?page_size=10');
      return response.data.results || response.data;
    },
  });

  // Filter reports with review actions - EXCLUDE DRAFTS
  const activities = reports?.filter(r => 
    (r.status === 'APPROVED' || r.status === 'NEEDS_CORRECTION') && r.status !== 'DRAFT'
  ) || [];

  if (activities.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-header">
          <h6 className="mb-0">🔄 Recent Activity</h6>
        </div>
        <div className="card-body text-center text-muted py-3">
          No recent review activity
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h6 className="mb-0">🔄 Recent Activity</h6>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {activities.slice(0, 5).map((report) => (
            <div key={report.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{report.user?.username}</strong>
                  <span className="text-muted"> - </span>
                  <span>{report.week_start}</span>
                </div>
                <span className={`badge ${report.status === 'APPROVED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {report.status === 'APPROVED' ? '✅ Approved' : '🔄 Changes Requested'}
                </span>
              </div>
              {report.manager_comment && (
                <small className="text-muted d-block">💬 {report.manager_comment}</small>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivityFeed;
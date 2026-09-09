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

  // Filter reports with review actions
  const activities = reports?.filter(r => 
    r.status === 'APPROVED' || r.status === 'NEEDS_CORRECTION'
  ) || [];

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h6 className="mb-0">🔄 Recent Activity</h6>
      </div>
      <div className="card-body p-0">
        {activities.length > 0 ? (
          <div className="list-group list-group-flush">
            {activities.slice(0, 5).map((report) => (
              <div key={report.id} className="list-group-item">
                <div className="d-flex justify-content-between">
                  <span>
                    <strong>{report.user?.username}</strong>
                    <span className="text-muted"> - {report.week_start}</span>
                  </span>
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
        ) : (
          <div className="text-center py-3 text-muted">No recent activity</div>
        )}
      </div>
    </div>
  );
}
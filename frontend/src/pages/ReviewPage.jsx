import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [action, setAction] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get(`/reports/${id}/`);
      return response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ action, comment }) => {
      const response = await api.post(`/reports/${id}/review/`, {
        action: action,
        comment: comment,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      queryClient.invalidateQueries(['report', id]);
      alert(`✅ Report ${action === 'approve' ? 'approved' : 'sent back for correction'} successfully!`);
      navigate('/reports');
    },
    onError: (error) => {
      alert('❌ Failed to review report: ' + (error.response?.data?.error || 'Unknown error'));
    },
  });

  const handleReview = (actionType) => {
    if (actionType === 'request_changes' && !comment.trim()) {
      alert('Please provide feedback for the team member.');
      return;
    }
    
    const message = actionType === 'approve' 
      ? 'Approve this report?' 
      : 'Send this report back for correction?';
    
    if (window.confirm(message)) {
      reviewMutation.mutate({ action: actionType, comment });
    }
  };

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
  if (!report) return <div className="text-center mt-5">Report not found</div>;

  if (report.status !== 'SUBMITTED') {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>⚠️ This report is not in review</h4>
          <p>Current status: {report.status}</p>
          <Link to="/reports" className="btn btn-primary">Back to Reports</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Review Report</h2>
        <Link to="/reports" className="btn btn-secondary">Back to Reports</Link>
      </div>

      <div className="row">
        <div className="col-md-8">
          {/* Report Details */}
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Report by {report.user?.username}</h5>
            </div>
            <div className="card-body">
              <p><strong>Week:</strong> {report.week_start} to {report.week_end}</p>
              <p><strong>Project:</strong> {report.project?.name || 'N/A'}</p>
              <p><strong>Status:</strong> {getStatusBadge(report.status)}</p>
              
              {/* Tasks */}
              <h6 className="mt-3">Tasks</h6>
              {report.tasks && report.tasks.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Planned %</th>
                        <th>Actual %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.tasks.map((task, index) => (
                        <tr key={index}>
                          <td>{task.name}</td>
                          <td>{task.priority}</td>
                          <td>{task.planned_percent}%</td>
                          <td>{task.actual_percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No tasks</p>
              )}

              {/* Blockers */}
              {report.blockers && report.blockers.length > 0 && (
                <>
                  <h6 className="mt-3">Blockers</h6>
                  <ul>
                    {report.blockers.map((b, i) => (
                      <li key={i}>{b.description} {b.is_key && '⭐'}</li>
                    ))}
                  </ul>
                </>
              )}

              {/* Achievements */}
              {report.achievements && report.achievements.length > 0 && (
                <>
                  <h6 className="mt-3">Achievements</h6>
                  <ul>
                    {report.achievements.map((a, i) => (
                      <li key={i}>{a.description} {a.is_key && '🏆'}</li>
                    ))}
                  </ul>
                </>
              )}

              {/* Hours */}
              {report.hours_worked && Object.keys(report.hours_worked).length > 0 && (
                <>
                  <h6 className="mt-3">Hours Worked</h6>
                  <ul>
                    {Object.entries(report.hours_worked).map(([type, hours]) => (
                      <li key={type}>{type}: {hours}h</li>
                    ))}
                  </ul>
                </>
              )}

              {report.notes && (
                <>
                  <h6 className="mt-3">Notes</h6>
                  <p>{report.notes}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Review Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Review Actions</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Feedback (required for Request Changes)</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Provide feedback for the team member..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => handleReview('approve')}
                  disabled={reviewMutation.isLoading}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => handleReview('request_changes')}
                  disabled={reviewMutation.isLoading}
                >
                  🔄 Request Changes
                </button>
              </div>

              {reviewMutation.isLoading && (
                <div className="text-center mt-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Processing...</span>
                  </div>
                  <span className="ms-2">Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="card mt-3">
            <div className="card-body">
              <h6>Quick Info</h6>
              <ul className="list-unstyled small">
                <li><strong>Version:</strong> {report.version}</li>
                <li><strong>Submitted:</strong> {new Date(report.updated_at).toLocaleDateString()}</li>
                <li><strong>Manager:</strong> You</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewPage;
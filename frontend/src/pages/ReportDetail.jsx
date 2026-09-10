import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get(`/reports/${id}/`);
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
    return <span className={classes[status] || 'badge bg-secondary'}>{status}</span>;
  };

  const getPriorityBadge = (priority) => {
    const classes = {
      'HIGH': 'badge bg-danger',
      'MEDIUM': 'badge bg-warning text-dark',
      'LOW': 'badge bg-info',
    };
    return <span className={classes[priority] || 'badge bg-secondary'}>{priority}</span>;
  };

  if (isLoading) return <div className="text-center mt-5">Loading...</div>;
  if (!report) return <div className="text-center mt-5">Report not found</div>;

  const isEditable = report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION';
  const canResubmit = report.status === 'NEEDS_CORRECTION';
  const backUrl = user?.role === 'MANAGER' ? '/team-dashboard' : '/reports';
  const backLabel = user?.role === 'MANAGER' ? 'Back to Team Dashboard' : 'Back to Reports';

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Report Details</h2>
        <div>
          <Link to={backUrl} className="btn btn-secondary me-2">{backLabel}</Link>
          {isEditable && user?.role === 'TEAM_MEMBER' && (
            <Link to={`/reports/${report.id}/edit`} className="btn btn-primary">
              {canResubmit ? '✏️ Edit & Resubmit' : 'Edit Report'}
            </Link>
          )}
          {report.status === 'SUBMITTED' && user?.role === 'MANAGER' && (
            <Link to={`/reports/${report.id}/review`} className="btn btn-warning">
              Review Report
            </Link>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-3">
        <strong>Status: </strong>
        {getStatusBadge(report.status)}
        {report.status === 'NEEDS_CORRECTION' && (
          <span className="ms-2 text-warning">⚠️ Needs your attention</span>
        )}
      </div>

      {/* Manager Comment */}
      {report.manager_comment && (
        <div className={`alert ${report.status === 'NEEDS_CORRECTION' ? 'alert-warning' : 'alert-info'}`}>
          <strong>{report.status === 'NEEDS_CORRECTION' ? '⚠️ Manager\'s Feedback:' : 'Manager\'s Comment:'}</strong>
          <p className="mb-0">{report.manager_comment}</p>
          {report.status === 'NEEDS_CORRECTION' && (
            <p className="mb-0 mt-2 small">
              <Link to={`/reports/${report.id}/edit`} className="alert-link">
                Click here to edit and resubmit
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Report Info</h5>
              <p><strong>User:</strong> {report.user?.username}</p>
              <p><strong>Project:</strong> {report.project?.name || 'N/A'}</p>
              <p><strong>Week:</strong> {report.week_start} to {report.week_end}</p>
              <p><strong>Version:</strong> {report.version}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Hours Worked</h5>
              {report.hours_worked && Object.keys(report.hours_worked).length > 0 ? (
                <ul className="list-unstyled">
                  {Object.entries(report.hours_worked).map(([type, hours]) => (
                    <li key={type}><strong>{type}:</strong> {hours} hours</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No hours recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="card mb-3">
        <div className="card-header">
          <h5 className="mb-0">Tasks ({report.tasks?.length || 0})</h5>
        </div>
        <div className="card-body p-0">
          {report.tasks && report.tasks.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Planned %</th>
                    <th>Actual %</th>
                    <th>Status</th>
                    <th>Time Planned</th>
                    <th>Time Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {report.tasks.map((task, index) => (
                    <tr key={index}>
                      <td>{task.name}</td>
                      <td>{getPriorityBadge(task.priority)}</td>
                      <td>{task.planned_percent}%</td>
                      <td>{task.actual_percent}%</td>
                      <td>{task.status}</td>
                      <td>{task.time_planned}h</td>
                      <td>{task.time_spent}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted p-3">No tasks added.</p>
          )}
        </div>
      </div>

      {/* Blockers */}
      {report.blockers && report.blockers.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Blockers / Challenges</h5>
          </div>
          <div className="card-body">
            <ul className="mb-0">
              {report.blockers.map((blocker, index) => (
                <li key={index}>
                  {blocker.description}
                  {blocker.is_key && <span className="badge bg-danger ms-2">Key Issue</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tasks Planned for Next Week */}
      {report.tasks_planned && report.tasks_planned.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">📅 Tasks Planned for Next Week</h5>
          </div>
          <div className="card-body">
            <ul className="mb-0">
              {report.tasks_planned.map((task, index) => (
                <li key={index}>{task.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Achievements */}
      {report.achievements && report.achievements.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Achievements / Highlights</h5>
          </div>
          <div className="card-body">
            <ul className="mb-0">
              {report.achievements.map((achievement, index) => (
                <li key={index}>
                  {achievement.description}
                  {achievement.is_key && <span className="badge bg-success ms-2">Key Achievement</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Notes</h5>
          </div>
          <div className="card-body">
            <p className="mb-0">{report.notes}</p>
          </div>
        </div>
      )}

      {/* Version History */}
      {report.version_history && report.version_history.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Version History</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Timestamp</th>
                    <th>Manager Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {report.version_history.map((history, index) => (
                    <tr key={index}>
                      <td>v{history.version}</td>
                      <td>{new Date(history.timestamp).toLocaleString()}</td>
                      <td>{history.comment || 'No comment'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportDetail;
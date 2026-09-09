import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Charts from '../components/Charts';
import ActivityFeed from '../components/ActivityFeed';

function Dashboard() {
  const { user, logout } = useAuth();

  // Fetch user's projects (team members) or all projects (managers)
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/');
      return response.data.results || response.data;
    },
    enabled: !!user,
  });

  // Fetch stats (for charts)
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/reports/stats/');
      return response.data;
    },
    enabled: user?.role === 'MANAGER',
  });

  // Fetch all reports for hours calculation (managers only)
  const { data: allReports } = useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const response = await api.get('/reports/');
      return response.data.results || response.data;
    },
    enabled: user?.role === 'MANAGER',
  });

  // Fetch recent reports
  const { data: reports } = useQuery({
    queryKey: ['reports', 'recent'],
    queryFn: async () => {
      const response = await api.get('/reports/?page_size=5');
      return response.data.results || response.data;
    },
  });

  // Calculate hours by task type from all reports
  const hoursData = React.useMemo(() => {
    if (!allReports) return {};
    const hours = {};
    allReports.forEach(report => {
      if (report.hours_worked) {
        Object.entries(report.hours_worked).forEach(([type, value]) => {
          hours[type] = (hours[type] || 0) + value;
        });
      }
    });
    return hours;
  }, [allReports]);

  const getStatusBadge = (status) => {
    const classes = {
      'DRAFT': 'badge bg-secondary',
      'SUBMITTED': 'badge bg-primary',
      'NEEDS_CORRECTION': 'badge bg-warning text-dark',
      'APPROVED': 'badge bg-success',
    };
    return <span className={`${classes[status] || 'badge bg-secondary'} px-2 py-1`}>{status}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-6 fw-bold mb-0">👋 Welcome, {user?.username}!</h1>
          <p className="text-muted mb-0">Role: {user?.role === 'MANAGER' ? 'Manager' : 'Team Member'}</p>
        </div>
        <div>
          <button onClick={logout} className="btn btn-outline-danger">Logout</button>
        </div>
      </div>

      <div className="row">
        {/* My Projects - For Team Members */}
        {user?.role === 'TEAM_MEMBER' && (
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header">
                <h5 className="mb-0">📁 My Projects</h5>
              </div>
              <div className="card-body">
                {projects && projects.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {projects.map((project) => (
                      <li key={project.id} className="mb-2">
                        <span className="badge bg-primary me-2">✓</span>
                        <strong>{project.name}</strong>
                        <br />
                        <small className="text-muted">{project.description || 'No description'}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No projects assigned yet. Contact your manager.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manager Stats Cards */}
        {user?.role === 'MANAGER' && stats && (
          <>
            <div className="col-md-3 mb-4">
              <div className="card bg-primary text-white shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">Total Reports</h6>
                  <h2 className="mb-0">{stats.total_reports}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card bg-warning text-dark shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">Needs Correction</h6>
                  <h2 className="mb-0">{stats.needs_correction}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card bg-success text-white shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">Approved</h6>
                  <h2 className="mb-0">{stats.approved}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card bg-info text-white shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">Compliance Rate</h6>
                  <h2 className="mb-0">{stats.compliance_rate}%</h2>
                  <small>Submitted this week</small>
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="col-md-4 mb-4">
              <div className="card bg-secondary text-white shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">📤 Submitted This Week</h6>
                  <h2 className="mb-0">{stats.submitted_this_week}</h2>
                  <small>Out of {stats.total_members} team members</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card bg-danger text-white shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">🚧 Open Blockers</h6>
                  <h2 className="mb-0">{stats.open_blockers}</h2>
                  <small>Key issues across the team</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card bg-dark text-white shadow-sm">
                <div className="card-body">
                  <h6 className="card-title">⏳ Not Started</h6>
                  <h2 className="mb-0">{stats.not_started_users || 0}</h2>
                  <small>No report for this week</small>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className={`col-md-${user?.role === 'TEAM_MEMBER' ? '8' : '12'} mb-4`}>
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="mb-0">⚡ Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap">
                {user?.role === 'TEAM_MEMBER' && (
                  <Link to="/reports/new" className="btn btn-primary">
                    📝 Create Report
                  </Link>
                )}
                <Link to="/reports" className="btn btn-outline-primary">
                  📋 View Reports
                </Link>
                {user?.role === 'MANAGER' && (
                  <>
                    <Link to="/team-dashboard" className="btn btn-outline-success">
                      📊 Team Dashboard
                    </Link>
                    <Link to="/projects" className="btn btn-outline-info">
                      📁 Manage Projects
                    </Link>
                    <Link to="/users" className="btn btn-outline-secondary">
                      👥 Manage Users
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Only for Managers */}
      {user?.role === 'MANAGER' && stats && (
        <div className="mt-4">
          <h4 className="mb-3">📈 Visual Insights</h4>
          <Charts reports={allReports} stats={stats} hoursData={hoursData} />
        </div>
      )}

      {/* Activity Feed - Only for Managers */}
      {user?.role === 'MANAGER' && (
        <div className="mt-4">
          <ActivityFeed />
        </div>
      )}

      {/* Recent Reports */}
      <div className="card shadow-sm mt-4">
        <div className="card-header">
          <h5 className="mb-0">📋 Recent Reports</h5>
        </div>
        <div className="card-body p-0">
          {reports && reports.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Week</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.user?.username}</td>
                      <td>{report.week_start} → {report.week_end}</td>
                      <td>{report.project?.name || 'No project'}</td>
                      <td>{getStatusBadge(report.status)}</td>
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
            <div className="text-center py-4 text-muted">No reports yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
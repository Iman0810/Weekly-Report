import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-body">
          <h2>Welcome, {user?.username || 'User'}!</h2>
          <p className="text-muted">Role: {user?.role || 'Unknown'}</p>
          
          <div className="mt-4">
            <h5>Quick Actions</h5>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/reports" className="btn btn-primary">View Reports</Link>
              <Link to="/reports/new" className="btn btn-success">Create Report</Link>
              <button onClick={logout} className="btn btn-danger">Logout</button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-light rounded">
            <p className="mb-0 text-muted small">
              ✅ Connected to Django backend at http://localhost:8000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          📊 Weekly Report
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/reports">My Reports</Link>
            </li>
            {user?.role === 'MANAGER' && (
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">Team Dashboard</Link>
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center">
            <span className="navbar-text text-light me-3">
              👤 {user.username} 
              <span className="badge bg-info ms-1 text-dark">
                {user.role === 'MANAGER' ? 'Manager' : 'Team Member'}
              </span>
            </span>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-light btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
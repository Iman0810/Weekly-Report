import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" style={{ width: '100%' }}>
      <div className="container-fluid px-4">
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
            
            {/* My Reports - Only for Team Members */}
            {user?.role === 'TEAM_MEMBER' && (
              <li className="nav-item">
                <Link className="nav-link" to="/reports">My Reports</Link>
              </li>
            )}
            
            {/* Manager Links */}
            {user?.role === 'MANAGER' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/team-dashboard">Team Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/projects">📁 Projects</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/users">👥 Users</Link>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-outline-light btn-sm me-3"
              title="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

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
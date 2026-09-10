import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportList from './pages/ReportList';
import ReportForm from './pages/ReportForm';
import ReportDetail from './pages/ReportDetail';
import ReviewPage from './pages/ReviewPage';
import TeamDashboard from './pages/TeamDashboard';
import ProjectsPage from './pages/ProjectsPage';
import UserManagement from './pages/UserManagement';
import TeamMemberProfile from './pages/TeamMemberProfile';
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <div className={user ? 'container mt-4' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportList />
            </ProtectedRoute>
          } />
          <Route path="/reports/new" element={
            <ProtectedRoute>
              <ReportForm />
            </ProtectedRoute>
          } />
          <Route path="/reports/:id" element={
            <ProtectedRoute>
              <ReportDetail />
            </ProtectedRoute>
          } />
          <Route path="/reports/:id/edit" element={
            <ProtectedRoute>
              <ReportForm />
            </ProtectedRoute>
          } />
          <Route path="/reports/:id/review" element={
            <ProtectedRoute roles={['MANAGER']}>
              <ReviewPage />
            </ProtectedRoute>
          } />
          <Route path="/team-dashboard" element={
            <ProtectedRoute roles={['MANAGER']}>
              <TeamDashboard />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute roles={['MANAGER']}>
              <ProjectsPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['MANAGER']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/team-member/:userId" element={
            <ProtectedRoute roles={['MANAGER']}>
              <TeamMemberProfile />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
}

export default App;
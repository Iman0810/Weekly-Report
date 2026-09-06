import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Pages
import Dashboard from './pages/Dashboard';
import ReportList from './pages/ReportList';
import ReportForm from './pages/ReportForm';
import ReportDetail from './pages/ReportDetail';
import ReviewPage from './pages/ReviewPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
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

    </Routes>
  );
}

export default App;
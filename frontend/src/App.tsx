import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import RegisterPage from './components/RegisterPage';
import ProfileOnboarding from './components/ProfileOnboarding';
import DashboardWrapper from './pages/DashboardWrapper';
import ChatbotWidget from './components/Chatbot/ChatbotWidget';
import Profile from './pages/Profile';
import { UserRole } from './types/UserType';
import { ToastContainer } from 'react-toastify';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const ChatbotContainer: React.FC = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role') as UserRole;
    setIsAuthenticated(!!token);
    setUserRole(role || null);
  }, [location]);

  if (location.pathname.startsWith('/dashboard')) return null;

  return (
    <ChatbotWidget
      userRole={userRole}
      isAuthenticated={isAuthenticated}
      position="fixed"
    />
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <ToastContainer position="bottom-left" autoClose={3000} hideProgressBar={false} newestOnTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <ProfileOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              localStorage.getItem('accessToken')
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatbotContainer />
      </div>
    </Router>
  );
}

export default App;

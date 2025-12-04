import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import CreateMeeting from './pages/Meeting/CreateMeeting';
import JoinMeeting from './pages/Meeting/JoinMeeting';
import MeetingRoom from './pages/Meeting/MeetingRoom';
import ParticipantView from './pages/Meeting/ParticipantView';
import KeycloakService from './services/KeycloakService';

interface User {
  id: string;
  username: string;
  email: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Keycloak on app startup
    const initKeycloak = async () => {
      try {
        const authenticated = await KeycloakService.init();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const profile = await KeycloakService.getUserProfile();
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    initKeycloak();
  }, []);

  const handleLogin = async () => {
    // Redirect to Keycloak login
    KeycloakService.login();
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    KeycloakService.logout();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <AuthContext.Provider value={{ user, isAuthenticated, handleLogin, handleLogout }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-meeting" element={<CreateMeeting />} />
            <Route path="/join-meeting" element={<JoinMeeting />} />
            <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
            <Route path="/meeting/:meetingId/participant" element={<ParticipantView />} />
          </Route>

          {/* Default Route */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
      </AuthContext.Provider>
    </Router>
  );
};

export default App;

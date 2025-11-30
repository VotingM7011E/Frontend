import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import KeycloakService from '../../services/KeycloakService';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Redirect to Keycloak registration page
      const keycloak = KeycloakService.getInstance();
      if (keycloak) {
        keycloak.register();
      }
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Redirecting to Registration...</h1>
        <p>Please wait while we redirect you to the registration page.</p>
      </div>
    </div>
  );
};

export default Register;

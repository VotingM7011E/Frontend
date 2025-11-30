import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Redirect to Keycloak login
      handleLogin();
    }
  }, [isAuthenticated, navigate, handleLogin]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Redirecting to Login...</h1>
        <p>Please wait while we redirect you to the authentication page.</p>
      </div>
    </div>
  );
};

export default Login;

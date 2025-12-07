import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin, isAuthenticated } = useContext(AuthContext);
  const loginCalledRef = useRef(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    // Only call handleLogin once
    if (!loginCalledRef.current) {
      loginCalledRef.current = true;
      handleLogin();
    }
  }, [isAuthenticated, navigate]);

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

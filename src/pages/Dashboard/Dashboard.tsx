import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Interactive Meetings</h1>
        <div className="header-actions">
          <span className="user-info">Welcome, {user?.username}!</span>
          <button onClick={handleLogoutClick} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="action-section">
          <div className="action-card">
            <h2>Create Meeting</h2>
            <p>Start a new interactive meeting with your presentation</p>
            <Link to="/create-meeting" className="action-btn">
              Create Meeting
            </Link>
          </div>

          <div className="action-card">
            <h2>Join Meeting</h2>
            <p>Join an existing meeting using a meeting code</p>
            <Link to="/join-meeting" className="action-btn">
              Join Meeting
            </Link>
          </div>
        </section>

        <section className="upcoming-section">
          <h2>Your Meetings</h2>
          <div className="meetings-list">
            <p className="empty-state">No meetings yet. Create or join one to get started!</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

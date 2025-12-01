import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import MockApiService from '../../services/MockApiService';
import './Meeting.css';

const JoinMeeting: React.FC = () => {
  const [meetingCode, setMeetingCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Using mock API for localhost testing
      const data = await MockApiService.joinMeeting(meetingCode, user?.id || '');
      navigate(`/meeting/${data.meetingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meeting-container">
      <div className="meeting-card">
        <h1>Join Meeting</h1>
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label htmlFor="meetingCode">Meeting Code</label>
            <input
              id="meetingCode"
              type="text"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
              required
              placeholder="Enter meeting code (e.g., ABC123)"
              maxLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Joining...' : 'Join Meeting'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinMeeting;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import './Meeting.css';

const JoinMeeting: React.FC = () => {
  const [meetingCode, setMeetingCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get meeting ID from meeting code using the API
      const data: any = await ApiService.meetings.getIdByCode(meetingCode);
      console.log('Meeting lookup result:', data);
      
      // Navigate to participant view (participants who join by code)
      if (data.meeting_id) {
        navigate(`/meeting/${data.meeting_id}/participant`);
      } else {
        setError('Invalid meeting code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Meeting not found');
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
              placeholder="Enter meeting code (e.g., 123456)"
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

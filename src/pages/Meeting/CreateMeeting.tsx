import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import AuthContext from '../../context/AuthContext';
import ApiService from '../../services/ApiService';
import './Meeting.css';

const CreateMeeting: React.FC = () => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const navigate = useNavigate();
  //const { user } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call MeetingService API
      const data: any = await ApiService.meetings.create(title);
      console.log('Meeting created:', data);
      
      // Fetch meeting details to get the meeting code
      const meetingDetails: any = await ApiService.meetings.getDetails(data.meeting_id);
      console.log('Meeting details:', meetingDetails);
      
      if (meetingDetails.meeting_code) {
        setMeetingCode(meetingDetails.meeting_code);
        // Show code for 3 seconds before navigating
        setTimeout(() => {
          navigate(`/meeting/${data.meeting_id}`);
        }, 3000);
      } else {
        navigate(`/meeting/${data.meeting_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meeting-container">
      <div className="meeting-card">
        <h1>Create Meeting</h1>
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label htmlFor="title">Meeting Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter meeting title"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          
          {meetingCode && (
            <div className="success-message" style={{ padding: '10px', background: '#4CAF50', color: 'white', borderRadius: '4px', marginBottom: '10px' }}>
              Meeting created! Code: <strong>{meetingCode}</strong>
              <br />
              Redirecting to meeting room...
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating...' : 'Create Meeting'}
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

export default CreateMeeting;

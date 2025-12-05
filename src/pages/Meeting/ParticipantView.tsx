import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import SocketService from '../../services/SocketService';
import './Participant.css';

interface AgendaItem {
  type: 'election' | 'motion' | 'info';
  title: string;
  description?: string;
  positions?: string[];
  baseMotions?: Array<{ owner: string; motion: string }>;
}

interface Meeting {
  meeting_id: string;
  meeting_code: string;
  meeting_name: string;
  current_item?: number;
  items?: AgendaItem[];
}

const ParticipantView: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        if (meetingId) {
          const data = await ApiService.meetings.getDetails(meetingId) as Meeting;
          console.log('Participant view - Meeting data:', data);
          setMeeting(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMeeting();

    if (!meetingId) return;

    // Connect to WebSocket and join meeting room
    SocketService.connect();
    SocketService.joinMeeting(meetingId);

    // Listen for meeting updates from backend
    SocketService.onMeetingUpdated((updatedMeeting: Meeting) => {
      console.log('📡 Received meeting update via WebSocket:', updatedMeeting);
      setMeeting(updatedMeeting);
    });

    // Also listen for next agenda item events
    SocketService.onNextAgendaItem((data: any) => {
      console.log('📡 Next agenda item event:', data);
      // Optionally refetch to ensure consistency
      fetchMeeting();
    });

    // Cleanup on unmount
    return () => {
      SocketService.leaveMeeting(meetingId);
      SocketService.off('meeting_updated');
      SocketService.off('Next Agenda Item');
    };
  }, [meetingId]);

  const handleLeaveMeeting = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="loading">Loading meeting...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="submit-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="error-container">
        <p className="error-message">Meeting not found</p>
        <button onClick={() => navigate('/dashboard')} className="submit-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentItem = meeting.items && meeting.current_item !== undefined 
    ? meeting.items[meeting.current_item] 
    : null;

  return (
    <div className="participant-view-container">
      {/* Header */}
      <header className="participant-view-header">
        <h1>{meeting.meeting_name}</h1>
        <p>
          Meeting Code: <strong>{meeting.meeting_code}</strong>
        </p>
      </header>

      {/* Current Agenda Item */}
      <main className="participant-view-main">
        <div className="participant-current-item-card">
          {currentItem ? (
            <>
              <div className="participant-current-badge">
                CURRENT ITEM
              </div>
              <h2 className="participant-item-title">
                {currentItem.title}
              </h2>
              <div className="participant-item-type">
                {currentItem.type}
              </div>
              {currentItem.description && (
                <p className="participant-item-description">
                  {currentItem.description}
                </p>
              )}
            </>
          ) : (
            <div className="participant-no-item">
              <h2>No agenda item is currently active</h2>
              <p>Please wait for the meeting to start</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="participant-view-footer">
        <button 
          onClick={handleLeaveMeeting}
          className="participant-leave-btn"
        >
          Leave Meeting
        </button>
      </footer>
    </div>
  );
};

export default ParticipantView;
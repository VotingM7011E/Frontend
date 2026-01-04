import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import SocketService from '../../services/SocketService';
import CurrentAgendaItem from '../../components/CurrentAgendaItem';
import './Participant.css';

interface AgendaItem {
  type: 'election' | 'motion' | 'info';
  title: string;
  description?: string;
  positions?: string[];
  baseMotions?: Array<{ owner: string; motion: string }>;
  motion_item_id?: string; // UUID linking to motion-service
}

interface Meeting {
  meeting_id: string;
  meeting_code: string;
  meeting_name: string;
  current_item?: number;
  items?: AgendaItem[];
}

const ParticipantView: React.FC = () => {
  console.log('🚀 ParticipantView component rendering');
  const { meetingId } = useParams<{ meetingId: string }>();
  console.log('📝 meetingId from params:', meetingId);
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

  console.log('🔄 Render check - loading:', loading, 'error:', error, 'meeting:', !!meeting);

  if (loading) {
    console.log('📦 Showing loading screen');
    return <div className="loading">Loading meeting...</div>;
  }

  if (error) {
    console.log('❌ Showing error screen:', error);
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
    console.log('🤷 Showing meeting not found');
    return (
      <div className="error-container">
        <p className="error-message">Meeting not found</p>
        <button onClick={() => navigate('/dashboard')} className="submit-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  console.log('✅ Proceeding to main render, meeting:', meeting);  
  
  console.log('🎯 About to calculate currentItem');
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
          <CurrentAgendaItem
            meetingId={meeting.meeting_id}
            currentItem={currentItem}
          />
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
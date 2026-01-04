import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import SocketService from '../../services/SocketService';
import KeycloakService from '../../services/KeycloakService';
import './Participant.css';

interface AgendaItem {
  type: 'election' | 'motion' | 'info';
  title: string;
  description?: string;
  positions?: string[];
  baseMotions?: Array<{ owner: string; motion: string }>;
  motion_item_id?: string; // UUID linking to motion-service
}

interface Motion {
  motion_uuid: string;
  owner: string;
  motion: string;
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
  const [motions, setMotions] = useState<Motion[]>([]);
  const [motionsLoading, setMotionsLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [newMotionText, setNewMotionText] = useState('');
  const [editingMotionId, setEditingMotionId] = useState<string | null>(null);
  const [editMotionText, setEditMotionText] = useState('');

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

    // Get current user
    const fetchUser = async () => {
      const profile = await KeycloakService.getUserProfile();
      if (profile) {
        setCurrentUsername(profile.username);
      }
    };

    // Initial fetch
    fetchMeeting();
    fetchUser();

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

  // Fetch motions when current item is a motion type
  useEffect(() => {
    console.log('🔍 useEffect triggered, meeting exists:', !!meeting);

    // Don't run if meeting data hasn't loaded yet
    if (!meeting) {
      console.log('🔍 Meeting not loaded yet, skipping motion fetch');
      return;
    }

    const currentItem = meeting.items && meeting.current_item !== undefined
      ? meeting.items[meeting.current_item]
      : null;

    console.log('🔍 currentItem:', currentItem);

    if (!currentItem || currentItem.type !== 'motion' || !currentItem.motion_item_id) {
      console.log('🔍 Skipping motion fetch');
      setMotions([]);
      return;
    }

    console.log('🔍 Fetching motions...');
    const fetchMotions = async () => {
      setMotionsLoading(true);
      try {
        const data = await ApiService.motions.getMotions(currentItem.motion_item_id || "") as Motion[];
        console.log('✅ Fetched motions:', data);
        setMotions(data || []);
      } catch (err) {
        console.error('❌ Failed to fetch motions:', err);
        setMotions([]);
      } finally {
        setMotionsLoading(false);
      }
    };

    fetchMotions();
  }, [meeting]);

  const handleLeaveMeeting = () => {
    navigate('/dashboard');
  };

  const handleCreateMotion = async () => {
    if (!newMotionText.trim()) {
      alert('Please enter motion text');
      return;
    }

    const currentItem = meeting?.items && meeting.current_item !== undefined
      ? meeting.items[meeting.current_item]
      : null;

    if (!currentItem?.motion_item_id) {
      alert('No active motion item');
      return;
    }

    try {
      await ApiService.motions.createMotion(currentItem.motion_item_id, newMotionText.trim());
      setNewMotionText('');
      
      // Refresh motions list
      const data = await ApiService.motions.getMotions(currentItem.motion_item_id) as Motion[];
      setMotions(data || []);
    } catch (err) {
      console.error('Failed to create motion:', err);
      alert('Failed to create motion: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditMotion = (motion: Motion) => {
    setEditingMotionId(motion.motion_uuid);
    setEditMotionText(motion.motion);
  };

  const handleSaveEdit = async (motionId: string) => {
    if (!editMotionText.trim()) {
      alert('Please enter motion text');
      return;
    }

    const currentItem = meeting?.items && meeting.current_item !== undefined
      ? meeting.items[meeting.current_item]
      : null;

    if (!currentItem?.motion_item_id) {
      alert('No active motion item');
      return;
    }

    try {
      await ApiService.motions.updateMotion(
        currentItem.motion_item_id,
        motionId,
        editMotionText.trim()
      );
      
      setEditingMotionId(null);
      setEditMotionText('');
      
      // Refresh motions list
      const data = await ApiService.motions.getMotions(currentItem.motion_item_id) as Motion[];
      setMotions(data || []);
    } catch (err) {
      console.error('Failed to update motion:', err);
      alert('Failed to update motion: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditingMotionId(null);
    setEditMotionText('');
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

              {/* Show motions when current item is a motion type */}
              {currentItem.type === 'motion' && (
                <div className="participant-motions-section">
                  <h3>Current Motions</h3>
                  {motionsLoading ? (
                    <p>Loading motions...</p>
                  ) : motions.length === 0 ? (
                    <p className="no-motions">No motions have been submitted yet.</p>
                  ) : (
                    <ul className="motions-list">
                      {motions.map((m) => (
                        <li key={m.motion_uuid} className="motion-item">
                          {editingMotionId === m.motion_uuid ? (
                            <div className="motion-edit-form">
                              <textarea
                                value={editMotionText}
                                onChange={(e) => setEditMotionText(e.target.value)}
                                className="motion-edit-input"
                                rows={3}
                              />
                              <div className="motion-edit-buttons">
                                <button 
                                  onClick={() => handleSaveEdit(m.motion_uuid)}
                                  className="motion-save-btn"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={handleCancelEdit}
                                  className="motion-cancel-btn"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="motion-owner">{m.owner}:</span>
                              <span className="motion-text">{m.motion}</span>
                              {m.owner === currentUsername && (
                                <button 
                                  onClick={() => handleEditMotion(m)}
                                  className="motion-edit-btn"
                                >
                                  Edit
                                </button>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add new motion form */}
                  <div className="new-motion-form">
                    <h4>Submit a Motion</h4>
                    <textarea
                      value={newMotionText}
                      onChange={(e) => setNewMotionText(e.target.value)}
                      placeholder="Enter your motion here..."
                      className="new-motion-input"
                      rows={3}
                    />
                    <button 
                      onClick={handleCreateMotion}
                      className="new-motion-btn"
                      disabled={!newMotionText.trim()}
                    >
                      Submit Motion
                    </button>
                  </div>
                </div>
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
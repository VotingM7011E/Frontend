import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import SocketService from '../../services/SocketService';
import CurrentAgendaItem from '../../components/CurrentAgendaItem';
import ElectionManager from '../../components/ElectionManager';
import './Meeting.css';
import AuthContext from '../../context/AuthContext';

interface AgendaItem {
  type: 'election' | 'motion' | 'info';
  title: string;
  description?: string;
  positions?: string[];
  baseMotions?: Array<{ owner: string; motion: string }>
  motion_item_id?: string;
}

interface Meeting {
  meeting_id: string;
  meeting_code: string;
  meeting_name: string;
  current_item?: number;
  items?: AgendaItem[];
}

const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedMeetingCode = location.state?.meetingCode;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [agendaType, setAgendaType] = useState<'motion' | 'election' | 'info'>('motion');
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaDescription, setAgendaDescription] = useState('');
  const [motionText, setMotionText] = useState('');
  const [motionOwner, setMotionOwner] = useState('');
  const [electionPositions, setElectionPositions] = useState<string[]>([]);
  const [newPosition, setNewPosition] = useState('');
  const [hasManagePermission, setHasManagePermission] = useState(false);
  const auth = useContext(AuthContext);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        if (meetingId) {
          const data = await ApiService.meetings.getDetails(meetingId) as Meeting;
          console.log('Meeting data received:', data);
          // If meeting code was passed via navigation, use it (avoids extra API call display delay)
          if (passedMeetingCode && !data.meeting_code) {
            data.meeting_code = passedMeetingCode;
          }
          setMeeting(data);
          // After meeting loaded, fetch current user's permissions for this meeting
          const username = auth.user?.username;
          if (username) {
            try {
              const roles = await ApiService.permissions.getUserRoles(meetingId, username);
              if (Array.isArray(roles)) {
                setHasManagePermission(roles.includes('manage'));
              } else {
                setHasManagePermission(false);
              }
            } catch (permErr) {
              console.warn('Failed to fetch permissions:', permErr);
              setHasManagePermission(false);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMeeting();
    // Also refetch permissions when auth user changes
    // (if user logs in/out while on the page)
    const refetchPermissionsOnAuthChange = async () => {
      const username = auth.user?.username;
      if (!meetingId || !username) return;
      try {
        const roles = await ApiService.permissions.getUserRoles(meetingId, username);
        setHasManagePermission(Array.isArray(roles) ? roles.includes('manage') : false);
      } catch (err) {
        console.warn('Failed to refresh permissions:', err);
        setHasManagePermission(false);
      }
    };
    refetchPermissionsOnAuthChange();

    if (!meetingId) return;

    // Connect to WebSocket and join meeting room
    SocketService.connect();
    SocketService.joinMeeting(meetingId);

    // Listen for meeting updates from backend
    SocketService.onMeetingUpdated((updatedMeeting: Meeting) => {
      console.log('📡 Meeting owner received update via WebSocket:', updatedMeeting);
      setMeeting(updatedMeeting);
    });

    // Cleanup on unmount
    return () => {
      SocketService.leaveMeeting(meetingId);
      SocketService.off('meeting_updated');
      SocketService.off('Next Agenda Item');
    };
  }, [meetingId, passedMeetingCode, auth.user]);

  const handleAddAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId) return;

    // Validate election positions
    if (agendaType === 'election' && electionPositions.length === 0) {
      setError('Please add at least one position for the election');
      return;
    }

    try {
      let item: any;
      
      if (agendaType === 'motion') {
        item = {
          type: 'motion',
          title: agendaTitle,
          description: agendaDescription || '',
          baseMotions: motionText && motionOwner ? [{ owner: motionOwner, motion: motionText }] : []
        };
      } else if (agendaType === 'info') {
        item = {
          type: 'info',
          title: agendaTitle,
          description: agendaDescription || ''
        };
      } else {
        item = {
          type: 'election',
          title: agendaTitle,
          positions: electionPositions
        };
      }

      console.log('Sending agenda item:', JSON.stringify(item, null, 2));
      await ApiService.agenda.addItem(meetingId, item);
      
      // Refresh meeting data
      const data = await ApiService.meetings.getDetails(meetingId);
      setMeeting(data as Meeting);
      
      // Reset form
      setShowAddAgenda(false);
      setAgendaTitle('');
      setAgendaDescription('');
      setMotionText('');
      setMotionOwner('');
      setElectionPositions([]);
      setNewPosition('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add agenda item';
      setError(errorMsg);
      console.error('Agenda creation failed:', err);
    }
  };

  const handleLeaveMeeting = () => {
    navigate('/dashboard');
  };

  const handleNextItem = async () => {
    if (!meetingId || !meeting || !meeting.items) return;
    const nextIndex = (meeting.current_item ?? -1) + 1;
    if (nextIndex < meeting.items.length) {
      try {
        await ApiService.meetings.update(meetingId, { current_item: nextIndex });
        const data = await ApiService.meetings.getDetails(meetingId);
        setMeeting(data as Meeting);
      } catch (err) {
        setError('Failed to move to next item');
      }
    }
  };

  const handlePreviousItem = async () => {
    if (!meetingId || !meeting) return;
    const prevIndex = (meeting.current_item ?? 0) - 1;
    if (prevIndex >= 0) {
      try {
        await ApiService.meetings.update(meetingId, { current_item: prevIndex });
        const data = await ApiService.meetings.getDetails(meetingId);
        setMeeting(data as Meeting);
      } catch (err) {
        setError('Failed to move to previous item');
      }
    }
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

  return (
    <div className="meeting-room-container">
      <header className="meeting-room-header">
        <div className="meeting-info">
          <h1>{meeting.meeting_name}</h1>
          <p className="meeting-code">Code: {meeting.meeting_code}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasManagePermission && (
            <button onClick={() => navigate(`/meeting/${meeting.meeting_id}/permissions`)} className="submit-btn">
              Permissions
            </button>
          )}
          <button onClick={handleLeaveMeeting} className="leave-btn">
            Leave Meeting
          </button>
        </div>
      </header>

      <main className="meeting-room-content">
        <section className="presentation-section">
          <div className="presentation-placeholder">
            <h2>Meeting Agenda</h2>
            
            {/* Navigation Controls */}
            {meeting.items && meeting.items.length > 0 && (
              <div className="agenda-navigation" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={handlePreviousItem} 
                  disabled={(meeting.current_item ?? 0) <= 0}
                  className="submit-btn"
                  style={{ opacity: (meeting.current_item ?? 0) <= 0 ? 0.5 : 1 }}
                >
                  ← Previous
                </button>
                <span style={{ fontWeight: 'bold' }}>
                  Item {(meeting.current_item ?? 0) + 1} of {meeting.items.length}
                </span>
                <button 
                  onClick={handleNextItem} 
                  disabled={(meeting.current_item ?? -1) >= meeting.items.length - 1}
                  className="submit-btn"
                  style={{ opacity: (meeting.current_item ?? -1) >= meeting.items.length - 1 ? 0.5 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}

            {meeting.items && meeting.items.length > 0 ? (
              <div style={{ 
                maxHeight: 'calc(100vh - 400px)', 
                minHeight: '300px',
                overflowY: 'auto', 
                marginBottom: '15px',
                paddingRight: '5px'
              }}>
                <div className="agenda-list">
                  {meeting.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="agenda-item"
                      style={{
                        backgroundColor: index === (meeting.current_item ?? -1) ? '#e3f2fd' : 'white',
                        border: index === (meeting.current_item ?? -1) ? '2px solid #2196F3' : '1px solid #ddd',
                        padding: '10px 15px',
                        marginBottom: '8px',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {index === (meeting.current_item ?? -1) && (
                          <span style={{ 
                            backgroundColor: '#2196F3', 
                            color: 'white', 
                            padding: '2px 8px', 
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            CURRENT
                          </span>
                        )}
                        <h3 style={{ margin: 0, fontSize: '16px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </h3>
                        <span className="agenda-type" style={{ fontSize: '12px', color: '#666', flexShrink: 0 }}>
                          [{item.type}]
                        </span>
                      </div>
                      {item.description && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                          {item.description}
                        </p>
                      )}
                      {item.baseMotions && item.baseMotions.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <strong>Base motions ({item.baseMotions.length}):</strong>
                          {item.baseMotions.map((motion, i) => (
                            <div key={i} style={{ padding: '4px 0', borderLeft: '2px solid #ddd', paddingLeft: '8px', marginTop: '4px' }}>
                              <strong>{motion.owner}:</strong> {motion.motion}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.positions && item.positions.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <strong>Positions ({item.positions.length}):</strong> {item.positions.join(', ')}
                        </div>
                      )}
                      {/* Show Election Manager for current election item */}
                      {index === (meeting.current_item ?? -1) && item.type === 'election' && item.positions && (
                        <div style={{ marginTop: '10px' }}>
                          <ElectionManager
                            meetingId={meeting.meeting_id}
                            agendaItemIndex={index}
                            positions={item.positions}
                            hasManagePermission={hasManagePermission}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No agenda items yet</p>
            )}
            <button onClick={() => setShowAddAgenda(!showAddAgenda)} className="submit-btn">
              {showAddAgenda ? 'Cancel' : 'Add Agenda Item'}
            </button>
          </div>
        </section>

        {showAddAgenda && (
          <section className="add-agenda-section">
            <h2>Add Agenda Item</h2>
            <form onSubmit={handleAddAgendaItem} className="meeting-form">
              <div className="form-group">
                <label>Type</label>
                <select value={agendaType} onChange={(e) => setAgendaType(e.target.value as any)}>
                  <option value="motion">Motion</option>
                  <option value="election">Election</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={agendaTitle}
                  onChange={(e) => setAgendaTitle(e.target.value)}
                  required
                  placeholder="Enter agenda item title"
                />
              </div>

              {(agendaType === 'motion' || agendaType === 'info') && (
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={agendaDescription}
                    onChange={(e) => setAgendaDescription(e.target.value)}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              )}

              {agendaType === 'motion' && (
                <>
                  <div className="form-group">
                    <label>Motion Owner</label>
                    <input
                      type="text"
                      value={motionOwner}
                      onChange={(e) => setMotionOwner(e.target.value)}
                      placeholder="Who is proposing this motion?"
                    />
                  </div>
                  <div className="form-group">
                    <label>Motion Text</label>
                    <textarea
                      value={motionText}
                      onChange={(e) => setMotionText(e.target.value)}
                      placeholder="Enter the motion"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {agendaType === 'election' && (
                <div className="form-group">
                  <label>Positions to Elect</label>
                  <div style={{ marginBottom: '10px' }}>
                    {electionPositions.map((pos, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ flex: 1, padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                          {pos}
                        </span>
                        <button
                          type="button"
                          onClick={() => setElectionPositions(electionPositions.filter((_, i) => i !== index))}
                          style={{ padding: '4px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      placeholder="e.g., President"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newPosition.trim()) {
                            setElectionPositions([...electionPositions, newPosition.trim()]);
                            setNewPosition('');
                          }
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newPosition.trim()) {
                          setElectionPositions([...electionPositions, newPosition.trim()]);
                          setNewPosition('');
                        }
                      }}
                      style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Add Position
                    </button>
                  </div>
                  {electionPositions.length === 0 && (
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Add at least one position to elect
                    </p>
                  )}
                </div>
              )}

              <button type="submit" className="submit-btn">Add Item</button>
            </form>
          </section>
        )}

        <section className="interaction-section">
          <h2>Current Item - Participant View</h2>
          <div className="interaction-content">
            <CurrentAgendaItem
              meetingId={meeting.meeting_id}
              currentItem={meeting.items && meeting.current_item !== undefined 
                ? meeting.items[meeting.current_item] 
                : null}
              currentItemIndex={meeting.current_item !== undefined ? meeting.current_item : 0}
              className="participant-current-item-card"
              hasManagePermission={hasManagePermission}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default MeetingRoom;

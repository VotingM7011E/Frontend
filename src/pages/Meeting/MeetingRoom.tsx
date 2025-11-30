import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import './Meeting.css';

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

const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [agendaType, setAgendaType] = useState<'motion' | 'election' | 'info'>('motion');
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaDescription, setAgendaDescription] = useState('');
  const [motionText, setMotionText] = useState('');
  const [motionOwner, setMotionOwner] = useState('');

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        if (meetingId) {
          const data = await ApiService.meetings.getDetails(meetingId);
          console.log('Meeting data received:', data);
          setMeeting(data as Meeting);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  const handleAddAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId) return;

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
          positions: []  // Empty array for now
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add agenda item';
      setError(`Backend Error: ${errorMsg}. The MeetingService has a bug in the /agenda endpoint.`);
      console.error('Agenda creation failed:', err);
    }
  };

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

  return (
    <div className="meeting-room-container">
      <header className="meeting-room-header">
        <div className="meeting-info">
          <h1>{meeting.meeting_name}</h1>
          <p className="meeting-code">Code: {meeting.meeting_code}</p>
        </div>
        <button onClick={handleLeaveMeeting} className="leave-btn">
          Leave Meeting
        </button>
      </header>

      <main className="meeting-room-content">
        <section className="presentation-section">
          <div className="presentation-placeholder">
            <h2>Meeting Agenda</h2>
            {meeting.items && meeting.items.length > 0 ? (
              <div className="agenda-list">
                {meeting.items.map((item, index) => (
                  <div key={index} className="agenda-item">
                    <h3>{item.title}</h3>
                    <span className="agenda-type">{item.type}</span>
                    {item.description && <p>{item.description}</p>}
                    {item.baseMotions && item.baseMotions.length > 0 && (
                      <div className="motions">
                        {item.baseMotions.map((motion, i) => (
                          <div key={i} className="motion">
                            <strong>{motion.owner}:</strong> {motion.motion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

              <button type="submit" className="submit-btn">Add Item</button>
            </form>
          </section>
        )}

        <section className="interaction-section">
          <h2>Interaction Panel</h2>
          <div className="interaction-content">
            <div className="voting-area">
              <h3>Vote on Current Item</h3>
              <p>Current item: {meeting.current_item !== undefined ? meeting.current_item : 'None'}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MeetingRoom;

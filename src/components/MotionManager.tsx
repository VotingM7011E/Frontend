import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';
import MotionSocketService from '../services/MotionSocketService';
import KeycloakService from '../services/KeycloakService';
import VoteManager from './VoteManager';
import './MotionManager.css';

interface Motion {
  motion_uuid: string;
  owner: string;
  motion: string;
}

interface MotionItem {
  motion_item_id: string;
  meeting_id: string;
  motions: Motion[];
  poll?: {
    poll_uuid: string;
    poll_state: string;
    poll_options?: string[];
  };
}

interface MotionManagerProps {
  meetingId: string;
  motionItemId: string;
  initialMotions?: Array<{ owner: string; motion: string }>;
  hasManagePermission?: boolean;
}

const MotionManager: React.FC<MotionManagerProps> = ({ 
  meetingId,
  motionItemId,
  hasManagePermission = false
}) => {
  const [motions, setMotions] = useState<Motion[]>([]);
  const [motionsLoading, setMotionsLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [newMotionText, setNewMotionText] = useState('');
  const [editingMotionId, setEditingMotionId] = useState<string | null>(null);
  const [editMotionText, setEditMotionText] = useState('');
  const [error, setError] = useState('');
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const profile = await KeycloakService.getUserProfile();
      if (profile) {
        setCurrentUsername(profile.username);
      }
    };
    fetchUser();
  }, []);

  // Check for active poll
  useEffect(() => {
    const checkForPoll = async () => {
      if (!motionItemId) return;
      
      try {
        const motionItem = await ApiService.motions.getMotionItem(motionItemId) as any;
        console.log('📋 Motion item data:', motionItem);
        
        if (motionItem.poll && motionItem.poll.poll_uuid) {
          setActivePollId(motionItem.poll.poll_uuid);
          setVotingActive(motionItem.poll.poll_state === 'open' || motionItem.poll.poll_state === 'created');
        }
      } catch (err) {
        console.error('Failed to fetch motion item:', err);
      }
    };

    checkForPoll();
    // Re-check periodically in case voting starts
    const interval = setInterval(checkForPoll, 5000);
    
    return () => clearInterval(interval);
  }, [motionItemId]);

  // Fetch motions and set up real-time updates
  useEffect(() => {
    if (!motionItemId) {
      console.log('No motion_item_id provided');
      return;
    }

    const fetchMotions = async () => {
      setMotionsLoading(true);
      try {
        const data = await ApiService.motions.getMotions(motionItemId) as Motion[];
        console.log('✅ Fetched motions:', data);
        setMotions(data || []);
      } catch (err) {
        console.error('❌ Failed to fetch motions:', err);
        setError('Failed to load motions');
        setMotions([]);
      } finally {
        setMotionsLoading(false);
      }
    };

    fetchMotions();

    // Connect to Motion Service WebSocket and join motion item room
    MotionSocketService.connect();
    MotionSocketService.joinMotionItem(motionItemId);

    // Listen for motion added events
    const handleMotionAdded = (data: any) => {
      console.log('📡 Motion added:', data);
      if (data.motion_item_id === motionItemId) {
        setMotions(prev => {
          // Avoid duplicates
          if (prev.some(m => m.motion_uuid === data.motion.motion_uuid)) {
            return prev;
          }
          return [...prev, data.motion];
        });
      }
    };

    // Listen for motion updated events
    const handleMotionUpdated = (data: any) => {
      console.log('📡 Motion updated:', data);
      if (data.motion_item_id === motionItemId) {
        setMotions(prev => prev.map(m => 
          m.motion_uuid === data.motion.motion_uuid ? data.motion : m
        ));
      }
    };

    MotionSocketService.onMotionAdded(handleMotionAdded);
    MotionSocketService.onMotionUpdated(handleMotionUpdated);

    // Cleanup on unmount or when motion item changes
    return () => {
      MotionSocketService.leaveMotionItem(motionItemId);
      MotionSocketService.off('motion_added');
      MotionSocketService.off('motion_updated');
    };
  }, [motionItemId]);

  const handleCreateMotion = async () => {
    if (!newMotionText.trim()) {
      setError('Please enter motion text');
      return;
    }

    try {
      await ApiService.motions.createMotion(motionItemId, newMotionText.trim());
      setNewMotionText('');
      setError('');
      
      // Motion will be updated via WebSocket, but we can also refetch for certainty
      const data = await ApiService.motions.getMotions(motionItemId) as Motion[];
      setMotions(data || []);
    } catch (err) {
      console.error('Failed to create motion:', err);
      setError('Failed to create motion: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditMotion = (motion: Motion) => {
    setEditingMotionId(motion.motion_uuid);
    setEditMotionText(motion.motion);
    setError('');
  };

  const handleSaveEdit = async (motionId: string) => {
    if (!editMotionText.trim()) {
      setError('Please enter motion text');
      return;
    }

    try {
      await ApiService.motions.updateMotion(
        motionItemId,
        motionId,
        editMotionText.trim()
      );
      
      setEditingMotionId(null);
      setEditMotionText('');
      setError('');
      
      // Motion will be updated via WebSocket, but we can also refetch for certainty
      const data = await ApiService.motions.getMotions(motionItemId) as Motion[];
      setMotions(data || []);
    } catch (err) {
      console.error('Failed to update motion:', err);
      setError('Failed to update motion: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditingMotionId(null);
    setEditMotionText('');
    setError('');
  };

  const handleStartVoting = async () => {
    try {
      await ApiService.motions.startVoting(meetingId, motionItemId);
      setError('');
      // Poll should be created, refetch motion item to get poll_id
      setTimeout(async () => {
        const motionItem = await ApiService.motions.getMotionItem(motionItemId) as any;
        if (motionItem.poll && motionItem.poll.poll_uuid) {
          setActivePollId(motionItem.poll.poll_uuid);
          setVotingActive(true);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start voting:', err);
      setError('Failed to start voting: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // If voting is active, show VoteManager instead
  if (votingActive && activePollId) {
    return (
      <VoteManager
        meetingId={meetingId}
        pollId={activePollId}
        hasManagePermission={hasManagePermission}
      />
    );
  }

  return (
    <div className="motion-manager">
      <h3>Motion Management</h3>
      
      {error && <div className="error-message">{error}</div>}

      {/* Motions List */}
      <div className="motions-section">
        <h4>Current Motions</h4>
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
                    <div className="motion-content">
                      <span className="motion-owner">{m.owner}:</span>
                      <span className="motion-text">{m.motion}</span>
                    </div>
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
      </div>

      {/* New Motion Form */}
      <div className="new-motion-form">
        <h4>Submit a New Motion</h4>
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

      {/* Start Voting Button (Managers Only) */}
      {hasManagePermission && motions.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
          <button 
            onClick={handleStartVoting}
            className="new-motion-btn"
            style={{ backgroundColor: '#FF9800' }}
          >
            Start Voting
          </button>
        </div>
      )}
    </div>
  );
};

export default MotionManager;

import React, { useState, useEffect } from 'react';
import ApiService, { Motion, MotionItem, PollHistoryRecord } from '../services/ApiService';
import MotionSocketService from '../services/MotionSocketService';
import KeycloakService from '../services/KeycloakService';
import VoteManager from './VoteManager';
import './MotionManager.css';

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
  const [hasVotePermission, setHasVotePermission] = useState(false);
  const [votingSessionState, setVotingSessionState] = useState<'in_progress' | 'completed' | 'error' | null>(null);
  const [pollHistory, setPollHistory] = useState<PollHistoryRecord[]>([]);

  // Helper function to get poll result for a specific motion
  const getMotionResult = (motionUuid: string): PollHistoryRecord | undefined => {
    return pollHistory.find(record => record.motion_uuid === motionUuid);
  };

  // Helper function to determine if a motion passed
  const didMotionPass = (result: PollHistoryRecord): boolean => {
    const yesVotes = result.results['yes'] || 0;
    const noVotes = result.results['no'] || 0;
    return yesVotes > noVotes;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const profile = await KeycloakService.getUserProfile();
      if (profile) {
        setCurrentUsername(profile.username);
      }
    };
    fetchUser();
  }, []);

  // Check whether current user has 'vote' permission for this meeting
  useEffect(() => {
    const checkVotePermission = async () => {
      if (!currentUsername || !meetingId) return;
      try {
        const roles = await ApiService.permissions.getUserRoles(meetingId, currentUsername) as any;
        let roleList: string[] = [];
        if (Array.isArray(roles)) {
          roleList = roles;
        } else if (roles && Array.isArray((roles as any).roles)) {
          roleList = (roles as any).roles;
        }
        setHasVotePermission(roleList.includes('vote'));
      } catch (err) {
        console.error('Failed to check vote permission:', err);
        setHasVotePermission(false);
      }
    };

    checkVotePermission();
  }, [currentUsername, meetingId]);

  // Check for active poll
  useEffect(() => {
    const checkForPoll = async () => {
      if (!motionItemId) return;
      
      try {
        const motionItem = await ApiService.motions.getMotionItem(motionItemId);
        console.log('📋 Motion item data:', motionItem);
        
        // Check voting session state
        if (motionItem.voting_session) {
          setVotingSessionState(motionItem.voting_session.state);
          setPollHistory(motionItem.voting_session.poll_history || []);
        } else {
          setVotingSessionState(null);
          setPollHistory([]);
        }
        
        if (motionItem.poll && motionItem.poll.poll_uuid) {
          setActivePollId(motionItem.poll.poll_uuid);
          setVotingActive(motionItem.poll.poll_state === 'open');
        } else {
          setActivePollId(null);
          setVotingActive(false);
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
      await ApiService.agenda.startVoting(meetingId, motionItemId);
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
    if (hasVotePermission) {
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
        <h3>Voting Active</h3>
        <p className="info-message">Voting is active for this item, but you don't have permission to vote.</p>
      </div>
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
                      {(() => {
                        const result = getMotionResult(m.motion_uuid);
                        if (result) {
                          const passed = didMotionPass(result);
                          return (
                            <span className={`motion-result ${passed ? 'passed' : 'failed'}`}>
                              {passed ? '✓ Passed' : '✗ Failed'} 
                              (Yes: {result.results['yes'] || 0}, No: {result.results['no'] || 0}, Abstain: {result.results['abstain'] || 0})
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {m.owner === currentUsername && !votingSessionState && (
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

      {/* New Motion Form - Only show when voting is not in progress or completed */}
      {!votingSessionState && (
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
      )}

      {/* Start Voting Button (Managers Only) - Only show when voting hasn't started */}
      {hasManagePermission && motions.length > 0 && !votingSessionState && (
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

import React, { useState, useEffect } from 'react';
import './ElectionManager.css';

interface Position {
  position_id: number;
  meeting_id: string;
  position_name: string;
  is_open: boolean;
  poll_id?: string;
}

interface Nomination {
  position_id: number;
  username: string;
  accepted: boolean;
}

interface ElectionManagerProps {
  meetingId: string;
  meetingCode: string;
  positions: string[];
  onClose?: () => void;
}

const ELECTION_SERVICE_URL = import.meta.env.DEV 
  ? 'http://localhost:5002' 
  : '/api/election-service';

const ElectionManager: React.FC<ElectionManagerProps> = ({ 
  meetingId, 
  meetingCode, 
  positions,
  onClose 
}) => {
  const [createdPositions, setCreatedPositions] = useState<Position[]>([]);
  const [nominations, setNominations] = useState<Record<number, Nomination[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newNominee, setNewNominee] = useState<Record<number, string>>({});

  // Initialize positions
  useEffect(() => {
    const initializePositions = async () => {
      setLoading(true);
      try {
        // Check if positions already exist
        const response = await fetch(`${ELECTION_SERVICE_URL}/positions?meeting_id=${meetingId}`);
        const existingPositions = await response.json();
        
        if (existingPositions.length > 0) {
          setCreatedPositions(existingPositions);
          // Load nominations for each position
          for (const pos of existingPositions) {
            await loadNominations(pos.position_id);
          }
        } else {
          // Create positions
          const created: Position[] = [];
          for (const positionName of positions) {
            const response = await fetch(`${ELECTION_SERVICE_URL}/positions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meeting_code: meetingCode,
                position_name: positionName
              })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to create position: ${positionName}`);
            }
            
            const position = await response.json();
            created.push(position);
          }
          setCreatedPositions(created);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize positions');
      } finally {
        setLoading(false);
      }
    };

    if (positions.length > 0) {
      initializePositions();
    }
  }, [meetingId, meetingCode, positions]);

  const loadNominations = async (positionId: number) => {
    try {
      const response = await fetch(`${ELECTION_SERVICE_URL}/positions/${positionId}/nominations`);
      if (response.ok) {
        const noms = await response.json();
        setNominations(prev => ({ ...prev, [positionId]: noms }));
      }
    } catch (err) {
      console.error('Failed to load nominations:', err);
    }
  };

  const handleNominate = async (positionId: number) => {
    const username = newNominee[positionId];
    if (!username || !username.trim()) return;

    try {
      const response = await fetch(`${ELECTION_SERVICE_URL}/positions/${positionId}/nominations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to nominate');
      }

      // Reload nominations
      await loadNominations(positionId);
      setNewNominee(prev => ({ ...prev, [positionId]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add nomination');
    }
  };

  const handleAcceptNomination = async (positionId: number, username: string) => {
    try {
      const response = await fetch(
        `${ELECTION_SERVICE_URL}/positions/${positionId}/nominations/${username}/accept`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to accept nomination');
      }

      // Reload nominations
      await loadNominations(positionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept nomination');
    }
  };

  const handleClosePosition = async (positionId: number) => {
    try {
      const response = await fetch(`${ELECTION_SERVICE_URL}/positions/${positionId}/close`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close position');
      }

      const result = await response.json();
      
      // Update the position in state
      setCreatedPositions(prev => 
        prev.map(p => p.position_id === positionId 
          ? { ...p, is_open: false, poll_id: result.poll_id }
          : p
        )
      );

      alert(`Voting opened! Poll ID: ${result.poll_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close position');
    }
  };

  if (loading) {
    return <div className="election-manager"><p>Loading elections...</p></div>;
  }

  return (
    <div className="election-manager">
      <div className="election-header">
        <h3>Election Management</h3>
        {onClose && (
          <button onClick={onClose} className="close-btn">×</button>
        )}
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {createdPositions.map(position => {
        const posNominations = nominations[position.position_id] || [];
        const acceptedCount = posNominations.filter(n => n.accepted).length;

        return (
          <div key={position.position_id} className="position-card">
            <div className="position-header">
              <h4>{position.position_name}</h4>
              <span className="position-status">
                {position.is_open ? 'Open' : position.poll_id ? 'Voting' : 'Closed'}
              </span>
            </div>

            {position.is_open && (
              <>
                <div className="nomination-form">
                  <input
                    type="text"
                    placeholder="Enter username to nominate"
                    value={newNominee[position.position_id] || ''}
                    onChange={(e) => setNewNominee(prev => ({ 
                      ...prev, 
                      [position.position_id]: e.target.value 
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNominate(position.position_id);
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleNominate(position.position_id)}
                    className="nominate-btn"
                  >
                    Nominate
                  </button>
                </div>

                <div className="nominations-list">
                  <h5>Nominations ({posNominations.length})</h5>
                  {posNominations.length === 0 ? (
                    <p className="no-nominations">No nominations yet</p>
                  ) : (
                    <ul>
                      {posNominations.map(nom => (
                        <li key={nom.username} className="nomination-item">
                          <span className={nom.accepted ? 'accepted' : 'pending'}>
                            {nom.username}
                          </span>
                          {!nom.accepted && (
                            <button 
                              onClick={() => handleAcceptNomination(position.position_id, nom.username)}
                              className="accept-btn"
                            >
                              Accept
                            </button>
                          )}
                          {nom.accepted && <span className="badge">✓ Accepted</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="position-actions">
                  <p className="info-text">Accepted candidates: {acceptedCount}</p>
                  <button
                    onClick={() => handleClosePosition(position.position_id)}
                    className="close-nominations-btn"
                    disabled={acceptedCount < 2}
                    title={acceptedCount < 2 ? 'Need at least 2 accepted candidates' : 'Close nominations and start voting'}
                  >
                    Close Nominations & Start Voting
                  </button>
                </div>
              </>
            )}

            {position.poll_id && (
              <div className="voting-info">
                <p>Voting is now open!</p>
                <p className="poll-id">Poll ID: <code>{position.poll_id}</code></p>
                <button className="view-results-btn">View Results</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ElectionManager;

import React, { useState, useEffect } from 'react';
import ApiService, { Poll } from '../services/ApiService';
import './VoteManager.css';

interface VoteManagerProps {
  meetingId: string;
  pollId: string;
  hasManagePermission?: boolean;
  motionTitle?: string;
}

const VoteManager: React.FC<VoteManagerProps> = ({ 
  pollId,
  motionTitle }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [rankedOptions, setRankedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true);
      try {
        const data = await ApiService.voting.getPoll(pollId);
        console.log('✅ Fetched poll:', data);
        setPoll(data);
        
        // Initialize ranked options with empty array
        if (data.pollType === 'ranked') {
          setRankedOptions([]);
        }
        // Check whether the authenticated user has already voted
        try {
          const hv = await ApiService.voting.hasVoted(pollId);
          setHasVoted(Boolean(hv && (hv as any).has_voted));
        } catch (e) {
          console.error('❌ Failed to check hasVoted:', e);
        }
      } catch (err) {
        console.error('❌ Failed to fetch poll:', err);
        setError('Failed to load poll');
      } finally {
        setLoading(false);
      }
    };

    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const handleSingleVote = (option: string) => {
    setSelectedOption(option);
  };

  const handleRankedVote = (option: string) => {
    setRankedOptions(prev => {
      // If already ranked, remove it
      if (prev.includes(option)) {
        return prev.filter(o => o !== option);
      }
      // Otherwise add to ranking
      return [...prev, option];
    });
  };

  const moveRankUp = (index: number) => {
    if (index === 0) return;
    const newRanked = [...rankedOptions];
    [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
    setRankedOptions(newRanked);
  };

  const moveRankDown = (index: number) => {
    if (index === rankedOptions.length - 1) return;
    const newRanked = [...rankedOptions];
    [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
    setRankedOptions(newRanked);
  };

  const handleSubmitVote = async () => {
    if (!poll) return;

    let voteData: any;

    if (poll.pollType === 'single') {
      if (!selectedOption) {
        setError('Please select an option');
        return;
      }
      voteData = { vote: [selectedOption] };
    } else {
      if (rankedOptions.length === 0) {
        setError('Please rank at least one option');
        return;
      }
      voteData = { vote: rankedOptions };
    }

    setSubmitting(true);
    try {
      await ApiService.voting.submitVote(pollId, voteData);
      setHasVoted(true);
      setError('');
      console.log('✅ Vote submitted successfully');
    } catch (err) {
      console.error('❌ Failed to submit vote:', err);
      setError('Failed to submit vote: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="vote-manager"><p>Loading poll...</p></div>;
  }

  if (error && !poll) {
    return <div className="vote-manager"><p className="error-message">{error}</p></div>;
  }

  if (!poll) {
    return <div className="vote-manager"><p>No active poll</p></div>;
  }

  if (hasVoted) {
    return (
      <div className="vote-manager">
        <h3>Vote Submitted</h3>
        <p className="success-message">✓ Your vote has been recorded successfully!</p>
      </div>
    );
  }

  console.log('🗳️ Rendering voting interface for poll:', poll);

  return (
    <div className="vote-manager">
      <h3>{motionTitle || 'Cast Your Vote'}</h3>
      <p className="vote-type-label">
        {poll.pollType === 'single' ? 'Select one option' : 'Rank options in order of preference'}
      </p>

      {error && <div className="error-message">{error}</div>}

      {poll.pollType === 'single' ? (
        <div className="vote-options">
          {poll.options.map((option, index) => (
            <button
              key={index}
              className={`vote-option ${selectedOption === option ? 'selected' : ''}`}
              onClick={() => handleSingleVote(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="ranked-vote-container">
          <div className="available-options">
            <h4>Available Options:</h4>
            {poll.options.filter(o => !rankedOptions.includes(o)).map((option, index) => (
              <button
                key={index}
                className="vote-option"
                onClick={() => handleRankedVote(option)}
              >
                + {option}
              </button>
            ))}
          </div>

          {rankedOptions.length > 0 && (
            <div className="ranked-options">
              <h4>Your Ranking:</h4>
              {rankedOptions.map((option, index) => (
                <div key={index} className="ranked-item">
                  <span className="rank-number">{index + 1}</span>
                  <span className="rank-option">{option}</span>
                  <div className="rank-controls">
                    <button
                      onClick={() => moveRankUp(index)}
                      disabled={index === 0}
                      className="rank-btn"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveRankDown(index)}
                      disabled={index === rankedOptions.length - 1}
                      className="rank-btn"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRankedVote(option)}
                      className="rank-btn remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSubmitVote}
        className="submit-vote-btn"
        disabled={submitting || (poll.pollType === 'single' ? !selectedOption : rankedOptions.length === 0)}
      >
        {submitting ? 'Submitting...' : 'Submit Vote'}
      </button>
    </div>
  );
};

export default VoteManager;

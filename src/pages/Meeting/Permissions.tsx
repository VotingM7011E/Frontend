import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import './Meeting.css';

type UserRoles = {
  username: string;
  roles: string[];
};

const Permissions: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserRoles[]>([]);

  const fetchAllUsersWithRoles = async () => {
    if (!meetingId) return;
    setLoading(true);
    setError('');

    try {
      const rolesToCheck = ['view', 'vote', 'manage'];
      const map = new Map<string, Set<string>>();

      // Fetch users for each role and aggregate
      await Promise.all(
        rolesToCheck.map(async (role) => {
          try {
            const res = await ApiService.permissions.getUsersByRole(meetingId, role);
            if (Array.isArray(res)) {
              (res as string[]).forEach((username) => {
                const set = map.get(username) || new Set<string>();
                set.add(role);
                map.set(username, set);
              });
            }
          } catch (err) {
            // If a particular role endpoint fails, log and continue
            console.warn(`Failed fetching users for role ${role}:`, err);
          }
        })
      );

      const aggregated: UserRoles[] = Array.from(map.entries()).map(([username, set]) => ({
        username,
        roles: Array.from(set),
      }));

      // Sort by username
      aggregated.sort((a, b) => a.username.localeCompare(b.username));
      setUsers(aggregated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsersWithRoles();
  }, [meetingId]);

  return (
    <div className="meeting-room-container">
      <header className="meeting-room-header">
        <div className="meeting-info">
          <h1>Permissions</h1>
          <p>Manage user roles for meeting {meetingId}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate(`/meeting/${meetingId}`)} className="submit-btn">Back</button>
          <button onClick={fetchAllUsersWithRoles} className="submit-btn">Refresh</button>
        </div>
      </header>

      <main className="meeting-room-content">
        <section style={{ marginBottom: '20px' }}>
          <h2>Users & Roles</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error-message">{error}</p>}

          {users.length === 0 && !loading ? (
            <p>No users with roles found</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Username</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Roles</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{u.username}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{u.roles.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default Permissions;

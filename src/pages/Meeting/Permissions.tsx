import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';
import './Meeting.css';

const Permissions: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [replaceInput, setReplaceInput] = useState('');
  const [usersByRole, setUsersByRole] = useState<string[]>([]);
  const [roleQuery, setRoleQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    if (!meetingId || !username) return;
    setLoading(true);
    setError('');
    try {
      const data = await ApiService.permissions.getUserRoles(meetingId, username);
      setRoles(Array.isArray(data) ? (data as string[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!meetingId || !username || !roleInput) return;
    setLoading(true);
    setError('');
    try {
      // Assume backend expects { role: "..." } or similar AddRoleRequest
      await ApiService.permissions.addUserRole(meetingId, username, { role: roleInput });
      await fetchRoles();
      setRoleInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (!meetingId || !username) return;
    setLoading(true);
    setError('');
    try {
      await ApiService.permissions.removeUserRole(meetingId, username, role);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceRoles = async () => {
    if (!meetingId || !username) return;
    setLoading(true);
    setError('');
    try {
      const rolesArr = replaceInput
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);
      await ApiService.permissions.replaceUserRoles(meetingId, username, rolesArr);
      await fetchRoles();
      setReplaceInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace roles');
    } finally {
      setLoading(false);
    }
  };

  const handleGetUsersByRole = async () => {
    if (!meetingId || !roleQuery) return;
    setLoading(true);
    setError('');
    try {
      const users = await ApiService.permissions.getUsersByRole(meetingId, roleQuery);
      setUsersByRole(Array.isArray(users) ? (users as string[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meeting-room-container">
      <header className="meeting-room-header">
        <div className="meeting-info">
          <h1>Permissions</h1>
          <p>Manage user roles for meeting {meetingId}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate(`/meeting/${meetingId}`)} className="submit-btn">Back</button>
        </div>
      </header>

      <main className="meeting-room-content">
        <section style={{ marginBottom: '20px' }}>
          <h2>User Roles</h2>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            <button onClick={fetchRoles} className="submit-btn" style={{ marginTop: '8px' }}>Fetch Roles</button>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p className="error-message">{error}</p>}

          {roles && roles.length > 0 ? (
            <ul>
              {roles.map((r) => (
                <li key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{r}</span>
                  <button onClick={() => handleRemoveRole(r)} className="submit-btn">Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No roles found for user</p>
          )}

          <div style={{ marginTop: '12px' }}>
            <input placeholder="role to add" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} />
            <button onClick={handleAddRole} className="submit-btn">Add Role</button>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label>Replace roles (comma separated)</label>
            <input value={replaceInput} onChange={(e) => setReplaceInput(e.target.value)} placeholder="role1, role2" />
            <button onClick={handleReplaceRoles} className="submit-btn">Replace Roles</button>
          </div>
        </section>

        <section>
          <h2>Users By Role</h2>
          <div className="form-group">
            <label>Role</label>
            <input value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} placeholder="role" />
            <button onClick={handleGetUsersByRole} className="submit-btn">Get Users</button>
          </div>

          {usersByRole && usersByRole.length > 0 ? (
            <ul>
              {usersByRole.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p>No users for role</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Permissions;

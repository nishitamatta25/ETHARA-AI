import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Trash2, Users } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    api.get('/users').then(r => setUsers(r.data.users)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/users/${userId}`); toast.success('User deleted'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1><Shield size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />Admin Panel</h1>
        <p>Manage all users and their roles</p>
      </div>

      <div className="card">
        <div className="section-title">
          <span><Users size={16} style={{ display: 'inline', marginRight: '6px' }} />All Users ({users.length})</span>
        </div>
        {users.length === 0 ? (
          <div className="empty-state"><p>No users found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar">{u.name?.[0]?.toUpperCase()}</div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{u.email}</td>
                    <td>
                      <select className="form-control" style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto' }}
                        value={u.role} onChange={e => changeRole(u._id, e.target.value)}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id, u.name)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

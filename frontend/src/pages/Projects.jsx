import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, FolderOpen, Users, Calendar, CheckCircle2 } from 'lucide-react';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '', priority: 'medium', color: COLORS[0] });
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    api.get('/projects').then(r => setProjects(r.data.projects)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', deadline: '', priority: 'medium', color: COLORS[0] });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass = { active: 'badge-active', completed: 'badge-completed', archived: 'badge-archived' };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={48} />
          <h3>No projects yet</h3>
          <p>{user?.role === 'admin' ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}</p>
        </div>
      ) : (
        <div className="card-grid card-grid-2">
          {projects.map(p => {
            const pct = p.taskCount > 0 ? Math.round((p.doneCount / p.taskCount) * 100) : 0;
            return (
              <div key={p._id} className="project-card" style={{ '--card-color': p.color }} onClick={() => navigate(`/projects/${p._id}`)}>
                <div className="project-card-header">
                  <h3>{p.name}</h3>
                  <span className={`badge ${statusBadgeClass[p.status]}`}>{p.status}</span>
                </div>
                {p.description && <p className="desc">{p.description}</p>}
                <div className="project-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} />{p.members.length} member{p.members.length !== 1 ? 's' : ''}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} />{p.taskCount} tasks</span>
                  {p.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />{formatDate(p.deadline)}</span>}
                </div>
                <div className="project-progress">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} /></div>
                  <div className="progress-label">{pct}% complete — {p.doneCount}/{p.taskCount} tasks done</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title="Create New Project" onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button id="save-project-btn" className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
          </>}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="form-control" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" placeholder="What is this project about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" className="form-control" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'transform 0.2s' }} />
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

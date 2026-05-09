import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Pencil, Trash2, UserPlus, UserMinus, Calendar, Flag } from 'lucide-react';

const STATUSES = ['todo', 'in-progress', 'done'];
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };
const STATUS_COLORS = { 'todo': '#6366f1', 'in-progress': '#f59e0b', 'done': '#10b981' };

const PriorityBadge = ({ p }) => <span className={`badge badge-${p}`}>{p}</span>;

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tab, setTab] = useState('board');
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
  const [memberUserId, setMemberUserId] = useState('');
  const [projectForm, setProjectForm] = useState({});

  const fetchAll = async () => {
    try {
      const [pRes, tRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks/project/${id}`)]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
      setProjectForm({ name: pRes.data.project.name, description: pRes.data.project.description, status: pRes.data.project.status, deadline: pRes.data.project.deadline?.split('T')[0] || '' });
      if (isAdmin) {
        const uRes = await api.get('/users');
        setAllUsers(uRes.data.users);
      }
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const openTaskModal = (task = null) => {
    setEditTask(task);
    setTaskForm(task ? { title: task.title, description: task.description || '', assignedTo: task.assignedTo?._id || '', priority: task.priority, status: task.status, dueDate: task.dueDate?.split('T')[0] || '' }
      : { title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
    setTaskModal(true);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, taskForm);
        toast.success('Task updated!');
      } else {
        await api.post('/tasks', { ...taskForm, project: id });
        toast.success('Task created!');
      }
      setTaskModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving task'); }
    finally { setSaving(false); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); toast.success('Task deleted'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const updateStatus = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!memberUserId) return toast.error('Select a user');
    setSaving(true);
    try { await api.post(`/projects/${id}/members`, { userId: memberUserId }); toast.success('Member added!'); setMemberModal(false); setMemberUserId(''); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); toast.success('Member removed'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put(`/projects/${id}`, projectForm); toast.success('Project updated!'); setEditProjectModal(false); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const deleteProject = async () => {
    if (!confirm('Delete this entire project and all its tasks?')) return;
    try { await api.delete(`/projects/${id}`); toast.success('Project deleted'); navigate('/projects'); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const isOverdue = (d) => d && new Date(d) < new Date();

  const notMembers = allUsers.filter(u => !project?.members.some(m => m.user._id === u._id));

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {});

  return (
    <div>
      <div className="project-detail-header">
        <div className="left">
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: '12px' }} onClick={() => navigate('/projects')}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            {project.name}
          </h1>
          {project.description && <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '0.9rem' }}>{project.description}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            <span className={`badge badge-${project.priority}`}>{project.priority} priority</span>
            {project.deadline && <span className="badge" style={{ background: 'var(--glass)', color: 'var(--text2)', border: '1px solid var(--border)' }}><Calendar size={10} /> {formatDate(project.deadline)}</span>}
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditProjectModal(true)}><Pencil size={14} /> Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setMemberModal(true)}><UserPlus size={14} /> Add Member</button>
            <button className="btn btn-danger btn-sm" onClick={deleteProject}><Trash2 size={14} /> Delete</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div className="tabs">
          <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</button>
          <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members ({project.members.length})</button>
        </div>
        <button id="add-task-btn" className="btn btn-primary btn-sm" onClick={() => openTaskModal()}><Plus size={14} /> Add Task</button>
      </div>

      {tab === 'board' && (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <h4><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />{STATUS_LABELS[status]}</h4>
                <span className="col-count">{tasksByStatus[status].length}</span>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus[status].length === 0 && <div style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>No tasks</div>}
                {tasksByStatus[status].map(task => (
                  <div key={task._id} className="task-card">
                    <div className="task-card-header">
                      <h4>{task.title}</h4>
                      <div className="task-actions">
                        <button className="icon-btn" onClick={() => openTaskModal(task)} title="Edit"><Pencil size={13} /></button>
                        {(isAdmin || task.createdBy?._id === user._id) && (
                          <button className="icon-btn danger" onClick={() => deleteTask(task._id)} title="Delete"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </div>
                    {task.description && <p className="task-desc">{task.description}</p>}
                    <div className="task-card-footer">
                      <PriorityBadge p={task.priority} />
                      {task.assignedTo && (
                        <div className="assignee">
                          <div className="assignee-dot">{task.assignedTo.name?.[0]}</div>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                      {task.dueDate && <span className={`due-date ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue' : ''}`}>{formatDate(task.dueDate)}</span>}
                    </div>
                    {/* Quick status change */}
                    <select className="form-control" style={{ marginTop: '10px', fontSize: '0.75rem', padding: '4px 8px' }}
                      value={task.status} onChange={e => updateStatus(task._id, e.target.value)}>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="members-list">
            {project.members.map(m => (
              <div key={m.user._id} className="member-item">
                <div className="user-avatar">{m.user.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div className="name">{m.user.name}</div>
                  <div className="email">{m.user.email}</div>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isAdmin && m.user._id !== project.owner._id && (
                  <button className="icon-btn danger" onClick={() => removeMember(m.user._id)}><UserMinus size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModal && (
        <Modal title={editTask ? 'Edit Task' : 'Create Task'} onClose={() => setTaskModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setTaskModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTask} disabled={saving}>{saving ? 'Saving...' : (editTask ? 'Update' : 'Create')}</button>
          </>}>
          <div className="form-group"><label>Title *</label><input className="form-control" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Assign To</label>
              <select className="form-control" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      {memberModal && isAdmin && (
        <Modal title="Add Member" onClose={() => setMemberModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setMemberModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMember} disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
          </>}>
          <div className="form-group">
            <label>Select User</label>
            <select className="form-control" value={memberUserId} onChange={e => setMemberUserId(e.target.value)}>
              <option value="">-- Choose a user --</option>
              {notMembers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          {notMembers.length === 0 && <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>All users are already members of this project.</p>}
        </Modal>
      )}

      {/* Edit Project Modal */}
      {editProjectModal && isAdmin && (
        <Modal title="Edit Project" onClose={() => setEditProjectModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditProjectModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveProject} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </>}>
          <div className="form-group"><label>Name</label><input className="form-control" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>
                <option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group"><label>Deadline</label><input type="date" className="form-control" value={projectForm.deadline} onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

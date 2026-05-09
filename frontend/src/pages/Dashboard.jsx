import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, ListTodo, AlertTriangle, TrendingUp } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = { 'todo': 'badge-todo', 'in-progress': 'badge-inprogress', 'done': 'badge-done' };
  const label = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };
  return <span className={`badge ${map[status]}`}>{label[status]}</span>;
};

const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading dashboard...</span></div>;

  const { stats, recentTasks, overdueTasks } = data || {};

  const statCards = [
    { label: 'Total Tasks', value: stats?.total || 0, icon: <ListTodo size={22} color="#6366f1" />, color: 'rgba(99,102,241,0.15)', textColor: '#818cf8' },
    { label: 'In Progress', value: stats?.['in-progress'] || 0, icon: <Clock size={22} color="#f59e0b" />, color: 'rgba(245,158,11,0.15)', textColor: '#f59e0b' },
    { label: 'Completed', value: stats?.done || 0, icon: <CheckCircle2 size={22} color="#10b981" />, color: 'rgba(16,185,129,0.15)', textColor: '#10b981' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: <AlertTriangle size={22} color="#ef4444" />, color: 'rgba(239,68,68,0.15)', textColor: '#ef4444' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const isOverdue = (d) => d && new Date(d) < new Date();

  return (
    <div>
      <div className="page-header">
        <h1>👋 Hello, {user?.name?.split(' ')[0]}!</h1>
        <p>Here's what's happening across your projects today.</p>
      </div>

      <div className="card-grid card-grid-4" style={{ marginBottom: '28px' }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <div className="value" style={{ color: s.textColor }}>{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card">
            <div className="section-title">
              <span><TrendingUp size={16} style={{ display: 'inline', marginRight: '6px' }} />Recent Tasks</span>
            </div>
            {recentTasks?.length === 0 && (
              <div className="empty-state"><p>No tasks yet. Join a project to get started!</p></div>
            )}
            {recentTasks?.map(task => (
              <div key={task._id} className="task-list-item" onClick={() => navigate(`/projects/${task.project?._id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: task.project?.color || '#6366f1', flexShrink: 0 }} />
                <div className="task-list-info">
                  <div className="title">{task.title}</div>
                  <div className="project-name">{task.project?.name}</div>
                </div>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="section-title">
              <span><AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', color: '#ef4444' }} />Overdue</span>
              {overdueTasks?.length > 0 && <span className="badge badge-overdue">{overdueTasks.length}</span>}
            </div>
            {overdueTasks?.length === 0 && (
              <div className="empty-state"><CheckCircle2 size={32} color="#10b981" /><p style={{ marginTop: '8px' }}>All caught up! 🎉</p></div>
            )}
            {overdueTasks?.map(task => (
              <div key={task._id} className="task-list-item" onClick={() => navigate(`/projects/${task.project?._id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: task.project?.color || '#6366f1', flexShrink: 0 }} />
                <div className="task-list-info">
                  <div className="title">{task.title}</div>
                  <div className="project-name" style={{ color: '#ef4444' }}>Due {formatDate(task.dueDate)}</div>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

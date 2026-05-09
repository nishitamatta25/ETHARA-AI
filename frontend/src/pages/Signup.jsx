import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', adminSecret: '' });
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await register(form.name, form.email, form.password, form.adminSecret);
      toast.success(res.message || 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Zap size={28} color="#6366f1" /> TaskFlow</div>
        <h2>Create an account</h2>
        <p className="subtitle">Start managing your projects today</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input id="signup-name" className="form-control" type="text" placeholder="John Doe"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input id="signup-email" className="form-control" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input id="signup-password" className="form-control" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="button" className="admin-secret-toggle" onClick={() => setShowAdmin(!showAdmin)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', border: 'none', background: 'none' }}>
            {showAdmin ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Have an admin access key?
          </button>
          {showAdmin && (
            <div className="form-group">
              <label>Admin Secret Key</label>
              <input id="signup-admin-secret" className="form-control" type="password" placeholder="Enter admin secret..."
                value={form.adminSecret} onChange={e => setForm({ ...form, adminSecret: e.target.value })} />
            </div>
          )}
          <button id="signup-submit" className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}

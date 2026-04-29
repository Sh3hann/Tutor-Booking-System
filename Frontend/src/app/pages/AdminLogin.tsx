import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import './AdminLogin.css';

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useChatAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Admin access granted');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="antigravity-particles" />
      
      <div className="glass-card">
        <div className="shield-container">
          <Shield className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="admin-title">Admin Portal</h1>
        <p className="admin-subtitle">Restricted access — authorized personnel only</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <Label className="admin-label">Admin Email</Label>
            <Input 
              type="email" 
              placeholder="admin@gmail.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="admin-input"
            />
          </div>

          <div className="form-field">
            <Label className="admin-label">Password</Label>
            <div className="password-wrapper">
              <Input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="admin-input"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="admin-button"
          >
            {loading ? 'Verifying...' : (
              <>Access Dashboard <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <div className="back-home">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

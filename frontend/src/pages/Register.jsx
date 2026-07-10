import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', businessName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon"><i className="ti ti-crown"></i></span>
          Cloud<span> Finanças</span>
        </div>
        <div className="auth-subtitle">Crie sua conta e organize as finanças do seu negócio.</div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Seu nome</label>
            <div className="input-with-icon">
              <i className="ti ti-user"></i>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Maria Silva"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Nome do negócio (opcional)</label>
            <div className="input-with-icon">
              <i className="ti ti-building-store"></i>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Ex: Mercadinho da Maria"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <i className="ti ti-mail"></i>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="voce@seunegocio.com"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Senha</label>
            <div className="input-with-icon">
              <i className="ti ti-lock"></i>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary full-btn" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <div className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
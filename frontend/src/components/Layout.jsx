import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-brand-icon"><i className="ti ti-crown"></i></span>
          <span className="brand-text">Cloud<span> Finanças</span></span>
        </div>
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="ti ti-layout-dashboard"></i> <span className="nav-label">Resumo</span>
          </NavLink>
          <NavLink to="/transacoes" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="ti ti-receipt-2"></i> <span className="nav-label">Transações</span>
          </NavLink>
          <NavLink to="/categorias" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="ti ti-tag"></i> <span className="nav-label">Categorias</span>
          </NavLink>
        </nav>
        <button className="topbar-icon-btn">
          <i className="ti ti-bell"></i>
          <span className="dot"></span>
        </button>
        <div className="topbar-user">{user?.name?.slice(0, 2).toUpperCase()}</div>
        <button className="logout-link" onClick={logout}>Sair</button>
      </div>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Activity, Sun, Moon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Sidebar = () => {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="sidebar-logo">
        <Activity size={32} />
        <span>NutriFlow</span>
      </NavLink>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink 
          to="/pacientes" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          Pacientes
        </NavLink>
        
        {/* Mobile-only menu items */}
        <button onClick={toggleTheme} className="nav-item mobile-only" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          Tema
        </button>
        <button onClick={signOut} className="nav-item mobile-only" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}>
          <LogOut size={20} />
          Sair
        </button>
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={toggleTheme} 
          className="nav-item" 
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '0.5rem' }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
        </button>
        <button 
          onClick={signOut} 
          className="nav-item" 
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
};


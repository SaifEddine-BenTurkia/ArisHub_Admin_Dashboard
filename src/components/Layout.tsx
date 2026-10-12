import { useState } from 'react';
import { BriefcaseBusiness, ChevronLeft, Flag, Gauge, LayoutDashboard, LogOut, Megaphone, Menu, RefreshCw, ShieldCheck, Users, WalletCards, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navigation = [
  { to: '/', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/performance', label: 'Performance', icon: Gauge },
  { to: '/providers', label: 'Prestataires', icon: ShieldCheck },
  { to: '/recharges', label: 'Recharges', icon: WalletCards },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/jobs', label: 'Missions', icon: BriefcaseBusiness },
  { to: '/reports', label: 'Signalements', icon: Flag },
  { to: '/notifications', label: 'Notifications', icon: Megaphone },
];

export function Layout() {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return <div className="app-shell">
    {open && <button className="sidebar-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark">A</div><div><strong>ArisHub</strong><span>Administration</span></div><button className="mobile-close" onClick={() => setOpen(false)}><X /></button></div>
      <nav>{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer"><div className="admin-identity"><span className="admin-avatar">{admin?.fullName?.[0] || 'A'}</span><div><strong>{admin?.fullName}</strong><span>{admin?.role?.replace('_', ' ')}</span></div></div><button className="nav-link logout" onClick={logout}><LogOut size={18} />Déconnexion</button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="menu-button" onClick={() => setOpen(true)}><Menu /></button><div className="breadcrumb"><ChevronLeft size={16} /><span>Espace sécurisé</span></div><button className="refresh-button" title="Actualiser" onClick={() => window.location.reload()}><RefreshCw size={17} /></button></header>
      <div className="page" key={location.pathname}><Outlet /></div>
    </main>
  </div>;
}

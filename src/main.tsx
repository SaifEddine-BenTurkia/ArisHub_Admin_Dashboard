import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { LoadingState } from './components/ui';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { JobsPage } from './pages/JobsPage';
import { LoginPage } from './pages/LoginPage';
import { ProviderDetailPage } from './pages/ProviderDetailPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { RechargesPage } from './pages/RechargesPage';
import './styles.css';

function ProtectedLayout() {
  const { admin, loading } = useAuth();
  if (loading) return <div className="fullscreen-state"><LoadingState /></div>;
  return admin ? <Layout /> : <Navigate to="/login" replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="providers" element={<ProvidersPage />} />
      <Route path="providers/:id" element={<ProviderDetailPage />} />
      <Route path="recharges" element={<RechargesPage />} />
      <Route path="clients" element={<ClientsPage />} />
      <Route path="clients/:id" element={<ClientDetailPage />} />
      <Route path="jobs" element={<JobsPage />} />
      <Route path="jobs/:id" element={<JobDetailPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider></BrowserRouter></StrictMode>,
);

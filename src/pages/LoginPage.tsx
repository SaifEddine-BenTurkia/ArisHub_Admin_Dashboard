import { useState, type FormEvent } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui';
import { getErrorMessage } from '../lib/format';

export function LoginPage() {
  const { admin, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (admin) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(email.trim(), password); } catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }

  return <main className="login-page"><section className="login-intro"><div className="brand-mark large">A</div><p className="eyebrow">ArisHub Operations</p><h1>Le centre de contrôle de votre plateforme.</h1><p>Validez les prestataires, sécurisez les recharges et gardez une vue claire sur l’activité de lancement.</p><div className="security-note"><ShieldCheck /><span>Accès strictement réservé aux administrateurs autorisés.</span></div></section><section className="login-panel"><form className="login-card" onSubmit={submit}><div className="login-icon"><LockKeyhole /></div><div><p className="eyebrow">Espace sécurisé</p><h2>Connexion administrateur</h2><p>Utilisez le compte créé par le script d’initialisation.</p></div>{error && <div className="alert alert-danger">{error}</div>}<label>Adresse e-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@arishub.site" /></label><label>Mot de passe<input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" /></label><Button type="submit" busy={busy}>Se connecter</Button><small>La session est conservée uniquement dans cet onglet et expire selon la configuration du backend.</small></form></section></main>;
}

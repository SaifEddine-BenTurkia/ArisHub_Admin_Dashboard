import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { formatDate, getErrorMessage } from '../lib/format';
import type { ClientSummary, JobSummary } from '../types';

type ClientDetail = ClientSummary & { jobsPosted?: JobSummary[] };
export function ClientDetailPage() {
  const { id = '' } = useParams(); const [client, setClient] = useState<ClientDetail | null>(null); const [error, setError] = useState('');
  const load = useCallback(async () => { try { setClient(await api(`/admin/clients/${id}`)); } catch (e) { setError(getErrorMessage(e)); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <ErrorState message={error} retry={load} />; if (!client) return <LoadingState />;
  return <><Link to="/clients" className="back-link"><ArrowLeft size={16} />Retour aux clients</Link><PageHeader title={client.fullName} subtitle={`Compte créé le ${formatDate(client.createdAt)}`} /><div className="detail-grid"><Card className="profile-summary"><Avatar name={client.fullName} src={client.profileImage} /><h2>{client.fullName}</h2><p><Phone size={15} />{client.phoneNumber}</p><p><Mail size={15} />{client.email || 'Aucun e-mail'}</p><p><MapPin size={15} />{[client.gouvernement, client.delegation].filter(Boolean).join(', ') || 'Non renseigné'}</p><div className="dual-status"><div><span>Téléphone</span><StatusBadge status={client.phoneVerified} /></div><div><span>E-mail</span><StatusBadge status={client.emailVerified} /></div></div></Card><Card><div className="section-title"><div><p className="eyebrow">Historique</p><h2>Dernières missions</h2></div></div>{client.jobsPosted?.length ? <div className="compact-list">{client.jobsPosted.map((job) => <Link to={`/jobs/${job.id}`} key={job.id}><div><strong>{job.title}</strong><span>{formatDate(job.createdAt)}</span></div><StatusBadge status={job.status} /></Link>)}</div> : <p className="muted">Ce client n’a encore publié aucune mission.</p>}</Card></div></>;
}

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { formatDate, formatMoney, getErrorMessage } from '../lib/format';
import type { JobSummary, Transaction } from '../types';

type JobDetail = JobSummary & { description?: string; applicants?: Array<{ id: string; provider: { id: string; fullName: string; businessName?: string; averageRating?: number | string; completedJobs?: number } }>; transactions?: Transaction[] };
export function JobDetailPage() {
  const { id = '' } = useParams(); const [job, setJob] = useState<JobDetail | null>(null); const [error, setError] = useState('');
  const load = useCallback(async () => { try { setJob(await api(`/admin/jobs/${id}`)); } catch (e) { setError(getErrorMessage(e)); } }, [id]); useEffect(() => { void load(); }, [load]);
  if (error) return <ErrorState message={error} retry={load} />; if (!job) return <LoadingState />;
  return <><Link to="/jobs" className="back-link"><ArrowLeft size={16} />Retour aux missions</Link><PageHeader title={job.title} subtitle={`${job.category} · créée le ${formatDate(job.createdAt)}`} action={<StatusBadge status={job.status} />} /><div className="detail-main"><Card><div className="section-title"><div><p className="eyebrow">Mission</p><h2>Détails opérationnels</h2></div><BriefcaseBusiness /></div><p>{job.description || 'Aucune description disponible.'}</p><dl className="data-grid"><div><dt>Client</dt><dd>{job.client?.fullName || job.clientName}</dd></div><div><dt>Prestataire affecté</dt><dd>{job.confirmedProvider?.fullName || 'Non affecté'}</dd></div><div><dt>Budget</dt><dd>{job.fixedPrice ? formatMoney(job.fixedPrice) : `${formatMoney(job.minPrice)} – ${formatMoney(job.maxPrice)}`}</dd></div><div><dt>Candidatures</dt><dd>{job.totalApplicants}</dd></div></dl></Card><Card><div className="section-title"><div><p className="eyebrow">Candidatures</p><h2>Prestataires intéressés</h2></div></div>{job.applicants?.length ? <div className="compact-list">{job.applicants.map((item) => <Link to={`/providers/${item.provider.id}`} key={item.id}><div><strong>{item.provider.fullName}</strong><span>{item.provider.businessName || `${item.provider.completedJobs || 0} missions terminées`}</span></div><b>{Number(item.provider.averageRating || 0).toFixed(1)} / 5</b></Link>)}</div> : <p className="muted">Aucune candidature.</p>}</Card></div></>;
}

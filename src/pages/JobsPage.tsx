import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, SearchInput, StatusBadge } from '../components/ui';
import { api, queryString } from '../lib/api';
import { formatDate, formatMoney, getErrorMessage } from '../lib/format';
import type { JobSummary, Paginated } from '../types';

export function JobsPage() {
  const [params, setParams] = useSearchParams(); const [search, setSearch] = useState(params.get('search') || ''); const [result, setResult] = useState<Paginated<JobSummary> | null>(null); const [error, setError] = useState('');
  const page = Number(params.get('page') || 1); const status = params.get('status') || '';
  const load = useCallback(async () => { setResult(null); setError(''); try { setResult(await api(`/admin/jobs${queryString({ search: params.get('search') || undefined, status: status || undefined, page, limit: 20 })}`)); } catch (e) { setError(getErrorMessage(e)); } }, [page, params, status]);
  useEffect(() => { void load(); }, [load]);
  function update(values: Record<string, string | undefined>) { const next = new URLSearchParams(params); Object.entries(values).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k)); if (!values.page) next.delete('page'); setParams(next); }
  return <><PageHeader title="Missions" subtitle="Supervision du cycle de vie et des affectations." /><Card className="toolbar"><div className="search-submit"><SearchInput value={search} onChange={setSearch} placeholder="Titre ou nom du client" /><button onClick={() => update({ search: search.trim() || undefined })}>Rechercher</button></div><label className="select-wrap"><SlidersHorizontal size={16} /><select value={status} onChange={(e) => update({ status: e.target.value || undefined })}><option value="">Tous les statuts</option><option value="open">Ouvertes</option><option value="in_progress">En cours</option><option value="completed">Terminées</option><option value="cancelled">Annulées</option></select></label></Card>{error ? <ErrorState message={error} retry={load} /> : !result ? <LoadingState /> : !result.data.length ? <EmptyState title="Aucune mission" /> : <Card className="table-card"><div className="table-scroll"><table><thead><tr><th>Mission</th><th>Client</th><th>Statut</th><th>Budget</th><th>Candidats</th><th>Créée le</th><th></th></tr></thead><tbody>{result.data.map((job) => <tr key={job.id}><td><div className="title-cell"><strong>{job.title}</strong><span>{job.category} · {job.gouvernement || '—'}</span></div></td><td>{job.client?.fullName || job.clientName || '—'}</td><td><StatusBadge status={job.status} /></td><td>{job.fixedPrice ? formatMoney(job.fixedPrice) : `${formatMoney(job.minPrice)} – ${formatMoney(job.maxPrice)}`}</td><td>{job.totalApplicants}</td><td>{formatDate(job.createdAt)}</td><td><Link className="row-action" to={`/jobs/${job.id}`}><ChevronRight /></Link></td></tr>)}</tbody></table></div><Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPage={(p) => update({ page: String(p) })} /></Card>}</>;
}

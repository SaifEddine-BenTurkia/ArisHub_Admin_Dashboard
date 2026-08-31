import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, SearchInput } from '../components/ui';
import { api, queryString } from '../lib/api';
import { formatDate, getErrorMessage } from '../lib/format';
import type { ClientSummary, Paginated } from '../types';

export function ClientsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [result, setResult] = useState<Paginated<ClientSummary> | null>(null);
  const [error, setError] = useState('');
  const page = Number(params.get('page') || 1);
  const load = useCallback(async () => { setResult(null); setError(''); try { setResult(await api(`/admin/clients${queryString({ search: params.get('search') || undefined, page, limit: 20 })}`)); } catch (e) { setError(getErrorMessage(e)); } }, [page, params]);
  useEffect(() => { void load(); }, [load]);
  function update(values: Record<string, string | undefined>) { const next = new URLSearchParams(params); Object.entries(values).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k)); if (!values.page) next.delete('page'); setParams(next); }

  return <><PageHeader title="Clients" subtitle="Recherche et consultation des comptes clients." /><Card className="toolbar"><div className="search-submit"><SearchInput value={search} onChange={setSearch} placeholder="Nom, téléphone ou e-mail" /><button onClick={() => update({ search: search.trim() || undefined })}>Rechercher</button></div></Card>{error ? <ErrorState message={error} retry={load} /> : !result ? <LoadingState /> : !result.data.length ? <EmptyState title="Aucun client" /> : <Card className="table-card"><div className="table-scroll"><table><thead><tr><th>Client</th><th>Localisation</th><th>Vérifications</th><th>Missions</th><th>Inscription</th><th></th></tr></thead><tbody>{result.data.map((client) => <tr key={client.id}><td><div className="person-cell"><Avatar name={client.fullName} src={client.profileImage} /><div><strong>{client.fullName}</strong><span>{client.phoneNumber}</span></div></div></td><td>{[client.gouvernement, client.delegation].filter(Boolean).join(' · ') || '—'}</td><td><div className="verification-dots"><span>{client.phoneVerified ? <CheckCircle2 /> : <Circle />} Téléphone</span><span>{client.emailVerified ? <CheckCircle2 /> : <Circle />} E-mail</span></div></td><td>{client._count?.jobsPosted ?? 0}</td><td>{formatDate(client.createdAt)}</td><td><Link className="row-action" to={`/clients/${client.id}`}><ChevronRight /></Link></td></tr>)}</tbody></table></div><Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPage={(p) => update({ page: String(p) })} /></Card>}</>;
}

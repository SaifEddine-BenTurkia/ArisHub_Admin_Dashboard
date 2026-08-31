import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination, SearchInput, StatusBadge } from '../components/ui';
import { api, queryString } from '../lib/api';
import { formatDate, formatMoney, getErrorMessage } from '../lib/format';
import type { Paginated, ProviderSummary } from '../types';

export function ProvidersPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<ProviderSummary> | null>(null);
  const [search, setSearch] = useState(params.get('search') || '');
  const [error, setError] = useState('');
  const approval = params.get('approval') ?? '';
  const page = Number(params.get('page') || 1);

  const load = useCallback(async () => {
    setError(''); setResult(null);
    try { setResult(await api(`/admin/providers${queryString({ search: params.get('search') || undefined, isApproved: approval || undefined, page, limit: 20 })}`)); }
    catch (e) { setError(getErrorMessage(e)); }
  }, [approval, page, params]);
  useEffect(() => { void load(); }, [load]);

  function update(next: Record<string, string | undefined>) {
    const copy = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => value ? copy.set(key, value) : copy.delete(key));
    if (!('page' in next)) copy.delete('page');
    setParams(copy);
  }
  function submitSearch() { update({ search: search.trim() || undefined }); }

  return <><PageHeader title="Prestataires" subtitle="Vérification KYC, statut d’approbation et portefeuille." /><Card className="toolbar"><div className="search-submit"><SearchInput value={search} onChange={setSearch} placeholder="Nom, téléphone, e-mail ou entreprise" /><button onClick={submitSearch}>Rechercher</button></div><label className="select-wrap"><SlidersHorizontal size={16} /><select value={approval} onChange={(e) => update({ approval: e.target.value || undefined })}><option value="">Tous les statuts</option><option value="false">À examiner</option><option value="true">Approuvés</option></select></label></Card>{error ? <ErrorState message={error} retry={load} /> : !result ? <LoadingState /> : result.data.length === 0 ? <EmptyState title="Aucun prestataire" /> : <Card className="table-card"><div className="table-scroll"><table><thead><tr><th>Prestataire</th><th>Vérification</th><th>Catégories</th><th>Portefeuille</th><th>Inscription</th><th></th></tr></thead><tbody>{result.data.map((provider) => { const mismatch = provider.verificationStatus === 'APPROVED' && !provider.isApproved; return <tr key={provider.id}><td><div className="person-cell"><Avatar name={provider.fullName} src={provider.profileImage} /><div><strong>{provider.fullName}</strong><span>{provider.phoneNumber}</span></div></div></td><td><div className="status-stack"><StatusBadge status={provider.verificationStatus || provider.isApproved} />{mismatch && <Badge tone="danger"><AlertTriangle size={12} /> Incohérent</Badge>}</div></td><td><div className="tag-list">{provider.category?.slice(0, 2).map((item) => <span key={item}>{item}</span>)}</div></td><td><strong>{formatMoney(provider.walletBalance)}</strong></td><td>{formatDate(provider.createdAt)}</td><td><Link className="row-action" to={`/providers/${provider.id}`} aria-label="Voir le dossier"><ChevronRight /></Link></td></tr>; })}</tbody></table></div><Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPage={(next) => update({ page: String(next) })} /></Card>}</>;
}

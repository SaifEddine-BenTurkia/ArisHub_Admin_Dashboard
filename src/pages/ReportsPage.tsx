import { useCallback, useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '../components/ui';
import { api, queryString } from '../lib/api';
import { formatDate, getErrorMessage } from '../lib/format';
import type { Report, ReportList, ReportPerson, ReportStatus } from '../types';

type Tone = 'warning' | 'info' | 'success' | 'neutral';

const STATUS_BADGE: Record<ReportStatus, { label: string; tone: Tone }> = {
  pending: { label: 'En attente', tone: 'warning' },
  investigating: { label: 'En cours', tone: 'info' },
  resolved: { label: 'Traité', tone: 'success' },
  dismissed: { label: 'Rejeté', tone: 'neutral' },
};

const TABS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'investigating', label: 'En cours' },
  { value: 'resolved', label: 'Traités' },
  { value: 'dismissed', label: 'Rejetés' },
  { value: 'all', label: 'Tous' },
];

/** What an admin can do next from each status. Every step can be undone. */
const NEXT_STEPS: Record<ReportStatus, Array<{ status: ReportStatus; label: string; variant: 'primary' | 'secondary' }>> = {
  pending: [
    { status: 'investigating', label: 'Prendre en charge', variant: 'primary' },
    { status: 'resolved', label: 'Marquer traité', variant: 'secondary' },
    { status: 'dismissed', label: 'Rejeter', variant: 'secondary' },
  ],
  investigating: [
    { status: 'resolved', label: 'Marquer traité', variant: 'primary' },
    { status: 'dismissed', label: 'Rejeter', variant: 'secondary' },
  ],
  resolved: [{ status: 'pending', label: 'Rouvrir', variant: 'secondary' }],
  dismissed: [{ status: 'pending', label: 'Rouvrir', variant: 'secondary' }],
};

export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') || 'pending') as ReportStatus | 'all';
  const page = Number(params.get('page') || 1);
  const [result, setResult] = useState<ReportList | null>(null);
  const [counts, setCounts] = useState<ReportList['counts'] | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    const list = await api<ReportList>(`/admin/reports${queryString({ status: status === 'all' ? undefined : status, page, limit: 20 })}`);
    setResult(list);
    setCounts(list.counts);
  }, [page, status]);
  const load = useCallback(async () => {
    setError(''); setResult(null);
    try { await fetchReports(); } catch (e) { setError(getErrorMessage(e)); }
  }, [fetchReports]);
  useEffect(() => { void load(); }, [load]);

  function update(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); if (key !== 'page') next.delete('page'); setParams(next); }

  async function move(report: Report, next: ReportStatus) {
    setBusyId(report.id); setActionError('');
    try {
      await api(`/admin/reports/${report.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      await fetchReports();
    } catch (e) { setActionError(getErrorMessage(e)); } finally { setBusyId(null); }
  }

  return <>
    <PageHeader title="Signalements" subtitle="Ce que les utilisateurs signalent depuis l’application. Chaque nouveau signalement est aussi envoyé par email." />
    <Card className="toolbar"><div className="segmented">{TABS.map((tab) => <button key={tab.value} className={status === tab.value ? 'active' : ''} onClick={() => update('status', tab.value)}>{tab.label}{tab.value !== 'all' && counts ? ` (${counts[tab.value]})` : ''}</button>)}</div></Card>
    {actionError && <div className="alert alert-danger">{actionError}</div>}
    {error ? <ErrorState message={error} retry={load} />
      : !result ? <LoadingState />
      : result.data.length === 0 ? <EmptyState title="Aucun signalement" message={status === 'pending' ? 'Rien à traiter pour le moment.' : 'Aucun signalement dans cette catégorie.'} />
      : <div className="report-grid">{result.data.map((report) => <ReportCard key={report.id} report={report} busy={busyId === report.id} disabled={busyId !== null} onMove={(next) => move(report, next)} />)}</div>}
    {result && <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPage={(next) => update('page', String(next))} />}
  </>;
}

function ReportCard({ report, busy, disabled, onMove }: { report: Report; busy: boolean; disabled: boolean; onMove(next: ReportStatus): void }) {
  const badge = STATUS_BADGE[report.status] ?? { label: report.status, tone: 'neutral' };
  const jobLink = report.job && <Link className="text-link" to={`/jobs/${report.job.id}`}>{report.job.title}</Link>;
  const target = report.targetType === 'job'
    ? (jobLink ? <>{jobLink}<span>La mission elle-même</span></> : <>Mission supprimée<span>{report.targetId}</span></>)
    : report.targetType === 'user'
      ? <PersonLine person={report.reportedUser} id={report.targetId} />
      : <>Un message<span>{report.targetId}</span></>;

  return <Card className="report-card">
    <div className="report-head"><span className="action-icon"><Flag /></span><Badge tone={badge.tone}>{badge.label}</Badge></div>
    <div><p className="eyebrow">{formatDate(report.createdAt)}</p><h2>{report.reason}</h2></div>
    {report.details ? <p className="report-details">{report.details}</p> : <p className="report-no-details">Aucun détail donné.</p>}
    <dl>
      <div><dt>Signalé par</dt><dd><PersonLine person={report.reporter} id={report.reporterId} /></dd></div>
      <div><dt>Concerne</dt><dd>{target}</dd></div>
      {jobLink && report.targetType !== 'job' && <div><dt>Mission</dt><dd>{jobLink}</dd></div>}
    </dl>
    <div className="report-actions">{(NEXT_STEPS[report.status] ?? []).map((step) => <Button key={step.status} variant={step.variant} busy={busy} disabled={disabled} onClick={() => onMove(step.status)}>{step.label}</Button>)}</div>
  </Card>;
}

function PersonLine({ person, id }: { person: ReportPerson | null; id: string }) {
  if (!person) return <>Compte supprimé<span>{id}</span></>;
  const provider = person.type === 'provider';
  return <><Link className="text-link" to={`/${provider ? 'providers' : 'clients'}/${person.id}`}>{person.fullName}</Link><span>{provider ? 'Prestataire' : 'Client'} · {person.phoneNumber}</span></>;
}

import { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, ChevronRight, Hourglass, Timer, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate, getErrorMessage } from '../lib/format';
import type { FunnelRow, MarketplaceFunnel, UnansweredJobs } from '../types';
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui';

const PERIODS = [7, 30, 90];
/** Advertising starts once this share of requests gets an offer within the hour. */
const ADS_TARGET = 80;

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : null);
const showPercent = (value: number | null) => (value === null ? '—' : `${value} %`);

function showMinutes(minutes: number | null) {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const rest = minutes % 60;
    return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
  }
  return `${Math.round(minutes / (24 * 60))} j`;
}

export function PerformancePage() {
  const [days, setDays] = useState(30);
  const [funnel, setFunnel] = useState<MarketplaceFunnel | null>(null);
  const [unanswered, setUnanswered] = useState<UnansweredJobs | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setFunnel(null);
    setError('');
    try {
      const [funnelData, waiting] = await Promise.all([
        api<MarketplaceFunnel>(`/admin/stats/funnel?days=${days}`),
        api<UnansweredJobs>('/admin/jobs/unanswered'),
      ]);
      setFunnel(funnelData);
      setUnanswered(waiting);
    } catch (e) { setError(getErrorMessage(e)); }
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  const periodPicker = <div className="segmented">{PERIODS.map((value) => <button key={value} className={value === days ? 'active' : ''} onClick={() => setDays(value)}>{value} jours</button>)}</div>;

  if (error) return <><PageHeader title="Performance" subtitle="Les demandes trouvent-elles un prestataire ?" action={periodPicker} /><ErrorState message={error} retry={load} /></>;
  if (!funnel || !unanswered) return <><PageHeader title="Performance" subtitle="Les demandes trouvent-elles un prestataire ?" action={periodPicker} /><LoadingState /></>;

  const o = funnel.overall;
  const hourRate = percent(o.offerWithinHour, o.matured);
  const targetMet = hourRate !== null && hourRate >= ADS_TARGET;
  const cards = [
    { label: 'Demandes publiées', value: String(o.posted), note: `${days} derniers jours`, icon: BriefcaseBusiness, tone: 'violet' },
    { label: 'Offre en moins d’1 h', value: showPercent(hourRate), note: `${o.offerWithinHour} sur ${o.matured} demandes`, icon: Timer, tone: targetMet ? 'teal' : 'gold' },
    { label: 'Délai médian', value: showMinutes(o.medianMinutesToFirstOffer), note: `avant la première offre (${o.withOffer} avec offre)`, icon: Hourglass, tone: 'blue' },
    { label: 'Prestataire choisi', value: showPercent(percent(o.hired, o.posted)), note: `${o.completed} terminées · ${o.cancelled} annulées`, icon: UserCheck, tone: 'teal' },
  ];

  return <>
    <PageHeader title="Performance" subtitle={`Demandes ouvertes depuis le ${formatDate(funnel.since)} · mis à jour ${formatDate(funnel.generatedAt)}`} action={periodPicker} />
    <div className="stat-grid">{cards.map(({ label, value, note, icon: Icon, tone }) => <div key={label}><Card className="stat-card"><span className={`stat-icon ${tone}`}><Icon /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></Card></div>)}</div>
    <div className="dashboard-grid">
      <Card>
        <div className="section-title"><div><p className="eyebrow">Avant la publicité</p><h2>Objectif : {ADS_TARGET} % de réponses en moins d’une heure</h2></div><Badge tone={targetMet ? 'success' : 'warning'}>{targetMet ? 'Atteint' : 'Pas encore'}</Badge></div>
        <p className="muted">Lancez les campagnes dans une zone quand {ADS_TARGET} % des demandes y reçoivent une offre en moins d’une heure, deux semaines de suite. Les demandes publiées il y a moins d’une heure ne comptent pas encore. Le tableau par gouvernorat montre les zones prêtes.</p>
      </Card>
      <Card>
        <div className="section-title"><div><p className="eyebrow">À traiter maintenant</p><h2>Sans réponse depuis {unanswered.thresholdMinutes} min</h2></div><Badge tone={unanswered.data.length ? 'warning' : 'success'}>{unanswered.data.length}</Badge></div>
        {unanswered.data.length === 0
          ? <div className="mini-empty">Toutes les demandes récentes ont une réponse.</div>
          : <div className="compact-list">{unanswered.data.map((job) => <Link to={`/jobs/${job.id}`} key={job.id}><div><strong>{job.title}</strong><span>{job.category || 'Catégorie non précisée'} · {[job.gouvernement, job.delegation].filter(Boolean).join(', ') || 'Zone non précisée'}</span><span>{job.requestType === 'direct' ? `Demande directe à ${job.targetProvider?.fullName || 'un prestataire'}` : 'Demande ouverte, aucune offre'}</span></div><div className="compact-right waiting"><b>{showMinutes(job.minutesWaiting)}</b><ChevronRight size={16} /></div></Link>)}</div>}
      </Card>
    </div>
    <FunnelTable title="Par gouvernorat" firstColumn="Gouvernorat" rows={funnel.byGovernorate} />
    <FunnelTable title="Par catégorie" firstColumn="Catégorie" rows={funnel.byCategory} />
  </>;
}

function FunnelTable({ title, firstColumn, rows }: { title: string; firstColumn: string; rows: FunnelRow[] }) {
  return <Card className="table-card funnel-table">
    <div className="section-title funnel-table-title"><h2>{title}</h2></div>
    {rows.length === 0 ? <EmptyState title="Aucune demande" message="Aucune demande ouverte sur cette période." /> : <div className="table-scroll"><table><thead><tr><th>{firstColumn}</th><th>Publiées</th><th>Avec offre</th><th>Offre &lt; 1 h</th><th>Délai médian</th><th>Prestataire choisi</th><th>Terminées</th></tr></thead><tbody>{rows.map((row) => { const rate = percent(row.offerWithinHour, row.matured); return <tr key={row.label}><td><strong>{row.label}</strong></td><td>{row.posted}</td><td>{row.withOffer}</td><td>{rate === null ? '—' : <Badge tone={rate >= ADS_TARGET ? 'success' : rate >= 50 ? 'warning' : 'danger'}>{rate} %</Badge>}</td><td>{showMinutes(row.medianMinutesToFirstOffer)}</td><td>{row.hired}</td><td>{row.completed}</td></tr>; })}</tbody></table></div>}
  </Card>;
}

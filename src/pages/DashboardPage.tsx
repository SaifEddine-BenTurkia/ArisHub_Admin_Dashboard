import { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, CircleDollarSign, Clock3, Flag, ShieldCheck, Timer, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate, formatMoney, getErrorMessage } from '../lib/format';
import type { DashboardOverview, Paginated, RechargeRequest, ReportList, UnansweredJobs } from '../types';
import { Badge, Card, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/ui';

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [unanswered, setUnanswered] = useState<number | null>(null);
  const [pendingReports, setPendingReports] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [stats, rechargeData, pending, waiting, reports] = await Promise.all([
        api<DashboardOverview>('/admin/stats/overview'),
        api<Paginated<RechargeRequest>>('/admin/recharge-requests?status=PENDING&page=1&limit=5'),
        api<{ pendingApprovals: number }>('/admin/providers/pending-count'),
        // Optional: the overview must still load against a backend without these endpoints.
        api<UnansweredJobs>('/admin/jobs/unanswered').catch(() => null),
        api<ReportList>('/admin/reports?status=pending&limit=1').catch(() => null),
      ]);
      setOverview(stats); setRecharges(rechargeData.data); setPendingApprovals(pending.pendingApprovals); setUnanswered(waiting ? waiting.data.length : null); setPendingReports(reports ? reports.counts.pending : null);
    } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (error) return <ErrorState message={error} retry={load} />;
  if (!overview) return <LoadingState />;

  const cards = [
    { label: 'Clients', value: overview.users.totalClients, note: `+${overview.users.newClientsThisMonth} ce mois`, icon: Users, tone: 'teal' },
    { label: 'Prestataires', value: overview.users.totalProviders, note: `${overview.users.approvedProviders} approuvés`, icon: ShieldCheck, tone: 'blue' },
    { label: 'À vérifier', value: pendingApprovals, note: 'Action requise', icon: Clock3, tone: 'gold', to: '/providers?approval=false' },
    { label: 'Missions ouvertes', value: overview.jobs.open, note: `${overview.jobs.total} au total`, icon: BriefcaseBusiness, tone: 'violet' },
  ];
  const waitingTotal = pendingApprovals + recharges.length + (unanswered ?? 0) + (pendingReports ?? 0);

  return <><PageHeader title="Vue d’ensemble" subtitle={`Dernière synchronisation : ${formatDate(overview.generatedAt)}`} /><div className="stat-grid">{cards.map(({ label, value, note, icon: Icon, tone, to }) => { const content = <Card className="stat-card"><span className={`stat-icon ${tone}`}><Icon /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></Card>; return to ? <Link key={label} to={to}>{content}</Link> : <div key={label}>{content}</div>; })}</div><div className="dashboard-grid"><Card><div className="section-title"><div><p className="eyebrow">Opérations</p><h2>Actions prioritaires</h2></div><Badge tone={waitingTotal ? 'warning' : 'success'}>{waitingTotal} en attente</Badge></div><div className="action-list"><Link to="/providers?approval=false"><span className="action-icon"><ShieldCheck /></span><div><strong>Vérifications prestataires</strong><p>Examiner les dossiers et corriger les états incohérents.</p></div><b>{pendingApprovals}</b></Link><Link to="/recharges?status=PENDING"><span className="action-icon"><WalletCards /></span><div><strong>Demandes de recharge</strong><p>Contrôler les références avant de créditer les portefeuilles.</p></div><b>{recharges.length}</b></Link><Link to="/performance"><span className="action-icon"><Timer /></span><div><strong>Demandes sans réponse</strong><p>Appeler des prestataires de la zone avant que le client abandonne.</p></div><b>{unanswered ?? '—'}</b></Link><Link to="/reports"><span className="action-icon"><Flag /></span><div><strong>Signalements</strong><p>Lire ce que les utilisateurs signalent : fraude, abus, comportement.</p></div><b>{pendingReports ?? '—'}</b></Link></div></Card><Card><div className="section-title"><div><p className="eyebrow">Activité</p><h2>Santé de la plateforme</h2></div><TrendingUp /></div><div className="health-grid"><div><span>Taux de réalisation</span><strong>{overview.jobs.completionRate}%</strong></div><div><span>Missions ce mois</span><strong>{overview.jobs.thisMonth}</strong></div><div><span>Préinscriptions</span><strong>{overview.totalPreRegistrations}</strong></div></div></Card></div><div className="dashboard-grid"><Card><div className="section-title"><div><p className="eyebrow">Finance</p><h2>Soldes et commissions</h2></div><CircleDollarSign /></div><div className="financial-list"><div><span>Soldes prestataires</span><strong>{formatMoney(overview.financials.totalWalletBalance)}</strong></div><div><span>Gains cumulés</span><strong>{formatMoney(overview.financials.totalEarningsPaidOut)}</strong></div><div><span>Commissions collectées</span><strong>{formatMoney(overview.financials.totalCommissionCollected)}</strong></div><div><span>Commissions ce mois</span><strong>{formatMoney(overview.financials.commissionThisMonth)}</strong></div></div></Card><Card><div className="section-title"><div><p className="eyebrow">File récente</p><h2>Recharges à traiter</h2></div><Link className="text-link" to="/recharges">Tout voir</Link></div>{recharges.length === 0 ? <div className="mini-empty">Aucune recharge en attente.</div> : <div className="compact-list">{recharges.map((item) => <Link to="/recharges" key={item.id}><div><strong>{item.provider.fullName}</strong><span>{formatDate(item.createdAt)}</span></div><div className="compact-right"><b>{formatMoney(item.amount)}</b><StatusBadge status={item.status} /></div></Link>)}</div>}</Card></div></>;
}

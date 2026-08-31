import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Phone, ShieldAlert, WalletCards, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card, ErrorState, LoadingState, Modal, PageHeader, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { formatDate, formatMoney, getErrorMessage } from '../lib/format';
import type { ProviderDetail } from '../types';

type Action = 'approve' | 'reject' | 'topup' | null;

export function ProviderDetailPage() {
  const { id = '' } = useParams();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [error, setError] = useState('');
  const [action, setAction] = useState<Action>(null);
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => { setError(''); try { setProvider(await api(`/admin/providers/${id}`)); } catch (e) { setError(getErrorMessage(e)); } }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function execute() {
    setBusy(true); setActionError('');
    try {
      if (action === 'approve') await api(`/admin/providers/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ notes: notes.trim() || undefined }) });
      if (action === 'reject') await api(`/admin/providers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason: notes.trim() }) });
      if (action === 'topup') await api(`/admin/providers/${id}/wallet/top-up`, { method: 'POST', body: JSON.stringify({ amount: Number(amount), description: notes.trim() }) });
      setAction(null); setNotes(''); setAmount(''); await load();
    } catch (e) { setActionError(getErrorMessage(e)); } finally { setBusy(false); }
  }

  if (error) return <ErrorState message={error} retry={load} />;
  if (!provider) return <LoadingState />;
  const mismatch = provider.verificationStatus === 'APPROVED' && !provider.isApproved;
  const documents = [
    ['CIN — face avant', provider.cinFront], ['CIN — face arrière', provider.cinBack], ['Selfie de vérification', provider.verificationSelfie],
  ] as const;

  return <><Link to="/providers" className="back-link"><ArrowLeft size={16} />Retour aux prestataires</Link><PageHeader title={provider.fullName} subtitle={provider.businessName || 'Prestataire indépendant'} action={<div className="header-actions">{!provider.isApproved && <Button onClick={() => setAction('approve')}><CheckCircle2 size={17} />Approuver</Button>}<Button variant="danger" onClick={() => setAction('reject')}><XCircle size={17} />Refuser</Button></div>} />{mismatch && <div className="alert alert-danger"><AlertTriangle /><div><strong>État de vérification incohérent</strong><p>Le dossier KYC est marqué APPROVED, mais le compte n’est pas approuvé. Utilisez « Approuver » pour synchroniser les deux valeurs.</p></div></div>}<div className="detail-grid"><Card className="profile-summary"><Avatar name={provider.fullName} src={provider.profileImage} /><h2>{provider.fullName}</h2><p>{provider.email || 'Aucun e-mail'}</p><p><Phone size={15} />{provider.phoneNumber}</p><div className="dual-status"><div><span>Dossier KYC</span><StatusBadge status={provider.verificationStatus} /></div><div><span>Accès plateforme</span><StatusBadge status={provider.isApproved} /></div></div><dl><div><dt>Inscrit le</dt><dd>{formatDate(provider.createdAt)}</dd></div><div><dt>Approuvé le</dt><dd>{formatDate(provider.approvedAt)}</dd></div><div><dt>Missions terminées</dt><dd>{provider.completedJobs}</dd></div><div><dt>Note moyenne</dt><dd>{Number(provider.averageRating || 0).toFixed(1)} / 5</dd></div></dl></Card><div className="detail-main"><Card><div className="section-title"><div><p className="eyebrow">Contrôle KYC</p><h2>Documents de vérification</h2></div><ShieldAlert /></div><div className="document-grid">{documents.map(([label, url]) => <div className="document-card" key={label}><div><strong>{label}</strong><span>{url ? 'Document reçu' : 'Manquant'}</span></div>{url ? <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={16} />Ouvrir</a> : <Badge tone="danger">Absent</Badge>}</div>)}</div><div className="contract-line"><div><strong>Contrat signé</strong><span>{formatDate(provider.contractSignedAt)}</span></div><StatusBadge status={Boolean(provider.contractSigned)} /></div></Card><Card><div className="section-title"><div><p className="eyebrow">Portefeuille</p><h2>{formatMoney(provider.walletBalance)}</h2></div><Button variant="secondary" onClick={() => setAction('topup')}><WalletCards size={17} />Crédit manuel</Button></div>{provider.transactions?.length ? <div className="compact-list">{provider.transactions.slice(0, 8).map((tx) => <div key={tx.id}><div><strong>{tx.description || tx.type}</strong><span>{formatDate(tx.createdAt)}</span></div><b>{formatMoney(tx.amount)}</b></div>)}</div> : <p className="muted">Aucune transaction récente.</p>}</Card><Card><div className="section-title"><div><p className="eyebrow">Profil métier</p><h2>Services et expérience</h2></div></div><p>{provider.description || 'Aucune description fournie.'}</p><div className="tag-list spacious">{provider.category?.map((item) => <span key={item}>{item}</span>)}</div>{provider.services?.map((service) => <div className="service-row" key={service.id}><div><strong>{service.name}</strong><span>{service.description}</span></div><b>{formatMoney(service.price)}</b></div>)}</Card></div></div>{action && <Modal title={action === 'approve' ? 'Approuver le prestataire' : action === 'reject' ? 'Refuser le dossier' : 'Créditer le portefeuille'} onClose={() => !busy && setAction(null)}><div className="modal-body">{actionError && <div className="alert alert-danger">{actionError}</div>}{action === 'approve' && <p>Cette action autorisera le prestataire à utiliser les fonctionnalités réservées aux comptes vérifiés et synchronisera ses deux statuts.</p>}{action === 'reject' && <p>Le motif sera envoyé au prestataire. Il pourra soumettre un nouveau dossier.</p>}{action === 'topup' && <label>Montant en DT<input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>}<label>{action === 'reject' ? 'Motif du refus' : action === 'topup' ? 'Description obligatoire' : 'Notes internes (facultatif)'}<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></label><div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={() => setAction(null)}>Annuler</Button><Button variant={action === 'reject' ? 'danger' : 'primary'} busy={busy} disabled={(action === 'reject' && notes.trim().length < 3) || (action === 'topup' && (!amount || !notes.trim()))} onClick={execute}>Confirmer</Button></div></div></Modal>}</>;
}

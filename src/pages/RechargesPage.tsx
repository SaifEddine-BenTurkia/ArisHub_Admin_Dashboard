import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, ReceiptText, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal, PageHeader, Pagination, StatusBadge } from '../components/ui';
import { api, queryString } from '../lib/api';
import { formatDate, formatMoney, getErrorMessage } from '../lib/format';
import type { Paginated, RechargeRequest } from '../types';

export function RechargesPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'PENDING';
  const page = Number(params.get('page') || 1);
  const [result, setResult] = useState<Paginated<RechargeRequest> | null>(null);
  const [selected, setSelected] = useState<RechargeRequest | null>(null);
  const [decision, setDecision] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => { setError(''); setResult(null); try { setResult(await api(`/admin/recharge-requests${queryString({ status: status || undefined, page, limit: 20 })}`)); } catch (e) { setError(getErrorMessage(e)); } }, [page, status]);
  useEffect(() => { void load(); }, [load]);
  function update(key: string, value: string) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); setParams(next); }
  async function review() {
    if (!selected || decision === null) return; setBusy(true); setError('');
    try { await api(`/admin/recharge-requests/${selected.id}/review`, { method: 'PATCH', body: JSON.stringify({ approve: decision, reason: reason.trim() || undefined }) }); setSelected(null); setDecision(null); setReason(''); await load(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }

  return <><PageHeader title="Demandes de recharge" subtitle="Une recharge ne crédite le portefeuille qu’après validation administrative." /><Card className="toolbar"><div className="segmented">{['PENDING', 'APPROVED', 'REJECTED', ''].map((item) => <button key={item || 'ALL'} className={status === item ? 'active' : ''} onClick={() => update('status', item)}>{item === 'PENDING' ? 'En attente' : item === 'APPROVED' ? 'Approuvées' : item === 'REJECTED' ? 'Refusées' : 'Toutes'}</button>)}</div></Card>{error && !result ? <ErrorState message={error} retry={load} /> : !result ? <LoadingState /> : result.data.length === 0 ? <EmptyState title="Aucune demande" /> : <div className="recharge-grid">{result.data.map((item) => { const proof = item.receiptUrl || item.proofImage; return <Card key={item.id} className="recharge-card"><div className="recharge-head"><span className="action-icon"><ReceiptText /></span><StatusBadge status={item.status} /></div><div><p className="eyebrow">{item.paymentReference}</p><h2>{formatMoney(item.amount)}</h2><strong>{item.provider.fullName}</strong><p>{item.provider.phoneNumber}</p></div><dl><div><dt>Solde actuel</dt><dd>{formatMoney(item.provider.walletBalance)}</dd></div><div><dt>Demandée le</dt><dd>{formatDate(item.createdAt)}</dd></div></dl>{proof && <a className="button button-secondary" href={proof} target="_blank" rel="noreferrer"><ExternalLink size={16} />Voir le justificatif</a>}{item.status === 'PENDING' && <div className="split-actions"><Button onClick={() => { setSelected(item); setDecision(true); }}><Check size={16} />Approuver</Button><Button variant="danger" onClick={() => { setSelected(item); setDecision(false); }}><X size={16} />Refuser</Button></div>}{item.rejectionReason && <div className="alert alert-danger">{item.rejectionReason}</div>}</Card>; })}</div>}{result && <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPage={(next) => update('page', String(next))} />}{selected && decision !== null && <Modal title={decision ? 'Approuver la recharge' : 'Refuser la recharge'} onClose={() => !busy && setSelected(null)}><div className="modal-body"><p>{decision ? `${formatMoney(selected.amount)} seront ajoutés au portefeuille de ${selected.provider.fullName}. Cette opération ne pourra pas être rejouée.` : `Expliquez pourquoi la demande de ${selected.provider.fullName} est refusée.`}</p>{error && <div className="alert alert-danger">{error}</div>}<label>{decision ? 'Note facultative' : 'Motif obligatoire'}<textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} /></label><div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Annuler</Button><Button variant={decision ? 'primary' : 'danger'} busy={busy} disabled={!decision && reason.trim().length < 3} onClick={review}>Confirmer</Button></div></div></Modal>}</>;
}

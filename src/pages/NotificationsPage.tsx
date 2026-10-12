import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Smartphone, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card, Modal, PageHeader, SearchInput } from '../components/ui';
import { ApiError, api, queryString } from '../lib/api';
import { formatNumber, getErrorMessage } from '../lib/format';
import type { AudiencePreview, NotificationAudience, NotificationDelivery, NotificationRecipient, ProviderStatusFilter } from '../types';

const TITLE_MAX = 100;
const BODY_MAX = 1000;

const AUDIENCES: Array<{ value: NotificationAudience; label: string }> = [
  { value: 'all', label: 'Tout le monde' },
  { value: 'clients', label: 'Clients' },
  { value: 'providers', label: 'Prestataires' },
];

const PROVIDER_STATUSES: Array<{ value: ProviderStatusFilter; label: string }> = [
  { value: 'approved', label: 'Prestataires approuvés' },
  { value: 'pending', label: 'Prestataires pas encore approuvés' },
  { value: 'all', label: 'Tous les prestataires' },
];

const plural = (count: number, one: string, many: string) => `${formatNumber(count)} ${count > 1 ? many : one}`;

export function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'user' ? 'user' : 'broadcast';

  return <>
    <PageHeader title="Notifications" subtitle="Envoyez une notification sur le téléphone des utilisateurs. Elle s’affiche aussi dans la liste des notifications de l’application." />
    <Card className="toolbar"><div className="segmented">
      <button className={mode === 'broadcast' ? 'active' : ''} onClick={() => setParams({})}>À un groupe</button>
      <button className={mode === 'user' ? 'active' : ''} onClick={() => setParams({ mode: 'user' })}>À une personne</button>
    </div></Card>
    {mode === 'broadcast' ? <BroadcastForm /> : <PersonForm />}
  </>;
}

function BroadcastForm() {
  const [audience, setAudience] = useState<NotificationAudience>('all');
  const [providerStatus, setProviderStatus] = useState<ProviderStatusFilter>('approved');
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<NotificationDelivery | null>(null);
  const latest = useRef(0);

  const withProviders = audience !== 'clients';
  const filters = { audience, providerStatus: withProviders ? providerStatus : undefined };

  const loadPreview = useCallback(async () => {
    // Switching filters quickly must not show the count of an older choice.
    const request = ++latest.current;
    setPreview(null); setPreviewError('');
    try {
      const next = await api<AudiencePreview>(`/admin/notifications/audience${queryString({ audience, providerStatus: withProviders ? providerStatus : undefined })}`);
      if (request === latest.current) setPreview(next);
    } catch (e) { if (request === latest.current) setPreviewError(getErrorMessage(e)); }
  }, [audience, providerStatus, withProviders]);
  useEffect(() => { void loadPreview(); }, [loadPreview]);

  const ready = title.trim() !== '' && body.trim() !== '' && (preview?.users ?? 0) > 0;

  async function send() {
    setBusy(true); setError('');
    try {
      setResult(await api<NotificationDelivery>('/admin/notifications/broadcast', { method: 'POST', body: JSON.stringify({ ...filters, title: title.trim(), body: body.trim() }) }));
      setTitle(''); setBody('');
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409
        ? 'Cette notification a déjà été envoyée à ces destinataires il y a moins de 10 minutes. Elle n’a pas été renvoyée.'
        : getErrorMessage(e));
    } finally { setBusy(false); setConfirming(false); }
  }

  return <div className="notify-grid">
    <Card>
      <div className="section-title"><div><p className="eyebrow">Étape 1</p><h2>Qui reçoit la notification ?</h2></div><Users /></div>
      <div className="segmented">{AUDIENCES.map((item) => <button key={item.value} type="button" className={audience === item.value ? 'active' : ''} onClick={() => setAudience(item.value)}>{item.label}</button>)}</div>
      {withProviders && <label className="form-field">Quels prestataires ?<select value={providerStatus} onChange={(e) => setProviderStatus(e.target.value as ProviderStatusFilter)}>{PROVIDER_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
      <AudienceSummary preview={preview} error={previewError} retry={loadPreview} />

      <div className="section-title form-step"><div><p className="eyebrow">Étape 2</p><h2>Le message</h2></div><Send /></div>
      <MessageFields title={title} body={body} onTitle={setTitle} onBody={setBody} />
      {error && <div className="alert alert-danger form-alert">{error}</div>}
      {result && <DeliveryAlert delivery={result} />}
      <div className="form-actions"><Button disabled={!ready} onClick={() => { setResult(null); setConfirming(true); }}><Send size={16} />{preview?.users ? `Envoyer à ${plural(preview.users, 'personne', 'personnes')}` : 'Envoyer'}</Button></div>
    </Card>
    <div className="notify-side"><PhonePreview title={title} body={body} /></div>

    {confirming && preview && <Modal title="Confirmer l’envoi" onClose={() => !busy && setConfirming(false)}><div className="modal-body">
      <p>Cette notification va partir maintenant vers <strong>{plural(preview.users, 'personne', 'personnes')}</strong> ({describeAudience(preview, audience, providerStatus)}). Un envoi ne peut pas être annulé.</p>
      <PhonePreview title={title} body={body} />
      <div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>Annuler</Button><Button busy={busy} onClick={send}>Envoyer maintenant</Button></div>
    </div></Modal>}
  </div>;
}

function describeAudience(preview: AudiencePreview, audience: NotificationAudience, providerStatus: ProviderStatusFilter) {
  const providers = plural(preview.providers, 'prestataire', 'prestataires')
    + (providerStatus === 'approved' ? (preview.providers > 1 ? ' approuvés' : ' approuvé') : providerStatus === 'pending' ? ' pas encore approuvé' + (preview.providers > 1 ? 's' : '') : '');
  const clients = plural(preview.clients, 'client', 'clients');
  return audience === 'clients' ? clients : audience === 'providers' ? providers : `${clients} et ${providers}`;
}

function AudienceSummary({ preview, error, retry }: { preview: AudiencePreview | null; error: string; retry(): void }) {
  if (error) return <div className="audience-box audience-error"><span>Impossible de compter les destinataires : {error}</span><Button variant="secondary" onClick={retry}>Réessayer</Button></div>;
  if (!preview) return <div className="audience-box"><span className="muted-line">Calcul des destinataires…</span></div>;
  if (preview.users === 0) return <div className="audience-box"><strong>Personne</strong><span>Aucun compte ne correspond à ce choix.</span></div>;
  const without = preview.users - preview.withDevice;
  return <div className="audience-box">
    <strong>{plural(preview.users, 'personne', 'personnes')}</strong>
    <span><Smartphone size={14} /> {plural(preview.withDevice, 'a', 'ont')} un téléphone enregistré : la notification y sonnera.</span>
    {without > 0 && <span>{plural(without, 'autre la verra', 'autres la verront')} seulement en ouvrant l’application.</span>}
  </div>;
}

function PersonForm() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<NotificationRecipient[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [person, setPerson] = useState<NotificationRecipient | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<NotificationDelivery | null>(null);

  async function find(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    if (term.length < 2) { setSearchError('Tapez au moins 2 caractères.'); return; }
    setSearching(true); setSearchError('');
    try { setResults((await api<{ data: NotificationRecipient[] }>(`/admin/notifications/recipients${queryString({ search: term })}`)).data); }
    catch (e) { setSearchError(getErrorMessage(e)); }
    finally { setSearching(false); }
  }

  async function send() {
    if (!person) return;
    setBusy(true); setError('');
    try {
      setResult(await api<NotificationDelivery>('/admin/notifications/send', { method: 'POST', body: JSON.stringify({ userId: person.id, userType: person.type, title: title.trim(), body: body.trim() }) }));
      setTitle(''); setBody('');
    } catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }

  const ready = person !== null && title.trim() !== '' && body.trim() !== '';

  return <div className="notify-grid">
    <Card>
      <div className="section-title"><div><p className="eyebrow">Étape 1</p><h2>Trouver la personne</h2></div><Users /></div>
      <form className="search-submit" onSubmit={find}><SearchInput value={search} onChange={setSearch} placeholder="Nom, téléphone ou e-mail" /><button type="submit" disabled={searching}>{searching ? 'Recherche…' : 'Rechercher'}</button></form>
      {searchError && <div className="alert alert-danger form-alert">{searchError}</div>}
      {results && (results.length === 0
        ? <p className="muted-line search-empty">Aucune personne trouvée. Vérifiez l’orthographe du nom ou le numéro de téléphone.</p>
        : <div className="recipient-list">{results.map((item) => <RecipientOption key={`${item.type}:${item.id}`} person={item} selected={person?.id === item.id && person.type === item.type} onSelect={() => { setPerson(item); setResult(null); setError(''); }} />)}</div>)}

      <div className="section-title form-step"><div><p className="eyebrow">Étape 2</p><h2>Le message</h2></div><Send /></div>
      {person
        ? <div className="audience-box"><strong>À : {person.fullName}</strong><span>{person.type === 'provider' ? 'Prestataire' : 'Client'} · {person.phoneNumber}</span>
          {person.devices === 0 && <span>Pas de téléphone enregistré : la notification ne sonnera pas. Elle apparaîtra dans l’application à sa prochaine ouverture.</span>}</div>
        : <div className="audience-box"><span className="muted-line">Choisissez d’abord une personne dans les résultats.</span></div>}
      <MessageFields title={title} body={body} onTitle={setTitle} onBody={setBody} />
      {error && <div className="alert alert-danger form-alert">{error}</div>}
      {result && <DeliveryAlert delivery={result} />}
      <div className="form-actions"><Button busy={busy} disabled={!ready} onClick={send}><Send size={16} />{person ? `Envoyer à ${person.fullName}` : 'Envoyer'}</Button></div>
    </Card>
    <div className="notify-side"><PhonePreview title={title} body={body} /></div>
  </div>;
}

function RecipientOption({ person, selected, onSelect }: { person: NotificationRecipient; selected: boolean; onSelect(): void }) {
  const provider = person.type === 'provider';
  return <button type="button" className={`recipient-option ${selected ? 'selected' : ''}`} onClick={onSelect}>
    <Avatar name={person.fullName} src={person.profileImage} />
    <div><strong>{person.fullName}</strong><span>{person.phoneNumber}</span></div>
    <div className="recipient-meta">
      <span className="badge-row"><Badge tone={provider ? 'info' : 'neutral'}>{provider ? 'Prestataire' : 'Client'}</Badge>{provider && person.isApproved === false && <Badge tone="warning">Non approuvé</Badge>}</span>
      <span><Smartphone size={13} /> {person.devices ? plural(person.devices, 'téléphone', 'téléphones') : 'Aucun téléphone'}</span>
    </div>
  </button>;
}

function MessageFields({ title, body, onTitle, onBody }: { title: string; body: string; onTitle(value: string): void; onBody(value: string): void }) {
  return <>
    <label className="form-field">Titre<input value={title} maxLength={TITLE_MAX} onChange={(e) => onTitle(e.target.value)} placeholder="Ex. : Orpex arrive à Sfax" /><span className="field-meta"><span>Court : environ 40 caractères restent visibles sur l’écran verrouillé.</span><span>{title.length}/{TITLE_MAX}</span></span></label>
    <label className="form-field">Message<textarea rows={5} value={body} maxLength={BODY_MAX} onChange={(e) => onBody(e.target.value)} placeholder="Ce que la personne lira sous le titre." /><span className="field-meta"><span>Les 2 premières lignes s’affichent avant d’ouvrir la notification.</span><span>{body.length}/{BODY_MAX}</span></span></label>
  </>;
}

function PhonePreview({ title, body }: { title: string; body: string }) {
  return <div className="phone-preview" aria-label="Aperçu sur le téléphone">
    <p className="phone-caption">Aperçu sur le téléphone</p>
    <div className="push-card">
      <span className="push-icon">O</span>
      <div><div className="push-head"><span>Orpex</span><span>maintenant</span></div>
        <strong>{title.trim() || 'Titre de la notification'}</strong>
        <p>{body.trim() || 'Le message apparaît ici.'}</p></div>
    </div>
  </div>;
}

function DeliveryAlert({ delivery }: { delivery: NotificationDelivery }) {
  const saved = plural(delivery.recipients, 'personne', 'personnes');
  if (!delivery.pushEnabled) {
    return <div className="alert alert-warning form-alert"><div><strong>Enregistrée pour {saved}, mais aucun téléphone n’a sonné.</strong><p>Les notifications push ne sont pas configurées sur le serveur. Elle apparaît seulement dans l’application.</p></div></div>;
  }
  const without = delivery.recipients - delivery.recipientsWithDevice;
  return <div className="alert alert-success form-alert"><div>
    <strong>Envoyée à {saved}.</strong>
    <p>{plural(delivery.devicesReached, 'téléphone l’a reçue', 'téléphones l’ont reçue')}{delivery.devicesFailed > 0 && `, ${plural(delivery.devicesFailed, 'en échec', 'en échec')}`}.
      {without > 0 && ` ${plural(without, 'personne sans téléphone enregistré la verra', 'personnes sans téléphone enregistré la verront')} dans l’application.`}</p>
  </div></div>;
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle, Search, X } from 'lucide-react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Button({ children, variant = 'primary', busy, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; busy?: boolean }) {
  return <button className={`button button-${variant}`} disabled={busy || props.disabled} {...props}>{busy && <LoaderCircle size={16} className="spin" />}{children}</button>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status?: string | boolean | null }) {
  const text = typeof status === 'boolean' ? (status ? 'Approuvé' : 'Non approuvé') : (status || 'Inconnu');
  const normalized = String(text).toUpperCase();
  const tone = ['APPROVED', 'COMPLETED', 'TRUE', 'APPROUVÉ'].includes(normalized) ? 'success'
    : ['PENDING', 'OPEN', 'IN_PROGRESS', 'EN ATTENTE'].includes(normalized) ? 'warning'
    : ['REJECTED', 'CANCELLED', 'FALSE', 'REFUSÉ'].includes(normalized) ? 'danger' : 'neutral';
  return <Badge tone={tone}>{text.replaceAll('_', ' ')}</Badge>;
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher…' }: { value: string; onChange(value: string): void; placeholder?: string }) {
  return <label className="search-input"><Search size={17} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />{value && <button type="button" aria-label="Effacer" onClick={() => onChange('')}><X size={15} /></button>}</label>;
}

export function LoadingState() { return <div className="state"><LoaderCircle className="spin" /><p>Chargement des données…</p></div>; }
export function EmptyState({ title = 'Aucun résultat', message = 'Aucune donnée ne correspond aux critères actuels.' }: { title?: string; message?: string }) { return <div className="state"><strong>{title}</strong><p>{message}</p></div>; }
export function ErrorState({ message, retry }: { message: string; retry?(): void }) { return <div className="state state-error"><strong>Impossible de charger cette section</strong><p>{message}</p>{retry && <Button variant="secondary" onClick={retry}>Réessayer</Button>}</div>; }

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage(page: number): void }) {
  if (totalPages <= 1) return null;
  return <div className="pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Précédent</Button><span>Page {page} sur {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Suivant</Button></div>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose(): void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fermer"><X /></button></div>{children}</div></div>;
}

export function Avatar({ name, src }: { name: string; src?: string | null }) {
  return src ? <img className="avatar" src={src} alt="" /> : <span className="avatar avatar-fallback">{name.split(/\s+/).slice(0, 2).map((v) => v[0]).join('').toUpperCase()}</span>;
}

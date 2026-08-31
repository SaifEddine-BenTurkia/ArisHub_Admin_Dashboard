export const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('fr-TN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

export const formatMoney = (value?: number | string | null) =>
  new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)) + ' DT';

export const initials = (name?: string) =>
  (name || '?').split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}

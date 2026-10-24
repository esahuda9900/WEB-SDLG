/** Mapping status database → tampilan web (keputusan M0). */

export type DisplayStatus =
  | 'Belum disubmit'
  | 'Sudah disubmit'
  | 'Diaudit SDLG'
  | 'Ditolak'
  | 'Arsip'

const BELUM = new Set([
  'Draft',
  'Ready to Claim',
  'Submitted to Warranty Admin',
])

const SUDAH = new Set(['Submitted to SDLG', 'Claimed to SDLG'])

const DIAUDIT = new Set([
  'SDLG Audit',
  'Approved',
  'Billing',
  'Paid',
  'Completed',
])

const DITOLAK = new Set(['Rejected', 'On Hold'])

/** Status DB yang boleh dipilih admin saat ubah status (urutan alur umum). */
export const EDITABLE_DB_STATUSES = [
  'Draft',
  'Ready to Claim',
  'Submitted to Warranty Admin',
  'Submitted to SDLG',
  'Claimed to SDLG',
  'SDLG Audit',
  'Approved',
  'Billing',
  'Paid',
  'Completed',
  'On Hold',
  'Rejected',
] as const

export type EditableDbStatus = (typeof EDITABLE_DB_STATUSES)[number]

export function toDisplayStatus(
  claimStatus: string | null | undefined,
  archivedAt: string | null | undefined,
): DisplayStatus {
  if (archivedAt) return 'Arsip'
  const s = claimStatus ?? ''
  if (BELUM.has(s)) return 'Belum disubmit'
  if (SUDAH.has(s)) return 'Sudah disubmit'
  if (DIAUDIT.has(s)) return 'Diaudit SDLG'
  if (DITOLAK.has(s)) return 'Ditolak'
  return 'Belum disubmit'
}

export function dbStatusesForDisplay(display: DisplayStatus): string[] | null {
  switch (display) {
    case 'Belum disubmit':
      return [...BELUM]
    case 'Sudah disubmit':
      return [...SUDAH]
    case 'Diaudit SDLG':
      return [...DIAUDIT]
    case 'Ditolak':
      return [...DITOLAK]
    case 'Arsip':
      return null
    default:
      return null
  }
}

export const DISPLAY_STATUS_OPTIONS: DisplayStatus[] = [
  'Belum disubmit',
  'Sudah disubmit',
  'Diaudit SDLG',
  'Ditolak',
]

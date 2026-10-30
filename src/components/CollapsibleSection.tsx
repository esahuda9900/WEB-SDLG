import { useState, useEffect, type ReactNode } from 'react'

type Props = {
  id: string
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

const STORAGE_KEY = 'sdlg-claim-detail-collapsed'

function readStored(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeStored(map: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

export default function CollapsibleSection({ id, title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(() => {
    const stored = readStored()
    if (id in stored) return stored[id]
    return defaultOpen
  })

  useEffect(() => {
    const stored = readStored()
    stored[id] = open
    writeStored(stored)
  }, [id, open])

  return (
    <section className={`collapsible ${open ? 'is-open' : 'is-closed'}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-icon" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  )
}

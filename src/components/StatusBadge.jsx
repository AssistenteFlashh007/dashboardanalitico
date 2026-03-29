import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function StatusBadge({ sources }) {
  if (!sources) return null

  const items = [
    { key: 'meta', label: 'Meta Ads' },
    { key: 'hubla', label: 'Hubla' },
    { key: 'pagtrust', label: 'Pagtrust' },
  ]

  return (
    <div className="flex items-center gap-3">
      {items.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          {sources[key] ? (
            <CheckCircle className="w-3.5 h-3.5 text-success" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-text-secondary" />
          )}
          <span className={`text-xs ${sources[key] ? 'text-text-primary' : 'text-text-secondary'}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

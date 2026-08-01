/**
 * ScheduleInput — toggle between "Publish now", "Save as draft", and "Schedule".
 *
 * Props:
 *   isPublished  — boolean
 *   scheduledAt  — ISO string or null
 *   onChange     — ({ isPublished, scheduledAt }) => void
 */
export default function ScheduleInput({ isPublished, scheduledAt, onChange }) {
  const mode = scheduledAt ? 'scheduled' : isPublished ? 'published' : 'draft'

  const setMode = (m) => {
    if (m === 'published')  onChange({ isPublished: true,  scheduledAt: null })
    if (m === 'draft')      onChange({ isPublished: false, scheduledAt: null })
    if (m === 'scheduled')  onChange({ isPublished: false, scheduledAt: scheduledAt || toLocalISO(new Date(Date.now() + 60 * 60 * 1000)) })
  }

  const handleDateChange = (val) => {
    onChange({ isPublished: false, scheduledAt: val || null })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Publishing</p>

      {/* Mode selector */}
      <div className="flex gap-2">
        {[
          { id: 'draft',     label: 'Draft' },
          { id: 'published', label: 'Publish now' },
          { id: 'scheduled', label: 'Schedule' },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMode(opt.id)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border transition-colors
              ${mode === opt.id
                ? 'border-white text-white bg-neutral-800'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date/time picker — shown only when scheduled */}
      {mode === 'scheduled' && (
        <div>
          <label className="block text-[10px] text-neutral-500 mb-1">Publish date &amp; time</label>
          <input
            type="datetime-local"
            value={scheduledAt ? toLocalISO(new Date(scheduledAt)) : ''}
            onChange={e => handleDateChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            min={toLocalISO(new Date())}
            className="bg-[#0a0a0a] border border-neutral-800 text-sm text-white px-3 py-2 focus:outline-none focus:border-neutral-500 transition-colors"
          />
          {scheduledAt && (
            <p className="text-[10px] text-neutral-600 mt-1">
              Will publish {new Date(scheduledAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${
          mode === 'published' ? 'bg-green-400' :
          mode === 'scheduled' ? 'bg-yellow-400' : 'bg-neutral-600'
        }`} />
        <span className="text-[10px] text-neutral-500">
          {mode === 'published' ? 'Will be visible on the site immediately' :
           mode === 'scheduled' ? `Scheduled to auto-publish ${scheduledAt ? new Date(scheduledAt).toLocaleString() : ''}` :
           'Not visible on the site'}
        </span>
      </div>
    </div>
  )
}

// Convert a Date to a local datetime-local string value (YYYY-MM-DDTHH:mm)
function toLocalISO(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

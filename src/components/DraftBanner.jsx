/**
 * Shows a banner when a draft is available in localStorage.
 * Props:
 *   savedAt   — timestamp (ms) of when the draft was saved
 *   onRestore — called when user clicks "Restore"
 *   onDiscard — called when user clicks "Discard"
 */
export default function DraftBanner({ savedAt, onRestore, onDiscard }) {
  if (!savedAt) return null

  const when = new Date(savedAt)
  const label = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="mx-4 md:mx-8 mt-4 flex items-center justify-between gap-4 px-4 py-3 border border-yellow-900/60 bg-yellow-950/30 text-xs">
      <p className="text-yellow-400">
        Unsaved draft from <span className="font-medium">{label}</span> — restore it?
      </p>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onRestore}
          className="text-white font-medium hover:text-yellow-300 transition-colors"
        >
          Restore
        </button>
        <button
          onClick={onDiscard}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

/**
 * Mimics a Google search result snippet.
 * Props: title, description, slug, section ('blog' | 'projects' | custom string)
 */
export default function SeoPreview({ title, description, slug, section = 'blog' }) {
  if (!title && !description) return null
  const displayTitle = title || 'Page Title'
  const displayDesc  = description || 'Meta description will appear here.'
  const displayUrl   = `awradesigns.com › ${section} › ${slug || `${section}-slug`}`

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-4 rounded">
      <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">Google Preview</p>
      <p className="text-[13px] text-blue-400 truncate">{displayTitle}</p>
      <p className="text-[11px] text-green-600 truncate my-0.5">{displayUrl}</p>
      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{displayDesc}</p>
      <p className={`text-[10px] mt-2 ${displayDesc.length > 155 ? 'text-yellow-500' : 'text-neutral-700'}`}>
        {displayDesc.length}/155 chars {displayDesc.length > 155 ? '— too long, will be cut off' : ''}
      </p>
    </div>
  )
}

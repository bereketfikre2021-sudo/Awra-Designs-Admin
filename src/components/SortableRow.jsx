import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Wraps any row in a sortable drag handle.
 * Usage:
 *   <SortableRow id={item.id}>
 *     {row content}
 *   </SortableRow>
 */
export default function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="flex-shrink-0 w-5 flex flex-col items-center gap-0.5 py-1 text-neutral-700 hover:text-neutral-400 transition-colors cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <span className="w-3 h-px bg-current" />
        <span className="w-3 h-px bg-current" />
        <span className="w-3 h-px bg-current" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

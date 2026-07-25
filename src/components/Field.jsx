export default function Field({ label, required, error, children }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Input({ error, className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-neutral-900 border ${error ? 'border-red-700' : 'border-neutral-800'} text-sm text-white px-3 py-2 focus:border-neutral-600 transition-colors placeholder-neutral-600 ${className}`}
    />
  )
}

export function Textarea({ error, className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-neutral-900 border ${error ? 'border-red-700' : 'border-neutral-800'} text-sm text-white px-3 py-2 focus:border-neutral-600 transition-colors placeholder-neutral-600 resize-y ${className}`}
    />
  )
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-neutral-900 border ${error ? 'border-red-700' : 'border-neutral-800'} text-sm text-white px-3 py-2 focus:border-neutral-600 transition-colors ${className}`}
    >
      {children}
    </select>
  )
}

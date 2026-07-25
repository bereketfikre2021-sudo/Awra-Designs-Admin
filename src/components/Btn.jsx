export default function Btn({ children, onClick, type = 'button', variant = 'primary', disabled, className = '' }) {
  const base = 'px-4 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-white text-[#0a0a0a] hover:bg-neutral-200',
    secondary: 'border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white',
    danger:    'border border-red-800 text-red-400 hover:border-red-600 hover:text-red-300',
    ghost:     'text-neutral-500 hover:text-white',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

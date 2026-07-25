export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-900">
      <div>
        <h1 className="text-lg font-medium text-white">{title}</h1>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

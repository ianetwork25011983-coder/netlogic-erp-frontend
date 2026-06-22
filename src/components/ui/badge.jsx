import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-slate-700 text-slate-200',
  success: 'bg-green-500/15 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
  info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
}

export function Badge({ className, variant = 'default', children }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

import { cn } from '@/lib/utils'

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

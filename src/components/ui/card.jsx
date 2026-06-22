import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn('p-6 pb-2', className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }) {
  return <h3 className={cn('text-lg font-semibold text-slate-100', className)} {...props}>{children}</h3>
}

export function CardDescription({ className, children, ...props }) {
  return <p className={cn('text-sm text-slate-400', className)} {...props}>{children}</p>
}

export function CardContent({ className, children, ...props }) {
  return <div className={cn('p-6 pt-2', className)} {...props}>{children}</div>
}

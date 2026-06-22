import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  success: { icon: CheckCircle, cls: 'bg-green-500/10 border-green-500/30 text-green-400' },
  warning: { icon: AlertTriangle, cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  error: { icon: XCircle, cls: 'bg-red-500/10 border-red-500/30 text-red-400' },
  info: { icon: Info, cls: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
}

export function Alert({ variant = 'info', title, children, className }) {
  const { icon: Icon, cls } = variants[variant]
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', cls, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <p className="opacity-80">{children}</p>}
      </div>
    </div>
  )
}

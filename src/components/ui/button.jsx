import { cn } from '@/lib/utils'

export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-cyan-500 text-slate-900 hover:bg-cyan-400': variant === 'default',
          'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-500': variant === 'destructive',
          'border border-slate-700 bg-transparent hover:bg-slate-800': variant === 'outline',
          'h-10 px-4 py-2 text-sm': size === 'default',
          'h-8 px-3 text-xs': size === 'sm',
          'h-12 px-8 text-base': size === 'lg',
          'w-full': size === 'full',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

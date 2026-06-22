import { cn } from '@/lib/utils'

export function Table({ className, children }) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-slate-700/50">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead className="bg-slate-800/80 border-b border-slate-700/50">
      {children}
    </thead>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-slate-700/30">{children}</tbody>
}

export function Th({ className, children }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

export function Td({ className, children }) {
  return (
    <td className={cn('px-4 py-3 text-slate-300 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}

export function Tr({ className, children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn('bg-slate-800/20 hover:bg-slate-800/50 transition-colors', onClick && 'cursor-pointer', className)}
    >
      {children}
    </tr>
  )
}

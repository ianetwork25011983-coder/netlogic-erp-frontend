import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Construction className="w-10 h-10 text-slate-600" />
      <div className="text-center">
        <p className="text-slate-300 font-medium">{title}</p>
        <p className="text-slate-500 text-sm mt-1">Módulo en construcción</p>
      </div>
    </div>
  )
}

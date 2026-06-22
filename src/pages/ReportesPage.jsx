import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import api from '@/lib/api'

function ReporteCard({ title, description, icon: Icon, color, onDownload, loading }) {
  return (
    <Card className="hover:border-slate-600 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onDownload} disabled={loading}>
            <Download className="w-3.5 h-3.5 mr-1" />
            {loading ? 'Descargando...' : 'Excel'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

async function downloadExcel(url, filename) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Error al descargar')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`

  const [desde, setDesde] = useState(firstDay)
  const [hasta, setHasta] = useState(today)
  const [productoId, setProductoId] = useState('')
  const [depositoId, setDepositoId] = useState('')
  const [loading, setLoading] = useState({})
  const [error, setError] = useState('')

  const { data: productos } = useQuery({ queryKey: ['productos-list'], queryFn: () => api.get('/productos/?page_size=200').then(r => r.data.results || r.data) })
  const { data: depositos } = useQuery({ queryKey: ['depositos'], queryFn: () => api.get('/depositos/').then(r => r.data.results || r.data) })

  const dl = async (key, url, filename) => {
    setLoading(l => ({ ...l, [key]: true }))
    setError('')
    try { await downloadExcel(url, filename) }
    catch (e) { setError(`Error al descargar ${filename}: ${e.message}`) }
    finally { setLoading(l => ({ ...l, [key]: false })) }
  }

  const reportes = [
    {
      key: 'ventas', title: 'Reporte de ventas', icon: BarChart3, color: 'bg-green-500/10 text-green-400',
      description: `Detalle de documentos de venta del período`,
      url: `/reports/ventas/excel/?desde=${desde}&hasta=${hasta}`, file: `ventas_${desde}_${hasta}.xlsx`,
    },
    {
      key: 'compras', title: 'Reporte de compras', icon: FileSpreadsheet, color: 'bg-blue-500/10 text-blue-400',
      description: 'Detalle de órdenes de compra del período',
      url: `/reports/compras/excel/?desde=${desde}&hasta=${hasta}`, file: `compras_${desde}_${hasta}.xlsx`,
    },
    {
      key: 'rentabilidad', title: 'Rentabilidad por producto', icon: BarChart3, color: 'bg-cyan-500/10 text-cyan-400',
      description: 'Ventas, costo y margen por producto',
      url: `/reports/rentabilidad/excel/?desde=${desde}&hasta=${hasta}`, file: `rentabilidad_${desde}_${hasta}.xlsx`,
    },
    {
      key: 'clientes', title: 'Listado de clientes', icon: FileSpreadsheet, color: 'bg-purple-500/10 text-purple-400',
      description: 'Todos los clientes registrados',
      url: `/reports/clientes/excel/`, file: 'clientes.xlsx',
    },
    {
      key: 'proveedores', title: 'Listado de proveedores', icon: FileSpreadsheet, color: 'bg-yellow-500/10 text-yellow-400',
      description: 'Todos los proveedores registrados',
      url: `/reports/proveedores/excel/`, file: 'proveedores.xlsx',
    },
    {
      key: 'inv-val', title: 'Inventario valorizado', icon: FileSpreadsheet, color: 'bg-orange-500/10 text-orange-400',
      description: 'Stock actual valorizado por depósito',
      url: `/reports/inventario-valorizado/excel/${depositoId ? `?deposito=${depositoId}` : ''}`, file: 'inventario_valorizado.xlsx',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-slate-400 text-sm mt-0.5">Exportación de datos a Excel</p>
      </div>

      {/* Filtros de período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtros de período</CardTitle>
          <CardDescription>Se aplican a los reportes que requieren fecha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Desde</label>
              <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Hasta</label>
              <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Depósito (inv. valorizado)</label>
              <Select value={depositoId} onChange={e => setDepositoId(e.target.value)} className="w-48">
                <option value="">Todos los depósitos</option>
                {depositos?.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Grid de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportes.map(r => (
          <ReporteCard key={r.key} title={r.title} description={r.description} icon={r.icon} color={r.color}
            loading={loading[r.key]}
            onDownload={() => dl(r.key, `/api${r.url}`, r.file)} />
        ))}
      </div>

      {/* Kardex por producto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-cyan-400" />
            Kardex por producto
          </CardTitle>
          <CardDescription>Historial completo de movimientos de un producto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400 mb-1 block">Producto</label>
              <Select value={productoId} onChange={e => setProductoId(e.target.value)}>
                <option value="">Seleccionar producto</option>
                {productos?.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Depósito</label>
              <Select value={depositoId} onChange={e => setDepositoId(e.target.value)} className="w-44">
                <option value="">Todos</option>
                {depositos?.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </Select>
            </div>
            <Button
              disabled={!productoId || loading.kardex}
              onClick={() => dl('kardex', `/api/reports/kardex/excel/?producto=${productoId}${depositoId ? `&deposito=${depositoId}` : ''}`, 'kardex.xlsx')}
            >
              <Download className="w-4 h-4 mr-2" />
              {loading.kardex ? 'Descargando...' : 'Descargar Kardex'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

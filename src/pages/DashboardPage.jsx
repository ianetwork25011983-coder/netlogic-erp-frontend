import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, AlertTriangle, BarChart3, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import api from '@/lib/api'

function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'cyan' }) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value ?? '—'}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}% vs período anterior
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function fmt(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-PY', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function DashboardPage() {
  const today = new Date()
  const desde = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const hasta = today.toISOString().slice(0, 10)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', desde, hasta],
    queryFn: () => api.get(`/analytics/dashboard/?desde=${desde}&hasta=${hasta}`).then(r => r.data),
    retry: false,
  })

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => api.get('/ai-engine/alertas-preventivas/').then(r => r.data),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-slate-400 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No se pudo cargar el dashboard</p>
          <p className="text-slate-500 text-sm mt-1">
            {error.response?.data?.detail || 'Verificá que tengas una empresa asignada.'}
          </p>
        </div>
      </div>
    )
  }

  const ventas = data?.ventas_resumen
  const compras = data?.compras_resumen
  const rentabilidad = data?.rentabilidad
  const inventario = data?.inventario_resumen
  const comparativo = data?.ventas_comparativo

  const variacion = comparativo?.variacion_porcentual

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Ejecutivo</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Período: {desde} → {hasta}
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Ventas del mes"
          value={`₲ ${fmt(ventas?.total_ventas)}`}
          subtitle={`${fmt(ventas?.cantidad_facturas)} facturas · Ticket prom. ₲ ${fmt(ventas?.ticket_promedio)}`}
          icon={DollarSign}
          trend={variacion}
          color="cyan"
        />
        <StatCard
          title="Compras del mes"
          value={`₲ ${fmt(compras?.total_compras_pyg)}`}
          subtitle={`${fmt(compras?.cantidad_ordenes)} órdenes de compra`}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Margen bruto"
          value={rentabilidad ? `${fmt(rentabilidad.margen_porcentaje, 1)}%` : '—'}
          subtitle={`Utilidad ₲ ${fmt(rentabilidad?.margen_bruto)}`}
          icon={BarChart3}
          color="green"
        />
        <StatCard
          title="Inventario valorizado"
          value={`₲ ${fmt(inventario?.valor_total_inventario)}`}
          subtitle={`${fmt(inventario?.productos_bajo_minimo)} productos bajo mínimo`}
          icon={Package}
          color={inventario?.productos_bajo_minimo > 0 ? 'yellow' : 'cyan'}
        />
      </div>

      {/* Alertas preventivas */}
      {alertas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Alertas de inventario
            </CardTitle>
            <CardDescription>Situaciones que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Productos críticos', value: alertas.criticos?.length ?? 0, color: 'text-red-400' },
                { label: 'Bajo mínimo', value: alertas.bajo_minimo?.length ?? 0, color: 'text-yellow-400' },
                { label: 'Sobre stock', value: alertas.sobre_stock?.length ?? 0, color: 'text-blue-400' },
                { label: 'Rotación lenta', value: alertas.rotacion_lenta?.length ?? 0, color: 'text-slate-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top productos y clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProductos desde={desde} hasta={hasta} />
        <TopClientes desde={desde} hasta={hasta} />
      </div>
    </div>
  )
}

function TopProductos({ desde, hasta }) {
  const { data } = useQuery({
    queryKey: ['top-productos', desde, hasta],
    queryFn: () => api.get(`/analytics/ventas/top-productos/?desde=${desde}&hasta=${hasta}&limite=5`).then(r => r.data),
    retry: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-400" />
          Top 5 productos
        </CardTitle>
        <CardDescription>Por monto vendido este mes</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <div className="space-y-2">
            {data.map((p, i) => (
              <div key={p.producto__id || i} className="flex items-center gap-3">
                <span className="w-5 text-xs text-slate-500 font-mono">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{p.producto__nombre}</p>
                </div>
                <span className="text-sm font-medium text-cyan-400">
                  ₲ {Number(p.total).toLocaleString('es-PY')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Sin datos para el período.</p>
        )}
      </CardContent>
    </Card>
  )
}

function TopClientes({ desde, hasta }) {
  const { data } = useQuery({
    queryKey: ['top-clientes', desde, hasta],
    queryFn: () => api.get(`/analytics/ventas/top-clientes/?desde=${desde}&hasta=${hasta}&limite=5`).then(r => r.data),
    retry: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Top 5 clientes
        </CardTitle>
        <CardDescription>Por monto comprado este mes</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <div className="space-y-2">
            {data.map((c, i) => (
              <div key={c.cliente__id || i} className="flex items-center gap-3">
                <span className="w-5 text-xs text-slate-500 font-mono">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">
                    {c.cliente__nombre_comercial || c.cliente__razon_social}
                  </p>
                </div>
                <span className="text-sm font-medium text-cyan-400">
                  ₲ {Number(c.total).toLocaleString('es-PY')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Sin datos para el período.</p>
        )}
      </CardContent>
    </Card>
  )
}

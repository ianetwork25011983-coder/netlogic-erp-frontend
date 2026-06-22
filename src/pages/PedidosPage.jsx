import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Eye, CheckCircle, XCircle, ShoppingBag, FileText, Truck, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/table'
import api from '@/lib/api'

const ESTADO_BADGE = {
  PENDIENTE: 'warning', VALIDADO: 'info', APROBADO: 'success',
  RECHAZADO: 'danger', EN_PICKING: 'purple', FACTURADO: 'success',
  DESPACHADO: 'info', ENTREGADO: 'success', CANCELADO: 'danger',
}

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente', VALIDADO: 'Validado', APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado', EN_PICKING: 'En Picking', FACTURADO: 'Facturado',
  DESPACHADO: 'Despachado', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
}

// Flujo de estados: PENDIENTE → VALIDADO → APROBADO → EN_PICKING → FACTURADO → DESPACHADO → ENTREGADO
const ACCIONES_POR_ESTADO = {
  VALIDADO: [{ label: 'Aprobar', action: 'aprobar', variant: 'default', icon: CheckCircle }],
  APROBADO: [
    { label: 'En Picking', action: 'en-picking', variant: 'secondary', icon: Package },
    { label: 'Rechazar', action: 'rechazar', variant: 'destructive', icon: XCircle },
  ],
  EN_PICKING: [{ label: 'Facturar', action: 'facturar', variant: 'default', icon: FileText }],
  FACTURADO: [{ label: 'Despachar', action: 'despachar', variant: 'secondary', icon: Truck }],
  DESPACHADO: [{ label: 'Entregar', action: 'entregar', variant: 'default', icon: CheckCircle }],
}

function NuevoPedidoForm({ onSave, onCancel }) {
  const [clienteId, setClienteId] = useState('')
  const [cuponCodigo, setCuponCodigo] = useState('')
  const [items, setItems] = useState([{ producto: '', cantidad: '1' }])
  const [error, setError] = useState('')

  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api.get('/clientes/').then(r => r.data.results || r.data) })
  const { data: productos } = useQuery({ queryKey: ['productos-list'], queryFn: () => api.get('/productos/?page_size=200').then(r => r.data.results || r.data) })

  const addItem = () => setItems(i => [...i, { producto: '', cantidad: '1' }])
  const setItem = (idx, k, v) => setItems(i => i.map((it, j) => j === idx ? { ...it, [k]: v } : it))
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!clienteId) return setError('Seleccioná un cliente.')
    const itemsValidos = items.filter(i => i.producto && Number(i.cantidad) > 0)
    if (!itemsValidos.length) return setError('Agregá al menos un producto con cantidad.')
    const body = {
      cliente: clienteId,
      items: itemsValidos.map(i => ({ producto: i.producto, cantidad: i.cantidad })),
    }
    if (cuponCodigo.trim()) body.cupon_codigo = cuponCodigo.trim()
    try { await onSave(body) }
    catch (err) { setError(err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(' ') || 'Error al crear el pedido.') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Cliente *</label>
        <Select value={clienteId} onChange={e => setClienteId(e.target.value)} required>
          <option value="">Seleccionar cliente</option>
          {clientes?.map(c => <option key={c.id} value={c.id}>{c.nombre_comercial || c.razon_social}</option>)}
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Productos *</label>
          <button type="button" onClick={addItem} className="text-xs text-cyan-400 hover:text-cyan-300">+ Agregar producto</button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_90px_28px] gap-2 items-center">
              <Select value={item.producto} onChange={e => setItem(idx, 'producto', e.target.value)}>
                <option value="">Seleccionar producto</option>
                {productos?.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
              </Select>
              <Input
                type="number"
                value={item.cantidad}
                onChange={e => setItem(idx, 'cantidad', e.target.value)}
                placeholder="Cant."
                min="0.0001"
                step="0.0001"
              />
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Cupón de descuento (opcional)</label>
        <Input value={cuponCodigo} onChange={e => setCuponCodigo(e.target.value)} placeholder="Código de cupón" />
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      <Alert variant="info">
        Al crear el pedido se valida el stock disponible y se genera una reserva automática.
      </Alert>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Crear pedido</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function DetallePedido({ pedido, onAccion, loadingAccion }) {
  if (!pedido) return null
  const acciones = ACCIONES_POR_ESTADO[pedido.estado] || []

  return (
    <div className="space-y-4">
      {/* Info principal */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{pedido.cliente_nombre || pedido.cliente}</span></div>
        <div><span className="text-slate-400">Estado:</span> <Badge variant={ESTADO_BADGE[pedido.estado]} className="ml-2">{ESTADO_LABEL[pedido.estado]}</Badge></div>
        <div><span className="text-slate-400">Total:</span> <span className="text-cyan-400 font-bold ml-2">₲ {Number(pedido.total || 0).toLocaleString('es-PY')}</span></div>
        <div><span className="text-slate-400">Prioridad:</span> <Badge variant={pedido.prioridad === 'ALTA' ? 'danger' : pedido.prioridad === 'MEDIA' ? 'warning' : 'default'} className="ml-2">{pedido.prioridad || 'NORMAL'}</Badge></div>
        {pedido.fecha_pedido && <div><span className="text-slate-400">Fecha:</span> <span className="text-white ml-2">{new Date(pedido.fecha_pedido).toLocaleDateString('es-PY')}</span></div>}
        {pedido.descuento_cupon > 0 && <div><span className="text-slate-400">Descuento cupón:</span> <span className="text-green-400 ml-2">-₲ {Number(pedido.descuento_cupon).toLocaleString('es-PY')}</span></div>}
      </div>

      {/* Items */}
      <Table>
        <Thead><tr><Th>Producto</Th><Th>Cantidad</Th><Th>Precio</Th><Th>Subtotal</Th></tr></Thead>
        <Tbody>
          {pedido.items?.map(item => (
            <Tr key={item.id}>
              <Td className="text-white">{item.producto_nombre || item.producto}</Td>
              <Td>{Number(item.cantidad).toLocaleString('es-PY')}</Td>
              <Td>₲ {Number(item.precio_unitario || 0).toLocaleString('es-PY')}</Td>
              <Td className="text-cyan-400">₲ {Number(item.subtotal || 0).toLocaleString('es-PY')}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Historial de estados */}
      {pedido.historial_estados?.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Historial de estados</p>
          <div className="space-y-1.5">
            {pedido.historial_estados.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <Badge variant={ESTADO_BADGE[h.estado_nuevo] || 'default'}>{ESTADO_LABEL[h.estado_nuevo]}</Badge>
                <span className="text-slate-400">{new Date(h.fecha).toLocaleString('es-PY')}</span>
                {h.notas && <span className="text-slate-500">— {h.notas}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      {acciones.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-slate-700/50">
          {acciones.map(({ label, action, variant, icon: Icon }) => (
            <Button key={action} variant={variant} onClick={() => onAccion(pedido.id, action)} disabled={loadingAccion}>
              <Icon className="w-4 h-4 mr-1.5" />{label}
            </Button>
          ))}
          {['PENDIENTE', 'VALIDADO', 'APROBADO'].includes(pedido.estado) && (
            <Button variant="outline" onClick={() => onAccion(pedido.id, 'cancelar')} disabled={loadingAccion}>
              <XCircle className="w-4 h-4 mr-1.5" />Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PedidosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null)
  const [pedidoSelId, setPedidoSelId] = useState(null)
  const [loadingAccion, setLoadingAccion] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['pedidos', search, filtroEstado],
    queryFn: () => api.get(`/orders/pedidos/?search=${search}&estado=${filtroEstado}&ordering=-fecha_pedido`).then(r => r.data),
  })

  const { data: pedidoDetalle, refetch: refetchDetalle } = useQuery({
    queryKey: ['pedido-detalle', pedidoSelId],
    queryFn: () => api.get(`/orders/pedidos/${pedidoSelId}/`).then(r => r.data),
    enabled: !!pedidoSelId,
  })

  const crear = useMutation({
    mutationFn: b => api.post('/orders/pedidos/crear/', b),
    onSuccess: () => { qc.invalidateQueries(['pedidos']); setModal(null) },
  })

  const ejecutarAccion = async (id, accion) => {
    setLoadingAccion(true)
    try {
      await api.post(`/orders/pedidos/${id}/${accion}/`)
      qc.invalidateQueries(['pedidos'])
      refetchDetalle()
    } catch (err) {
      alert(err.response?.data?.detail || `Error al ejecutar: ${accion}`)
    } finally {
      setLoadingAccion(false)
    }
  }

  const pedidos = data?.results ?? data ?? []

  // Contadores por estado
  const contadores = pedidos.reduce((acc, p) => { acc[p.estado] = (acc[p.estado] || 0) + 1; return acc }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos de Venta</h1>
          <p className="text-slate-400 text-sm">Flujo completo: carrito → validación → aprobación → despacho → entrega</p>
        </div>
        <Button onClick={() => setModal('crear')}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo pedido
        </Button>
      </div>

      {/* Contadores rápidos */}
      {!isLoading && pedidos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(contadores).map(([estado, count]) => (
            <button key={estado} onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filtroEstado === estado ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              <Badge variant={ESTADO_BADGE[estado]}>{estado}</Badge>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      <Card><CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input className="pl-10" placeholder="Buscar pedidos..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="w-44">
            <option value="">Todos los estados</option>
            {Object.keys(ESTADO_LABEL).map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
          </Select>
        </div>
      </CardContent></Card>

      {isLoading ? <PageLoader /> : error ? (
        <Alert variant="error">{error.response?.data?.detail || 'Error al cargar pedidos.'}</Alert>
      ) : (
        <Table>
          <Thead><tr>
            <Th>#</Th><Th>Cliente</Th><Th>Fecha</Th><Th>Total</Th><Th>Prioridad</Th><Th>Estado</Th><Th>Acciones</Th>
          </tr></Thead>
          <Tbody>
            {pedidos.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={7}>
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                Sin pedidos registrados
              </Td></Tr>
            ) : pedidos.map(p => (
              <Tr key={p.id}>
                <Td className="font-mono text-cyan-400">#{p.id}</Td>
                <Td className="font-medium text-white">{p.cliente_nombre || p.cliente}</Td>
                <Td className="text-xs">{p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-PY') : '—'}</Td>
                <Td className="font-medium">₲ {Number(p.total || 0).toLocaleString('es-PY')}</Td>
                <Td>
                  {p.prioridad && <Badge variant={p.prioridad === 'ALTA' ? 'danger' : p.prioridad === 'MEDIA' ? 'warning' : 'default'}>{p.prioridad}</Badge>}
                </Td>
                <Td><Badge variant={ESTADO_BADGE[p.estado] || 'default'}>{ESTADO_LABEL[p.estado] || p.estado}</Badge></Td>
                <Td>
                  <button
                    onClick={() => setPedidoSelId(p.id === pedidoSelId ? null : p.id)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Ver detalle y acciones"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Panel de detalle inline */}
      {pedidoSelId && pedidoDetalle && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Pedido #{pedidoDetalle.id}</h3>
              <button onClick={() => setPedidoSelId(null)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <DetallePedido pedido={pedidoDetalle} onAccion={ejecutarAccion} loadingAccion={loadingAccion} />
          </CardContent>
        </Card>
      )}

      <Modal open={modal === 'crear'} onClose={() => setModal(null)} title="Nuevo pedido de venta" className="max-w-xl">
        <NuevoPedidoForm onSave={b => crear.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  )
}

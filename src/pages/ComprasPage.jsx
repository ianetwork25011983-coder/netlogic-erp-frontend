import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Eye, CheckCircle, Truck } from 'lucide-react'
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

const ESTADO_BADGE = { BORRADOR: 'default', ENVIADA: 'info', PARCIALMENTE_RECIBIDA: 'warning', RECIBIDA: 'success', ANULADA: 'danger' }

function OrdenForm({ onSave, onCancel }) {
  const [proveedor, setProveedor] = useState('')
  const [moneda, setMoneda] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState([{ producto: '', cantidad: '', precio_unitario: '' }])
  const [error, setError] = useState('')

  const { data: proveedores } = useQuery({ queryKey: ['proveedores'], queryFn: () => api.get('/proveedores/').then(r => r.data.results || r.data) })
  const { data: monedas } = useQuery({ queryKey: ['monedas'], queryFn: () => api.get('/currencies/currencies/').then(r => r.data.results || r.data) })
  const { data: productos } = useQuery({ queryKey: ['productos-list'], queryFn: () => api.get('/productos/?page_size=200').then(r => r.data.results || r.data) })

  const addItem = () => setItems(i => [...i, { producto: '', cantidad: '', precio_unitario: '' }])
  const setItem = (idx, k, v) => setItems(i => i.map((it, j) => j === idx ? { ...it, [k]: v } : it))
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!proveedor) return setError('Seleccioná un proveedor.')
    if (!moneda) return setError('Seleccioná una moneda.')
    const body = { proveedor, moneda, notas, items: items.filter(i => i.producto && i.cantidad) }
    if (!body.items.length) return setError('Agregá al menos un ítem.')
    try { await onSave(body) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error al guardar.') }
  }

  const total = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio_unitario) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Proveedor *</label>
          <Select value={proveedor} onChange={e => setProveedor(e.target.value)} required>
            <option value="">Seleccionar</option>
            {proveedores?.map(p => <option key={p.id} value={p.id}>{p.razon_social || p.nombre_comercial}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Moneda *</label>
          <Select value={moneda} onChange={e => setMoneda(e.target.value)} required>
            <option value="">Seleccionar</option>
            {monedas?.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Ítems *</label>
          <button type="button" onClick={addItem} className="text-xs text-cyan-400 hover:text-cyan-300">+ Agregar ítem</button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_100px_120px_32px] gap-2 items-center">
              <Select value={item.producto} onChange={e => setItem(idx, 'producto', e.target.value)}>
                <option value="">Producto</option>
                {productos?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
              <Input type="number" value={item.cantidad} onChange={e => setItem(idx, 'cantidad', e.target.value)} placeholder="Cant." min="0.0001" step="0.0001" />
              <Input type="number" value={item.precio_unitario} onChange={e => setItem(idx, 'precio_unitario', e.target.value)} placeholder="Precio" min="0" />
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
        {total > 0 && <p className="text-right text-sm text-cyan-400 mt-2 font-medium">Total: {Number(total).toLocaleString('es-PY')}</p>}
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Notas</label>
        <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones" />
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Crear orden</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function RecepcionForm({ orden, onSave, onCancel }) {
  const [items, setItems] = useState(
    orden.items?.map(i => ({ item_orden: i.id, cantidad_recibida: i.cantidad_pendiente || i.cantidad })) || []
  )
  const [deposito, setDeposito] = useState('')
  const [error, setError] = useState('')

  const { data: depositos } = useQuery({ queryKey: ['depositos'], queryFn: () => api.get('/depositos/').then(r => r.data.results || r.data) })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!deposito) return setError('Seleccioná un depósito.')
    try { await onSave({ orden: orden.id, deposito, items: items.filter(i => Number(i.cantidad_recibida) > 0) }) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error.') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Depósito destino *</label>
        <Select value={deposito} onChange={e => setDeposito(e.target.value)} required>
          <option value="">Seleccionar</option>
          {depositos?.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const orig = orden.items?.[idx]
          return (
            <div key={idx} className="grid grid-cols-[1fr_120px] gap-2 items-center">
              <span className="text-sm text-slate-300">{orig?.producto_nombre || `Ítem ${idx + 1}`}</span>
              <Input type="number" value={item.cantidad_recibida} onChange={e => setItems(items.map((it, j) => j === idx ? { ...it, cantidad_recibida: e.target.value } : it))} placeholder="Cant." min="0" step="0.0001" />
            </div>
          )
        })}
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Confirmar recepción</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function ComprasPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['ordenes-compra', search],
    queryFn: () => api.get(`/purchases/ordenes/?search=${search}&ordering=-created_at`).then(r => r.data),
  })

  const { data: ordenDetalle } = useQuery({
    queryKey: ['orden-detalle', modal?.id],
    queryFn: () => api.get(`/purchases/ordenes/${modal.id}/`).then(r => r.data),
    enabled: !!modal?.id,
  })

  const crear = useMutation({
    mutationFn: b => api.post('/purchases/ordenes/', b),
    onSuccess: () => { qc.invalidateQueries(['ordenes-compra']); setModal(null) },
  })

  const recibir = useMutation({
    mutationFn: b => api.post('/purchases/ordenes/recibir/', b),
    onSuccess: () => { qc.invalidateQueries(['ordenes-compra']); setModal(null) },
  })

  const ordenes = data?.results ?? data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compras</h1>
          <p className="text-slate-400 text-sm">Órdenes de compra y recepciones</p>
        </div>
        <Button onClick={() => setModal({ type: 'crear' })}>
          <Plus className="w-4 h-4 mr-2" /> Nueva orden
        </Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input className="pl-10" placeholder="Buscar órdenes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      {isLoading ? <PageLoader /> : error ? (
        <Alert variant="error">{error.response?.data?.detail || 'Error al cargar.'}</Alert>
      ) : (
        <Table>
          <Thead><tr>
            <Th>N°</Th><Th>Proveedor</Th><Th>Fecha</Th><Th>Moneda</Th><Th>Total</Th><Th>Estado</Th><Th>Acciones</Th>
          </tr></Thead>
          <Tbody>
            {ordenes.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={7}>Sin órdenes de compra</Td></Tr>
            ) : ordenes.map(o => (
              <Tr key={o.id}>
                <Td className="font-mono text-cyan-400">#{o.id}</Td>
                <Td className="font-medium text-white">{o.proveedor_nombre || o.proveedor}</Td>
                <Td className="text-xs">{new Date(o.created_at || o.fecha).toLocaleDateString('es-PY')}</Td>
                <Td>{o.moneda_code || o.moneda}</Td>
                <Td className="font-medium">{Number(o.total || 0).toLocaleString('es-PY')}</Td>
                <Td><Badge variant={ESTADO_BADGE[o.estado] || 'default'}>{o.estado}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ type: 'ver', id: o.id })} className="text-slate-400 hover:text-cyan-400 transition-colors" title="Ver detalle"><Eye className="w-4 h-4" /></button>
                    {(o.estado === 'ENVIADA' || o.estado === 'PARCIALMENTE_RECIBIDA') && (
                      <button onClick={() => setModal({ type: 'recibir', id: o.id })} className="text-slate-400 hover:text-green-400 transition-colors" title="Recibir"><Truck className="w-4 h-4" /></button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal?.type === 'crear'} onClose={() => setModal(null)} title="Nueva orden de compra" className="max-w-2xl">
        <OrdenForm onSave={b => crear.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>

      <Modal open={modal?.type === 'recibir' && !!ordenDetalle} onClose={() => setModal(null)} title="Recepción de mercadería">
        {ordenDetalle && <RecepcionForm orden={ordenDetalle} onSave={b => recibir.mutateAsync(b)} onCancel={() => setModal(null)} />}
      </Modal>

      <Modal open={modal?.type === 'ver' && !!ordenDetalle} onClose={() => setModal(null)} title={`Orden #${ordenDetalle?.id}`} className="max-w-2xl">
        {ordenDetalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">Proveedor:</span> <span className="text-white ml-2">{ordenDetalle.proveedor_nombre}</span></div>
              <div><span className="text-slate-400">Estado:</span> <Badge variant={ESTADO_BADGE[ordenDetalle.estado]} className="ml-2">{ordenDetalle.estado}</Badge></div>
              <div><span className="text-slate-400">Moneda:</span> <span className="text-white ml-2">{ordenDetalle.moneda_code}</span></div>
              <div><span className="text-slate-400">Total:</span> <span className="text-cyan-400 font-bold ml-2">{Number(ordenDetalle.total || 0).toLocaleString('es-PY')}</span></div>
            </div>
            <Table>
              <Thead><tr><Th>Producto</Th><Th>Cantidad</Th><Th>Precio unit.</Th><Th>Subtotal</Th></tr></Thead>
              <Tbody>
                {ordenDetalle.items?.map(i => (
                  <Tr key={i.id}>
                    <Td className="text-white">{i.producto_nombre || i.producto}</Td>
                    <Td>{Number(i.cantidad).toLocaleString('es-PY')}</Td>
                    <Td>{Number(i.precio_unitario).toLocaleString('es-PY')}</Td>
                    <Td className="text-cyan-400">{Number(i.subtotal || i.cantidad * i.precio_unitario).toLocaleString('es-PY')}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Modal>
    </div>
  )
}

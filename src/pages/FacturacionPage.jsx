import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Eye, XCircle, FileText } from 'lucide-react'
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

const ESTADO_BADGE = { EMITIDA: 'success', ANULADA: 'danger', PENDIENTE: 'warning', PAGADA: 'info' }
const TIPO_BADGE = { FACTURA: 'success', NOTA_CREDITO: 'warning', NOTA_DEBITO: 'info', PRESUPUESTO: 'purple', REMISION: 'default' }

function DocumentoForm({ onSave, onCancel }) {
  const [tipo, setTipo] = useState('FACTURA')
  const [clienteId, setClienteId] = useState('')
  const [monedaId, setMonedaId] = useState('')
  const [condicion, setCondicion] = useState('CONTADO')
  const [puntoVenta, setPuntoVenta] = useState('')
  const [descuento, setDescuento] = useState('0')
  const [items, setItems] = useState([{ producto: '', descripcion: '', cantidad: '1', precio_unitario: '', descuento_porcentaje: '0' }])
  const [error, setError] = useState('')

  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api.get('/clientes/').then(r => r.data.results || r.data) })
  const { data: monedas } = useQuery({ queryKey: ['monedas'], queryFn: () => api.get('/currencies/currencies/').then(r => r.data.results || r.data) })
  const { data: productos } = useQuery({ queryKey: ['productos-list'], queryFn: () => api.get('/productos/?page_size=200').then(r => r.data.results || r.data) })
  const { data: puntosVenta } = useQuery({ queryKey: ['puntos-venta'], queryFn: () => api.get('/puntos-venta/').then(r => r.data.results || r.data) })

  const addItem = () => setItems(i => [...i, { producto: '', descripcion: '', cantidad: '1', precio_unitario: '', descuento_porcentaje: '0' }])
  const setItem = (idx, k, v) => setItems(i => i.map((it, j) => j === idx ? { ...it, [k]: v } : it))
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))
  const totalItems = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio_unitario) * (1 - Number(i.descuento_porcentaje || 0) / 100) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!clienteId) return setError('Seleccioná un cliente.')
    if (!monedaId) return setError('Seleccioná una moneda.')
    const body = {
      tipo_documento: tipo, cliente: clienteId, moneda: monedaId,
      condicion_venta: condicion, punto_venta: puntoVenta || undefined,
      descuento_global: descuento,
      afecta_inventario: ['FACTURA', 'REMISION'].includes(tipo),
      items: items.filter(i => i.descripcion || i.producto).map(i => ({
        producto: i.producto || undefined, descripcion: i.descripcion,
        cantidad: i.cantidad, precio_unitario: i.precio_unitario,
        descuento_porcentaje: i.descuento_porcentaje || '0',
      })),
    }
    if (!body.items.length) return setError('Agregá al menos un ítem.')
    try { await onSave(body) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error al emitir.') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tipo de documento</label>
          <Select value={tipo} onChange={e => setTipo(e.target.value)}>
            {['FACTURA','PRESUPUESTO','NOTA_CREDITO','NOTA_DEBITO','REMISION'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Condición de venta</label>
          <Select value={condicion} onChange={e => setCondicion(e.target.value)}>
            <option value="CONTADO">Contado</option>
            <option value="CREDITO">Crédito</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Cliente *</label>
          <Select value={clienteId} onChange={e => setClienteId(e.target.value)} required>
            <option value="">Seleccionar cliente</option>
            {clientes?.map(c => <option key={c.id} value={c.id}>{c.nombre_comercial || c.razon_social}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Moneda *</label>
          <Select value={monedaId} onChange={e => setMonedaId(e.target.value)} required>
            <option value="">Seleccionar moneda</option>
            {monedas?.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Punto de venta</label>
        <Select value={puntoVenta} onChange={e => setPuntoVenta(e.target.value)}>
          <option value="">Sin punto de venta</option>
          {puntosVenta?.map(pv => <option key={pv.id} value={pv.id}>{pv.nombre} ({pv.numero})</option>)}
        </Select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Ítems *</label>
          <button type="button" onClick={addItem} className="text-xs text-cyan-400 hover:text-cyan-300">+ Agregar ítem</button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_110px_80px_28px] gap-2 items-center">
              <div className="space-y-1">
                <Select value={item.producto} onChange={e => { const p = productos?.find(pr => String(pr.id) === e.target.value); setItem(idx, 'producto', e.target.value); if (p) { setItem(idx, 'descripcion', p.nombre); setItem(idx, 'precio_unitario', p.precio_venta || '') } }}>
                  <option value="">Producto (opc.)</option>
                  {productos?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </Select>
                <Input value={item.descripcion} onChange={e => setItem(idx, 'descripcion', e.target.value)} placeholder="Descripción" />
              </div>
              <Input type="number" value={item.cantidad} onChange={e => setItem(idx, 'cantidad', e.target.value)} placeholder="Cant." min="0.0001" step="0.0001" />
              <Input type="number" value={item.precio_unitario} onChange={e => setItem(idx, 'precio_unitario', e.target.value)} placeholder="Precio" min="0" />
              <Input type="number" value={item.descuento_porcentaje} onChange={e => setItem(idx, 'descuento_porcentaje', e.target.value)} placeholder="Desc%" min="0" max="100" />
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Descuento global:</label>
            <Input type="number" value={descuento} onChange={e => setDescuento(e.target.value)} className="w-24 h-7 text-xs" min="0" />
          </div>
          {totalItems > 0 && <p className="text-sm text-cyan-400 font-medium">Total: {Number(totalItems - Number(descuento)).toLocaleString('es-PY')}</p>}
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Emitir documento</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function FacturacionPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modal, setModal] = useState(null)
  const [docDetalle, setDocDetalle] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['documentos', search, filtroTipo],
    queryFn: () => api.get(`/billing/documentos/?search=${search}&tipo_documento=${filtroTipo}&ordering=-fecha_emision`).then(r => r.data),
  })

  const emitir = useMutation({
    mutationFn: b => api.post('/billing/documentos/emitir/', b),
    onSuccess: () => { qc.invalidateQueries(['documentos']); setModal(null) },
  })

  const anular = useMutation({
    mutationFn: ({ id, motivo }) => api.post(`/billing/documentos/${id}/anular/`, { motivo }),
    onSuccess: () => { qc.invalidateQueries(['documentos']); setModal(null) },
  })

  const documentos = data?.results ?? data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturación</h1>
          <p className="text-slate-400 text-sm">Facturas, presupuestos, notas de crédito y débito</p>
        </div>
        <Button onClick={() => setModal('crear')}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo documento
        </Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input className="pl-10" placeholder="Buscar documentos..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="w-48">
            <option value="">Todos los tipos</option>
            {['FACTURA','PRESUPUESTO','NOTA_CREDITO','NOTA_DEBITO','REMISION'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </Select>
        </div>
      </CardContent></Card>

      {isLoading ? <PageLoader /> : error ? (
        <Alert variant="error">{error.response?.data?.detail || 'Error al cargar.'}</Alert>
      ) : (
        <Table>
          <Thead><tr>
            <Th>N°</Th><Th>Tipo</Th><Th>Cliente</Th><Th>Fecha</Th><Th>Total</Th><Th>Moneda</Th><Th>Estado</Th><Th>Acciones</Th>
          </tr></Thead>
          <Tbody>
            {documentos.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={8}>Sin documentos</Td></Tr>
            ) : documentos.map(d => (
              <Tr key={d.id}>
                <Td className="font-mono text-cyan-400">{d.numero || `#${d.id}`}</Td>
                <Td><Badge variant={TIPO_BADGE[d.tipo_documento] || 'default'}>{d.tipo_documento?.replace('_',' ')}</Badge></Td>
                <Td className="font-medium text-white">{d.cliente_nombre || d.cliente}</Td>
                <Td className="text-xs">{d.fecha_emision ? new Date(d.fecha_emision).toLocaleDateString('es-PY') : '—'}</Td>
                <Td className="font-medium">{Number(d.total || 0).toLocaleString('es-PY')}</Td>
                <Td>{d.moneda_code || d.moneda}</Td>
                <Td><Badge variant={ESTADO_BADGE[d.estado] || 'default'}>{d.estado}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setDocDetalle(d)} className="text-slate-400 hover:text-cyan-400 transition-colors" title="Ver"><Eye className="w-4 h-4" /></button>
                    {d.estado === 'EMITIDA' && (
                      <button onClick={() => setModal({ type: 'anular', id: d.id })} className="text-slate-400 hover:text-red-400 transition-colors" title="Anular"><XCircle className="w-4 h-4" /></button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal === 'crear'} onClose={() => setModal(null)} title="Emitir documento" className="max-w-3xl">
        <DocumentoForm onSave={b => emitir.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>

      <Modal open={!!docDetalle} onClose={() => setDocDetalle(null)} title={`Documento ${docDetalle?.numero || '#' + docDetalle?.id}`} className="max-w-2xl">
        {docDetalle && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-400">Tipo:</span> <Badge variant={TIPO_BADGE[docDetalle.tipo_documento]} className="ml-2">{docDetalle.tipo_documento?.replace('_',' ')}</Badge></div>
              <div><span className="text-slate-400">Estado:</span> <Badge variant={ESTADO_BADGE[docDetalle.estado]} className="ml-2">{docDetalle.estado}</Badge></div>
              <div><span className="text-slate-400">Cliente:</span> <span className="text-white ml-2">{docDetalle.cliente_nombre}</span></div>
              <div><span className="text-slate-400">Fecha:</span> <span className="text-white ml-2">{docDetalle.fecha_emision ? new Date(docDetalle.fecha_emision).toLocaleDateString('es-PY') : '—'}</span></div>
              <div><span className="text-slate-400">Total:</span> <span className="text-cyan-400 font-bold ml-2">{Number(docDetalle.total || 0).toLocaleString('es-PY')} {docDetalle.moneda_code}</span></div>
              <div><span className="text-slate-400">Saldo pendiente:</span> <span className="text-yellow-400 ml-2">{Number(docDetalle.saldo_pendiente || 0).toLocaleString('es-PY')}</span></div>
            </div>
            <Table>
              <Thead><tr><Th>Descripción</Th><Th>Cant.</Th><Th>Precio</Th><Th>IVA</Th><Th>Total línea</Th></tr></Thead>
              <Tbody>
                {docDetalle.items?.map(i => (
                  <Tr key={i.id}>
                    <Td className="text-white">{i.descripcion}</Td>
                    <Td>{Number(i.cantidad).toLocaleString('es-PY')}</Td>
                    <Td>{Number(i.precio_unitario).toLocaleString('es-PY')}</Td>
                    <Td>{Number(i.impuesto_linea || 0).toLocaleString('es-PY')}</Td>
                    <Td className="text-cyan-400">{Number(i.total_linea || 0).toLocaleString('es-PY')}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Modal>

      <Modal open={modal?.type === 'anular'} onClose={() => setModal(null)} title="Anular documento">
        <AnularForm id={modal?.id} onSave={({ motivo }) => anular.mutateAsync({ id: modal.id, motivo })} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  )
}

function AnularForm({ onSave, onCancel }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!motivo.trim()) return setError('Ingresá el motivo de anulación.')
    try { await onSave({ motivo }) }
    catch (err) { setError(err.response?.data?.detail || 'Error al anular.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert variant="warning" title="Atención">Esta acción no se puede deshacer. Si el documento afectaba inventario, se generará el movimiento inverso automáticamente.</Alert>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Motivo de anulación *</label>
        <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Describa el motivo" required />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" className="flex-1">Anular documento</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

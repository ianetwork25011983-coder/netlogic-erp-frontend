import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Truck, Package, CheckCircle, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/table'
import api from '@/lib/api'

const ESTADO_BADGE = { PENDIENTE: 'warning', EN_PROCESO: 'info', COMPLETADA: 'success', DESPACHADO: 'purple', ENTREGADO: 'success', FALLIDO: 'danger' }

function IniciarPickingForm({ onSave, onCancel }) {
  const [pedidoId, setPedidoId] = useState('')
  const [error, setError] = useState('')
  const { data: pedidos } = useQuery({ queryKey: ['pedidos-en-picking'], queryFn: () => api.get('/orders/pedidos/?estado=EN_PICKING').then(r => r.data.results || r.data) })
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pedidoId) return setError('Seleccioná un pedido.')
    try { await onSave({ pedido: pedidoId }) }
    catch (err) { setError(err.response?.data?.detail || 'Error.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Pedido en picking *</label>
        <Select value={pedidoId} onChange={e => setPedidoId(e.target.value)} required>
          <option value="">Seleccionar pedido</option>
          {pedidos?.map(p => <option key={p.id} value={p.id}>Pedido #{p.id} — {p.cliente_nombre || p.cliente}</option>)}
        </Select>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Iniciar picking</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function DespachoForm({ onSave, onCancel }) {
  const [docIds, setDocIds] = useState('')
  const [transportistaId, setTransportistaId] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [error, setError] = useState('')
  const { data: transportistas } = useQuery({ queryKey: ['transportistas'], queryFn: () => api.get('/logistics/transportistas/').then(r => r.data.results || r.data) })
  const { data: vehiculos } = useQuery({ queryKey: ['vehiculos'], queryFn: () => api.get('/logistics/vehiculos/').then(r => r.data.results || r.data) })
  const handleSubmit = async (e) => {
    e.preventDefault()
    const ids = docIds.split(',').map(s => s.trim()).filter(Boolean).map(Number)
    if (!ids.length) return setError('Ingresá al menos un ID de documento de venta.')
    try { await onSave({ documentos_venta: ids, transportista: transportistaId || undefined, vehiculo: vehiculoId || undefined }) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">IDs de documentos de venta (separados por coma) *</label>
        <Input value={docIds} onChange={e => setDocIds(e.target.value)} placeholder="1, 2, 3" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Transportista</label>
          <Select value={transportistaId} onChange={e => setTransportistaId(e.target.value)}>
            <option value="">Sin transportista</option>
            {transportistas?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Vehículo</label>
          <Select value={vehiculoId} onChange={e => setVehiculoId(e.target.value)}>
            <option value="">Sin vehículo</option>
            {vehiculos?.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
          </Select>
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Crear despacho</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function LogisticaPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('pickings')
  const [modal, setModal] = useState(null)

  const { data: pickings, isLoading: loadPick } = useQuery({
    queryKey: ['pickings'],
    queryFn: () => api.get('/logistics/ordenes-picking/?ordering=-created_at').then(r => r.data),
    enabled: tab === 'pickings',
  })
  const { data: despachos, isLoading: loadDesp } = useQuery({
    queryKey: ['despachos'],
    queryFn: () => api.get('/logistics/despachos/?ordering=-fecha_despacho').then(r => r.data),
    enabled: tab === 'despachos',
  })

  const iniciarPicking = useMutation({ mutationFn: b => api.post('/logistics/picking/iniciar/', b), onSuccess: () => { qc.invalidateQueries(['pickings']); setModal(null) } })
  const completarPicking = useMutation({ mutationFn: id => api.post(`/logistics/picking/${id}/completar/`, { items: [] }), onSuccess: () => qc.invalidateQueries(['pickings']) })
  const crearDespacho = useMutation({ mutationFn: b => api.post('/logistics/despachos/crear/', b), onSuccess: () => { qc.invalidateQueries(['despachos']); setModal(null) } })
  const registrarEntrega = useMutation({ mutationFn: id => api.post(`/logistics/despacho-documentos/${id}/entrega/`, { entregado: true }), onSuccess: () => qc.invalidateQueries(['despachos']) })

  const pickingsList = pickings?.results ?? pickings ?? []
  const despachosList = despachos?.results ?? despachos ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Logística</h1>
          <p className="text-slate-400 text-sm">Picking, despachos y entregas</p>
        </div>
        <div className="flex gap-2">
          {tab === 'pickings' && <Button onClick={() => setModal('picking')}><Package className="w-4 h-4 mr-2" /> Iniciar picking</Button>}
          {tab === 'despachos' && <Button onClick={() => setModal('despacho')}><Truck className="w-4 h-4 mr-2" /> Crear despacho</Button>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50">
        {['pickings','despachos'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'pickings' ? 'Órdenes de picking' : 'Despachos'}
          </button>
        ))}
      </div>

      {tab === 'pickings' && (
        loadPick ? <PageLoader /> : (
          <Table>
            <Thead><tr><Th>#</Th><Th>Pedido</Th><Th>Fecha</Th><Th>Estado</Th><Th>Acciones</Th></tr></Thead>
            <Tbody>
              {pickingsList.length === 0 ? (
                <Tr><Td className="text-center text-slate-500 py-8" colSpan={5}>Sin órdenes de picking</Td></Tr>
              ) : pickingsList.map(p => (
                <Tr key={p.id}>
                  <Td className="font-mono text-cyan-400">#{p.id}</Td>
                  <Td className="text-white">Pedido #{p.pedido}</Td>
                  <Td className="text-xs">{new Date(p.created_at || p.fecha).toLocaleDateString('es-PY')}</Td>
                  <Td><Badge variant={ESTADO_BADGE[p.estado] || 'default'}>{p.estado}</Badge></Td>
                  <Td>
                    {p.estado === 'EN_PROCESO' && (
                      <button onClick={() => completarPicking.mutate(p.id)} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Completar
                      </button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      )}

      {tab === 'despachos' && (
        loadDesp ? <PageLoader /> : (
          <Table>
            <Thead><tr><Th>#</Th><Th>Fecha</Th><Th>Transportista</Th><Th>Documentos</Th><Th>Estado</Th><Th>Acciones</Th></tr></Thead>
            <Tbody>
              {despachosList.length === 0 ? (
                <Tr><Td className="text-center text-slate-500 py-8" colSpan={6}>Sin despachos</Td></Tr>
              ) : despachosList.map(d => (
                <Tr key={d.id}>
                  <Td className="font-mono text-cyan-400">#{d.id}</Td>
                  <Td className="text-xs">{d.fecha_despacho ? new Date(d.fecha_despacho).toLocaleDateString('es-PY') : '—'}</Td>
                  <Td>{d.transportista_nombre || '—'}</Td>
                  <Td>{d.documentos?.length ?? 0} doc(s)</Td>
                  <Td><Badge variant={ESTADO_BADGE[d.estado] || 'default'}>{d.estado || 'DESPACHADO'}</Badge></Td>
                  <Td>
                    {d.documentos?.filter(doc => !doc.fecha_entrega).map(doc => (
                      <button key={doc.id} onClick={() => registrarEntrega.mutate(doc.id)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Marcar entregado
                      </button>
                    ))}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      )}

      <Modal open={modal === 'picking'} onClose={() => setModal(null)} title="Iniciar picking">
        <IniciarPickingForm onSave={b => iniciarPicking.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'despacho'} onClose={() => setModal(null)} title="Crear despacho">
        <DespachoForm onSave={b => crearDespacho.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  )
}

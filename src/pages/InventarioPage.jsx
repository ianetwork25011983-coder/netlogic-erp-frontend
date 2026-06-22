import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Warehouse, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, SlidersHorizontal, Search, ClipboardList } from 'lucide-react'
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

const TIPO_BADGE = {
  ENTRADA: 'success', SALIDA: 'danger', TRANSFERENCIA: 'info', AJUSTE: 'warning',
}

function MovimientoForm({ tipo, onSave, onCancel }) {
  const [form, setForm] = useState({ cantidad: '', costo_unitario: '', motivo: '', notas: '' })
  const [productoId, setProductoId] = useState('')
  const [depositoId, setDepositoId] = useState('')
  const [depositoDestinoId, setDepositoDestinoId] = useState('')
  const [error, setError] = useState('')

  const { data: productos } = useQuery({ queryKey: ['productos-list'], queryFn: () => api.get('/productos/?page_size=200').then(r => r.data.results || r.data) })
  const { data: depositos } = useQuery({ queryKey: ['depositos'], queryFn: () => api.get('/depositos/').then(r => r.data.results || r.data) })
  const { data: monedas } = useQuery({ queryKey: ['monedas'], queryFn: () => api.get('/currencies/currencies/').then(r => r.data.results || r.data) })
  const [monedaId, setMonedaId] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const titulos = { entrada: 'Registrar entrada', salida: 'Registrar salida', transferencia: 'Transferencia', ajuste: 'Ajuste manual' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!productoId) return setError('Seleccioná un producto.')
    if (!depositoId) return setError('Seleccioná un depósito.')
    if (!form.cantidad || Number(form.cantidad) <= 0) return setError('La cantidad debe ser mayor a 0.')

    const body = {
      producto: productoId,
      deposito: depositoId,
      cantidad: form.cantidad,
      notas: form.notas,
    }
    if (tipo === 'entrada') { body.costo_unitario = form.costo_unitario; body.moneda = monedaId }
    if (tipo === 'transferencia') body.deposito_destino = depositoDestinoId
    if (tipo === 'ajuste') { body.motivo = form.motivo; body.costo_unitario = form.costo_unitario }

    try { await onSave(body) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error al registrar.') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Producto *</label>
        <Select value={productoId} onChange={e => setProductoId(e.target.value)} required>
          <option value="">Seleccionar producto</option>
          {productos?.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">{tipo === 'transferencia' ? 'Depósito origen *' : 'Depósito *'}</label>
        <Select value={depositoId} onChange={e => setDepositoId(e.target.value)} required>
          <option value="">Seleccionar depósito</option>
          {depositos?.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </Select>
      </div>
      {tipo === 'transferencia' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Depósito destino *</label>
          <Select value={depositoDestinoId} onChange={e => setDepositoDestinoId(e.target.value)} required>
            <option value="">Seleccionar destino</option>
            {depositos?.filter(d => d.id !== Number(depositoId)).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Cantidad *</label>
          <Input type="number" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="0" min="0.0001" step="0.0001" required />
        </div>
        {(tipo === 'entrada' || tipo === 'ajuste') && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Costo unitario</label>
            <Input type="number" value={form.costo_unitario} onChange={e => set('costo_unitario', e.target.value)} placeholder="0" min="0" />
          </div>
        )}
      </div>
      {tipo === 'entrada' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Moneda</label>
          <Select value={monedaId} onChange={e => setMonedaId(e.target.value)}>
            <option value="">Seleccionar moneda</option>
            {monedas?.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </Select>
        </div>
      )}
      {tipo === 'ajuste' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Motivo *</label>
          <Input value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Motivo del ajuste" required />
        </div>
      )}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Notas</label>
        <Input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones opcionales" />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Registrar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function InventarioPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('saldos')
  const [modal, setModal] = useState(null)
  const [searchProd, setSearchProd] = useState('')

  const { data: saldos, isLoading: loadSaldos } = useQuery({
    queryKey: ['saldos', searchProd],
    queryFn: () => api.get(`/inventory/saldos/?search=${searchProd}`).then(r => r.data),
    enabled: tab === 'saldos',
  })

  const { data: movimientos, isLoading: loadMov } = useQuery({
    queryKey: ['movimientos'],
    queryFn: () => api.get('/inventory/movimientos/?ordering=-fecha').then(r => r.data),
    enabled: tab === 'movimientos',
  })

  const registrar = (endpoint) => useMutation({
    mutationFn: (body) => api.post(`/inventory/movimientos/${endpoint}/`, body),
    onSuccess: () => { qc.invalidateQueries(['saldos']); qc.invalidateQueries(['movimientos']); setModal(null) },
  })

  const entrada = useMutation({ mutationFn: b => api.post('/inventory/movimientos/entrada/', b), onSuccess: () => { qc.invalidateQueries(['saldos']); qc.invalidateQueries(['movimientos']); setModal(null) } })
  const salida = useMutation({ mutationFn: b => api.post('/inventory/movimientos/salida/', b), onSuccess: () => { qc.invalidateQueries(['saldos']); qc.invalidateQueries(['movimientos']); setModal(null) } })
  const transferencia = useMutation({ mutationFn: b => api.post('/inventory/movimientos/transferencia/', b), onSuccess: () => { qc.invalidateQueries(['saldos']); qc.invalidateQueries(['movimientos']); setModal(null) } })
  const ajuste = useMutation({ mutationFn: b => api.post('/inventory/movimientos/ajuste/', b), onSuccess: () => { qc.invalidateQueries(['saldos']); qc.invalidateQueries(['movimientos']); setModal(null) } })

  const saldosList = saldos?.results ?? saldos ?? []
  const movsList = movimientos?.results ?? movimientos ?? []

  const tabs = [
    { key: 'saldos', label: 'Saldos actuales' },
    { key: 'movimientos', label: 'Movimientos' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="text-slate-400 text-sm mt-0.5">Saldos, movimientos y kardex</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setModal('entrada')} className="bg-green-600 hover:bg-green-500 text-white">
            <ArrowDownCircle className="w-4 h-4 mr-1" /> Entrada
          </Button>
          <Button onClick={() => setModal('salida')} variant="destructive">
            <ArrowUpCircle className="w-4 h-4 mr-1" /> Salida
          </Button>
          <Button onClick={() => setModal('transferencia')} variant="secondary">
            <ArrowLeftRight className="w-4 h-4 mr-1" /> Transferencia
          </Button>
          <Button onClick={() => setModal('ajuste')} variant="outline">
            <SlidersHorizontal className="w-4 h-4 mr-1" /> Ajuste
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'saldos' && (
        <>
          <Card><CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input className="pl-10" placeholder="Buscar producto..." value={searchProd} onChange={e => setSearchProd(e.target.value)} />
            </div>
          </CardContent></Card>
          {loadSaldos ? <PageLoader /> : (
            <Table>
              <Thead><tr>
                <Th>Producto</Th><Th>Depósito</Th><Th>Cantidad</Th><Th>Costo prom.</Th><Th>Valor total</Th>
              </tr></Thead>
              <Tbody>
                {saldosList.length === 0 ? (
                  <Tr><Td className="text-center text-slate-500 py-8" colSpan={5}>Sin saldos registrados</Td></Tr>
                ) : saldosList.map(s => (
                  <Tr key={s.id}>
                    <Td className="font-medium text-white">{s.producto_nombre || s.producto}</Td>
                    <Td>{s.deposito_nombre || s.deposito}</Td>
                    <Td className={Number(s.cantidad) <= 0 ? 'text-red-400 font-bold' : 'text-green-400 font-medium'}>
                      {Number(s.cantidad).toLocaleString('es-PY')}
                    </Td>
                    <Td>₲ {Number(s.costo_promedio || 0).toLocaleString('es-PY')}</Td>
                    <Td className="font-medium">₲ {(Number(s.cantidad) * Number(s.costo_promedio || 0)).toLocaleString('es-PY')}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </>
      )}

      {tab === 'movimientos' && (
        loadMov ? <PageLoader /> : (
          <Table>
            <Thead><tr>
              <Th>Fecha</Th><Th>Tipo</Th><Th>Producto</Th><Th>Depósito</Th><Th>Cantidad</Th><Th>Costo unit.</Th><Th>Notas</Th>
            </tr></Thead>
            <Tbody>
              {movsList.length === 0 ? (
                <Tr><Td className="text-center text-slate-500 py-8" colSpan={7}>Sin movimientos</Td></Tr>
              ) : movsList.map(m => (
                <Tr key={m.id}>
                  <Td className="text-xs">{new Date(m.fecha).toLocaleString('es-PY')}</Td>
                  <Td><Badge variant={TIPO_BADGE[m.tipo_movimiento] || 'default'}>{m.tipo_movimiento}</Badge></Td>
                  <Td className="font-medium text-white">{m.producto_nombre || m.producto}</Td>
                  <Td>{m.deposito_nombre || m.deposito}</Td>
                  <Td>{Number(m.cantidad).toLocaleString('es-PY')}</Td>
                  <Td>₲ {Number(m.costo_unitario_pyg || 0).toLocaleString('es-PY')}</Td>
                  <Td className="text-slate-400 text-xs max-w-xs truncate">{m.notas || '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      )}

      {['entrada','salida','transferencia','ajuste'].map(tipo => (
        <Modal key={tipo} open={modal === tipo} onClose={() => setModal(null)}
          title={{ entrada: 'Registrar entrada de stock', salida: 'Registrar salida de stock', transferencia: 'Transferencia entre depósitos', ajuste: 'Ajuste manual de stock' }[tipo]}>
          <MovimientoForm tipo={tipo}
            onSave={{ entrada: b => entrada.mutateAsync(b), salida: b => salida.mutateAsync(b), transferencia: b => transferencia.mutateAsync(b), ajuste: b => ajuste.mutateAsync(b) }[tipo]}
            onCancel={() => setModal(null)} />
        </Modal>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, ArrowDownCircle, ArrowUpCircle, Building } from 'lucide-react'
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

function AperturaCajaForm({ onSave, onCancel }) {
  const [cajaId, setCajaId] = useState('')
  const [montoInicial, setMontoInicial] = useState('0')
  const [error, setError] = useState('')
  const { data: cajas } = useQuery({ queryKey: ['cajas'], queryFn: () => api.get('/treasury/cajas/').then(r => r.data.results || r.data) })
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cajaId) return setError('Seleccioná una caja.')
    try { await onSave({ caja: cajaId, monto_inicial_efectivo: montoInicial }) }
    catch (err) { setError(err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(' ') || 'Error.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Caja *</label>
        <Select value={cajaId} onChange={e => setCajaId(e.target.value)} required>
          <option value="">Seleccionar caja</option>
          {cajas?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Efectivo inicial (PYG)</label>
        <Input type="number" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} min="0" />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Abrir caja</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function MovimientoForm({ tipo, onSave, onCancel }) {
  const [form, setForm] = useState({ monto: '', concepto: '', medio_pago: 'EFECTIVO', notas: '' })
  const [aperturaId, setAperturaId] = useState('')
  const [error, setError] = useState('')
  const { data: aperturas } = useQuery({ queryKey: ['aperturas-activas'], queryFn: () => api.get('/treasury/aperturas/?estado=ABIERTA').then(r => r.data.results || r.data) })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aperturaId) return setError('Seleccioná una apertura de caja.')
    if (!form.monto || Number(form.monto) <= 0) return setError('El monto debe ser mayor a 0.')
    try { await onSave({ apertura: aperturaId, tipo_movimiento: tipo, ...form }) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Apertura de caja *</label>
        <Select value={aperturaId} onChange={e => setAperturaId(e.target.value)} required>
          <option value="">Seleccionar caja abierta</option>
          {aperturas?.map(a => <option key={a.id} value={a.id}>{a.caja_nombre || `Caja #${a.caja}`} — Apertura #{a.id}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Monto (PYG) *</label>
          <Input type="number" value={form.monto} onChange={e => set('monto', e.target.value)} min="0" required />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Medio de pago</label>
          <Select value={form.medio_pago} onChange={e => set('medio_pago', e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option>
            <option value="TARJETA">Tarjeta</option>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Concepto</label>
        <Input value={form.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Descripción del movimiento" />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Registrar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function CobrarFacturaForm({ onSave, onCancel }) {
  const [facturaId, setFacturaId] = useState('')
  const [aperturaId, setAperturaId] = useState('')
  const [monto, setMonto] = useState('')
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [error, setError] = useState('')
  const { data: facturas } = useQuery({ queryKey: ['facturas-pendientes'], queryFn: () => api.get('/billing/documentos/?estado=EMITIDA&tipo_documento=FACTURA').then(r => r.data.results || r.data) })
  const { data: aperturas } = useQuery({ queryKey: ['aperturas-activas'], queryFn: () => api.get('/treasury/aperturas/?estado=ABIERTA').then(r => r.data.results || r.data) })
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!facturaId || !aperturaId || !monto) return setError('Completá todos los campos.')
    try { await onSave({ factura: facturaId, apertura: aperturaId, monto, medio_pago: medioPago }) }
    catch (err) { setError(err.response?.data?.detail || 'Error.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Factura *</label>
        <Select value={facturaId} onChange={e => { setFacturaId(e.target.value); const f = facturas?.find(f => String(f.id) === e.target.value); if (f) setMonto(f.saldo_pendiente || f.total) }}>
          <option value="">Seleccionar factura</option>
          {facturas?.map(f => <option key={f.id} value={f.id}>{f.numero || `#${f.id}`} — {f.cliente_nombre} — Saldo: ₲ {Number(f.saldo_pendiente || 0).toLocaleString('es-PY')}</option>)}
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Apertura de caja *</label>
        <Select value={aperturaId} onChange={e => setAperturaId(e.target.value)} required>
          <option value="">Seleccionar</option>
          {aperturas?.map(a => <option key={a.id} value={a.id}>{a.caja_nombre || `Caja #${a.caja}`}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Monto a cobrar *</label>
          <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="0" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Medio de pago</label>
          <Select value={medioPago} onChange={e => setMedioPago(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option><option value="TARJETA">Tarjeta</option>
          </Select>
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Registrar cobro</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function TesoreriaPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('cajas')
  const [modal, setModal] = useState(null)

  const { data: aperturas, isLoading } = useQuery({
    queryKey: ['aperturas'],
    queryFn: () => api.get('/treasury/aperturas/?ordering=-fecha_apertura').then(r => r.data),
    enabled: tab === 'cajas',
  })
  const { data: movBancarios } = useQuery({
    queryKey: ['mov-bancarios'],
    queryFn: () => api.get('/treasury/movimientos-bancarios/?ordering=-fecha').then(r => r.data),
    enabled: tab === 'banco',
  })

  const abrirCaja = useMutation({ mutationFn: b => api.post('/treasury/cajas/abrir/', b), onSuccess: () => { qc.invalidateQueries(['aperturas']); setModal(null) } })
  const cerrarCaja = useMutation({ mutationFn: ({ id, conteo }) => api.post(`/treasury/aperturas/${id}/cerrar/`, { monto_efectivo_contado: conteo }), onSuccess: () => { qc.invalidateQueries(['aperturas']) } })
  const registrarMov = useMutation({ mutationFn: b => api.post('/treasury/movimientos/registrar/', b), onSuccess: () => { qc.invalidateQueries(['aperturas']); setModal(null) } })
  const cobrarFactura = useMutation({ mutationFn: b => api.post('/treasury/movimientos/cobro-factura/', b), onSuccess: () => { qc.invalidateQueries(['aperturas']); setModal(null) } })

  const aperturasList = aperturas?.results ?? aperturas ?? []
  const movBanList = movBancarios?.results ?? movBancarios ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja y Tesorería</h1>
          <p className="text-slate-400 text-sm">Cajas, movimientos y cuentas bancarias</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setModal('abrir-caja')}><Plus className="w-4 h-4 mr-1" /> Abrir caja</Button>
          <Button variant="secondary" onClick={() => setModal('ingreso')}><ArrowDownCircle className="w-4 h-4 mr-1" /> Ingreso</Button>
          <Button variant="outline" onClick={() => setModal('egreso')}><ArrowUpCircle className="w-4 h-4 mr-1" /> Egreso</Button>
          <Button variant="secondary" onClick={() => setModal('cobro')}><DollarSign className="w-4 h-4 mr-1" /> Cobrar factura</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50">
        {['cajas','banco'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'cajas' ? 'Cajas registradoras' : 'Movimientos bancarios'}
          </button>
        ))}
      </div>

      {tab === 'cajas' && (
        isLoading ? <PageLoader /> : (
          <Table>
            <Thead><tr><Th>Caja</Th><Th>Apertura</Th><Th>Cierre</Th><Th>Saldo inicial</Th><Th>Estado</Th><Th>Acciones</Th></tr></Thead>
            <Tbody>
              {aperturasList.length === 0 ? (
                <Tr><Td className="text-center text-slate-500 py-8" colSpan={6}>Sin aperturas de caja</Td></Tr>
              ) : aperturasList.map(a => (
                <Tr key={a.id}>
                  <Td className="font-medium text-white">{a.caja_nombre || `Caja #${a.caja}`}</Td>
                  <Td className="text-xs">{new Date(a.fecha_apertura).toLocaleString('es-PY')}</Td>
                  <Td className="text-xs">{a.fecha_cierre ? new Date(a.fecha_cierre).toLocaleString('es-PY') : '—'}</Td>
                  <Td>₲ {Number(a.monto_inicial_efectivo || 0).toLocaleString('es-PY')}</Td>
                  <Td><Badge variant={a.estado === 'ABIERTA' ? 'success' : 'default'}>{a.estado}</Badge></Td>
                  <Td>
                    {a.estado === 'ABIERTA' && (
                      <button onClick={() => { const c = prompt('Monto efectivo contado:'); if (c) cerrarCaja.mutate({ id: a.id, conteo: c }) }}
                        className="text-xs text-yellow-400 hover:text-yellow-300">Cerrar caja</button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      )}

      {tab === 'banco' && (
        <Table>
          <Thead><tr><Th>Fecha</Th><Th>Cuenta</Th><Th>Tipo</Th><Th>Monto</Th><Th>Concepto</Th></tr></Thead>
          <Tbody>
            {movBanList.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={5}>Sin movimientos bancarios</Td></Tr>
            ) : movBanList.map(m => (
              <Tr key={m.id}>
                <Td className="text-xs">{new Date(m.fecha).toLocaleDateString('es-PY')}</Td>
                <Td>{m.cuenta_nombre || m.cuenta}</Td>
                <Td><Badge variant={m.tipo === 'DEPOSITO' ? 'success' : m.tipo === 'RETIRO' ? 'danger' : 'info'}>{m.tipo}</Badge></Td>
                <Td className="font-medium">₲ {Number(m.monto || 0).toLocaleString('es-PY')}</Td>
                <Td className="text-slate-400 text-xs">{m.concepto || '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal === 'abrir-caja'} onClose={() => setModal(null)} title="Abrir caja">
        <AperturaCajaForm onSave={b => abrirCaja.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'ingreso'} onClose={() => setModal(null)} title="Registrar ingreso">
        <MovimientoForm tipo="INGRESO" onSave={b => registrarMov.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'egreso'} onClose={() => setModal(null)} title="Registrar egreso">
        <MovimientoForm tipo="EGRESO" onSave={b => registrarMov.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'cobro'} onClose={() => setModal(null)} title="Cobrar factura">
        <CobrarFacturaForm onSave={b => cobrarFactura.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  )
}

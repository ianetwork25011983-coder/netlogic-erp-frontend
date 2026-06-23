import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'
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

const fmt = (n) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(n ?? 0)

// ── Abrir caja ────────────────────────────────────────────────────────────────
function AperturaCajaForm({ onSave, onCancel, pygId }) {
  const [cajaId, setCajaId] = useState('')
  const [montoInicial, setMontoInicial] = useState('0')
  const [error, setError] = useState('')

  const { data: cajas = [] } = useQuery({
    queryKey: ['cajas'],
    queryFn: () => api.get('/treasury/cajas/').then(r => r.data.results ?? r.data),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cajaId) return setError('Seleccioná una caja.')
    if (!pygId) return setError('No se encontró la moneda PYG en el sistema.')
    try {
      await onSave({
        caja_id: Number(cajaId),
        monto_inicial: Number(montoInicial),
        moneda_id: pygId,
      })
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail ?? Object.values(data ?? {}).flat().join(' ') ?? 'Error al abrir caja.'
      setError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Caja</label>
        <Select value={cajaId} onChange={e => setCajaId(e.target.value)} required>
          <option value="">Seleccionar caja</option>
          {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.codigo}</option>)}
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Efectivo inicial (Gs.)</label>
        <Input type="number" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} min="0" />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">Abrir caja</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

// ── Registrar movimiento (ingreso/egreso) ─────────────────────────────────────
function MovimientoForm({ tipo, onSave, onCancel, pygId }) {
  const [aperturaId, setAperturaId] = useState('')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('OTRO')
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')

  const { data: aperturas = [] } = useQuery({
    queryKey: ['aperturas-activas'],
    queryFn: () => api.get('/treasury/aperturas/', { params: { estado: 'ABIERTA' } }).then(r => r.data.results ?? r.data),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aperturaId) return setError('Seleccioná una apertura de caja.')
    if (!monto || Number(monto) <= 0) return setError('El monto debe ser mayor a 0.')
    try {
      await onSave({
        apertura_caja_id: Number(aperturaId),
        tipo,
        concepto,
        medio_pago: medioPago,
        monto: Number(monto),
        moneda_id: pygId,
        observaciones,
      })
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail ?? Object.values(data ?? {}).flat().join(' ') ?? 'Error.')
    }
  }

  const CONCEPTOS = tipo === 'INGRESO'
    ? [['COBRO_FACTURA', 'Cobro de factura'], ['OTRO', 'Otro ingreso']]
    : [['GASTO', 'Gasto'], ['RETIRO', 'Retiro'], ['DEPOSITO_BANCO', 'Depósito a banco'], ['PAGO_PROVEEDOR', 'Pago a proveedor'], ['OTRO', 'Otro egreso']]

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Apertura de caja</label>
        <Select value={aperturaId} onChange={e => setAperturaId(e.target.value)} required>
          <option value="">Seleccionar caja abierta</option>
          {aperturas.map(a => <option key={a.id} value={a.id}>Caja #{a.caja} — Apertura #{a.id}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Concepto</label>
          <Select value={concepto} onChange={e => setConcepto(e.target.value)}>
            {CONCEPTOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Medio de pago</label>
          <Select value={medioPago} onChange={e => setMedioPago(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA_DEBITO">Tarjeta Débito</option>
            <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
            <option value="QR">QR</option>
            <option value="CHEQUE">Cheque</option>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Monto (Gs.)</label>
        <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="0" required />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Observaciones</label>
        <Input value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional" />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">Registrar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

// ── Cobrar factura ─────────────────────────────────────────────────────────────
function CobrarFacturaForm({ onSave, onCancel }) {
  const [facturaId, setFacturaId] = useState('')
  const [aperturaId, setAperturaId] = useState('')
  const [monto, setMonto] = useState('')
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [error, setError] = useState('')

  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas-pendientes'],
    queryFn: () => api.get('/billing/documentos/', {
      params: { estado: 'EMITIDA', tipo_documento: 'FACTURA' }
    }).then(r => r.data.results ?? r.data),
  })
  const { data: aperturas = [] } = useQuery({
    queryKey: ['aperturas-activas'],
    queryFn: () => api.get('/treasury/aperturas/', { params: { estado: 'ABIERTA' } }).then(r => r.data.results ?? r.data),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!facturaId || !aperturaId || !monto) return setError('Completá todos los campos.')
    try {
      await onSave({
        documento_venta_id: Number(facturaId),
        apertura_caja_id: Number(aperturaId),
        monto: Number(monto),
        medio_pago: medioPago,
      })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Error al registrar cobro.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Factura</label>
        <Select value={facturaId} onChange={e => {
          setFacturaId(e.target.value)
          const f = facturas.find(f => String(f.id) === e.target.value)
          if (f) setMonto(String(f.saldo_pendiente || f.total || ''))
        }}>
          <option value="">Seleccionar factura</option>
          {facturas.map(f => (
            <option key={f.id} value={f.id}>
              {f.numero || `#${f.id}`} — {f.cliente_nombre} — Saldo: {fmt(f.saldo_pendiente || 0)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Apertura de caja</label>
        <Select value={aperturaId} onChange={e => setAperturaId(e.target.value)} required>
          <option value="">Seleccionar caja abierta</option>
          {aperturas.map(a => <option key={a.id} value={a.id}>Caja #{a.caja} — Apertura #{a.id}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Monto a cobrar (Gs.)</label>
          <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="0" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Medio de pago</label>
          <Select value={medioPago} onChange={e => setMedioPago(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA_DEBITO">Tarjeta Débito</option>
            <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
            <option value="QR">QR</option>
          </Select>
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">Registrar cobro</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

// ── Cerrar caja inline ────────────────────────────────────────────────────────
function CerrarCajaInline({ apertura, onCerrar }) {
  const conteo = prompt(`Cerrar Caja #${apertura.caja}\nEfectivo esperado: ${fmt(apertura.saldo_esperado_efectivo)}\n\nIngresá el monto contado en efectivo (Gs.):`)
  if (conteo === null) return
  onCerrar({ id: apertura.id, monto_contado_efectivo: Number(conteo) || 0 })
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TesoreriaPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('cajas')
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')

  const { data: monedas = [] } = useQuery({
    queryKey: ['monedas'],
    queryFn: () => api.get('/currencies/currencies/').then(r => r.data.results ?? r.data),
  })
  const pygId = monedas.find(m => m.code === 'PYG')?.id

  const { data: aperturas, isLoading } = useQuery({
    queryKey: ['aperturas'],
    queryFn: () => api.get('/treasury/aperturas/', { params: { ordering: '-fecha_apertura' } }).then(r => r.data),
  })
  const { data: movBancarios } = useQuery({
    queryKey: ['mov-bancarios'],
    queryFn: () => api.get('/treasury/movimientos-bancarios/', { params: { ordering: '-fecha' } }).then(r => r.data),
    enabled: tab === 'banco',
  })

  const abrirCaja = useMutation({
    mutationFn: b => api.post('/treasury/cajas/abrir/', b).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['aperturas']); qc.invalidateQueries(['apertura-activa']); setModal(null) },
    onError: (err) => setError(err.response?.data?.detail ?? 'Error al abrir caja.'),
  })

  const cerrarCaja = useMutation({
    mutationFn: ({ id, monto_contado_efectivo }) =>
      api.post(`/treasury/aperturas/${id}/cerrar/`, { monto_contado_efectivo }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['aperturas']); qc.invalidateQueries(['apertura-activa']) },
    onError: (err) => setError(err.response?.data?.detail ?? 'Error al cerrar caja.'),
  })

  const registrarMov = useMutation({
    mutationFn: b => api.post('/treasury/movimientos/registrar/', b).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['aperturas']); setModal(null) },
    onError: (err) => setError(err.response?.data?.detail ?? 'Error al registrar movimiento.'),
  })

  const cobrarFactura = useMutation({
    mutationFn: b => api.post('/treasury/movimientos/cobro-factura/', b).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['aperturas']); setModal(null) },
    onError: (err) => setError(err.response?.data?.detail ?? 'Error al cobrar factura.'),
  })

  const aperturasList = aperturas?.results ?? aperturas ?? []
  const movBanList = movBancarios?.results ?? movBancarios ?? []

  return (
    <div className="space-y-5">
      {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja y Tesorería</h1>
          <p className="text-slate-400 text-sm">Cajas registradoras, movimientos y cuentas bancarias</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setModal('abrir-caja')}><Plus className="w-4 h-4 mr-1" />Abrir caja</Button>
          <Button variant="secondary" onClick={() => setModal('ingreso')}><ArrowDownCircle className="w-4 h-4 mr-1" />Ingreso</Button>
          <Button variant="outline" onClick={() => setModal('egreso')}><ArrowUpCircle className="w-4 h-4 mr-1" />Egreso</Button>
          <Button variant="secondary" onClick={() => setModal('cobro')}><DollarSign className="w-4 h-4 mr-1" />Cobrar factura</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50">
        {[['cajas', 'Cajas registradoras'], ['banco', 'Movimientos bancarios']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'cajas' && (
        isLoading ? <PageLoader /> : (
          <Table>
            <Thead>
              <tr>
                <Th>Caja</Th><Th>Apertura</Th><Th>Saldo inicial</Th>
                <Th>Saldo efectivo</Th><Th>Movimientos</Th><Th>Estado</Th><Th>Acciones</Th>
              </tr>
            </Thead>
            <Tbody>
              {aperturasList.length === 0 ? (
                <Tr><Td className="text-center text-slate-500 py-8" colSpan={7}>Sin aperturas de caja registradas</Td></Tr>
              ) : aperturasList.map(a => (
                <Tr key={a.id}>
                  <Td className="font-medium text-white">Caja #{a.caja}</Td>
                  <Td className="text-xs text-slate-400">{new Date(a.fecha_apertura).toLocaleString('es-PY')}</Td>
                  <Td>{fmt(a.monto_inicial)}</Td>
                  <Td className="text-cyan-400 font-medium">{fmt(a.saldo_esperado_efectivo)}</Td>
                  <Td className="text-slate-400">{a.movimientos?.length ?? 0}</Td>
                  <Td><Badge variant={a.estado === 'ABIERTA' ? 'success' : 'default'}>{a.estado}</Badge></Td>
                  <Td>
                    {a.estado === 'ABIERTA' && (
                      <button
                        onClick={() => {
                          const conteo = prompt(`Cerrar Caja #${a.caja}\nEfectivo esperado: ${fmt(a.saldo_esperado_efectivo)}\n\nMonto contado (Gs.):`)
                          if (conteo !== null) cerrarCaja.mutate({ id: a.id, monto_contado_efectivo: Number(conteo) || 0 })
                        }}
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        Cerrar caja
                      </button>
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
          <Thead><tr><Th>Fecha</Th><Th>Cuenta</Th><Th>Tipo</Th><Th>Monto</Th><Th>Referencia</Th></tr></Thead>
          <Tbody>
            {movBanList.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={5}>Sin movimientos bancarios</Td></Tr>
            ) : movBanList.map(m => (
              <Tr key={m.id}>
                <Td className="text-xs">{new Date(m.fecha).toLocaleDateString('es-PY')}</Td>
                <Td>{m.cuenta_bancaria}</Td>
                <Td><Badge variant={m.tipo === 'DEPOSITO' ? 'success' : m.tipo === 'RETIRO' ? 'danger' : 'info'}>{m.tipo}</Badge></Td>
                <Td className="font-medium">{fmt(m.monto)}</Td>
                <Td className="text-slate-400 text-xs">{m.referencia || '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {modal === 'abrir-caja' && (
        <Modal title="Abrir caja" onClose={() => setModal(null)}>
          <AperturaCajaForm onSave={b => abrirCaja.mutateAsync(b)} onCancel={() => setModal(null)} pygId={pygId} />
        </Modal>
      )}
      {modal === 'ingreso' && (
        <Modal title="Registrar ingreso" onClose={() => setModal(null)}>
          <MovimientoForm tipo="INGRESO" onSave={b => registrarMov.mutateAsync(b)} onCancel={() => setModal(null)} pygId={pygId} />
        </Modal>
      )}
      {modal === 'egreso' && (
        <Modal title="Registrar egreso" onClose={() => setModal(null)}>
          <MovimientoForm tipo="EGRESO" onSave={b => registrarMov.mutateAsync(b)} onCancel={() => setModal(null)} pygId={pygId} />
        </Modal>
      )}
      {modal === 'cobro' && (
        <Modal title="Cobrar factura" onClose={() => setModal(null)}>
          <CobrarFacturaForm onSave={b => cobrarFactura.mutateAsync(b)} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}

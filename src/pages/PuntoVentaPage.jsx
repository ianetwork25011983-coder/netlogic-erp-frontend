import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingCart, Search, X, Plus, Minus, CreditCard, Banknote,
  QrCode, Building2, Printer, RotateCcw, ChevronDown, Package,
  CheckCircle, AlertTriangle, Lock, Unlock, Receipt
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import api from '@/lib/api'

const fmt = (n) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(n ?? 0)

const MEDIO_PAGO = [
  { key: 'EFECTIVO',        label: 'Efectivo',    icon: Banknote },
  { key: 'TARJETA_DEBITO',  label: 'Débito',      icon: CreditCard },
  { key: 'TARJETA_CREDITO', label: 'Crédito',     icon: CreditCard },
  { key: 'TRANSFERENCIA',   label: 'Transferencia', icon: Building2 },
  { key: 'QR',              label: 'QR',           icon: QrCode },
]

// ─── Calcular totales del carrito ────────────────────────────────────────────
function calcularTotales(items) {
  let subtotal = 0
  let iva = 0
  for (const it of items) {
    const base = it.precio * it.cantidad * (1 - (it.descuento || 0) / 100)
    const tasa = it.tasa_impuesto ?? 10
    const baseNeta = base / (1 + tasa / 100)
    subtotal += baseNeta
    iva += base - baseNeta
  }
  const total = subtotal + iva
  return { subtotal, iva, total }
}

// ─── Modal: Abrir Caja ───────────────────────────────────────────────────────
function ModalAbrirCaja({ cajas, moneda_id, onClose, onAbrir, loading }) {
  const [cajaId, setCajaId] = useState(cajas[0]?.id ?? '')
  const [monto, setMonto] = useState('0')

  return (
    <Modal open title="Abrir Sesión de Caja" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 block mb-1">Caja</label>
          <select
            value={cajaId}
            onChange={e => setCajaId(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
          >
            {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.codigo}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Monto inicial en caja (Gs.)</label>
          <Input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => onAbrir({ caja_id: cajaId, monto_inicial: Number(monto), moneda_id })}
            disabled={!cajaId || loading}
            className="flex-1"
          >
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modal: Cerrar Caja ──────────────────────────────────────────────────────
function ModalCerrarCaja({ apertura, onClose, onCerrar, loading }) {
  const [contado, setContado] = useState('')
  const esperado = apertura?.saldo_esperado_efectivo ?? 0
  const diferencia = (Number(contado) || 0) - Number(esperado)

  return (
    <Modal open title="Cerrar Caja — Arqueo" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Monto inicial:</span>
            <span className="text-white">{fmt(apertura?.monto_inicial)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Efectivo esperado:</span>
            <span className="text-cyan-400 font-medium">{fmt(esperado)}</span>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Efectivo contado físicamente (Gs.)</label>
          <Input
            type="number"
            value={contado}
            onChange={e => setContado(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>
        {contado !== '' && (
          <div className={`flex justify-between text-sm font-medium p-2 rounded-lg ${diferencia === 0 ? 'bg-green-500/10 text-green-400' : diferencia > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
            <span>Diferencia:</span>
            <span>{diferencia > 0 ? '+' : ''}{fmt(diferencia)}</span>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => onCerrar({ monto_contado_efectivo: Number(contado) || 0 })}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Cerrando...' : 'Cerrar Caja'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modal: Ticket emitido ───────────────────────────────────────────────────
function ModalTicket({ doc, onClose }) {
  return (
    <Modal open title="Venta Registrada" onClose={onClose}>
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mx-auto">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">{doc?.tipo_documento} {doc?.numero}</p>
          <p className="text-slate-400 text-sm mt-1">Total: <span className="text-cyan-400 font-bold">{fmt(doc?.total)}</span></p>
          <p className="text-slate-500 text-xs mt-1">Cliente: {doc?.cliente_nombre}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />Nueva venta
          </Button>
          <Button onClick={onClose} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Item de carrito ─────────────────────────────────────────────────────────
function CartItemRow({ item, onQty, onRemove }) {
  const total = item.precio * item.cantidad
  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/30">
      <td className="py-2 pl-3">
        <p className="text-sm text-white font-medium truncate max-w-[180px]">{item.nombre}</p>
        <p className="text-xs text-slate-500">{item.codigo}</p>
      </td>
      <td className="py-2 text-right pr-2">
        <p className="text-sm text-slate-300">{fmt(item.precio)}</p>
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-1 justify-center">
          <button
            onClick={() => onQty(item.id, item.cantidad - 1)}
            className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-sm text-white font-medium">{item.cantidad}</span>
          <button
            onClick={() => onQty(item.id, item.cantidad + 1)}
            className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </td>
      <td className="py-2 text-right pr-2">
        <p className="text-sm text-white font-bold">{fmt(total)}</p>
      </td>
      <td className="py-2 pr-2 text-right">
        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 rounded hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  )
}

// ─── Buscador de productos ───────────────────────────────────────────────────
function BuscadorProductos({ onSelect }) {
  const [query, setQuery] = useState('')
  const [show, setShow] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const { data, isFetching } = useQuery({
    queryKey: ['pos-productos', query],
    queryFn: () => api.get('/productos/', {
      params: { search: query, active: true, page_size: 20 }
    }).then(r => r.data.results ?? r.data),
    enabled: query.length >= 2,
    staleTime: 10_000,
  })

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') { inputRef.current?.focus(); e.preventDefault() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (prod) => {
    onSelect(prod)
    setQuery('')
    setShow(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setShow(true) }}
          onFocus={() => query.length >= 2 && setShow(true)}
          placeholder="Buscar producto por nombre, código o barras... (F2)"
          className="w-full bg-slate-800 border border-slate-600 focus:border-cyan-500 rounded-lg pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {show && data && data.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
          {data.map(prod => (
            <button
              key={prod.id}
              onClick={() => handleSelect(prod)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{prod.nombre}</p>
                <p className="text-xs text-slate-500">{prod.codigo} · {prod.unidad_medida_codigo || prod.unidad_medida}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-cyan-400">{fmt(prod.precio)}</p>
                <p className="text-xs text-slate-500">IVA {prod.impuesto_tasa ?? 10}%</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {show && query.length >= 2 && !isFetching && (!data || data.length === 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-4 text-center text-slate-400 text-sm">
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function PuntoVentaPage() {
  const qc = useQueryClient()
  const [cart, setCart] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [showAbrirModal, setShowAbrirModal] = useState(false)
  const [showCerrarModal, setShowCerrarModal] = useState(false)
  const [ticketDoc, setTicketDoc] = useState(null)
  const [error, setError] = useState('')

  // ── Datos base ──────────────────────────────────────────────────────────────
  const { data: cajas = [], isLoading: loadCajas } = useQuery({
    queryKey: ['cajas'],
    queryFn: () => api.get('/treasury/cajas/').then(r => r.data.results ?? r.data),
  })

  const { data: aperturas = [], isLoading: loadAp, refetch: refetchAp } = useQuery({
    queryKey: ['apertura-activa'],
    queryFn: () => api.get('/treasury/aperturas/', { params: { estado: 'ABIERTA' } }).then(r => r.data.results ?? r.data),
    refetchInterval: 30_000,
  })

  const { data: pvList = [] } = useQuery({
    queryKey: ['puntos-venta'],
    queryFn: () => api.get('/puntos-venta/').then(r => r.data.results ?? r.data),
  })

  const { data: depositos = [] } = useQuery({
    queryKey: ['depositos'],
    queryFn: () => api.get('/depositos/').then(r => r.data.results ?? r.data),
  })

  const { data: monedas = [] } = useQuery({
    queryKey: ['monedas'],
    queryFn: () => api.get('/currencies/currencies/').then(r => r.data.results ?? r.data),
  })

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-pos'],
    queryFn: () => api.get('/clientes/', { params: { page_size: 200 } }).then(r => r.data.results ?? r.data),
  })

  const apertura = aperturas[0] ?? null
  const pyg = monedas.find(m => m.code === 'PYG')

  // Determinar punto_venta y deposito a usar
  const cajaActiva = apertura ? cajas.find(c => c.id === apertura.caja) : null
  const pvActivo = cajaActiva ? pvList.find(p => p.id === cajaActiva.punto_venta) : pvList[0]
  const depositoActivo = pvActivo ? depositos.find(d => d.id === pvActivo.deposito_predeterminado) : depositos[0]

  // ── Acciones de caja ────────────────────────────────────────────────────────
  const abrirMutation = useMutation({
    mutationFn: (data) => api.post('/treasury/cajas/abrir/', data).then(r => r.data),
    onSuccess: () => { setShowAbrirModal(false); refetchAp(); qc.invalidateQueries(['apertura-activa']) },
    onError: (err) => setError(err.response?.data?.detail || 'Error al abrir la caja'),
  })

  const cerrarMutation = useMutation({
    mutationFn: ({ apertura_id, ...data }) =>
      api.post(`/treasury/aperturas/${apertura_id}/cerrar/`, data).then(r => r.data),
    onSuccess: () => { setShowCerrarModal(false); refetchAp(); qc.invalidateQueries(['apertura-activa']) },
    onError: (err) => setError(err.response?.data?.detail || 'Error al cerrar la caja'),
  })

  // ── Carrito ─────────────────────────────────────────────────────────────────
  const addToCart = useCallback((prod) => {
    setCart(prev => {
      const exists = prev.find(it => it.id === prod.id)
      if (exists) {
        return prev.map(it => it.id === prod.id ? { ...it, cantidad: it.cantidad + 1 } : it)
      }
      return [...prev, {
        id: prod.id,
        codigo: prod.codigo,
        nombre: prod.nombre,
        precio: Number(prod.precio),
        tasa_impuesto: Number(prod.impuesto_tasa ?? 10),
        impuesto_id: prod.impuesto,
        cantidad: 1,
        descuento: 0,
      }]
    })
  }, [])

  const updateQty = (id, qty) => {
    if (qty <= 0) { removeItem(id); return }
    setCart(prev => prev.map(it => it.id === id ? { ...it, cantidad: qty } : it))
  }

  const removeItem = (id) => setCart(prev => prev.filter(it => it.id !== id))

  const clearCart = () => { setCart([]); setClienteId(''); setMontoRecibido('') }

  const { subtotal, iva, total } = calcularTotales(cart)
  const vuelto = Math.max(0, (Number(montoRecibido) || 0) - total)

  // ── Facturar ────────────────────────────────────────────────────────────────
  const facturarMutation = useMutation({
    mutationFn: async ({ tipo }) => {
      if (!clienteId) throw new Error('Seleccioná un cliente')
      if (cart.length === 0) throw new Error('El carrito está vacío')
      if (!pvActivo) throw new Error('No hay punto de venta configurado')

      const payload = {
        empresa: pvActivo.sucursal
          ? (await api.get(`/sucursales/${pvActivo.sucursal}/`).then(r => r.data.empresa))
          : undefined,
        sucursal: pvActivo.sucursal,
        punto_venta: pvActivo.id,
        tipo_documento: tipo,
        cliente: Number(clienteId),
        moneda_code: 'PYG',
        condicion_venta: 'CONTADO',
        afecta_inventario: tipo === 'FACTURA' && !!depositoActivo,
        deposito_salida: tipo === 'FACTURA' ? depositoActivo?.id : null,
        items: cart.map(it => ({
          producto_id: it.id,
          cantidad: it.cantidad,
          precio_unitario: it.precio,
          descuento_porcentaje: it.descuento ?? 0,
          impuesto_id: it.impuesto_id ?? null,
        })),
      }

      const doc = await api.post('/billing/documentos/emitir/', payload).then(r => r.data)

      // Registrar cobro si hay sesión de caja abierta
      if (apertura && tipo === 'FACTURA') {
        await api.post('/treasury/movimientos/cobro-factura/', {
          apertura_caja_id: apertura.id,
          documento_venta_id: doc.id,
          monto: doc.total,
          medio_pago: medioPago,
        })
      }

      return doc
    },
    onSuccess: (doc) => {
      setTicketDoc(doc)
      setCart([])
      setClienteId('')
      setMontoRecibido('')
      qc.invalidateQueries(['apertura-activa'])
    },
    onError: (err) => {
      const msg = err?.message || err?.response?.data?.detail || JSON.stringify(err?.response?.data)
      setError(msg || 'Error al facturar')
    },
  })

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadCajas || loadAp) return <PageLoader />

  const sesionAbierta = !!apertura

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Cabecera ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-cyan-400" />
            Punto de Venta
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {sesionAbierta
              ? `Sesión abierta — ${fmt(apertura.saldo_esperado_efectivo)} en caja`
              : 'Sin sesión activa'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sesionAbierta ? (
            <>
              <Badge variant="success" className="gap-1">
                <Unlock className="w-3 h-3" /> Caja abierta
              </Badge>
              <Button variant="outline" onClick={() => setShowCerrarModal(true)}>
                <Lock className="w-4 h-4 mr-2" /> Cerrar Caja
              </Button>
            </>
          ) : (
            <>
              <Badge variant="warning" className="gap-1">
                <Lock className="w-3 h-3" /> Caja cerrada
              </Badge>
              {cajas.length > 0 && (
                <Button onClick={() => setShowAbrirModal(true)}>
                  <Unlock className="w-4 h-4 mr-2" /> Abrir Caja
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>
      )}

      {/* ── Sin cajas configuradas ───────────────────────────────────────────── */}
      {cajas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-white font-medium">No hay cajas configuradas</p>
            <p className="text-slate-400 text-sm mt-1">
              Crear una caja desde el panel de administración o volver a correr el seed de datos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Sin sesión abierta ────────────────────────────────────────────────── */}
      {cajas.length > 0 && !sesionAbierta && (
        <Card>
          <CardContent className="py-16 text-center">
            <Lock className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-200 font-semibold text-lg">Sesión de caja cerrada</p>
            <p className="text-slate-500 text-sm mt-2 mb-6">
              Abrí la sesión para comenzar a registrar ventas
            </p>
            <Button onClick={() => setShowAbrirModal(true)} className="mx-auto">
              <Unlock className="w-4 h-4 mr-2" /> Abrir Sesión de Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── POS Interface ────────────────────────────────────────────────────── */}
      {sesionAbierta && (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Panel izquierdo: buscador + carrito */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Buscador */}
            <BuscadorProductos onSelect={addToCart} />

            {/* Carrito */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="w-4 h-4 text-cyan-400" />
                  Carrito ({cart.length} {cart.length === 1 ? 'ítem' : 'ítems'})
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="ml-auto text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />Limpiar
                    </button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                    <ShoppingCart className="w-10 h-10 text-slate-700 mb-3" />
                    <p className="text-slate-400 text-sm">El carrito está vacío</p>
                    <p className="text-slate-600 text-xs mt-1">Buscá productos arriba o presioná F2</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/50">
                        <th className="text-left text-xs text-slate-500 py-2 pl-3">Producto</th>
                        <th className="text-right text-xs text-slate-500 py-2 pr-2">Precio</th>
                        <th className="text-center text-xs text-slate-500 py-2 px-2">Cant.</th>
                        <th className="text-right text-xs text-slate-500 py-2 pr-2">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          onQty={updateQty}
                          onRemove={removeItem}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho: checkout */}
          <div className="w-80 flex flex-col gap-3">
            {/* Cliente */}
            <Card>
              <CardContent className="pt-3 pb-3">
                <label className="text-xs text-slate-400 block mb-1.5">Cliente</label>
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">— Seleccionar cliente —</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_comercial || c.razon_social}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Totales */}
            <Card>
              <CardContent className="pt-3 pb-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal neto:</span>
                  <span className="text-white">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">IVA:</span>
                  <span className="text-white">{fmt(iva)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-slate-700 pt-2">
                  <span className="text-white">TOTAL</span>
                  <span className="text-cyan-400 text-xl">{fmt(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Medio de pago */}
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-slate-400 mb-2">Medio de pago</p>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {MEDIO_PAGO.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setMedioPago(key)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        medioPago === key
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {medioPago === 'EFECTIVO' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Monto recibido (Gs.)</label>
                      <Input
                        type="number"
                        value={montoRecibido}
                        onChange={e => setMontoRecibido(e.target.value)}
                        placeholder={String(Math.ceil(total))}
                      />
                    </div>
                    {montoRecibido && (
                      <div className={`flex justify-between text-sm font-bold p-2 rounded-lg ${vuelto >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span>Vuelto:</span>
                        <span>{fmt(vuelto)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="space-y-2">
              <Button
                className="w-full"
                disabled={cart.length === 0 || !clienteId || facturarMutation.isPending}
                onClick={() => facturarMutation.mutate({ tipo: 'FACTURA' })}
              >
                {facturarMutation.isPending ? 'Procesando...' : (
                  <><Receipt className="w-4 h-4 mr-2" />Emitir Factura</>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={cart.length === 0 || !clienteId || facturarMutation.isPending}
                onClick={() => facturarMutation.mutate({ tipo: 'PRESUPUESTO' })}
              >
                Generar Presupuesto
              </Button>
            </div>

            {/* Hoy */}
            {apertura?.movimientos && apertura.movimientos.length > 0 && (
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-slate-400">Ventas de la sesión</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 space-y-1 max-h-32 overflow-y-auto">
                  {apertura.movimientos
                    .filter(m => m.concepto === 'COBRO_FACTURA')
                    .slice(0, 10)
                    .map(m => (
                      <div key={m.id} className="flex justify-between text-xs">
                        <span className="text-slate-400 truncate">{m.observaciones || m.medio_pago}</span>
                        <span className="text-green-400 font-medium ml-2 flex-shrink-0">{fmt(m.monto)}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modales */}
      {showAbrirModal && pyg && (
        <ModalAbrirCaja
          cajas={cajas}
          moneda_id={pyg.id}
          onClose={() => setShowAbrirModal(false)}
          onAbrir={(data) => abrirMutation.mutate(data)}
          loading={abrirMutation.isPending}
        />
      )}

      {showCerrarModal && apertura && (
        <ModalCerrarCaja
          apertura={apertura}
          onClose={() => setShowCerrarModal(false)}
          onCerrar={(data) => cerrarMutation.mutate({ apertura_id: apertura.id, ...data })}
          loading={cerrarMutation.isPending}
        />
      )}

      {ticketDoc && (
        <ModalTicket doc={ticketDoc} onClose={() => setTicketDoc(null)} />
      )}
    </div>
  )
}

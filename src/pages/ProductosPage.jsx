import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
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

const TIPO_BADGE = {
  PRODUCTO: 'info', SERVICIO: 'purple', COMBO: 'warning', KIT: 'success', COMPUESTO: 'danger',
}

function ProductoForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    codigo: '', nombre: '', tipo: 'PRODUCTO', precio_venta: '', stock_minimo: '', stock_maximo: '',
    metodo_costeo: 'PROMEDIO', activo: true,
  })
  const [error, setError] = useState('')

  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: () => api.get('/categorias/').then(r => r.data.results || r.data) })
  const { data: marcas } = useQuery({ queryKey: ['marcas'], queryFn: () => api.get('/marcas/').then(r => r.data.results || r.data) })
  const { data: unidades } = useQuery({ queryKey: ['unidades'], queryFn: () => api.get('/unidades-medida/').then(r => r.data.results || r.data) })
  const { data: impuestos } = useQuery({ queryKey: ['impuestos'], queryFn: () => api.get('/impuestos/').then(r => r.data.results || r.data) })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.')
    if (!form.codigo.trim()) return setError('El código es obligatorio.')
    try {
      await onSave(form)
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Error al guardar.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Código *</label>
          <Input value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="PROD-001" required />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
          <Select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {['PRODUCTO','SERVICIO','COMBO','KIT','COMPUESTO'].map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nombre *</label>
        <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del producto" required />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Descripción</label>
        <Input value={form.descripcion || ''} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Categoría</label>
          <Select value={form.categoria || ''} onChange={e => set('categoria', e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Marca</label>
          <Select value={form.marca || ''} onChange={e => set('marca', e.target.value)}>
            <option value="">Sin marca</option>
            {marcas?.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Unidad de medida</label>
          <Select value={form.unidad_medida || ''} onChange={e => set('unidad_medida', e.target.value)}>
            <option value="">Seleccionar</option>
            {unidades?.map(u => <option key={u.id} value={u.id}>{u.codigo} — {u.nombre}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Impuesto</label>
          <Select value={form.impuesto || ''} onChange={e => set('impuesto', e.target.value)}>
            <option value="">Sin impuesto</option>
            {impuestos?.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.porcentaje}%)</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Precio venta (PYG)</label>
          <Input type="number" value={form.precio_venta} onChange={e => set('precio_venta', e.target.value)} placeholder="0" min="0" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Stock mínimo</label>
          <Input type="number" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} placeholder="0" min="0" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Stock máximo</label>
          <Input type="number" value={form.stock_maximo} onChange={e => set('stock_maximo', e.target.value)} placeholder="0" min="0" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Método de costeo</label>
        <Select value={form.metodo_costeo} onChange={e => set('metodo_costeo', e.target.value)}>
          <option value="PROMEDIO">Promedio Ponderado</option>
          <option value="FIFO">FIFO</option>
          <option value="LIFO">LIFO</option>
        </Select>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Guardar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function ProductosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['productos', search],
    queryFn: () => api.get(`/productos/?search=${search}`).then(r => r.data),
  })

  const crear = useMutation({
    mutationFn: (body) => api.post('/productos/', body),
    onSuccess: () => { qc.invalidateQueries(['productos']); setModal(null) },
  })
  const editar = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/productos/${id}/`, body),
    onSuccess: () => { qc.invalidateQueries(['productos']); setModal(null) },
  })
  const eliminar = useMutation({
    mutationFn: (id) => api.delete(`/productos/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['productos']); setDeleteId(null) },
  })

  const productos = data?.results ?? data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-slate-400 text-sm mt-0.5">Catálogo de productos, servicios y combos</p>
        </div>
        <Button onClick={() => setModal({ type: 'crear' })}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo producto
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              className="pl-10"
              placeholder="Buscar por nombre, código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? <PageLoader /> : error ? (
        <Alert variant="error" title="Error al cargar productos">{error.response?.data?.detail || 'Intente nuevamente.'}</Alert>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Código</Th><Th>Nombre</Th><Th>Tipo</Th><Th>Precio venta</Th>
              <Th>Stock mín.</Th><Th>Costeo</Th><Th>Estado</Th><Th>Acciones</Th>
            </tr>
          </Thead>
          <Tbody>
            {productos.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={8}>No hay productos registrados</Td></Tr>
            ) : productos.map(p => (
              <Tr key={p.id}>
                <Td><span className="font-mono text-cyan-400">{p.codigo}</span></Td>
                <Td className="font-medium text-white">{p.nombre}</Td>
                <Td><Badge variant={TIPO_BADGE[p.tipo] || 'default'}>{p.tipo}</Badge></Td>
                <Td>₲ {Number(p.precio_venta || 0).toLocaleString('es-PY')}</Td>
                <Td>{p.stock_minimo ?? '—'}</Td>
                <Td><span className="text-xs text-slate-400">{p.metodo_costeo}</span></Td>
                <Td><Badge variant={p.activo ? 'success' : 'danger'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ type: 'editar', data: p })} className="text-slate-400 hover:text-cyan-400 transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(p.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal?.type === 'crear'} onClose={() => setModal(null)} title="Nuevo producto">
        <ProductoForm onSave={(body) => crear.mutateAsync(body)} onCancel={() => setModal(null)} />
      </Modal>

      <Modal open={modal?.type === 'editar'} onClose={() => setModal(null)} title="Editar producto">
        {modal?.data && (
          <ProductoForm
            initial={modal.data}
            onSave={(body) => editar.mutateAsync({ id: modal.data.id, body })}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar eliminación">
        <p className="text-slate-300 mb-4">¿Seguro que querés eliminar este producto? Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <Button variant="destructive" className="flex-1" onClick={() => eliminar.mutate(deleteId)}>Eliminar</Button>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Star } from 'lucide-react'
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

function ClienteForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    razon_social: '', nombre_comercial: '', ruc: '', email: '', telefono: '', direccion: '',
    tipo_contribuyente: 'JURIDICA', es_vip: false,
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.razon_social.trim()) return setError('La razón social es obligatoria.')
    try { await onSave(form) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error al guardar.') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Razón social *</label>
          <Input value={form.razon_social} onChange={e => set('razon_social', e.target.value)} placeholder="Razón social" required />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nombre comercial</label>
          <Input value={form.nombre_comercial || ''} onChange={e => set('nombre_comercial', e.target.value)} placeholder="Nombre comercial" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">RUC / CI</label>
          <Input value={form.ruc || ''} onChange={e => set('ruc', e.target.value)} placeholder="80012345-6" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tipo contribuyente</label>
          <Select value={form.tipo_contribuyente} onChange={e => set('tipo_contribuyente', e.target.value)}>
            <option value="JURIDICA">Persona Jurídica</option>
            <option value="FISICA">Persona Física</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Email</label>
          <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="cliente@empresa.com" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Teléfono</label>
          <Input value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+595 21 123456" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Dirección</label>
        <Input value={form.direccion || ''} onChange={e => set('direccion', e.target.value)} placeholder="Dirección completa" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input type="checkbox" checked={form.es_vip} onChange={e => set('es_vip', e.target.checked)} className="accent-cyan-500" />
        Cliente VIP
      </label>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Guardar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function ClientesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['clientes', search],
    queryFn: () => api.get(`/clientes/?search=${search}`).then(r => r.data),
  })

  const crear = useMutation({ mutationFn: b => api.post('/clientes/', b), onSuccess: () => { qc.invalidateQueries(['clientes']); setModal(null) } })
  const editar = useMutation({ mutationFn: ({ id, body }) => api.patch(`/clientes/${id}/`, body), onSuccess: () => { qc.invalidateQueries(['clientes']); setModal(null) } })

  const clientes = data?.results ?? data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">Gestión de clientes y sus datos</p>
        </div>
        <Button onClick={() => setModal({ type: 'crear' })}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo cliente
        </Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input className="pl-10" placeholder="Buscar por nombre, RUC..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      {isLoading ? <PageLoader /> : error ? (
        <Alert variant="error">{error.response?.data?.detail || 'Error al cargar.'}</Alert>
      ) : (
        <Table>
          <Thead><tr>
            <Th>Razón social</Th><Th>Nombre comercial</Th><Th>RUC</Th><Th>Email</Th><Th>Teléfono</Th><Th>Tipo</Th><Th>VIP</Th><Th>Acciones</Th>
          </tr></Thead>
          <Tbody>
            {clientes.length === 0 ? (
              <Tr><Td className="text-center text-slate-500 py-8" colSpan={8}>Sin clientes registrados</Td></Tr>
            ) : clientes.map(c => (
              <Tr key={c.id}>
                <Td className="font-medium text-white">{c.razon_social}</Td>
                <Td className="text-slate-300">{c.nombre_comercial || '—'}</Td>
                <Td className="font-mono text-xs">{c.ruc || '—'}</Td>
                <Td className="text-xs">{c.email || '—'}</Td>
                <Td className="text-xs">{c.telefono || '—'}</Td>
                <Td><Badge variant="info">{c.tipo_contribuyente}</Badge></Td>
                <Td>{c.es_vip && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}</Td>
                <Td>
                  <button onClick={() => setModal({ type: 'editar', data: c })} className="text-slate-400 hover:text-cyan-400 transition-colors"><Edit className="w-4 h-4" /></button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={modal?.type === 'crear'} onClose={() => setModal(null)} title="Nuevo cliente">
        <ClienteForm onSave={b => crear.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal?.type === 'editar'} onClose={() => setModal(null)} title="Editar cliente">
        {modal?.data && <ClienteForm initial={modal.data} onSave={b => editar.mutateAsync({ id: modal.data.id, body: b })} onCancel={() => setModal(null)} />}
      </Modal>
    </div>
  )
}

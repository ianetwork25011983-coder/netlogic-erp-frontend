import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ArrowRight, Phone, Mail, Calendar } from 'lucide-react'
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

function ProspectoForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ razon_social: '', nombre_comercial: '', email: '', telefono: '', notas: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.razon_social.trim()) return setError('Razón social es obligatoria.')
    try { await onSave(form) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error.') }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Razón social *</label>
          <Input value={form.razon_social} onChange={e => set('razon_social', e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nombre comercial</label>
          <Input value={form.nombre_comercial} onChange={e => set('nombre_comercial', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Email</label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Teléfono</label>
          <Input value={form.telefono} onChange={e => set('telefono', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Notas</label>
        <Input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Información adicional" />
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Crear prospecto</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function OportunidadForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ nombre: '', valor_estimado: '', probabilidad: '50', fecha_cierre_estimada: '' })
  const [clienteId, setClienteId] = useState('')
  const [etapaId, setEtapaId] = useState('')
  const [error, setError] = useState('')

  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: () => api.get('/clientes/').then(r => r.data.results || r.data) })
  const { data: etapas } = useQuery({ queryKey: ['etapas'], queryFn: () => api.get('/crm/etapas-pipeline/').then(r => r.data.results || r.data) })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('Nombre es obligatorio.')
    try { await onSave({ ...form, cliente: clienteId || undefined, etapa: etapaId || undefined }) }
    catch (err) { setError(Object.values(err.response?.data || {}).flat().join(' ') || 'Error.') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nombre de la oportunidad *</label>
        <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Cliente</label>
          <Select value={clienteId} onChange={e => setClienteId(e.target.value)}>
            <option value="">Sin cliente</option>
            {clientes?.map(c => <option key={c.id} value={c.id}>{c.nombre_comercial || c.razon_social}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Etapa del pipeline</label>
          <Select value={etapaId} onChange={e => setEtapaId(e.target.value)}>
            <option value="">Sin etapa</option>
            {etapas?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Valor estimado (PYG)</label>
          <Input type="number" value={form.valor_estimado} onChange={e => set('valor_estimado', e.target.value)} min="0" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Probabilidad %</label>
          <Input type="number" value={form.probabilidad} onChange={e => set('probabilidad', e.target.value)} min="0" max="100" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Fecha cierre est.</label>
          <Input type="date" value={form.fecha_cierre_estimada} onChange={e => set('fecha_cierre_estimada', e.target.value)} />
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Crear oportunidad</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function CRMPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('prospectos')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  const { data: prospectos, isLoading: loadProsp } = useQuery({
    queryKey: ['prospectos', search],
    queryFn: () => api.get(`/crm/prospectos/?search=${search}`).then(r => r.data),
    enabled: tab === 'prospectos',
  })
  const { data: oportunidades, isLoading: loadOp } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: () => api.get('/crm/oportunidades/?ordering=-created_at').then(r => r.data),
    enabled: tab === 'oportunidades',
  })
  const { data: pipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => api.get('/crm/pipeline/resumen/').then(r => r.data),
    enabled: tab === 'pipeline',
  })

  const crearProspecto = useMutation({ mutationFn: b => api.post('/crm/prospectos/', b), onSuccess: () => { qc.invalidateQueries(['prospectos']); setModal(null) } })
  const crearOportunidad = useMutation({ mutationFn: b => api.post('/crm/oportunidades/', b), onSuccess: () => { qc.invalidateQueries(['oportunidades']); setModal(null) } })
  const convertir = useMutation({ mutationFn: id => api.post(`/crm/prospectos/${id}/convertir/`), onSuccess: () => { qc.invalidateQueries(['prospectos']) } })

  const prospList = prospectos?.results ?? prospectos ?? []
  const opList = oportunidades?.results ?? oportunidades ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM</h1>
          <p className="text-slate-400 text-sm">Prospectos, oportunidades y pipeline de ventas</p>
        </div>
        <div className="flex gap-2">
          {tab === 'prospectos' && <Button onClick={() => setModal('prospecto')}><Plus className="w-4 h-4 mr-2" /> Prospecto</Button>}
          {tab === 'oportunidades' && <Button onClick={() => setModal('oportunidad')}><Plus className="w-4 h-4 mr-2" /> Oportunidad</Button>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50">
        {['prospectos','oportunidades','pipeline'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'prospectos' && (
        <>
          <Card><CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input className="pl-10" placeholder="Buscar prospectos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardContent></Card>
          {loadProsp ? <PageLoader /> : (
            <Table>
              <Thead><tr><Th>Nombre</Th><Th>Email</Th><Th>Teléfono</Th><Th>Estado</Th><Th>Acciones</Th></tr></Thead>
              <Tbody>
                {prospList.length === 0 ? (
                  <Tr><Td className="text-center text-slate-500 py-8" colSpan={5}>Sin prospectos</Td></Tr>
                ) : prospList.map(p => (
                  <Tr key={p.id}>
                    <Td className="font-medium text-white">{p.nombre_comercial || p.razon_social}</Td>
                    <Td className="text-xs">{p.email || '—'}</Td>
                    <Td className="text-xs">{p.telefono || '—'}</Td>
                    <Td><Badge variant={p.convertido ? 'success' : 'info'}>{p.convertido ? 'Convertido' : 'Activo'}</Badge></Td>
                    <Td>
                      {!p.convertido && (
                        <button onClick={() => convertir.mutate(p.id)} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                          <ArrowRight className="w-3 h-3" /> Convertir a cliente
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </>
      )}

      {tab === 'oportunidades' && (
        loadOp ? <PageLoader /> : (
          <Table>
            <Thead><tr><Th>Oportunidad</Th><Th>Cliente</Th><Th>Valor est.</Th><Th>Prob. %</Th><Th>Etapa</Th><Th>Cierre est.</Th></tr></Thead>
            <Tbody>
              {opList.length === 0 ? (
                <Tr><Td className="text-center text-slate-500 py-8" colSpan={6}>Sin oportunidades</Td></Tr>
              ) : opList.map(o => (
                <Tr key={o.id}>
                  <Td className="font-medium text-white">{o.nombre}</Td>
                  <Td>{o.cliente_nombre || '—'}</Td>
                  <Td className="text-cyan-400">₲ {Number(o.valor_estimado || 0).toLocaleString('es-PY')}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${o.probabilidad}%` }} />
                      </div>
                      <span className="text-xs">{o.probabilidad}%</span>
                    </div>
                  </Td>
                  <Td>{o.etapa_nombre ? <Badge variant="info">{o.etapa_nombre}</Badge> : '—'}</Td>
                  <Td className="text-xs">{o.fecha_cierre_estimada ? new Date(o.fecha_cierre_estimada).toLocaleDateString('es-PY') : '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      )}

      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipeline?.length === 0 && <p className="text-slate-500 text-sm col-span-3 text-center py-8">Sin etapas de pipeline configuradas</p>}
          {pipeline?.map(etapa => (
            <Card key={etapa.etapa_id}>
              <CardHeader><CardTitle className="text-sm">{etapa.etapa_nombre}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{etapa.cantidad}</p>
                <p className="text-xs text-slate-400 mt-1">oportunidades</p>
                <p className="text-lg font-medium text-cyan-400 mt-2">₲ {Number(etapa.valor_total || 0).toLocaleString('es-PY')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal === 'prospecto'} onClose={() => setModal(null)} title="Nuevo prospecto">
        <ProspectoForm onSave={b => crearProspecto.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'oportunidad'} onClose={() => setModal(null)} title="Nueva oportunidad">
        <OportunidadForm onSave={b => crearOportunidad.mutateAsync(b)} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  )
}

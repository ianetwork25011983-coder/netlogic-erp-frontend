import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, Brain, User, Lightbulb, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/ui/spinner'
import api from '@/lib/api'

const PREGUNTAS_EJEMPLO = [
  '¿Qué productos tengo que comprar esta semana?',
  '¿Qué productos rotan más lento?',
  '¿Cuál fue el margen del mes pasado?',
  '¿Qué clientes bajaron sus compras?',
  'Generá una orden de compra sugerida',
  '¿Qué productos están agotados?',
  '¿Cuáles son los 5 productos más vendidos?',
  '¿Cuánto vale mi inventario actual?',
]

function MensajeBot({ data }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
        <Brain className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-slate-200 text-sm leading-relaxed">{data.respuesta}</p>
        {data.datos && Object.keys(data.datos).length > 0 && (
          <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 mt-2">
            <p className="text-xs text-slate-400 mb-2 font-medium">Datos estructurados:</p>
            <pre className="text-xs text-cyan-300 overflow-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(data.datos, null, 2)}
            </pre>
          </div>
        )}
        {data.intencion_detectada && (
          <p className="text-xs text-slate-500">Intención detectada: <span className="text-slate-400">{data.intencion_detectada}</span></p>
        )}
      </div>
    </div>
  )
}

function MensajeUser({ texto }) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-cyan-500/10 border border-cyan-500/20 px-4 py-3">
        <p className="text-slate-200 text-sm">{texto}</p>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  )
}

export default function CopilotoPage() {
  const [pregunta, setPregunta] = useState('')
  const [mensajes, setMensajes] = useState([])
  const bottomRef = useRef(null)

  const { data: historial, isLoading: loadHist } = useQuery({
    queryKey: ['copiloto-historial'],
    queryFn: () => api.get('/copilot/historial/').then(r => r.data.results || r.data),
  })

  const preguntar = useMutation({
    mutationFn: (p) => api.post('/copilot/preguntar/', { pregunta: p }).then(r => r.data),
    onSuccess: (data, variables) => {
      setMensajes(m => [...m, { tipo: 'user', texto: variables }, { tipo: 'bot', data }])
      setPregunta('')
    },
    onError: (err) => {
      setMensajes(m => [...m, { tipo: 'bot', data: { respuesta: `Error: ${err.response?.data?.detail || 'No se pudo procesar la consulta.'}`, datos: {} } }])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pregunta.trim() || preguntar.isPending) return
    preguntar.mutate(pregunta.trim())
  }

  const usarEjemplo = (p) => {
    setPregunta(p)
    preguntar.mutate(p)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">IA Copiloto del ERP</h1>
          <p className="text-slate-400 text-sm">Hacé preguntas en lenguaje natural sobre tu negocio</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <Brain className="w-12 h-12 text-slate-700" />
                  <div>
                    <p className="text-slate-300 font-medium">Copiloto listo para ayudarte</p>
                    <p className="text-slate-500 text-sm mt-1">Escribí tu pregunta o elegí un ejemplo de la derecha</p>
                  </div>
                </div>
              ) : mensajes.map((m, i) => (
                m.tipo === 'user'
                  ? <MensajeUser key={i} texto={m.texto} />
                  : <MensajeBot key={i} data={m.data} />
              ))}
              {preguntar.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>
            <div className="p-4 border-t border-slate-700/50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={pregunta}
                  onChange={e => setPregunta(e.target.value)}
                  placeholder="Ej: ¿Qué productos tengo que comprar esta semana?"
                  className="flex-1"
                  disabled={preguntar.isPending}
                />
                <Button type="submit" disabled={!pregunta.trim() || preguntar.isPending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Panel derecho */}
        <div className="w-72 flex flex-col gap-4">
          {/* Preguntas ejemplo */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="w-4 h-4 text-yellow-400" />Preguntas sugeridas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {PREGUNTAS_EJEMPLO.map((p, i) => (
                <button key={i} onClick={() => usarEjemplo(p)} disabled={preguntar.isPending}
                  className="w-full text-left text-xs text-slate-400 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                  {p}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Historial */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-slate-400" />Consultas recientes</CardTitle></CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-2">
              {loadHist ? <p className="text-xs text-slate-500">Cargando...</p> :
                historial?.length === 0 ? <p className="text-xs text-slate-500">Sin historial</p> :
                  historial?.slice(0, 10).map(h => (
                    <button key={h.id} onClick={() => usarEjemplo(h.pregunta)}
                      className="w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <p className="text-xs text-slate-300 truncate">{h.pregunta}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(h.created_at || h.fecha).toLocaleDateString('es-PY')}</p>
                    </button>
                  ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

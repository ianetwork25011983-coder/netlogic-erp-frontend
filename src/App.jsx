import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductosPage from '@/pages/ProductosPage'
import InventarioPage from '@/pages/InventarioPage'
import ComprasPage from '@/pages/ComprasPage'
import FacturacionPage from '@/pages/FacturacionPage'
import ClientesPage from '@/pages/ClientesPage'
import CRMPage from '@/pages/CRMPage'
import TesoreriaPage from '@/pages/TesoreriaPage'
import LogisticaPage from '@/pages/LogisticaPage'
import ReportesPage from '@/pages/ReportesPage'
import CopilotoPage from '@/pages/CopilotoPage'
import PedidosPage from '@/pages/PedidosPage'
import PuntoVentaPage from '@/pages/PuntoVentaPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/compras" element={<ComprasPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/pos" element={<PuntoVentaPage />} />
            <Route path="/facturacion" element={<FacturacionPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/tesoreria" element={<TesoreriaPage />} />
            <Route path="/logistica" element={<LogisticaPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/copiloto" element={<CopilotoPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

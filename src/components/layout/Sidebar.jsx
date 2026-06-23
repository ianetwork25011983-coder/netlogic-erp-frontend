import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, FileText,
  Users, Building2, DollarSign, Truck, BarChart3, Brain,
  ShoppingBag, Zap, LogOut, ChevronRight, Receipt
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Productos', icon: Package, to: '/productos' },
  { label: 'Inventario', icon: Warehouse, to: '/inventario' },
  { label: 'Compras', icon: ShoppingCart, to: '/compras' },
  { label: 'Pedidos de Venta', icon: ShoppingBag, to: '/pedidos' },
  { label: 'Punto de Venta', icon: Receipt, to: '/pos' },
  { label: 'Facturación', icon: FileText, to: '/facturacion' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
  { label: 'CRM', icon: Building2, to: '/crm' },
  { label: 'Tesorería', icon: DollarSign, to: '/tesoreria' },
  { label: 'Logística', icon: Truck, to: '/logistica' },
  { label: 'Reportes', icon: BarChart3, to: '/reportes' },
  { label: 'IA Copiloto', icon: Brain, to: '/copiloto' },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Netlogic</p>
          <p className="text-xs text-slate-500">ERP System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Footer usuario */}
      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 mb-2">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

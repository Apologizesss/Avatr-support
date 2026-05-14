import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Settings,
  ShieldCheck as ShieldCheckIcon,
  Car,
  Crown,
  GitCompare,
  Scale,
  Tag,
  Calculator,
  FileText,
  Building2,
  ShieldCheck,
  HelpCircle,
  Users,
  MessageSquare,
  Inbox,
  Target,
  Database,
  ChevronRight,
  Home,
} from 'lucide-react'
import { TABLE_GROUPS, GROUP_ICONS } from '../lib/tables'
import { useTheme } from '../hooks/useTheme'
import { clearSupabaseConfig, isUsingEnvConfig } from '../lib/supabase'

const ICONS = {
  Car,
  Crown,
  GitCompare,
  Scale,
  Tag,
  Calculator,
  FileText,
  Building2,
  ShieldCheck,
  HelpCircle,
  Users,
  MessageSquare,
  Inbox,
  Target,
  Database,
  Settings,
  Home,
}

function SidebarItem({ table, onClick }) {
  const Icon = ICONS[table.icon] || Database
  return (
    <NavLink
      to={`/t/${table.id}`}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-900 text-white dark:bg-brand-100 dark:text-brand-950'
            : 'text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-800'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{table.label}</span>
    </NavLink>
  )
}

export function Layout({ user, onSignOut, isAdmin }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Open subgroups by default if any active route is inside them.
  const [openSubGroups, setOpenSubGroups] = useState(() => {
    const init = new Set()
    Object.values(TABLE_GROUPS).forEach((items) => {
      items.forEach((t) => {
        if (t.subGroup && location.pathname === `/t/${t.id}`) {
          init.add(`${t.group}::${t.subGroup}`)
        }
      })
    })
    return init
  })

  const toggleSubGroup = (key) => {
    setOpenSubGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSignOut = async () => {
    await onSignOut()
    navigate('/')
  }

  const handleChangeConfig = () => {
    if (
      confirm(
        'ต้องการเปลี่ยน Supabase URL / Anon Key ใหม่ใช่ไหม?\n\n' +
          'ระบบจะออกจากระบบและให้กรอก credentials ใหม่'
      )
    ) {
      clearSupabaseConfig()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex bg-brand-50 dark:bg-brand-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-72 flex-shrink-0
          bg-white dark:bg-brand-900 border-r border-brand-200 dark:border-brand-800
          flex flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-brand-200 dark:border-brand-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-900 dark:bg-brand-100 text-white dark:text-brand-950 flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">AVATR</div>
              <div className="text-[10px] text-brand-500 uppercase tracking-wider">
                Admin Panel
              </div>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded hover:bg-brand-100 dark:hover:bg-brand-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 mb-4 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-900 text-white dark:bg-brand-100 dark:text-brand-950 font-medium'
                  : 'text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-800'
              }`
            }
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">ภาพรวม</span>
          </NavLink>

          {Object.entries(TABLE_GROUPS).map(([group, tables]) => {
            const GroupIcon = ICONS[GROUP_ICONS[group]] || Database
            const directItems = tables.filter((t) => !t.subGroup)
            const subGroupBuckets = new Map()
            for (const t of tables) {
              if (!t.subGroup) continue
              if (!subGroupBuckets.has(t.subGroup)) subGroupBuckets.set(t.subGroup, [])
              subGroupBuckets.get(t.subGroup).push(t)
            }

            return (
              <div key={group} className="mb-5">
                <div className="px-3 mb-1.5 text-[11px] font-semibold text-brand-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GroupIcon className="w-3 h-3" />
                  {group}
                </div>

                {directItems.map((table) => (
                  <SidebarItem
                    key={table.id}
                    table={table}
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}

                {[...subGroupBuckets.entries()].map(([sub, items]) => {
                  const subKey = `${group}::${sub}`
                  const isOpen = openSubGroups.has(subKey)
                  return (
                    <div key={sub}>
                      <button
                        type="button"
                        onClick={() => toggleSubGroup(subKey)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                      >
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                        <span className="truncate">{sub}</span>
                        <span className="ml-auto text-[10px] text-brand-400">{items.length}</span>
                      </button>
                      {isOpen && (
                        <div className="ml-4 border-l border-brand-200 dark:border-brand-800 pl-1 mt-0.5">
                          {items.map((table) => (
                            <SidebarItem
                              key={table.id}
                              table={table}
                              onClick={() => setSidebarOpen(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-brand-200 dark:border-brand-800 space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs">
            <div className="w-8 h-8 rounded-full bg-brand-200 dark:bg-brand-800 flex items-center justify-center font-semibold text-brand-700 dark:text-brand-300">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-brand-900 dark:text-brand-100">
                {user?.email || 'Unknown'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 !text-[9px] !px-1.5">
                    <ShieldCheckIcon className="w-2.5 h-2.5" />
                    Admin
                  </span>
                ) : (
                  <span className="badge bg-brand-100 text-brand-600 dark:bg-brand-800 dark:text-brand-400 !text-[9px] !px-1.5">
                    Support
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin-only: Settings button (hidden when using env config) */}
          {isAdmin && !isUsingEnvConfig() && (
            <button
              className="btn btn-ghost w-full !text-xs !py-1.5 !justify-start"
              onClick={handleChangeConfig}
              title="เปลี่ยน Supabase URL / Anon Key"
            >
              <Settings className="w-4 h-4" />
              ตั้งค่าการเชื่อมต่อ
            </button>
          )}

          <div className="flex gap-1">
            <button
              className="btn btn-ghost flex-1 !text-xs !py-1.5"
              onClick={toggle}
              title="เปลี่ยนธีม"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              className="btn btn-ghost flex-1 !text-xs !py-1.5 !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-950/40"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/80 dark:bg-brand-900/80 backdrop-blur border-b border-brand-200 dark:border-brand-800 px-4 py-3 flex items-center gap-3">
          <button
            className="p-1.5 rounded hover:bg-brand-100 dark:hover:bg-brand-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold">AVATR Admin</div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

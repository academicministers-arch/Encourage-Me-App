import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BookOpen, Heart, Settings as SettingsIcon,
  User, ChevronsLeft, ChevronsRight, LogOut, HeartHandshake, HandCoins, ShieldCheck,
} from 'lucide-react'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/journey', label: 'Emotional Journey', icon: TrendingUp },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/support', label: 'Support Organizations', icon: HeartHandshake },
  { to: '/consultation', label: 'Consultation', icon: HandCoins },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/testimonials', label: 'Testimonials', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-navy text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          {collapsed ? (
            <Logo size="sm" showWordmark={false} light />
          ) : (
            <Logo size="sm" light />
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring ${
                  isActive
                    ? 'bg-brand-green text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
          {user?.is_admin && (
            <>
              <NavLink
                to="/admin/consultants"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring ${
                    isActive
                      ? 'bg-brand-green text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
                title={collapsed ? 'Admin' : undefined}
              >
                <ShieldCheck size={19} className="shrink-0" />
                {!collapsed && <span>Admin</span>}
              </NavLink>
              {!collapsed && (
                <NavLink
                  to="/admin/organizations"
                  className={({ isActive }) =>
                    `ml-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring ${
                      isActive
                        ? 'bg-brand-green/20 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <HeartHandshake size={17} className="shrink-0" />
                  <span>Support Orgs</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors focus-ring"
          >
            <LogOut size={19} />
            {!collapsed && <span>Log out</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-colors focus-ring"
          >
            {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 bg-white border-b border-black/5 sticky top-0 z-20">
          <Logo size="sm" />
          <button
            onClick={logout}
            className="text-ink/50 hover:text-navy p-2 focus-ring rounded-lg"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <div className="flex justify-end px-4 md:px-8 pt-4">
            <div className="flex items-center gap-3 rounded-full border border-black/5 bg-white px-3 py-2 shadow-sm">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-navy flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user?.name || 'User'} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-navy">{user?.name || 'User'}</p>
              </div>
            </div>
          </div>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-20 flex justify-around px-1 py-1.5">
          {NAV_ITEMS.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors focus-ring ${
                  isActive ? 'text-brand-green' : 'text-ink/45'
                }`
              }
            >
              <Icon size={20} />
              <span>{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
import { Link, useLocation } from 'react-router-dom'
import {
  Brain,
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  Search,
  GitCompare,
  FlaskConical,
  GraduationCap,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Documents', icon: FolderOpen, href: '/documents' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Search', icon: Search, href: '/search' },
  { label: 'Compare', icon: GitCompare, href: '/compare' },
  { label: 'Research', icon: FlaskConical, href: '/research' },
  { label: 'Study', icon: GraduationCap, href: '/study' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-[15px]">DocMind AI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className={cn('w-4.5 h-4.5', pathname === href ? 'text-indigo-600' : 'text-gray-400')} size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname === '/settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Settings size={18} className="text-gray-400" />
          Settings
        </Link>
        <div className="px-3 py-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-indigo-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-gray-700 font-medium truncate flex-1">{user?.name}</span>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600 transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

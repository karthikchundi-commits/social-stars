'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Star, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavLink { href: string; label: string; icon: React.ReactNode }
interface NavBarProps {
  links: NavLink[];
  role: 'therapist' | 'parent';
  children: React.ReactNode;
}

export function NavBar({ links, role, children }: NavBarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const homeHref = role === 'therapist' ? '/therapist' : '/parent-dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-500"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen
            ? <PanelLeftClose className="w-5 h-5" />
            : <PanelLeftOpen className="w-5 h-5" />}
        </button>

        <Link href={homeHref} className="flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span className="text-lg font-bold text-purple-600">Social Stars</span>
        </Link>

        {/* Horizontal links — shown on large screens when sidebar is closed */}
        {!sidebarOpen && (
          <div className="hidden lg:flex items-center gap-1 ml-4">
            {links.map((link) => {
              const isHome = link.href === homeHref;
              const active = isHome
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}>
                  <span className="w-4 h-4">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
            {role}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* Vertical Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="p-3 space-y-1 min-w-[14rem]">
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {links.map((link) => {
              const isHome = link.href === homeHref;
              const active = isHome
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <span className="flex-shrink-0 w-4 h-4">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-gray-100">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

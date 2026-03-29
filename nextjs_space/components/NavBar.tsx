'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, Star } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavLink { href: string; label: string; icon: React.ReactNode }
interface NavBarProps { links: NavLink[]; role: 'therapist' | 'parent' }

export function NavBar({ links, role }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={role === 'therapist' ? '/therapist' : '/parent-dashboard'} className="flex items-center gap-2">
          <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-purple-600 hidden sm:block">Social Stars</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
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

        {/* Right: logout + mobile hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-all">
            {open ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <span className="w-4 h-4">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}

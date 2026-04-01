'use client';
import { NavBar } from '@/components/NavBar';
import { LayoutDashboard, Users } from 'lucide-react';

const PARENT_LINKS = [
  { href: '/parent-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/select-child', label: 'My Children', icon: <Users className="w-4 h-4" /> },
];

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavBar links={PARENT_LINKS} role="parent">
      {children}
    </NavBar>
  );
}

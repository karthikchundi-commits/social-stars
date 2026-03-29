'use client';
import { NavBar } from '@/components/NavBar';
import { Users, PenLine, Sparkles, Calendar, TrendingUp, Plus, BookOpen, Play, CreditCard } from 'lucide-react';

const THERAPIST_LINKS = [
  { href: '/therapist', label: 'Portal', icon: <Users className="w-4 h-4" /> },
  { href: '/therapist/create', label: 'Create', icon: <PenLine className="w-4 h-4" /> },
  { href: '/therapist/generate', label: 'AI Generate', icon: <Sparkles className="w-4 h-4" /> },
  { href: '/therapist/plan', label: 'Therapy Plan', icon: <Calendar className="w-4 h-4" /> },
  { href: '/therapist/insights', label: 'Insights', icon: <TrendingUp className="w-4 h-4" /> },
  { href: '/therapist/enroll', label: 'Enroll Family', icon: <Plus className="w-4 h-4" /> },
  { href: '/story-builder', label: 'Story Builder', icon: <BookOpen className="w-4 h-4" /> },
  { href: '/circle/host', label: 'Circle Time', icon: <Play className="w-4 h-4" /> },
  { href: '/pricing', label: 'Pricing', icon: <CreditCard className="w-4 h-4" /> },
];

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavBar links={THERAPIST_LINKS} role="therapist">
      {children}
    </NavBar>
  );
}

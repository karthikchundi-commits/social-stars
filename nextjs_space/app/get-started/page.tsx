'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Heart, Star, BookOpen, BarChart2, Wind,
  Stethoscope, ClipboardList, Users, Link as LinkIcon,
  ArrowRight, LogIn, Check, Zap, Crown,
} from 'lucide-react';

const PARENT_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    color: 'from-gray-400 to-gray-500',
    features: ['1 child profile', '10 starter activities', 'Progress tracking', 'Stars & badges'],
  },
  {
    name: 'Family',
    price: '$9',
    period: '/month',
    highlight: true,
    color: 'from-pink-500 to-orange-400',
    features: ['Up to 3 children', 'All 50+ activities', 'Adaptive difficulty', 'Therapist connection', 'Weekly reports'],
  },
  {
    name: 'Premium',
    price: '$19',
    period: '/month',
    highlight: false,
    color: 'from-purple-500 to-indigo-500',
    features: ['Unlimited children', 'All Family features', 'PDF progress exports', 'Priority support', 'Early access'],
  },
];

const THERAPIST_PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    highlight: false,
    color: 'from-gray-400 to-gray-500',
    features: ['Up to 3 families', 'Assign activities', 'View progress', 'Basic planning'],
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    highlight: true,
    color: 'from-purple-500 to-indigo-500',
    features: ['Up to 20 families', 'AI activity generation', 'Custom activities', 'Struggle alerts', 'Insights & analytics'],
  },
  {
    name: 'Practice',
    price: '$79',
    period: '/month',
    highlight: false,
    color: 'from-teal-500 to-emerald-500',
    features: ['Unlimited families', 'Multi-therapist team', 'White-label reports', 'HIPAA data export', 'Dedicated support'],
  },
];

type Role = 'parent' | 'therapist' | null;

const PARENT_BENEFITS = [
  { icon: <Heart className="w-6 h-6" />, color: 'from-pink-400 to-red-400', title: 'Track Your Child\'s Progress', desc: 'See completed activities, earned stars, and mood check-ins from one easy dashboard.' },
  { icon: <Star className="w-6 h-6" />, color: 'from-yellow-400 to-orange-400', title: 'Reward & Motivate', desc: 'Children earn badges and stars that celebrate every milestone, big or small.' },
  { icon: <BookOpen className="w-6 h-6" />, color: 'from-blue-400 to-purple-500', title: 'Interactive Activities', desc: 'Emotion games, social scenarios, breathing exercises, and stories — all designed for ages 3–6.' },
  { icon: <Wind className="w-6 h-6" />, color: 'from-teal-400 to-green-500', title: 'Emotional Regulation', desc: 'Guided breathing and calm-down activities help children manage big feelings.' },
  { icon: <BarChart2 className="w-6 h-6" />, color: 'from-purple-400 to-pink-500', title: 'Detailed Insights', desc: 'Charts and streak counts show patterns so you can support your child\'s learning at home.' },
  { icon: <LinkIcon className="w-6 h-6" />, color: 'from-indigo-400 to-blue-500', title: 'Connect with Therapists', desc: 'Link to your child\'s therapist and receive personalised activity assignments directly in the app.' },
];

const THERAPIST_BENEFITS = [
  { icon: <ClipboardList className="w-6 h-6" />, color: 'from-purple-400 to-pink-500', title: 'Enroll Families Easily', desc: 'Generate a personalised registration link for each family — no manual setup required.' },
  { icon: <Users className="w-6 h-6" />, color: 'from-blue-400 to-indigo-500', title: 'Manage All Your Clients', desc: 'View each child\'s progress, recent moods, and achievements from a single portal.' },
  { icon: <Star className="w-6 h-6" />, color: 'from-yellow-400 to-orange-400', title: 'Assign Activities', desc: 'Prescribe specific activities to individual children and add clinical notes for parents.' },
  { icon: <BookOpen className="w-6 h-6" />, color: 'from-green-400 to-teal-500', title: 'Build Custom Stories', desc: 'Use the Story Builder to create bespoke interactive stories tailored to each child\'s goals.' },
  { icon: <BarChart2 className="w-6 h-6" />, color: 'from-pink-400 to-red-400', title: 'Track Outcomes', desc: 'Monitor engagement, mood trends, and activity streaks to inform your treatment plans.' },
  { icon: <Heart className="w-6 h-6" />, color: 'from-teal-400 to-green-500', title: 'Evidence-Based Activities', desc: 'All activities are aligned with ASD social-skills research and adapted for early childhood.' },
];

export default function GetStartedPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [role, setRole] = useState<Role>(null);

  const handleBackToHome = () => {
    const userRole = (session?.user as any)?.role;
    if (userRole === 'therapist') router.push('/therapist');
    else if (userRole === 'parent') router.push('/parent-dashboard');
    else router.push('/');
  };

  if (role === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <button onClick={handleBackToHome} className="mb-10 flex items-center gap-2 text-gray-500 hover:text-purple-600 font-semibold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="text-4xl font-bold text-purple-600 mb-3">Who are you?</h1>
          <p className="text-gray-500 text-lg">Choose your role to get started with Social Stars.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Parent Tile */}
          <button
            onClick={() => setRole('parent')}
            className="group bg-white rounded-3xl shadow-xl p-10 text-left hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-pink-300"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform">
              👨‍👩‍👧
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">I'm a Parent / Guardian</h2>
            <p className="text-gray-500 mb-6">Help your child build social and emotional skills through fun, therapist-backed activities.</p>
            <span className="inline-flex items-center gap-2 text-pink-500 font-bold">
              Get started <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          {/* Therapist Tile */}
          <button
            onClick={() => setRole('therapist')}
            className="group bg-white rounded-3xl shadow-xl p-10 text-left hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-purple-300"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform">
              🩺
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">I'm a Therapist / Teacher</h2>
            <p className="text-gray-500 mb-6">Manage your clients, assign personalised activities, and track outcomes — all in one place.</p>
            <span className="inline-flex items-center gap-2 text-purple-500 font-bold">
              Get started <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  const isParent = role === 'parent';
  const benefits = isParent ? PARENT_BENEFITS : THERAPIST_BENEFITS;
  const accent = isParent ? 'from-pink-500 to-orange-400' : 'from-purple-500 to-indigo-500';
  const title = isParent ? 'Social Stars for Parents' : 'Social Stars for Therapists';
  const subtitle = isParent
    ? 'Everything you need to support your child\'s social and emotional growth at home.'
    : 'A powerful toolkit to extend your therapy sessions into your clients\' daily lives.';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setRole(null)} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-purple-600 font-semibold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Choose a different role
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-br ${accent} rounded-3xl p-10 text-white mb-10 shadow-2xl`}>
          <div className="text-5xl mb-4">{isParent ? '👨‍👩‍👧' : '🩺'}</div>
          <h1 className="text-4xl font-bold mb-3">{title}</h1>
          <p className="text-lg opacity-90">{subtitle}</p>
        </div>

        {/* Benefits Grid */}
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Why Social Stars?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className={`w-12 h-12 bg-gradient-to-br ${b.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                {b.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Plans */}
        <h2 className="text-2xl font-bold text-gray-700 mb-6 mt-2">Choose a plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {(isParent ? PARENT_PLANS : THERAPIST_PLANS).map((plan, i) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 shadow-md flex flex-col overflow-hidden transition-all ${
                plan.highlight ? 'border-purple-400 shadow-xl scale-105' : 'border-gray-100'
              }`}
            >
              {plan.highlight && (
                <div className={`text-center text-xs font-bold text-white py-2 bg-gradient-to-r ${plan.color}`}>
                  Most Popular
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-3`}>
                  {i === 0 ? <Star className="w-5 h-5" /> : i === 1 ? <Zap className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 stroke-[3]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Ready to begin?</h3>
            <p className="text-gray-500 text-sm">Sign in if you already have an account, or create one for free.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => router.push(`/auth/login?role=${role}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all"
            >
              <LogIn className="w-5 h-5" /> Sign In
            </button>
            <button
              onClick={() => router.push(`/auth/signup?role=${role}`)}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${accent} text-white font-bold rounded-2xl hover:opacity-90 transition-all`}
            >
              Create Account <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

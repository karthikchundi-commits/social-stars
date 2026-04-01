'use client';

import { useState } from 'react';
import { Check, Star, Zap, Crown, Users, Sparkles, TrendingUp, BookOpen, Brain, Shield } from 'lucide-react';
import Link from 'next/link';

const PARENT_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the basics for one child.',
    color: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: null,
    icon: <Star className="w-6 h-6" />,
    features: [
      '1 child profile',
      'Access to 10 starter activities',
      'Basic progress tracking',
      'Star & badge rewards',
      'Daily mood check-in',
    ],
    missing: [
      'Unlimited activities',
      'Therapist connection',
      'Detailed analytics',
      'Multiple children',
    ],
    cta: 'Start Free',
    ctaHref: '/get-started',
  },
  {
    name: 'Family',
    price: '$9',
    period: 'per month',
    description: "Everything you need for your family's growth journey.",
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    badge: 'Most Popular',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Up to 3 child profiles',
      'All 50+ activities unlocked',
      'Real-time adaptive difficulty',
      'Mood-based recommendations',
      'Therapist connection portal',
      'Weekly progress reports',
      'Activity streak tracking',
    ],
    missing: [
      'Unlimited children',
      'Priority support',
    ],
    cta: 'Start 14-Day Trial',
    ctaHref: '/get-started',
  },
  {
    name: 'Premium',
    price: '$19',
    period: 'per month',
    description: 'Full power for families with multiple children or complex needs.',
    color: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    badge: 'Best Value',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited child profiles',
      'All 50+ activities unlocked',
      'Real-time adaptive difficulty',
      'Mood-based recommendations',
      'Therapist connection portal',
      'Detailed analytics dashboard',
      'Export progress reports (PDF)',
      'Priority email support',
      'Early access to new activities',
    ],
    missing: [],
    cta: 'Start 14-Day Trial',
    ctaHref: '/get-started',
  },
];

const THERAPIST_PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Try the platform with a small caseload.',
    color: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: null,
    icon: <Users className="w-6 h-6" />,
    features: [
      'Up to 3 client families',
      'Assign existing activities',
      'View client progress',
      'Basic therapy planning',
    ],
    missing: [
      'AI activity generation',
      'Custom activity creation',
      'Struggle alerts',
      'Insights & analytics',
      'Unlimited clients',
    ],
    cta: 'Start Free',
    ctaHref: '/get-started',
  },
  {
    name: 'Professional',
    price: '$29',
    period: 'per month',
    description: 'The complete toolkit for private practice therapists.',
    color: 'from-purple-500 to-indigo-500',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    badge: 'Most Popular',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      'Up to 20 client families',
      'AI-powered activity generation',
      'Custom activity creation & editing',
      'Real-time struggle alerts',
      'Therapy plan builder',
      'Client insights & analytics',
      'Circle Time sessions',
      'Story Builder tool',
      '7-day performance history',
    ],
    missing: [
      'Unlimited clients',
      'White-label reports',
    ],
    cta: 'Start 14-Day Trial',
    ctaHref: '/get-started',
  },
  {
    name: 'Practice',
    price: '$79',
    period: 'per month',
    description: 'Built for clinics, schools, and multi-therapist teams.',
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    badge: 'For Teams',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited client families',
      'All Professional features',
      'Multiple therapist accounts',
      'Shared activity library',
      'White-label progress reports',
      'Advanced cohort analytics',
      'HIPAA-compliant data export',
      'Dedicated account manager',
      'Custom onboarding & training',
    ],
    missing: [],
    cta: 'Contact Sales',
    ctaHref: 'mailto:hello@socialstars.app',
  },
];

const FEATURES_COMPARISON = [
  { label: 'AI Activity Generation', therapist: ['—', 'Professional', 'Practice'], parent: ['—', '—', '—'] },
  { label: 'Real-time Adaptive Difficulty', therapist: ['—', '✓', '✓'], parent: ['—', '✓', '✓'] },
  { label: 'Mood-based Recommendations', therapist: ['—', '✓', '✓'], parent: ['—', '✓', '✓'] },
  { label: 'Struggle Alerts', therapist: ['—', '✓', '✓'], parent: ['—', '—', '—'] },
  { label: 'Progress Reports', therapist: ['Basic', 'Full', 'White-label'], parent: ['—', 'Weekly', 'PDF Export'] },
  { label: 'Priority Support', therapist: ['—', '—', '✓'], parent: ['—', '—', '✓'] },
];

export default function PricingPage() {
  const [tab, setTab] = useState<'parent' | 'therapist'>('parent');
  const plans = tab === 'parent' ? PARENT_PLANS : THERAPIST_PLANS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-purple-700" />
            Simple, transparent pricing
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Plans for every family<br />
            <span className="text-purple-600">and every practice</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-1.5 flex gap-1 shadow-sm">
            <button
              onClick={() => setTab('parent')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === 'parent'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              For Parents
            </button>
            <button
              onClick={() => setTab('therapist')}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === 'therapist'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              For Therapists
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border-2 ${plan.border} bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden ${
                i === 1 ? 'scale-105 shadow-xl border-purple-400' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute top-0 left-0 right-0 text-center py-2 text-xs font-bold text-white bg-gradient-to-r ${plan.color}`}>
                  {plan.badge}
                </div>
              )}

              <div className={`p-8 ${plan.badge ? 'pt-12' : 'pt-8'} flex flex-col flex-1`}>
                {/* Icon + Name */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} text-white mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 ml-2 text-sm">/{plan.period}</span>
                </div>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className={`block text-center py-3 px-6 rounded-2xl font-bold text-sm transition-all mb-8 ${
                    i === 1
                      ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-md`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Included Features */}
                <div className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                      </div>
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-start gap-3 opacity-40">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                        <span className="text-gray-400 text-xs font-bold">—</span>
                      </div>
                      <span className="text-sm text-gray-400 line-through">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why Social Stars */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Why families & therapists choose Social Stars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Brain className="w-6 h-6 text-purple-600" />, title: 'Evidence-Based', desc: 'Activities grounded in ABA and social-emotional learning research.' },
              { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: 'Real-Time Adaptive', desc: "Difficulty adjusts live based on each child's mood and performance." },
              { icon: <Shield className="w-6 h-6 text-green-600" />, title: 'Safe & Private', desc: 'No ads, no third-party data sharing. Your family\'s data stays yours.' },
              { icon: <TrendingUp className="w-6 h-6 text-blue-500" />, title: 'Measurable Progress', desc: 'Detailed charts and reports show exactly how skills are developing.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 mb-3">
                  {item.icon}
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes — upgrade or downgrade at any time. Changes take effect at your next billing cycle.',
              },
              {
                q: 'What happens after the free trial?',
                a: "You'll be prompted to choose a plan. If you don't upgrade, your account reverts to the free tier with no charge.",
              },
              {
                q: "Is my child's data safe?",
                a: "Absolutely. We don't sell or share data with third parties. Child profiles are private and only visible to the linked parent and therapist.",
              },
              {
                q: 'Can a parent and therapist both access the same child?',
                a: 'Yes. Therapists can enroll families and view progress. Parents control what activities are assigned.',
              },
              {
                q: 'Do you offer discounts for clinics or schools?',
                a: 'Yes — contact us for volume pricing on the Practice plan for teams of 3+ therapists.',
              },
              {
                q: 'Is there a mobile app?',
                a: 'Social Stars runs in any modern mobile browser with a responsive layout. A native app is on our roadmap.',
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-pink-500 p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-purple-100 mb-8 text-lg">Join hundreds of families building social skills every day.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/get-started" className="px-8 py-3 bg-white text-purple-700 font-bold rounded-2xl hover:bg-purple-50 transition-all shadow-md">
              Create Free Account
            </Link>
            <Link href="mailto:hello@socialstars.app" className="px-8 py-3 bg-white/20 text-white font-bold rounded-2xl hover:bg-white/30 transition-all border border-white/30">
              Talk to Sales
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Star, Zap, Crown, Brain, Shield, TrendingUp, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const PARENT_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the basics for one child.',
    color: 'from-gray-400 to-gray-500',
    border: 'border-gray-200',
    badge: null,
    icon: <Star className="w-6 h-6" />,
    features: ['1 child profile', 'Access to 10 starter activities', 'Basic progress tracking', 'Star & badge rewards', 'Daily mood check-in'],
    missing: ['Unlimited activities', 'Therapist connection', 'Detailed analytics', 'Multiple children'],
    cta: 'Start Free',
    ctaHref: '/get-started',
  },
  {
    name: 'Family',
    price: '$9',
    period: 'per month',
    description: "Everything you need for your family's growth journey.",
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-300',
    badge: 'Most Popular',
    icon: <Zap className="w-6 h-6" />,
    features: ['Up to 3 child profiles', 'All 50+ activities unlocked', 'Real-time adaptive difficulty', 'Mood-based recommendations', 'Therapist connection portal', 'Weekly progress reports', 'Activity streak tracking'],
    missing: ['Unlimited children', 'Priority support'],
    cta: 'Start 14-Day Trial',
    ctaHref: '/get-started',
  },
  {
    name: 'Premium',
    price: '$19',
    period: 'per month',
    description: 'Full power for families with multiple children or complex needs.',
    color: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-300',
    badge: 'Best Value',
    icon: <Crown className="w-6 h-6" />,
    features: ['Unlimited child profiles', 'All 50+ activities unlocked', 'Real-time adaptive difficulty', 'Mood-based recommendations', 'Therapist connection portal', 'Detailed analytics dashboard', 'Export progress reports (PDF)', 'Priority email support', 'Early access to new activities'],
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
    border: 'border-gray-200',
    badge: null,
    icon: <Star className="w-6 h-6" />,
    features: ['Up to 3 client families', 'Assign existing activities', 'View client progress', 'Basic therapy planning'],
    missing: ['AI activity generation', 'Custom activity creation', 'Struggle alerts', 'Insights & analytics', 'Unlimited clients'],
    cta: 'Start Free',
    ctaHref: '/get-started',
  },
  {
    name: 'Professional',
    price: '$29',
    period: 'per month',
    description: 'The complete toolkit for private practice therapists.',
    color: 'from-purple-500 to-indigo-500',
    border: 'border-purple-300',
    badge: 'Most Popular',
    icon: <Zap className="w-6 h-6" />,
    features: ['Up to 20 client families', 'AI-powered activity generation', 'Custom activity creation & editing', 'Real-time struggle alerts', 'Therapy plan builder', 'Client insights & analytics', 'Circle Time sessions', 'Story Builder tool', '7-day performance history'],
    missing: ['Unlimited clients', 'White-label reports'],
    cta: 'Start 14-Day Trial',
    ctaHref: '/get-started',
  },
  {
    name: 'Practice',
    price: '$79',
    period: 'per month',
    description: 'Built for clinics, schools, and multi-therapist teams.',
    color: 'from-teal-500 to-emerald-500',
    border: 'border-teal-300',
    badge: 'For Teams',
    icon: <Crown className="w-6 h-6" />,
    features: ['Unlimited client families', 'All Professional features', 'Multiple therapist accounts', 'Shared activity library', 'White-label progress reports', 'Advanced cohort analytics', 'HIPAA-compliant data export', 'Dedicated account manager', 'Custom onboarding & training'],
    missing: [],
    cta: 'Contact Sales',
    ctaHref: 'mailto:hello@socialstars.app',
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession() || {};
  const role = (session?.user as any)?.role as 'parent' | 'therapist' | undefined;
  const router = useRouter();

  const [therapistPlans, setTherapistPlans] = useState<any[]>([]);
  const [therapistInfo, setTherapistInfo] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Fetch therapist-managed subscription if parent
  useEffect(() => {
    if (status === 'authenticated' && role === 'parent') {
      setLoadingSubscription(true);
      fetch('/api/parent/subscription')
        .then((r) => r.json())
        .then((data) => {
          if (data.subscription?.therapist) {
            setTherapistInfo(data.subscription.therapist);
          }
        })
        .finally(() => setLoadingSubscription(false));
    }
  }, [status, role]);

  // Fetch therapist's custom plans when we know the therapist
  useEffect(() => {
    if (!therapistInfo?.id) return;
    fetch(`/api/parent/therapist-plans?therapistId=${therapistInfo.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.plans?.length > 0) setTherapistPlans(data.plans);
      });
  }, [therapistInfo]);

  const selectPlan = async (planId: string) => {
    setSelectingPlanId(planId);
    try {
      const res = await fetch('/api/parent/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        setSelectedPlanId(planId);
        setTimeout(() => router.push('/parent-dashboard'), 1200);
      }
    } finally {
      setSelectingPlanId(null);
    }
  };

  // Determine what to show
  const isParent = role === 'parent' || !role; // unauthenticated defaults to parent view
  const isTherapist = role === 'therapist';
  const hasTherapistPlans = therapistPlans.length > 0;

  const backHref = isTherapist ? '/therapist' : '/parent-dashboard';

  if (loadingSubscription) {
    return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Back link for authenticated users */}
        {status === 'authenticated' && (
          <Link href={backHref} className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-purple-700" />
            {hasTherapistPlans ? 'Plans from your therapist' : 'Simple, transparent pricing'}
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {isTherapist
              ? <>Plans for your<br /><span className="text-purple-600">practice</span></>
              : hasTherapistPlans
              ? <>{therapistInfo?.name ?? 'Your Therapist'}'s<br /><span className="text-purple-600">Subscription Plans</span></>
              : <>Plans for every<br /><span className="text-purple-600">family</span></>
            }
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {isTherapist
              ? 'Choose the plan that fits your caseload.'
              : hasTherapistPlans
              ? 'Your connected therapist has designed these plans for enrolled families.'
              : 'Start free. Upgrade when you\'re ready. Cancel anytime.'}
          </p>
          {hasTherapistPlans && therapistInfo && (
            <div className="inline-flex items-center gap-2 mt-3 text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-full">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {therapistInfo.name?.charAt(0) ?? 'T'}
              </span>
              {therapistInfo.name}
              {(therapistInfo.city || therapistInfo.state) && (
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {[therapistInfo.city, therapistInfo.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        {hasTherapistPlans ? (
          /* ── Therapist custom plans ── */
          <div className={`grid grid-cols-1 gap-6 mb-20 ${therapistPlans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : therapistPlans.length === 1 ? 'max-w-sm mx-auto' : 'md:grid-cols-3'}`}>
            {therapistPlans.map((plan: any, i: number) => {
              const features: string[] = JSON.parse(plan.features ?? '[]');
              const isMiddle = therapistPlans.length === 3 && i === 1;
              return (
                <div key={plan.id} className={`relative rounded-3xl border-2 bg-white flex flex-col overflow-hidden transition-all ${
                  isMiddle ? 'border-purple-400 shadow-xl scale-105' : 'border-gray-100 shadow-sm hover:shadow-lg'
                }`}>
                  {isMiddle && (
                    <div className="text-center py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500">
                      Recommended
                    </div>
                  )}
                  <div className={`p-8 ${isMiddle ? 'pt-6' : 'pt-8'} flex flex-col flex-1`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                    {plan.description && <p className="text-sm text-gray-500 mb-4">{plan.description}</p>}
                    <div className="mb-6">
                      <span className="text-5xl font-extrabold text-gray-900">${plan.pricePerMonth}</span>
                      <span className="text-gray-400 ml-2 text-sm">/month</span>
                    </div>
                    <button
                      onClick={() => selectPlan(plan.id)}
                      disabled={!!selectingPlanId || selectedPlanId === plan.id}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-sm transition-all mb-8 disabled:opacity-60 ${
                        selectedPlanId === plan.id
                          ? 'bg-green-500 text-white'
                          : isMiddle
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedPlanId === plan.id ? (
                        <><CheckCircle className="w-4 h-4" /> Selected!</>
                      ) : selectingPlanId === plan.id ? (
                        'Selecting...'
                      ) : (
                        'Select This Plan'
                      )}
                    </button>
                    <div className="space-y-3 flex-1">
                      {features.map((f) => (
                        <div key={f} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                          </div>
                          <span className="text-sm text-gray-700">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Standard plans (parent or therapist) ── */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {(isTherapist ? THERAPIST_PLANS : PARENT_PLANS).map((plan, i) => (
              <div key={plan.name} className={`relative rounded-3xl border-2 ${plan.border} bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden ${i === 1 ? 'scale-105 shadow-xl' : ''}`}>
                {plan.badge && (
                  <div className={`text-center py-2 text-xs font-bold text-white bg-gradient-to-r ${plan.color}`}>
                    {plan.badge}
                  </div>
                )}
                <div className={`p-8 ${plan.badge ? 'pt-6' : 'pt-8'} flex flex-col flex-1`}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} text-white mb-4`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 ml-2 text-sm">/{plan.period}</span>
                  </div>
                  <Link href={plan.ctaHref}
                    className={`block text-center py-3 px-6 rounded-2xl font-bold text-sm transition-all mb-8 ${
                      i === 1
                        ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-md`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {plan.cta}
                  </Link>
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
        )}

        {/* Why Social Stars — only shown to non-authenticated or parent without therapist plans */}
        {!hasTherapistPlans && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
              Why families {isTherapist ? '& therapists ' : ''}choose Social Stars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Brain className="w-6 h-6 text-purple-600" />, title: 'Evidence-Based', desc: 'Activities grounded in ABA and social-emotional learning research.' },
                { icon: <TrendingUp className="w-6 h-6 text-yellow-500" />, title: 'Real-Time Adaptive', desc: "Difficulty adjusts live based on each child's mood and performance." },
                { icon: <Shield className="w-6 h-6 text-green-600" />, title: 'Safe & Private', desc: "No ads, no third-party data sharing. Your family's data stays yours." },
                { icon: <TrendingUp className="w-6 h-6 text-blue-500" />, title: 'Measurable Progress', desc: 'Detailed charts and reports show exactly how skills are developing.' },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 mb-3">{item.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-pink-500 p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">
            {hasTherapistPlans ? 'Questions about your plan?' : 'Ready to get started?'}
          </h2>
          <p className="text-purple-100 mb-8 text-lg">
            {hasTherapistPlans
              ? 'Reach out to your therapist directly to discuss plan options.'
              : 'Join hundreds of families building social skills every day.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {hasTherapistPlans ? (
              <Link href="/parent-dashboard" className="px-8 py-3 bg-white text-purple-700 font-bold rounded-2xl hover:bg-purple-50 transition-all shadow-md">
                Back to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/get-started" className="px-8 py-3 bg-white text-purple-700 font-bold rounded-2xl hover:bg-purple-50 transition-all shadow-md">
                  Create Free Account
                </Link>
                <Link href="mailto:hello@socialstars.app" className="px-8 py-3 bg-white/20 text-white font-bold rounded-2xl hover:bg-white/30 transition-all border border-white/30">
                  Talk to Sales
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

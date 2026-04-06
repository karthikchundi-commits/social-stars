'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { CheckCircle, Lock, Baby, Target, User, AlertCircle, LogIn } from 'lucide-react';

interface EnrollmentData {
  token: string;
  parentName: string;
  parentEmail: string;
  therapistName: string;
  goals: string | null;
  children: { name: string; age: number; notes: string | null }[];
}

export default function EnrollPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-2xl font-bold text-purple-600">Loading...</div></div>}>
      <EnrollForm />
    </Suspense>
  );
}

function EnrollForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('No enrollment token found in this link.');
      setLoading(false);
      return;
    }
    fetch(`/api/enroll?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error || 'Invalid enrollment link.');
        } else {
          setEnrollment(data.enrollment);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Failed to load enrollment details.');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setSubmitError(data.error || 'Registration failed. Please try again.');
      return;
    }

    // Auto sign-in so the parent doesn't have to log in again manually
    const signInResult = await signIn('credentials', {
      email: data.email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (signInResult?.ok) {
      router.replace('/parent-dashboard');
    } else {
      // Sign-in failed for some reason — fall back to showing success + manual login
      setDone(true);
    }
  };

  if (loading) return null;

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Unavailable</h1>
          <p className="text-gray-500 mb-6">{loadError}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">You're all set!</h1>
          <p className="text-gray-500 mb-2">
            Your account has been created and linked to <strong>{enrollment?.therapistName}</strong>'s practice.
          </p>
          <p className="text-gray-500 mb-8">
            Your children's profiles are ready. Log in to start exploring activities together.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Log In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="text-4xl font-bold text-purple-600 mb-2">Welcome to Social Stars!</h1>
          <p className="text-gray-500 text-lg">
            <strong>{enrollment!.therapistName}</strong> has invited you to join. Complete your registration below.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">

          {/* Pre-filled parent details */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" /> Your Account Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 mb-1">Full Name</p>
                <p className="font-semibold text-gray-800">{enrollment!.parentName}</p>
              </div>
              <div className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 mb-1">Email (your login)</p>
                <p className="font-semibold text-gray-800">{enrollment!.parentEmail}</p>
              </div>
            </div>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Baby className="w-5 h-5 text-pink-500" /> Child Profiles
            </h2>
            <div className="space-y-3">
              {enrollment!.children.map((child, i) => (
                <div key={i} className="bg-pink-50 border-2 border-pink-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{child.name}</p>
                      <p className="text-sm text-gray-500">Age {child.age}</p>
                    </div>
                  </div>
                  {child.notes && (
                    <p className="mt-2 text-sm text-gray-500 italic">{child.notes}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">These profiles will be created automatically when you register.</p>
          </section>

          {/* Treatment Goals */}
          {enrollment!.goals && (
            <section>
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" /> Treatment Goals
              </h2>
              <div className="bg-green-50 border-2 border-green-100 rounded-xl px-4 py-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{enrollment!.goals}</pre>
              </div>
            </section>
          )}

          {/* Set Password */}
          <section>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-500" /> Set Your Password
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="Repeat your password"
                  required
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-2"
              >
                <CheckCircle className="w-6 h-6" />
                {submitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Plus, Trash2, Send, Copy, Check,
  User, Mail, Baby, ClipboardList, Target,
} from 'lucide-react';

interface ProspectChild {
  name: string;
  age: string;
  notes: string;
}

export default function TherapistEnrollPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [children, setChildren] = useState<ProspectChild[]>([{ name: '', age: '4', notes: '' }]);
  const [notes, setNotes] = useState('');
  const [goals, setGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentLink, setEnrollmentLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'therapist') {
      router.push('/select-child');
    }
  }, [status]);

  const addChild = () => setChildren((prev) => [...prev, { name: '', age: '4', notes: '' }]);

  const removeChild = (i: number) => setChildren((prev) => prev.filter((_, idx) => idx !== i));

  const updateChild = (i: number, field: keyof ProspectChild, value: string) => {
    setChildren((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (children.some((c) => !c.name.trim())) {
      setError('Please enter a name for each child.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/therapist/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName,
        parentEmail,
        children: children.map((c) => ({ name: c.name, age: Number(c.age), notes: c.notes })),
        notes,
        goals,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || 'Failed to create enrollment.');
      return;
    }

    const origin = window.location.origin;
    setEnrollmentLink(`${origin}/enroll?token=${data.enrollment.token}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(enrollmentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setEnrollmentLink('');
    setParentName('');
    setParentEmail('');
    setChildren([{ name: '', age: '4', notes: '' }]);
    setNotes('');
    setGoals('');
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl font-bold text-purple-600">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/therapist')} className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700">
          <ArrowLeft className="w-5 h-5" /> Back to Portal
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">Enroll a Family</h1>
            <p className="text-gray-500 text-lg">Fill in the details below. We'll generate a personalised registration link to share with the parent.</p>
          </div>

          {/* Success state — show enrollment link */}
          {enrollmentLink ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Enrollment Created!</h2>
              <p className="text-gray-500 mb-6">Share this link with <strong>{parentName}</strong>. When they open it, their registration will be pre-filled and they'll be automatically linked to your account.</p>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6">
                <p className="text-sm text-purple-600 font-semibold mb-2">Enrollment Link</p>
                <p className="text-gray-800 break-all font-mono text-sm mb-4">{enrollmentLink}</p>
                <button
                  onClick={copyLink}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied to clipboard!' : 'Copy Link'}
                </button>
              </div>

              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-blue-700 mb-1">What happens next</p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>✅ Parent opens the link and sees their pre-filled details</li>
                  <li>✅ They set a password to complete registration</li>
                  <li>✅ Child profiles are created automatically</li>
                  <li>✅ They are instantly linked to your therapist account</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Enroll Another Family</button>
                <button onClick={() => router.push('/therapist')} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all">Back to Portal</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Parent Information */}
              <section>
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500" /> Parent / Guardian Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name *</label>
                    <input
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      placeholder="e.g. Sarah Johnson"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1"><Mail className="w-4 h-4" /> Email Address *</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      placeholder="parent@email.com"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Children */}
              <section>
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-pink-500" /> Child Information
                </h2>
                <div className="space-y-4">
                  {children.map((child, i) => (
                    <div key={i} className="border-2 border-gray-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-600">Child {i + 1}</span>
                        {children.length > 1 && (
                          <button type="button" onClick={() => removeChild(i)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                          <input
                            value={child.name}
                            onChange={(e) => updateChild(i, 'name', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                            placeholder="Child's name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Age</label>
                          <select
                            value={child.age}
                            onChange={(e) => updateChild(i, 'age', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                          >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) => (
                              <option key={a} value={a}>{a} years old</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Child Notes (optional)</label>
                        <input
                          value={child.notes}
                          onChange={(e) => updateChild(i, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                          placeholder="e.g. Prefers visual schedules, limited verbal communication"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addChild}
                    className="w-full py-3 border-2 border-dashed border-pink-300 rounded-2xl text-pink-600 font-semibold hover:border-pink-500 hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Another Child
                  </button>
                </div>
              </section>

              {/* Clinical Notes */}
              <section>
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" /> Clinical Notes
                  <span className="text-sm font-normal text-gray-400">(optional — visible to therapist only)</span>
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  rows={4}
                  placeholder="e.g. Diagnosis: ASD Level 2. Strengths in visual processing. Challenges with transitions and unexpected changes. Sensory sensitivities to loud noises..."
                />
              </section>

              {/* Treatment Goals */}
              <section>
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" /> Treatment Goals
                  <span className="text-sm font-normal text-gray-400">(optional — shared with parent)</span>
                </h2>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  rows={4}
                  placeholder={`e.g.\n• Improve emotion recognition (target: 80% accuracy)\n• Practice greeting peers independently\n• Use communication board to express 3+ needs daily\n• Complete 3 breathing exercises per week`}
                />
              </section>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Send className="w-6 h-6" />
                {submitting ? 'Creating Enrollment...' : 'Generate Enrollment Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

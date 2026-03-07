'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Copy, Check, Users, Star, Award,
  Plus, Trash2, BookOpen, ClipboardList, Quote,
} from 'lucide-react';

interface AssignedActivity {
  id: string;
  activityId: string;
  title: string;
  type: string;
  note: string | null;
  assignedAt: string;
}

interface ChildData {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  totalCompleted: number;
  achievements: number;
  recentMoods: string[];
  assignedActivities: AssignedActivity[];
}

interface Client {
  parentId: string;
  parentName: string;
  parentEmail: string;
  linkedAt: string;
  children: ChildData[];
}

interface Activity {
  id: string;
  title: string;
  type: string;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', tired: '😴',
  sad: '😢', anxious: '😟', angry: '😠', silly: '😜',
};

export default function TherapistPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignChild, setAssignChild] = useState<ChildData | null>(null);
  const [assignActivityId, setAssignActivityId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'therapist') router.push('/select-child');
      else fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    const [inviteRes, clientsRes, activitiesRes] = await Promise.all([
      fetch('/api/therapist/invite'),
      fetch('/api/therapist/clients'),
      fetch('/api/activities'),
    ]);
    const inviteData = await inviteRes.json();
    const clientsData = await clientsRes.json();
    const activitiesData = await activitiesRes.json();
    setInviteCode(inviteData.inviteCode ?? '');
    setClients(clientsData.clients ?? []);
    setActivities(activitiesData.activities ?? []);
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openAssign = (child: ChildData) => {
    setAssignChild(child);
    setAssignActivityId('');
    setAssignNote('');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignChild || !assignActivityId) return;
    setAssigning(true);
    await fetch('/api/therapist/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: assignChild.id, activityId: assignActivityId, note: assignNote }),
    });
    setShowAssignModal(false);
    setAssigning(false);
    fetchData();
  };

  const handleUnassign = async (childId: string, activityId: string) => {
    await fetch(`/api/therapist/assign?childId=${childId}&activityId=${activityId}`, { method: 'DELETE' });
    fetchData();
  };

  const totalChildren = clients.reduce((sum, c) => sum + c.children.length, 0);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-bold text-purple-600 mb-1">Therapist Portal</h1>
            <p className="text-xl text-gray-600">Welcome, {session?.user?.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/therapist/enroll')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" /> Enroll Family
            </button>
            <button
              onClick={() => router.push('/story-builder')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              <BookOpen className="w-5 h-5" /> Story Builder
            </button>
          </div>
        </div>

        {/* Invite Code */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Invite Code</h2>
          <p className="text-purple-100 mb-4">Share this code with parents so they can link to your account</p>
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-2xl px-8 py-4">
              <span className="text-4xl font-bold tracking-widest">{inviteCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="bg-white text-purple-600 font-bold px-6 py-4 rounded-2xl hover:bg-purple-50 transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Linked Families', value: clients.length, color: 'from-blue-400 to-blue-600', icon: <Users className="w-8 h-8" /> },
            { label: 'Total Children', value: totalChildren, color: 'from-purple-400 to-pink-500', icon: <Star className="w-8 h-8" /> },
            { label: 'Activities Assigned', value: clients.reduce((s, c) => s + c.children.reduce((cs, ch) => cs + ch.assignedActivities.length, 0), 0), color: 'from-green-400 to-teal-500', icon: <ClipboardList className="w-8 h-8" /> },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-3xl p-6 text-white shadow-xl`}>
              <div className="flex items-center justify-between">
                {stat.icon}
                <div className="text-right">
                  <div className="text-4xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Stories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-5 flex items-center gap-2">
            <Quote className="w-6 h-6 text-yellow-500" /> Customer Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "After just 3 weeks using Social Stars, Liam started greeting his classmates by name every morning. His teacher said she'd never seen him do that before.",
                name: 'Sarah M.',
                role: 'Parent of Liam, age 5',
                emoji: '🌟',
                color: 'from-yellow-50 to-orange-50',
                border: 'border-yellow-200',
              },
              {
                quote: "I assign breathing activities before school on Mondays. Two of my clients went from meltdowns to calm arrivals within a month. The data in the portal is invaluable.",
                name: 'Dr. Priya R.',
                role: 'Occupational Therapist',
                emoji: '🏆',
                color: 'from-purple-50 to-pink-50',
                border: 'border-purple-200',
              },
              {
                quote: "Maya now points to the emotion cards on the fridge and tells us how she feels. She used to shut down completely. Social Stars gave us a shared language.",
                name: 'James & Anya K.',
                role: 'Parents of Maya, age 4',
                emoji: '💜',
                color: 'from-blue-50 to-teal-50',
                border: 'border-blue-200',
              },
            ].map((story) => (
              <div key={story.name} className={`bg-gradient-to-br ${story.color} border-2 ${story.border} rounded-2xl p-6`}>
                <div className="text-3xl mb-3">{story.emoji}</div>
                <p className="text-gray-700 text-sm italic mb-4 leading-relaxed">&ldquo;{story.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{story.name}</p>
                  <p className="text-xs text-gray-500">{story.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No clients yet</h2>
            <p className="text-gray-500 mb-4">Click <strong>Enroll Family</strong> to generate a personalised registration link, or share your invite code with parents who already have an account.</p>
            <button
              onClick={() => router.push('/therapist/enroll')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" /> Enroll Your First Family
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {clients.map((client) => (
              <div key={client.parentId} className="bg-white rounded-3xl shadow-xl p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{client.parentName}</h2>
                  <p className="text-gray-500">{client.parentEmail}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {client.children.map((child) => (
                    <div key={child.id} className="border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all" style={{ borderTopColor: child.avatarColor, borderTopWidth: '4px' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: child.avatarColor }}>
                            {child.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{child.name}</div>
                            <div className="text-sm text-gray-500">Age {child.age}</div>
                          </div>
                        </div>
                        <button onClick={() => openAssign(child)} className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex gap-4 mb-3 text-sm">
                        <span className="flex items-center gap-1 text-blue-600 font-semibold"><Star className="w-4 h-4" />{child.totalCompleted}</span>
                        <span className="flex items-center gap-1 text-yellow-600 font-semibold"><Award className="w-4 h-4" />{child.achievements}</span>
                      </div>

                      {child.recentMoods.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Recent moods:</div>
                          <div className="flex gap-1">{child.recentMoods.map((m, i) => <span key={i} className="text-lg">{MOOD_EMOJI[m] ?? '😐'}</span>)}</div>
                        </div>
                      )}

                      {child.assignedActivities.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Assigned:</div>
                          <div className="space-y-1">
                            {child.assignedActivities.map((a) => (
                              <div key={a.id} className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-1">
                                <span className="text-xs font-semibold text-purple-700 truncate">{a.title}</span>
                                <button onClick={() => handleUnassign(child.id, a.activityId)} className="ml-2 text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Activity Modal */}
      {showAssignModal && assignChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-purple-600 mb-1">Assign Activity</h2>
            <p className="text-gray-500 mb-6">For {assignChild.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Activity</label>
                <select
                  value={assignActivityId}
                  onChange={(e) => setAssignActivityId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select an activity...</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>[{a.type}] {a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note for parent (optional)</label>
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="e.g. Practice this 3x per week..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
              <button
                onClick={handleAssign}
                disabled={!assignActivityId || assigning}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, User, LogOut, Star, Stethoscope, BookOpen, Link } from 'lucide-react';
import { AVATAR_COLORS } from '@/lib/constants';
import { signOut } from 'next-auth/react';

interface Child {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
}

export default function SelectChildPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkResult, setLinkResult] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('3');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChildren();
    }
  }, [status]);

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children');
      const data = await response.json();
      setChildren(data?.children ?? []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName,
          age: newChildAge,
          avatarColor: selectedColor,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewChildName('');
        setNewChildAge('3');
        fetchChildren();
      }
    } catch (error) {
      console.error('Error adding child:', error);
    }
  };

  const handleSelectChild = (childId: string) => {
    router.push(`/dashboard/${childId}`);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleParentDashboard = () => {
    router.push('/parent-dashboard');
  };

  const handleLinkTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/therapist/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: linkCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setLinkResult(`✅ Linked to ${data.therapistName}!`);
      setLinkCode('');
    } else {
      setLinkResult(`❌ ${data.error}`);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-purple-600 mb-2">Social Stars</h1>
            <p className="text-xl text-gray-600">Who's learning today?</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {userRole === 'therapist' ? (
              <>
                <button onClick={() => router.push('/therapist')} className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-2xl hover:bg-purple-600 transition-all flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" /> Therapist Portal
                </button>
                <button onClick={() => router.push('/story-builder')} className="px-6 py-3 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-all flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Story Builder
                </button>
              </>
            ) : (
              <>
                <button onClick={handleParentDashboard} className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2">
                  <Star className="w-5 h-5" /> Parent Dashboard
                </button>
                <button onClick={() => router.push('/story-builder')} className="px-6 py-3 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-all flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Story Builder
                </button>
                <button onClick={() => setShowLinkModal(true)} className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 transition-all flex items-center gap-2">
                  <Link className="w-5 h-5" /> Link Therapist
                </button>
              </>
            )}
            <button onClick={handleLogout} className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-2xl hover:bg-gray-600 transition-all flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children?.map?.((child) => (
            <button
              key={child?.id}
              onClick={() => handleSelectChild(child?.id ?? '')}
              className="child-card bg-white hover:bg-gray-50 text-left"
              style={{ borderTop: `6px solid ${child?.avatarColor ?? '#FF6B6B'}` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundColor: child?.avatarColor ?? '#FF6B6B' }}
                >
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{child?.name ?? 'Child'}</h3>
                  <p className="text-lg text-gray-600">Age {child?.age ?? 0}</p>
                </div>
              </div>
            </button>
          )) ?? null}

          {/* Add New Child Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="child-card bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 hover:border-purple-500 flex items-center justify-center gap-3 text-purple-600"
          >
            <Plus className="w-12 h-12" />
            <span className="text-2xl font-bold">Add Child</span>
          </button>
        </div>
      </div>

      {/* Link Therapist Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-purple-600 mb-2">Link to a Therapist</h2>
            <p className="text-gray-500 mb-6">Enter the invite code your therapist or teacher shared with you.</p>
            <form onSubmit={handleLinkTherapist} className="space-y-4">
              <input
                type="text"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-xl font-bold tracking-widest text-center"
                placeholder="THER-XXXXXX"
                required
              />
              {linkResult && <p className="text-center font-semibold">{linkResult}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowLinkModal(false); setLinkResult(''); setLinkCode(''); }} className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl">Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold text-purple-600 mb-6">Add a Child</h2>
            <form onSubmit={handleAddChild} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Age
                </label>
                <select
                  value={newChildAge}
                  onChange={(e) => setNewChildAge(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                >
                  {[3, 4, 5, 6].map((age) => (
                    <option key={age} value={age}>
                      {age} years old
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Choose a Color
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-full aspect-square rounded-xl transition-all ${
                        selectedColor === color ? 'ring-4 ring-purple-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Add Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

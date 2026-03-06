'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Smile,
  Users,
  BookOpen,
  Award,
  ArrowLeft,
  Star,
  Trophy,
  Wind,
  MessageSquare,
  Flame,
} from 'lucide-react';
import Image from 'next/image';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  imageUrl?: string;
}

interface Child {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
}

interface Achievement {
  id: string;
  title: string;
  badgeImage: string;
  earnedAt: string;
}

const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#FFD700' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#FF6B6B' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#4ECDC4' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#95A5A6' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#45B7D1' },
  { id: 'anxious', label: 'Worried', emoji: '😟', color: '#BB8FCE' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#E74C3C' },
  { id: 'silly', label: 'Silly', emoji: '😜', color: '#F39C12' },
];

export default function ChildDashboard() {
  const router = useRouter();
  const params = useParams();
  const childId = params?.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [savingMood, setSavingMood] = useState(false);

  useEffect(() => {
    if (childId) {
      fetchData();
    }
  }, [childId]);

  const fetchData = async () => {
    try {
      const [childRes, activitiesRes, progressRes, moodRes] = await Promise.all([
        fetch('/api/children'),
        fetch('/api/activities'),
        fetch(`/api/progress?childId=${childId}`),
        fetch(`/api/mood?childId=${childId}`),
      ]);

      const childData = await childRes.json();
      const activitiesData = await activitiesRes.json();
      const progressData = await progressRes.json();
      const moodData = await moodRes.json();

      const currentChild = childData?.children?.find((c: Child) => c?.id === childId);
      setChild(currentChild ?? null);
      setActivities(activitiesData?.activities ?? []);

      const completedActivityIds: string[] =
        progressData?.completedActivities?.map((ca: any) => ca?.activityId ?? '') ?? [];
      setCompletedIds(new Set<string>(completedActivityIds));
      setAchievements(progressData?.achievements ?? []);
      setStreak(progressData?.streak ?? 0);

      // Check if mood was already set today
      const checkIns = moodData?.checkIns ?? [];
      if (checkIns.length > 0) {
        const latest = checkIns[0];
        const latestDate = new Date(latest.checkedAt);
        const today = new Date();
        if (latestDate.toDateString() === today.toDateString()) {
          setTodayMood(latest.mood);
        } else {
          setShowMoodCheck(true);
        }
      } else {
        setShowMoodCheck(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (moodId: string) => {
    setSavingMood(true);
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, mood: moodId }),
      });
      setTodayMood(moodId);
      setShowMoodCheck(false);

      // If child is anxious/angry, suggest breathing first
      if (moodId === 'anxious' || moodId === 'angry') {
        const breathingActivity = activities.find((a) => a.type === 'breathing');
        if (breathingActivity) {
          setTimeout(() => {
            if (confirm('Would you like to start with a calming breathing exercise?')) {
              router.push(`/activity/breathing/${breathingActivity.id}?childId=${childId}`);
            }
          }, 300);
        }
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setSavingMood(false);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    const type = activity?.type ?? '';
    const id = activity?.id ?? '';

    const routes: Record<string, string> = {
      emotion: `/activity/emotion/${id}?childId=${childId}`,
      scenario: `/activity/scenario/${id}?childId=${childId}`,
      story: `/activity/story/${id}?childId=${childId}`,
      breathing: `/activity/breathing/${id}?childId=${childId}`,
      communication: `/activity/communication/${id}?childId=${childId}`,
    };

    if (routes[type]) {
      router.push(routes[type]);
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      emotion: <Smile className="w-12 h-12" />,
      scenario: <Users className="w-12 h-12" />,
      story: <BookOpen className="w-12 h-12" />,
      breathing: <Wind className="w-12 h-12" />,
      communication: <MessageSquare className="w-12 h-12" />,
    };
    return icons[type] ?? <Star className="w-12 h-12" />;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      emotion: 'from-yellow-400 to-orange-500',
      scenario: 'from-blue-400 to-purple-500',
      story: 'from-green-400 to-teal-500',
      breathing: 'from-teal-400 to-cyan-500',
      communication: 'from-pink-400 to-rose-500',
    };
    return colors[type] ?? 'from-pink-400 to-red-500';
  };

  const getTodayMoodOption = () => MOOD_OPTIONS.find((m) => m.id === todayMood);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  const totalStars = completedIds.size;

  return (
    <div className="min-h-screen p-6">
      {/* Mood Check-In Modal */}
      {showMoodCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-bold text-purple-600 text-center mb-2">
              Hi {child?.name ?? 'Friend'}!
            </h2>
            <p className="text-xl text-gray-600 text-center mb-6">How are you feeling today?</p>
            <div className="grid grid-cols-4 gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  disabled={savingMood}
                  className="flex flex-col items-center p-3 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <span className="text-4xl mb-1">{mood.emoji}</span>
                  <span className="text-xs font-bold text-gray-700 text-center">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/select-child')}
            className="mb-4 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                  style={{ backgroundColor: child?.avatarColor ?? '#FF6B6B' }}
                >
                  {child?.name?.charAt(0)?.toUpperCase() ?? 'C'}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">
                    Hi, {child?.name ?? 'Friend'}! 👋
                  </h1>
                  {todayMood && getTodayMoodOption() && (
                    <p className="text-xl text-gray-600 mt-1 flex items-center gap-2">
                      Feeling{' '}
                      <span className="font-bold" style={{ color: getTodayMoodOption()!.color }}>
                        {getTodayMoodOption()!.label}
                      </span>{' '}
                      {getTodayMoodOption()!.emoji}
                    </p>
                  )}
                  <p className="text-lg text-gray-500 mt-1">Let's learn and have fun!</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Streak */}
                {streak > 0 && (
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-1">
                      <Flame className="w-8 h-8 text-orange-500" />
                      <span className="text-4xl font-bold text-orange-500">{streak}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">Day Streak!</p>
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    <span className="text-4xl font-bold text-yellow-600">{totalStars}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">Stars Earned</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Trophy className="w-8 h-8 text-purple-500" />
                    <span className="text-4xl font-bold text-purple-600">
                      {achievements?.length ?? 0}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">Badges</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        {achievements?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-purple-600 mb-4 flex items-center gap-3">
              <Award className="w-8 h-8" />
              Your Badges!
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.slice(0, 4).map((achievement) => (
                <div
                  key={achievement?.id}
                  className="bg-white rounded-2xl p-4 shadow-lg text-center sparkle"
                >
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <Image
                      src={achievement?.badgeImage ?? ''}
                      alt={achievement?.title ?? 'Badge'}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-bold text-gray-800">{achievement?.title ?? ''}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity categories */}
        {(['breathing', 'emotion', 'scenario', 'story', 'communication'] as const).map((type) => {
          const typeActivities = activities.filter((a) => a.type === type);
          if (!typeActivities.length) return null;

          const typeLabels: Record<string, string> = {
            emotion: 'Emotion Games',
            scenario: 'Social Scenarios',
            story: 'Interactive Stories',
            breathing: 'Calm Down',
            communication: 'Let\'s Talk!',
          };

          return (
            <div key={type} className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 text-purple-600">{getActivityIcon(type)}</span>
                {typeLabels[type] ?? type}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {typeActivities.map((activity) => {
                  const isCompleted = completedIds.has(activity?.id ?? '');
                  return (
                    <button
                      key={activity?.id}
                      onClick={() => handleActivityClick(activity)}
                      className="child-card bg-white text-left relative overflow-hidden group"
                    >
                      {isCompleted && (
                        <div className="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 z-10">
                          <Star className="w-6 h-6 text-white fill-white" />
                        </div>
                      )}
                      <div
                        className={`w-full h-28 bg-gradient-to-br ${getActivityColor(
                          activity?.type ?? ''
                        )} rounded-2xl mb-4 flex items-center justify-center text-white`}
                      >
                        {getActivityIcon(activity?.type ?? '')}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {activity?.title ?? 'Activity'}
                      </h3>
                      <p className="text-gray-600 text-base">{activity?.description ?? ''}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

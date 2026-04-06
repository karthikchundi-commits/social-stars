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
  Sparkles,
  Lock,
} from 'lucide-react';

// ── Recommendation engine ────────────────────────────────────────────────────

const TYPE_PRIORITY: Record<string, string[]> = {
  anxious:  ['breathing', 'emotion', 'story', 'scenario', 'communication', 'social_coach'],
  angry:    ['breathing', 'emotion', 'story', 'scenario', 'communication', 'social_coach'],
  sad:      ['emotion', 'breathing', 'story', 'scenario', 'communication', 'social_coach'],
  tired:    ['emotion', 'breathing', 'story', 'scenario', 'communication', 'social_coach'],
  calm:     ['story', 'social_coach', 'scenario', 'emotion', 'communication', 'breathing'],
  happy:    ['social_coach', 'scenario', 'communication', 'story', 'emotion', 'breathing'],
  excited:  ['social_coach', 'scenario', 'communication', 'story', 'emotion', 'breathing'],
  silly:    ['communication', 'social_coach', 'scenario', 'story', 'emotion', 'breathing'],
};

const MOOD_BANNER: Record<string, { emoji: string; message: string; color: string }> = {
  anxious:  { emoji: '😟', message: "Feeling a bit worried? Let's start with something calming.", color: 'from-purple-100 to-blue-100 border-purple-200' },
  angry:    { emoji: '😠', message: "Had a tough moment? Breathing first will help us feel better.", color: 'from-red-50 to-orange-50 border-red-200' },
  sad:      { emoji: '😢', message: "Feeling sad is okay. Let's do something gentle together.", color: 'from-blue-50 to-indigo-50 border-blue-200' },
  tired:    { emoji: '😴', message: "A bit tired today? We'll keep it easy and fun.", color: 'from-gray-50 to-blue-50 border-gray-200' },
  calm:     { emoji: '😌', message: "You're calm — perfect for exploring stories and scenarios!", color: 'from-teal-50 to-green-50 border-teal-200' },
  happy:    { emoji: '😊', message: "You're happy! Great time to practise social skills.", color: 'from-yellow-50 to-orange-50 border-yellow-200' },
  excited:  { emoji: '🤩', message: "So excited! Let's channel that energy into social adventures.", color: 'from-pink-50 to-purple-50 border-pink-200' },
  silly:    { emoji: '😜', message: "Feeling silly? Let's play and communicate together!", color: 'from-orange-50 to-yellow-50 border-orange-200' },
};

function getRecommendations(
  mood: string | null,
  streak: number,
  completedIds: Set<string>,
  allActivities: Activity[],
  assignedIds: Set<string>,
  adaptiveData?: { adaptation?: { difficultyLevel?: number }; recommendations?: Array<{ type: string; confusionRate: number; priority: string }>; personalizedPriority?: Record<string, string[]> } | null,
  recentCompletions?: Array<{ activityId: string; completedAt: string; type: string }>,
  personalizedPriority?: Record<string, string[]>,
): Activity[] {
  // Exclude assigned activities (shown separately)
  const pool = allActivities.filter((a) => !assignedIds.has(a.id));
  if (!pool.length) return [];

  // If no mood yet or streak is 0, prioritise easiest uncompleted activities across all types
  let priority = mood ? (TYPE_PRIORITY[mood] ?? Object.keys(TYPE_PRIORITY)[0].split(',')) : ['breathing', 'emotion', 'scenario', 'story', 'communication'];

  // Use personalized priority if we have data for this mood (at least 2 types)
  if (mood && personalizedPriority?.[mood] && personalizedPriority[mood].length >= 2) {
    const allTypes = ['breathing', 'emotion', 'scenario', 'story', 'communication', 'social_coach'];
    const personalized = personalizedPriority[mood];
    // Merge: personalized first, then remaining types not in personalized list
    priority = [...personalized, ...allTypes.filter(t => !personalized.includes(t))];
  }

  // 7-day type stats: boost types with 0 completions in last 7 days
  if (recentCompletions && recentCompletions.length >= 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTypes = new Set(
      recentCompletions
        .filter((c) => new Date(c.completedAt) >= sevenDaysAgo)
        .map((c) => c.type),
    );
    const allTypes = ['breathing', 'emotion', 'scenario', 'story', 'communication'];
    const zeroCompletionTypes = allTypes.filter((t) => !recentTypes.has(t));
    // Add zero-completion types after mood-priority types if not already in list
    for (const t of zeroCompletionTypes) {
      if (!priority.includes(t)) priority = [...priority, t];
    }
  }

  // De-prioritize types with high confusion rate (>50%) from adaptiveData
  if (adaptiveData?.recommendations) {
    const highConfusion = adaptiveData.recommendations
      .filter((r) => r.confusionRate > 50)
      .map((r) => r.type);
    priority = [
      ...priority.filter((t) => !highConfusion.includes(t)),
      ...priority.filter((t) => highConfusion.includes(t)),
    ];
  }

  const picked: Activity[] = [];
  const used = new Set<string>();

  // For each type in priority order, pick best uncompleted → then completed
  for (const type of priority) {
    if (picked.length >= 3) break;
    const ofType = pool.filter((a) => a.type === type && !used.has(a.id));
    const uncompleted = ofType.filter((a) => !completedIds.has(a.id));
    const candidates = uncompleted.length ? uncompleted : ofType;
    if (candidates.length) {
      picked.push(candidates[0]);
      used.add(candidates[0].id);
    }
  }

  // If fewer than 3, fill from remaining pool (uncompleted first)
  if (picked.length < 3) {
    const remaining = pool.filter((a) => !used.has(a.id));
    const uncompleted = remaining.filter((a) => !completedIds.has(a.id));
    const extra = uncompleted.length ? uncompleted : remaining;
    for (const a of extra) {
      if (picked.length >= 3) break;
      picked.push(a);
    }
  }

  return picked;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  imageUrl?: string;
  difficulty?: number;
  ageGroup?: string;
  isABAPlus?: boolean;
}

interface Child {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  childType?: string;
}

function isAgeAppropriate(ageGroup: string | undefined, childAge: number): boolean {
  if (!ageGroup || ageGroup === 'all') return true;
  if (ageGroup === 'toddler') return childAge <= 5;
  if (ageGroup === 'preschool') return childAge >= 4 && childAge <= 6;
  if (ageGroup === 'early-elementary') return childAge >= 5;
  return true;
}

interface Achievement {
  id: string;
  title: string;
  badgeImage: string;
  badgeType: string;
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
  const [assignedActivities, setAssignedActivities] = useState<Activity[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const [adaptiveData, setAdaptiveData] = useState<{ adaptation?: { difficultyLevel?: number }; recommendations?: Array<{ type: string; confusionRate: number; priority: string }>; personalizedPriority?: Record<string, string[]> } | null>(null);
  const [completedActivitiesData, setCompletedActivitiesData] = useState<Array<{ activityId: string; completedAt: string; type: string }>>([]);

  useEffect(() => {
    if (childId) {
      fetchData();
    }
  }, [childId]);

  // Poll adaptive data every 60 seconds to refresh recommendations live
  useEffect(() => {
    if (!childId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/adaptive?childId=${childId}`);
        const data = await res.json();
        setAdaptiveData(data ?? null);
      } catch {
        // silent fail
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [childId]);

  const fetchData = async () => {
    try {
      const [childRes, activitiesRes, progressRes, moodRes, adaptiveRes] = await Promise.all([
        fetch('/api/children'),
        fetch('/api/activities'),
        fetch(`/api/progress?childId=${childId}`),
        fetch(`/api/mood?childId=${childId}`),
        fetch(`/api/adaptive?childId=${childId}`),
      ]);

      const childData = await childRes.json();
      const activitiesData = await activitiesRes.json();
      const progressData = await progressRes.json();
      const moodData = await moodRes.json();
      const adaptiveResult = await adaptiveRes.json();
      setAdaptiveData(adaptiveResult ?? null);

      const currentChild = childData?.children?.find((c: Child) => c?.id === childId);
      setChild(currentChild ?? null);
      const allActivities: Activity[] = activitiesData?.activities ?? [];
      const assignmentIds = new Set<string>(
        (progressData?.assignments ?? []).map((a: any) => a.activityId)
      );
      setAssignedActivities(
        (progressData?.assignments ?? []).map((a: any) => a.activity).filter(Boolean)
      );
      setActivities(allActivities);

      const completedActivityIds: string[] =
        progressData?.completedActivities?.map((ca: any) => ca?.activityId ?? '') ?? [];
      setCompletedIds(new Set<string>(completedActivityIds));

      // Build completedActivitiesData with type info
      const activityMap = new Map(allActivities.map((a) => [a.id, a]));
      const completedWithType: Array<{ activityId: string; completedAt: string; type: string }> =
        (progressData?.completedActivities ?? []).map((ca: any) => ({
          activityId: ca?.activityId ?? '',
          completedAt: ca?.completedAt ?? new Date().toISOString(),
          type: activityMap.get(ca?.activityId ?? '')?.type ?? '',
        }));
      setCompletedActivitiesData(completedWithType);

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
    // ABA+ activities not assigned by a therapist show a friendly prompt
    if (activity.isABAPlus && !assignedActivities.some((a) => a.id === activity.id)) {
      alert('This activity is part of the ABA+ programme. Ask your therapist to assign it to unlock it!');
      return;
    }
    const type = activity?.type ?? '';
    const id = activity?.id ?? '';
    const moodParam = todayMood ? `&mood=${todayMood}` : '';

    const routes: Record<string, string> = {
      emotion: `/activity/emotion/${id}?childId=${childId}${moodParam}`,
      scenario: `/activity/scenario/${id}?childId=${childId}${moodParam}`,
      story: `/activity/story/${id}?childId=${childId}${moodParam}`,
      breathing: `/activity/breathing/${id}?childId=${childId}${moodParam}`,
      communication: `/activity/communication/${id}?childId=${childId}${moodParam}`,
      social_coach: `/activity/social-coach/${id}?childId=${childId}${moodParam}`,
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
  const assignedIds = new Set(assignedActivities.map((a) => a.id));
  const recommendations = getRecommendations(todayMood, streak, completedIds, activities, assignedIds, adaptiveData, completedActivitiesData, adaptiveData?.personalizedPriority);
  const moodBanner = todayMood ? MOOD_BANNER[todayMood] : null;
  const difficultyLevel = adaptiveData?.adaptation?.difficultyLevel ?? 0.5;

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
            onClick={() => router.push('/parent-dashboard')}
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
              {achievements.slice(0, 4).map((achievement) => {
                const badgeEmoji =
                  achievement?.badgeType === 'trophy' ? '🏆' :
                  achievement?.badgeType === 'medal' ? '🥇' : '⭐';
                const badgeGradient =
                  achievement?.badgeType === 'trophy' ? 'from-yellow-400 to-orange-500' :
                  achievement?.badgeType === 'medal' ? 'from-yellow-300 to-yellow-500' :
                  'from-purple-400 to-pink-500';
                return (
                  <div
                    key={achievement?.id}
                    className="bg-white rounded-2xl p-4 shadow-lg text-center sparkle"
                  >
                    <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${badgeGradient} flex items-center justify-center shadow-lg`}>
                      <span className="text-4xl">{badgeEmoji}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">{achievement?.title ?? ''}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mood-adaptive recommendation banner + picks */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            {moodBanner && (
              <div className={`bg-gradient-to-br ${moodBanner.color} border-2 rounded-2xl px-6 py-4 mb-5 flex items-center gap-3`}>
                <span className="text-3xl">{moodBanner.emoji}</span>
                <p className="text-gray-700 font-semibold text-lg">{moodBanner.message}</p>
              </div>
            )}
            <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-yellow-500" />
              {todayMood ? 'Just for You Right Now' : 'Great Place to Start'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((activity) => {
                const isCompleted = completedIds.has(activity.id);
                return (
                  <button
                    key={`rec-${activity.id}`}
                    onClick={() => handleActivityClick(activity)}
                    className="child-card bg-gradient-to-br from-yellow-50 to-orange-50 text-left relative overflow-hidden border-2 border-yellow-200 ring-2 ring-yellow-300 ring-offset-2"
                  >
                    {isCompleted && (
                      <div className="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 z-10">
                        <Star className="w-6 h-6 text-white fill-white" />
                      </div>
                    )}
                    <div className={`w-full h-28 bg-gradient-to-br ${getActivityColor(activity.type)} rounded-2xl mb-4 flex items-center justify-center text-white`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="absolute top-3 left-3 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Recommended
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{activity.title}</h3>
                    <p className="text-gray-600 text-base">{activity.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Therapist-assigned activities */}
        {assignedActivities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center gap-2">
              ⭐ From Your Therapist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedActivities.map((activity) => {
                const isCompleted = completedIds.has(activity?.id ?? '');
                return (
                  <button
                    key={activity?.id}
                    onClick={() => handleActivityClick(activity)}
                    className="child-card bg-gradient-to-br from-indigo-50 to-purple-50 text-left relative overflow-hidden border-2 border-indigo-200"
                  >
                    {isCompleted && (
                      <div className="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 z-10">
                        <Star className="w-6 h-6 text-white fill-white" />
                      </div>
                    )}
                    <div className={`w-full h-28 bg-gradient-to-br ${getActivityColor(activity?.type ?? '')} rounded-2xl mb-4 flex items-center justify-center text-white`}>
                      {getActivityIcon(activity?.type ?? '')}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{activity?.title ?? 'Activity'}</h3>
                    <p className="text-gray-600 text-base">{activity?.description ?? ''}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity categories */}
        {(['breathing', 'emotion', 'scenario', 'story', 'communication'] as const).map((type) => {
          const diffLevel = adaptiveData?.adaptation?.difficultyLevel ?? 0.5;
          // Convert 0-1 difficulty level to 1-3 activity difficulty scale
          const maxDifficulty = diffLevel <= 0.3 ? 1 : diffLevel <= 0.65 ? 2 : 3;

          const typeActivities = activities
            .filter((a) => a.type === type)
            .filter((a) => isAgeAppropriate(a.ageGroup, child?.age ?? 5))
            .filter((a) => !a.difficulty || a.difficulty <= maxDifficulty + 1) // allow 1 level above
            .sort((a, b) => (assignedIds.has(b.id) ? 1 : 0) - (assignedIds.has(a.id) ? 1 : 0))
            .sort((a, b) => {
              // Sort by difficulty based on child's level
              if (difficultyLevel <= 0.4) return (a.difficulty ?? 2) - (b.difficulty ?? 2);
              if (difficultyLevel >= 0.7) return (b.difficulty ?? 2) - (a.difficulty ?? 2);
              return 0;
            });
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
                    {(() => {
                      const isLocked = activity.isABAPlus && !assignedActivities.some((a) => a.id === activity.id);
                      return (
                        <button
                          key={activity?.id}
                          onClick={() => handleActivityClick(activity)}
                          className={`child-card bg-white text-left relative overflow-hidden group ${isLocked ? 'opacity-80' : ''}`}
                        >
                          {isCompleted && !isLocked && (
                            <div className="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 z-10">
                              <Star className="w-6 h-6 text-white fill-white" />
                            </div>
                          )}
                          {assignedIds.has(activity?.id ?? '') && (
                            <div className="absolute top-3 left-3 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                              ⭐ From Therapist
                            </div>
                          )}
                          {isLocked && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> ABA+
                            </div>
                          )}
                          <div
                            className={`w-full h-28 bg-gradient-to-br ${getActivityColor(
                              activity?.type ?? ''
                            )} rounded-2xl mb-4 flex items-center justify-center text-white relative`}
                          >
                            {getActivityIcon(activity?.type ?? '')}
                            {isLocked && (
                              <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                <Lock className="w-10 h-10 text-white/80" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-1">
                            {activity?.title ?? 'Activity'}
                          </h3>
                          <p className="text-gray-600 text-base">{activity?.description ?? ''}</p>
                          {isLocked && (
                            <p className="text-xs text-purple-600 font-semibold mt-2">Ask your therapist to unlock this activity</p>
                          )}
                        </button>
                      );
                    })()}
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Sparkles, Plus, Trash2, CheckCircle,
  Save, Eye, RotateCcw, Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChildData {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  recentMoods: string[];
  totalCompleted: number;
  assignedActivities: { type: string }[];
}

interface Client {
  parentId: string;
  parentName: string;
  children: ChildData[];
}

// ── Content state types per activity type ─────────────────────────────────────

interface ScenarioChoice { text: string; isCorrect: boolean; feedback: string }
interface StoryPage { text: string; image: string; question: string; options: string[]; correctAnswer: number }
interface BreathingPhase { label: string; duration: number; color: string; expand: boolean }
interface CommItem { label: string; emoji: string; audio: string }
interface CoachOption { text: string; isCorrect: boolean; feedback: string; resultEmoji: string }
interface CoachTurn { prompt: string; options: CoachOption[] }

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultChoices = (): ScenarioChoice[] => [
  { text: '', isCorrect: true, feedback: '' },
  { text: '', isCorrect: false, feedback: '' },
  { text: '', isCorrect: false, feedback: '' },
];

const defaultPages = (): StoryPage[] => [
  { text: '', image: '', question: '', options: ['', '', ''], correctAnswer: 0 },
];

const defaultPhases = (): BreathingPhase[] => [
  { label: 'Breathe In', duration: 4, color: '#4ECDC4', expand: true },
  { label: 'Hold', duration: 2, color: '#45B7D1', expand: true },
  { label: 'Breathe Out', duration: 5, color: '#96CEB4', expand: false },
];

const defaultItems = (): CommItem[] => [
  { label: 'Happy', emoji: '😊', audio: 'I feel happy!' },
  { label: 'Help', emoji: '🙋', audio: 'I need help please.' },
  { label: '', emoji: '', audio: '' },
];

const defaultTurns = (): CoachTurn[] => [
  {
    prompt: '',
    options: [
      { text: '', isCorrect: true, feedback: '', resultEmoji: '😊' },
      { text: '', isCorrect: false, feedback: '', resultEmoji: '😕' },
      { text: '', isCorrect: false, feedback: '', resultEmoji: '😢' },
    ],
  },
];

const ACTIVITY_TYPES = [
  { value: 'emotion', label: '😊 Emotion Recognition', desc: 'Child identifies an emotion from face images' },
  { value: 'scenario', label: '🤝 Social Scenario', desc: 'Multiple-choice social situation' },
  { value: 'story', label: '📖 Interactive Story', desc: 'Page-by-page story with questions' },
  { value: 'breathing', label: '🌬️ Breathing Exercise', desc: 'Guided calm-down breathing animation' },
  { value: 'communication', label: '💬 Communication Board', desc: 'Tap-to-speak board activity' },
  { value: 'social_coach', label: '🎭 Social Coach', desc: 'Branching real-life social simulation' },
];

const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'scared', 'disgusted', 'calm', 'excited', 'worried', 'proud'];

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', tired: '😴',
  sad: '😢', anxious: '😟', angry: '😠', silly: '😜',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { data: session, status } = useSession() || {};

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Form state
  const [selectedChildId, setSelectedChildId] = useState('');
  const [assignToChild, setAssignToChild] = useState(true);
  const [activityType, setActivityType] = useState('scenario');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Type-specific content state
  const [emotion, setEmotion] = useState('happy');
  const [choices, setChoices] = useState<ScenarioChoice[]>(defaultChoices());
  const [pages, setPages] = useState<StoryPage[]>(defaultPages());
  const [breathingInstruction, setBreathingInstruction] = useState('');
  const [breathingCycles, setBreathingCycles] = useState(3);
  const [phases, setPhases] = useState<BreathingPhase[]>(defaultPhases());
  const [commInstruction, setCommInstruction] = useState('');
  const [commTargetTaps, setCommTargetTaps] = useState(3);
  const [commItems, setCommItems] = useState<CommItem[]>(defaultItems());
  const [coachScenario, setCoachScenario] = useState('');
  const [coachCharName, setCoachCharName] = useState('');
  const [coachCharEmoji, setCoachCharEmoji] = useState('👦');
  const [coachTurns, setCoachTurns] = useState<CoachTurn[]>(defaultTurns());

  // AI + save state
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [aiGoals, setAiGoals] = useState('');
  const [aiChallenges, setAiChallenges] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'therapist') router.push('/select-child');
      else fetchClients();
    }
  }, [status]);

  // Reset content when activity type changes (skip in edit mode)
  useEffect(() => {
    if (editId) return;
    setTitle('');
    setDescription('');
    setEmotion('happy');
    setChoices(defaultChoices());
    setPages(defaultPages());
    setBreathingInstruction('');
    setBreathingCycles(3);
    setPhases(defaultPhases());
    setCommInstruction('');
    setCommTargetTaps(3);
    setCommItems(defaultItems());
    setCoachScenario('');
    setCoachCharName('');
    setCoachCharEmoji('👦');
    setCoachTurns(defaultTurns());
  }, [activityType]);

  const fetchClients = async () => {
    const res = await fetch('/api/therapist/clients');
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoadingClients(false);
  };

  // Load activity data when in edit mode
  useEffect(() => {
    if (!editId) return;
    const loadActivity = async () => {
      const res = await fetch('/api/activities');
      const data = await res.json();
      const activity = (data.activities ?? []).find((a: any) => a.id === editId);
      if (!activity) return;
      setActivityType(activity.type);
      const parsed = {
        title: activity.title,
        description: activity.description,
        content: typeof activity.content === 'string' ? JSON.parse(activity.content) : activity.content,
      };
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      const c = parsed.content;
      if (!c) return;
      switch (activity.type) {
        case 'emotion':
          if (c.emotion) setEmotion(c.emotion);
          break;
        case 'scenario':
          if (c.choices) setChoices(c.choices);
          break;
        case 'story':
          if (c.pages) setPages(c.pages.map((p: any) => ({
            text: p.text ?? '',
            image: p.image ?? '',
            question: p.question ?? '',
            options: p.options ?? ['', '', ''],
            correctAnswer: p.correctAnswer ?? 0,
          })));
          break;
        case 'breathing':
          if (c.instruction) setBreathingInstruction(c.instruction);
          if (c.cycles) setBreathingCycles(c.cycles);
          if (c.phases) setPhases(c.phases);
          break;
        case 'communication':
          if (c.instruction) setCommInstruction(c.instruction);
          if (c.targetTaps) setCommTargetTaps(c.targetTaps);
          if (c.items) setCommItems(c.items);
          break;
        case 'social_coach':
          if (c.scenario) setCoachScenario(c.scenario);
          if (c.characterName) setCoachCharName(c.characterName);
          if (c.characterEmoji) setCoachCharEmoji(c.characterEmoji);
          if (c.turns) setCoachTurns(c.turns.map((t: any) => ({
            prompt: t.prompt ?? '',
            options: t.options ?? defaultTurns()[0].options,
          })));
          break;
      }
    };
    loadActivity();
  }, [editId]);

  const allChildren = clients.flatMap((c) => c.children);
  const selectedChild = allChildren.find((c) => c.id === selectedChildId);

  // ── Apply AI suggestion to form fields ──────────────────────────────────────

  const applyAISuggestion = useCallback((parsed: any) => {
    if (parsed.title) setTitle(parsed.title);
    if (parsed.description) setDescription(parsed.description);
    const c = parsed.content;
    if (!c) return;

    switch (activityType) {
      case 'emotion':
        if (c.emotion) setEmotion(c.emotion);
        break;
      case 'scenario':
        if (c.choices) setChoices(c.choices);
        break;
      case 'story':
        if (c.pages) setPages(c.pages.map((p: any) => ({
          text: p.text ?? '',
          image: p.image ?? '',
          question: p.question ?? '',
          options: p.options ?? ['', '', ''],
          correctAnswer: p.correctAnswer ?? 0,
        })));
        break;
      case 'breathing':
        if (c.instruction) setBreathingInstruction(c.instruction);
        if (c.cycles) setBreathingCycles(c.cycles);
        if (c.phases) setPhases(c.phases);
        break;
      case 'communication':
        if (c.instruction) setCommInstruction(c.instruction);
        if (c.targetTaps) setCommTargetTaps(c.targetTaps);
        if (c.items) setCommItems(c.items);
        break;
      case 'social_coach':
        if (c.scenario) setCoachScenario(c.scenario);
        if (c.characterName) setCoachCharName(c.characterName);
        if (c.characterEmoji) setCoachCharEmoji(c.characterEmoji);
        if (c.turns) setCoachTurns(c.turns.map((t: any) => ({
          prompt: t.prompt ?? '',
          options: t.options ?? defaultTurns()[0].options,
        })));
        break;
    }
  }, [activityType]);

  // ── AI Suggest ───────────────────────────────────────────────────────────────

  const handleAISuggest = async () => {
    if (!selectedChildId) return;
    setSuggesting(true);
    setError('');
    const child = selectedChild!;
    const completedTypes = [...new Set(child.assignedActivities.map((a) => a.type))];

    try {
      const res = await fetch('/api/therapist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          childName: child.name,
          childAge: child.age,
          goals: aiGoals,
          recentMoods: child.recentMoods,
          completedTypes,
          challenges: aiChallenges,
          activityType,
          preview: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'AI suggestion failed');
      } else {
        applyAISuggestion(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSuggesting(false);
    }
  };

  // ── Build content object from form state ─────────────────────────────────────

  const buildContent = () => {
    switch (activityType) {
      case 'emotion': return { emotion };
      case 'scenario': return { choices };
      case 'story': return { pages };
      case 'breathing': return { instruction: breathingInstruction, cycles: breathingCycles, phases };
      case 'communication': return { instruction: commInstruction, targetTaps: commTargetTaps, items: commItems };
      case 'social_coach': return {
        scenario: coachScenario,
        characterName: coachCharName,
        characterEmoji: coachCharEmoji,
        turns: coachTurns,
      };
      default: return {};
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const res = await fetch('/api/therapist/create', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityId: editId,
            title,
            description,
            type: activityType,
            content: buildContent(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Update failed');
        } else {
          setSaved(true);
        }
      } else {
        const res = await fetch('/api/therapist/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            type: activityType,
            content: buildContent(),
            childId: selectedChildId || null,
            assignToChild: selectedChildId ? assignToChild : false,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Save failed');
        } else {
          setSaved(true);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers for dynamic fields ────────────────────────────────────────────────

  const updateChoice = (i: number, field: keyof ScenarioChoice, val: string | boolean) =>
    setChoices((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const updatePage = (i: number, field: keyof StoryPage, val: any) =>
    setPages((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const updatePageOption = (pi: number, oi: number, val: string) =>
    setPages((prev) => prev.map((p, idx) => idx === pi
      ? { ...p, options: p.options.map((o, i) => i === oi ? val : o) }
      : p));

  const updatePhase = (i: number, field: keyof BreathingPhase, val: any) =>
    setPhases((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const updateCommItem = (i: number, field: keyof CommItem, val: string) =>
    setCommItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const updateTurnPrompt = (ti: number, val: string) =>
    setCoachTurns((prev) => prev.map((t, i) => i === ti ? { ...t, prompt: val } : t));

  const updateTurnOption = (ti: number, oi: number, field: keyof CoachOption, val: any) =>
    setCoachTurns((prev) => prev.map((t, i) => i === ti
      ? { ...t, options: t.options.map((o, j) => j === oi ? { ...o, [field]: val } : o) }
      : t));

  // ── UI ────────────────────────────────────────────────────────────────────────

  if (status === 'loading' || loadingClients) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl font-bold text-purple-600">Loading...</div></div>;
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{editId ? 'Activity Updated!' : 'Activity Saved!'}</h1>
          <p className="text-gray-500 mb-2">
            {editId
              ? `"${title}" has been updated.`
              : `"${title}" has been created${selectedChildId && assignToChild ? ` and assigned to ${selectedChild?.name}` : ''}.`}
          </p>
          {!editId && <p className="text-gray-400 text-sm mb-8">It will appear in the activity grid on the child's dashboard.</p>}
          <div className="flex gap-3 mt-8">
            {!editId && (
              <button
                onClick={() => { setSaved(false); setTitle(''); setDescription(''); }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Create Another
              </button>
            )}
            <button
              onClick={() => router.push('/therapist')}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/therapist')} className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700">
          <ArrowLeft className="w-5 h-5" /> Back to Portal
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white mb-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <Eye className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{editId ? 'Edit Activity' : 'Custom Activity Builder'}</h1>
              <p className="text-purple-100">{editId ? 'Update the activity details and save your changes' : 'Build from scratch or let AI suggest — you review and edit before saving'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {/* Step 1 — Activity Type */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-700 mb-5">1. Choose Activity Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setActivityType(t.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    activityType === t.value
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300 ring-offset-1'
                      : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-bold text-gray-800 text-sm mb-1">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Child (optional) + AI Suggest */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-700 mb-5">2. Select Child & Get AI Suggestion</h2>
            <p className="text-sm text-gray-500 mb-4">Select a child to personalise the AI suggestion based on their behaviour data. You can also skip and fill in the fields manually.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setSelectedChildId('')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedChildId === '' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm mb-2">?</div>
                <div className="font-semibold text-gray-700 text-sm">No child</div>
                <div className="text-xs text-gray-400">General activity</div>
              </button>
              {allChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedChildId === child.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2" style={{ backgroundColor: child.avatarColor }}>
                    {child.name.charAt(0)}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">{child.name}</div>
                  <div className="text-xs text-gray-500">Age {child.age}</div>
                  {child.recentMoods.length > 0 && (
                    <div className="flex gap-0.5 mt-1">{child.recentMoods.slice(0, 4).map((m, i) => <span key={i} className="text-sm">{MOOD_EMOJI[m] ?? '😐'}</span>)}</div>
                  )}
                </button>
              ))}
            </div>

            {/* AI context inputs */}
            {selectedChildId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Child's Goals (optional)</label>
                  <textarea value={aiGoals} onChange={(e) => setAiGoals(e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none text-sm" placeholder="e.g. Improve turn-taking, reduce anxiety..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Current Challenges (optional)</label>
                  <textarea value={aiChallenges} onChange={(e) => setAiChallenges(e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none text-sm" placeholder="e.g. Sensitivity to noise, loves animals..." />
                </div>
              </div>
            )}

            <button
              onClick={handleAISuggest}
              disabled={!selectedChildId || suggesting}
              className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {suggesting ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating suggestion...</> : <><Sparkles className="w-5 h-5" /> AI Suggest for {selectedChild?.name ?? '...'}</>}
            </button>
            {!selectedChildId && <p className="text-xs text-gray-400 mt-2">Select a child above to enable AI suggestions</p>}
          </div>

          {/* Step 3 — Title & Description */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-700 mb-5">3. Title & Description</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Activity Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-semibold text-gray-800"
                  placeholder="e.g. Sharing at the Playground"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Description (shown to parents) *</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-700"
                  placeholder="e.g. Practice sharing toys with a friend at the playground"
                />
              </div>
            </div>
          </div>

          {/* Step 4 — Content editor (type-specific) */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-700 mb-6">4. Activity Content</h2>

            {/* EMOTION */}
            {activityType === 'emotion' && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Emotion to Identify</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {EMOTIONS.map((e) => (
                    <button key={e} onClick={() => setEmotion(e)}
                      className={`py-2 px-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${emotion === e ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200'}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">The child will be shown 6 face images and must pick the one showing: <strong>{emotion}</strong></p>
              </div>
            )}

            {/* SCENARIO */}
            {activityType === 'scenario' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-600">Choices (mark one as correct)</label>
                  <button onClick={() => setChoices((p) => [...p, { text: '', isCorrect: false, feedback: '' }])}
                    className="flex items-center gap-1 text-sm text-purple-600 font-semibold hover:text-purple-800">
                    <Plus className="w-4 h-4" /> Add Choice
                  </button>
                </div>
                {choices.map((ch, i) => (
                  <div key={i} className={`p-4 rounded-2xl border-2 ${ch.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => setChoices((p) => p.map((c, idx) => ({ ...c, isCorrect: idx === i })))}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${ch.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
                        {ch.isCorrect && <CheckCircle className="w-5 h-5 text-white" />}
                      </button>
                      <span className="text-xs font-bold text-gray-500">{ch.isCorrect ? 'CORRECT' : 'Wrong'}</span>
                      {choices.length > 2 && (
                        <button onClick={() => setChoices((p) => p.filter((_, idx) => idx !== i))} className="ml-auto text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input value={ch.text} onChange={(e) => updateChoice(i, 'text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-2 focus:border-purple-400 focus:outline-none"
                      placeholder="Choice text..." />
                    <input value={ch.feedback} onChange={(e) => updateChoice(i, 'feedback', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                      placeholder="Feedback shown after selection..." />
                  </div>
                ))}
              </div>
            )}

            {/* STORY */}
            {activityType === 'story' && (
              <div className="space-y-6">
                {pages.map((pg, pi) => (
                  <div key={pi} className="p-5 rounded-2xl border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-gray-700">Page {pi + 1}</span>
                      {pages.length > 1 && (
                        <button onClick={() => setPages((p) => p.filter((_, i) => i !== pi))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea value={pg.text} onChange={(e) => updatePage(pi, 'text', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-3 focus:border-purple-400 focus:outline-none resize-none"
                      placeholder="Story text for this page (1-3 sentences)..." />
                    <input value={pg.question} onChange={(e) => updatePage(pi, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-3 focus:border-purple-400 focus:outline-none"
                      placeholder="Question (leave blank for narrative-only page)..." />
                    {pg.question && (
                      <div className="space-y-2 ml-4">
                        {pg.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button onClick={() => updatePage(pi, 'correctAnswer', oi)}
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${pg.correctAnswer === oi ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                            <input value={opt} onChange={(e) => updatePageOption(pi, oi, e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:outline-none"
                              placeholder={`Option ${oi + 1}...`} />
                          </div>
                        ))}
                        <p className="text-xs text-gray-400">Click circle to mark correct answer</p>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => setPages((p) => [...p, { text: '', image: '', question: '', options: ['', '', ''], correctAnswer: 0 }])}
                  className="flex items-center gap-2 px-5 py-2 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-semibold hover:border-purple-500 transition-all">
                  <Plus className="w-4 h-4" /> Add Page
                </button>
              </div>
            )}

            {/* BREATHING */}
            {activityType === 'breathing' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Instruction for Child</label>
                  <input value={breathingInstruction} onChange={(e) => setBreathingInstruction(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Let's take big, slow breaths together." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Number of Cycles</label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setBreathingCycles(n)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${breathingCycles === n ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-3">Phases</label>
                  <div className="space-y-3">
                    {phases.map((ph, i) => (
                      <div key={i} className="grid grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-xl">
                        <input value={ph.label} onChange={(e) => updatePhase(i, 'label', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                          placeholder="Label" />
                        <div className="flex items-center gap-1">
                          <input type="number" value={ph.duration} min={1} max={10} onChange={(e) => updatePhase(i, 'duration', +e.target.value)}
                            className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
                          <span className="text-xs text-gray-500">sec</span>
                        </div>
                        <input type="color" value={ph.color} onChange={(e) => updatePhase(i, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                        <button onClick={() => updatePhase(i, 'expand', !ph.expand)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${ph.expand ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {ph.expand ? '↑ Expand' : '↓ Shrink'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COMMUNICATION */}
            {activityType === 'communication' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Instruction</label>
                    <input value={commInstruction} onChange={(e) => setCommInstruction(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      placeholder="e.g. Tap 3 things you want!" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Target Taps</label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setCommTargetTaps(n)}
                          className={`w-12 h-12 rounded-xl font-bold transition-all ${commTargetTaps === n ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-600">Board Items</label>
                    <button onClick={() => setCommItems((p) => [...p, { label: '', emoji: '', audio: '' }])}
                      className="flex items-center gap-1 text-sm text-purple-600 font-semibold">
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {commItems.map((it, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input value={it.emoji} onChange={(e) => updateCommItem(i, 'emoji', e.target.value)}
                          className="col-span-2 px-2 py-2 border border-gray-200 rounded-lg text-xl text-center focus:outline-none" placeholder="😊" />
                        <input value={it.label} onChange={(e) => updateCommItem(i, 'label', e.target.value)}
                          className="col-span-3 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" placeholder="Label" />
                        <input value={it.audio} onChange={(e) => updateCommItem(i, 'audio', e.target.value)}
                          className="col-span-6 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" placeholder="Spoken text..." />
                        {commItems.length > 2 && (
                          <button onClick={() => setCommItems((p) => p.filter((_, idx) => idx !== i))} className="col-span-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SOCIAL COACH */}
            {activityType === 'social_coach' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Scenario Description</label>
                    <textarea value={coachScenario} onChange={(e) => setCoachScenario(e.target.value)} rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="e.g. You see a new friend sitting alone at lunch." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Character</label>
                    <div className="flex gap-2">
                      <input value={coachCharEmoji} onChange={(e) => setCoachCharEmoji(e.target.value)}
                        className="w-16 px-2 py-3 border-2 border-gray-200 rounded-xl text-2xl text-center focus:border-purple-500 focus:outline-none" />
                      <input value={coachCharName} onChange={(e) => setCoachCharName(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        placeholder="Name" />
                    </div>
                  </div>
                </div>

                {coachTurns.map((turn, ti) => (
                  <div key={ti} className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-indigo-700">Turn {ti + 1}</span>
                      {coachTurns.length > 1 && (
                        <button onClick={() => setCoachTurns((p) => p.filter((_, i) => i !== ti))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea value={turn.prompt} onChange={(e) => updateTurnPrompt(ti, e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-sm mb-4 focus:border-purple-400 focus:outline-none resize-none bg-white"
                      placeholder={`What does ${coachCharName || 'the character'} say or do?`} />
                    <div className="space-y-3">
                      {turn.options.map((opt, oi) => (
                        <div key={oi} className={`p-3 rounded-xl border ${opt.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => setCoachTurns((p) => p.map((t, i) => i === ti
                              ? { ...t, options: t.options.map((o, j) => ({ ...o, isCorrect: j === oi })) }
                              : t))}
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${opt.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                            <span className="text-xs font-bold text-gray-500">{opt.isCorrect ? 'CORRECT' : 'Wrong'}</span>
                            <input value={opt.resultEmoji} onChange={(e) => updateTurnOption(ti, oi, 'resultEmoji', e.target.value)}
                              className="w-12 px-1 py-0.5 border border-gray-200 rounded-lg text-lg text-center ml-auto focus:outline-none" />
                          </div>
                          <input value={opt.text} onChange={(e) => updateTurnOption(ti, oi, 'text', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm mb-1 focus:outline-none"
                            placeholder="Child's response option..." />
                          <input value={opt.feedback} onChange={(e) => updateTurnOption(ti, oi, 'feedback', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                            placeholder="Feedback after selecting this..." />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => setCoachTurns((p) => [...p, {
                  prompt: '',
                  options: [
                    { text: '', isCorrect: true, feedback: '', resultEmoji: '😊' },
                    { text: '', isCorrect: false, feedback: '', resultEmoji: '😕' },
                    { text: '', isCorrect: false, feedback: '', resultEmoji: '😢' },
                  ],
                }])}
                  className="flex items-center gap-2 px-5 py-2 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold hover:border-indigo-500 transition-all">
                  <Plus className="w-4 h-4" /> Add Turn
                </button>
              </div>
            )}
          </div>

          {/* Step 5 — Assign & Save */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-700 mb-5">5. Save Activity</h2>

            {selectedChildId && (
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input type="checkbox" checked={assignToChild} onChange={(e) => setAssignToChild(e.target.checked)} className="w-5 h-5 rounded" />
                <span className="text-gray-700 font-semibold">Assign to {selectedChild?.name} immediately</span>
              </label>
            )}

            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={() => { setTitle(''); setDescription(''); setError(''); }}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !description.trim()}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
              >
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> {editId ? 'Updating...' : 'Saving...'}</> : <><Save className="w-5 h-5" /> {editId ? 'Update Activity' : 'Save Activity'}</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

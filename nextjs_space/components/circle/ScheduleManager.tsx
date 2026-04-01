'use client';

import { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  timeOfDay: string;
  title: string;
  activityId?: string | null;
  notes?: string | null;
}

interface Activity {
  id: string;
  title: string;
  type: string;
}

interface Props {
  schedule: ScheduleEntry[];
  activities: Activity[];
  onAdd: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ScheduleManager({ schedule, activities, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('15:00');
  const [title, setTitle] = useState('Circle Time');
  const [activityId, setActivityId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const storyActivities = activities.filter(a => a.type === 'story');

  const handleAdd = async () => {
    if (!title || !time) return;
    setSaving(true);
    await onAdd({ dayOfWeek: day, timeOfDay: time, title, activityId: activityId || null, notes: notes || null });
    setShowForm(false);
    setTitle('Circle Time');
    setNotes('');
    setActivityId('');
    setSaving(false);
  };

  // Group by day
  const byDay: Record<number, ScheduleEntry[]> = {};
  for (const e of schedule) {
    if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = [];
    byDay[e.dayOfWeek].push(e);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          <Clock className="w-5 h-5 text-pink-500" />
          Weekly Circle Time Schedule
        </h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 font-bold rounded-xl hover:bg-pink-200 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      </div>

      {showForm && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Day</label>
              <select value={day} onChange={e => setDay(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-purple-500">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Session Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Circle Time – Emotions"
              className="w-full px-3 py-2 border-2 border-purple-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Story Activity (optional)</label>
            <select value={activityId} onChange={e => setActivityId(e.target.value)}
              className="w-full px-3 py-2 border-2 border-purple-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-purple-500">
              <option value="">— No specific story —</option>
              {storyActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Notes for parents (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Please ensure child is ready 5 min early"
              className="w-full px-3 py-2 border-2 border-purple-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition-all">Cancel</button>
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl text-sm disabled:opacity-60 hover:opacity-90 transition-all">
              {saving ? 'Saving...' : 'Save Slot'}
            </button>
          </div>
        </div>
      )}

      {schedule.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No sessions scheduled yet. Click "Add Slot" to create a recurring time.</p>
      ) : (
        <div className="space-y-2">
          {[1,2,3,4,5,6,0].filter(d => byDay[d]).map(d => (
            <div key={d}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{DAYS[d]}</div>
              {byDay[d].map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm mb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{entry.timeOfDay}</span>
                      <span className="text-sm font-semibold text-purple-700">{entry.title}</span>
                    </div>
                    {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                  </div>
                  <button onClick={() => onDelete(entry.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

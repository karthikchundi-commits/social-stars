'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface ConfusionData {
  type: string;
  confusionRate: number;
  priority: 'reduce' | 'maintain' | 'increase';
}

interface ConfusionMapChartProps {
  data: ConfusionData[];
  difficultyLevel?: number;
  totalHints?: number;
}

const TYPE_LABELS: Record<string, string> = {
  breathing: 'Breathing',
  emotion: 'Emotions',
  scenario: 'Scenarios',
  story: 'Stories',
  communication: 'Communication',
};

const PRIORITY_COLORS: Record<string, string> = {
  reduce: '#F87171',    // red - needs support
  maintain: '#60A5FA',  // blue - on track
  increase: '#34D399',  // green - excelling
};

export function ConfusionMapChart({ data, difficultyLevel = 0.5, totalHints = 0 }: ConfusionMapChartProps) {
  const barData = data.map(d => ({
    name: TYPE_LABELS[d.type] ?? d.type,
    'Confusion %': d.confusionRate,
    fill: PRIORITY_COLORS[d.priority],
  }));

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{Math.round(difficultyLevel * 100)}%</p>
          <p className="text-sm text-blue-500 font-medium">Difficulty Level</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{totalHints}</p>
          <p className="text-sm text-purple-500 font-medium">AI Hints Given</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{data.filter(d => d.priority === 'increase').length}</p>
          <p className="text-sm text-green-500 font-medium">Excelling Areas</p>
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Confusion Rate by Activity Type</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Confusion']} />
            <Bar dataKey="Confusion %" radius={[4, 4, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Needs Support</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> On Track</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Excelling</span>
      </div>
    </div>
  );
}

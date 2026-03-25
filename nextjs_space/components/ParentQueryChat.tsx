'use client';
// PC-11: Natural Language Parent Query — chat UI for parent dashboard

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  childId: string;
  childName: string;
}

const SUGGESTED_QUESTIONS = [
  'Why does my child keep making mistakes in story activities?',
  'What mood has my child been in most this month?',
  'What activity type should I focus on this week?',
  'How is my child progressing overall?',
];

export function ParentQueryChat({ childId, childName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/parent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, question }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer ?? 'Sorry, I could not get an answer right now.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm">Ask about {childName}</h3>
          <p className="text-xs text-gray-400">AI answers using {childName}'s actual progress data</p>
        </div>
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="px-5 py-4 space-y-4 max-h-64 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(input)}
          placeholder={`Ask anything about ${childName}…`}
          disabled={loading}
          className="flex-1 text-sm px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 disabled:opacity-50"
        />
        <button
          onClick={() => ask(input)}
          disabled={loading || !input.trim()}
          className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

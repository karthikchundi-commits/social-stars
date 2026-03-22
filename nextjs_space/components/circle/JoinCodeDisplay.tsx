'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function JoinCodeDisplay({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-semibold text-gray-500 uppercase tracking-widest">Join Code</p>
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {joinCode.split('').map((char, i) => (
            <span
              key={i}
              className="w-12 h-14 flex items-center justify-center bg-white border-4 border-purple-300 rounded-2xl text-3xl font-black text-purple-700 shadow-lg"
            >
              {char}
            </span>
          ))}
        </div>
        <button
          onClick={copy}
          className="p-3 bg-purple-100 hover:bg-purple-200 rounded-xl transition-all"
          title="Copy code"
        >
          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-purple-600" />}
        </button>
      </div>
      <p className="text-sm text-gray-400">Share this code with the children</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Plus, Trash2, BookOpen, Save, HelpCircle, Image as ImageIcon } from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Playground', url: 'https://cdn.abacus.ai/images/83e2b54b-1e7d-40a7-a853-188cac3c99d8.jpg' },
  { label: 'Classroom', url: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg' },
  { label: 'Home', url: 'https://cdn.abacus.ai/images/991e7112-f748-4224-95f5-287204544337.jpg' },
  { label: 'Greeting', url: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg' },
  { label: 'Sharing', url: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg' },
  { label: 'Helping', url: 'https://cdn.abacus.ai/images/cb0f72ba-d55f-4e82-b34b-2d99c229def4.jpg' },
  { label: 'Taking Turns', url: 'https://cdn.abacus.ai/images/97cca0a3-bcab-4e6c-b861-9585254062db.jpg' },
  { label: 'Worried', url: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg' },
];

interface StoryPage {
  text: string;
  image: string;
  hasQuestion: boolean;
  question: string;
  options: string[];
  correctAnswer: number;
}

const blankPage = (): StoryPage => ({
  text: '',
  image: PRESET_IMAGES[0].url,
  hasQuestion: false,
  question: '',
  options: ['', '', ''],
  correctAnswer: 0,
});

export default function StoryBuilderPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pages, setPages] = useState<StoryPage[]>([blankPage()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeImagePicker, setActiveImagePicker] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status]);

  const updatePage = (index: number, field: keyof StoryPage, value: any) => {
    setPages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const updateOption = (pageIndex: number, optIndex: number, value: string) => {
    setPages((prev) => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      const newOptions = [...p.options];
      newOptions[optIndex] = value;
      return { ...p, options: newOptions };
    }));
  };

  const addPage = () => setPages((prev) => [...prev, blankPage()]);

  const removePage = (index: number) => {
    if (pages.length === 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please add a title and description.');
      return;
    }
    if (pages.some((p) => !p.text.trim())) {
      setError('Each page needs story text.');
      return;
    }
    if (pages.some((p) => p.hasQuestion && (!p.question.trim() || p.options.some((o) => !o.trim())))) {
      setError('Please fill in all question fields or remove the question.');
      return;
    }

    setSaving(true);
    setError('');

    const content = {
      pages: pages.map((p) => ({
        text: p.text,
        image: p.image,
        ...(p.hasQuestion ? {
          question: p.question,
          options: p.options,
          correctAnswer: p.correctAnswer,
        } : {}),
      })),
    };

    const res = await fetch('/api/activities/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, content }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => router.push('/parent-dashboard'), 1500);
    } else {
      setError('Failed to save story. Please try again.');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl font-bold text-purple-600">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Story Builder</h1>
              <p className="text-gray-500">Create a personalised social story</p>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Story Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                placeholder="e.g. Sam's First Day at School"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description *</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="e.g. A story about starting somewhere new"
              />
            </div>
          </div>

          {/* Pages */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-700">Story Pages ({pages.length})</h2>

            {pages.map((page, pageIndex) => (
              <div key={pageIndex} className="border-2 border-gray-100 rounded-2xl p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-purple-600">Page {pageIndex + 1}</span>
                  {pages.length > 1 && (
                    <button onClick={() => removePage(pageIndex)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Story text */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Story Text *</label>
                  <textarea
                    value={page.text}
                    onChange={(e) => updatePage(pageIndex, 'text', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Write what happens on this page..."
                  />
                </div>

                {/* Image picker */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Scene Image
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        onClick={() => updatePage(pageIndex, 'image', img.url)}
                        className={`relative aspect-video rounded-xl overflow-hidden border-4 transition-all ${page.image === img.url ? 'border-purple-500 scale-105' : 'border-transparent hover:border-purple-200'}`}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">{img.label}</div>
                      </button>
                    ))}
                  </div>
                  <input
                    value={PRESET_IMAGES.some((i) => i.url === page.image) ? '' : page.image}
                    onChange={(e) => updatePage(pageIndex, 'image', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                    placeholder="Or paste a custom image URL..."
                  />
                </div>

                {/* Optional question */}
                <div>
                  <button
                    onClick={() => updatePage(pageIndex, 'hasQuestion', !page.hasQuestion)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${page.hasQuestion ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    {page.hasQuestion ? 'Remove Question' : 'Add Comprehension Question'}
                  </button>

                  {page.hasQuestion && (
                    <div className="mt-4 bg-purple-50 rounded-xl p-4 space-y-3">
                      <input
                        value={page.question}
                        onChange={(e) => updatePage(pageIndex, 'question', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        placeholder="Question text..."
                      />
                      <div className="space-y-2">
                        {page.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${pageIndex}`}
                              checked={page.correctAnswer === optIndex}
                              onChange={() => updatePage(pageIndex, 'correctAnswer', optIndex)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <input
                              value={opt}
                              onChange={(e) => updateOption(pageIndex, optIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                              placeholder={`Option ${optIndex + 1}${page.correctAnswer === optIndex ? ' (correct)' : ''}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-purple-600">Select the radio button next to the correct answer.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addPage}
              className="w-full py-4 border-2 border-dashed border-purple-300 rounded-2xl text-purple-600 font-bold hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Page
            </button>
          </div>

          {error && <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="mt-8 w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-xl rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Save className="w-6 h-6" />
            {saved ? 'Saved! Redirecting...' : saving ? 'Saving...' : 'Save Story'}
          </button>
        </div>
      </div>
    </div>
  );
}

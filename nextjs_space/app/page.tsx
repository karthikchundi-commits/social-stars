'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, Heart, Star, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      router.replace(role === 'therapist' ? '/therapist' : '/select-child');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 sparkle">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-purple-600 mb-4">
            Social Stars
          </h1>
          <p className="text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            A fun and engaging way for children to learn social and emotional skills through interactive games and stories
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/get-started"
              className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-3xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/get-started"
              className="px-10 py-5 bg-white text-purple-600 font-bold text-xl rounded-3xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl border-2 border-purple-200"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="child-card bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Emotion Recognition</h3>
            <p className="text-lg text-gray-600">
              Learn to identify and understand different emotions through colorful, engaging games
            </p>
          </div>

          <div className="child-card bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Social Scenarios</h3>
            <p className="text-lg text-gray-600">
              Practice real-life social situations like sharing, greeting, and helping others
            </p>
          </div>

          <div className="child-card bg-gradient-to-br from-green-50 to-teal-50">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Interactive Stories</h3>
            <p className="text-lg text-gray-600">
              Enjoy stories that teach social cues and emotional understanding with choices
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-4xl font-bold text-center text-purple-600 mb-8">
            Designed for Young Learners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">✓</span>
              </div>
              <p className="text-gray-700">
                <strong>Age-Appropriate:</strong> Specially designed for children aged 3-6 years
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">✓</span>
              </div>
              <p className="text-gray-700">
                <strong>Visual Learning:</strong> Bright colors and large buttons make it easy to navigate
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">✓</span>
              </div>
              <p className="text-gray-700">
                <strong>Audio Feedback:</strong> Encouraging voice messages to support learning
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">✓</span>
              </div>
              <p className="text-gray-700">
                <strong>Progress Tracking:</strong> Parents can monitor achievements and progress
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">✓</span>
              </div>
              <p className="text-gray-700">
                <strong>Reward System:</strong> Earn stars and badges for completing activities
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">✓</span>
              </div>
              <p className="text-gray-700">
                <strong>Safe & Fun:</strong> A positive, encouraging environment for learning
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-4xl font-bold text-purple-600 mb-6">
            Start Your Child's Learning Journey Today!
          </h2>
          <Link
            href="/get-started"
            className="inline-block px-12 py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-2xl rounded-3xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-2xl"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}

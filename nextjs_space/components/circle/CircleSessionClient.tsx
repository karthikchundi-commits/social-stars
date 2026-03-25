'use client';

import { useEffect, useReducer, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CircleParticipant, CircleSessionState, AnsweredPayload } from '@/lib/circleTime';
import { ParticipantGrid } from './ParticipantGrid';
import { WaitingLobby } from './WaitingLobby';
import { StoryPageView } from './StoryPageView';
import { HostControls } from './HostControls';
import { LiveEmotionDetector } from './LiveEmotionDetector';

interface StoryPage {
  text: string;
  image: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

interface ClientState {
  session: CircleSessionState;
  pages: StoryPage[];
  activityTitle: string;
  answers: AnsweredPayload[];
  myAnswer: number | null;
  advancing: boolean;
  starting: boolean;
}

type Action =
  | { type: 'PAGE_CHANGED'; page: number }
  | { type: 'SESSION_STARTED'; totalPages: number }
  | { type: 'SESSION_ENDED' }
  | { type: 'PARTICIPANT_JOINED'; participant: CircleParticipant }
  | { type: 'PARTICIPANT_LEFT'; participantId: string }
  | { type: 'EMOTION_UPDATED'; participantId: string; emotion: string }
  | { type: 'ANSWER_RECEIVED'; answer: AnsweredPayload }
  | { type: 'MY_ANSWER'; answerIndex: number }
  | { type: 'ADVANCING'; value: boolean }
  | { type: 'STARTING'; value: boolean }
  // PC-13: activity push
  | { type: 'ACTIVITY_PUSHED'; pages: StoryPage[]; activityTitle: string };

function reducer(state: ClientState, action: Action): ClientState {
  switch (action.type) {
    case 'PAGE_CHANGED':
      return { ...state, session: { ...state.session, currentPage: action.page }, answers: [], myAnswer: null, advancing: false };
    case 'SESSION_STARTED':
      return { ...state, session: { ...state.session, status: 'active' }, starting: false };
    case 'SESSION_ENDED':
      return { ...state, session: { ...state.session, status: 'ended' } };
    case 'PARTICIPANT_JOINED':
      if (state.session.participants.find(p => p.id === action.participant.id)) return state;
      return { ...state, session: { ...state.session, participants: [...state.session.participants, action.participant] } };
    case 'PARTICIPANT_LEFT':
      return { ...state, session: { ...state.session, participants: state.session.participants.filter(p => p.id !== action.participantId) } };
    case 'EMOTION_UPDATED':
      return {
        ...state,
        session: {
          ...state.session,
          participants: state.session.participants.map(p =>
            p.id === action.participantId ? { ...p, currentEmotion: action.emotion } : p
          ),
        },
      };
    case 'ANSWER_RECEIVED':
      if (state.answers.find(a => a.participantId === action.answer.participantId)) return state;
      return { ...state, answers: [...state.answers, action.answer] };
    case 'MY_ANSWER':
      return { ...state, myAnswer: action.answerIndex };
    case 'ADVANCING':
      return { ...state, advancing: action.value };
    case 'STARTING':
      return { ...state, starting: action.value };
    case 'ACTIVITY_PUSHED':
      return {
        ...state,
        pages: action.pages,
        activityTitle: action.activityTitle,
        session: { ...state.session, currentPage: 0 },
        answers: [],
        myAnswer: null,
      };
    default:
      return state;
  }
}

interface Props {
  initialSession: CircleSessionState;
  activityContent: string;
  activityTitle: string;
  participantId: string;
  isHost: boolean;
}

export function CircleSessionClient({ initialSession, activityContent, activityTitle, participantId, isHost }: Props) {
  const router = useRouter();
  const pages: StoryPage[] = JSON.parse(activityContent)?.pages ?? [];

  // PC-13: load available activities for host push picker
  const [availableActivities, setAvailableActivities] = useState<{ id: string; title: string; type: string }[]>([]);
  const [pushedBanner, setPushedBanner] = useState<string | null>(null); // activity title for participant banner

  useEffect(() => {
    if (isHost) {
      fetch('/api/activities').then(r => r.json()).then(d => setAvailableActivities(d.activities ?? []));
    }
  }, [isHost]);

  const [state, dispatch] = useReducer(reducer, {
    session: initialSession,
    pages,
    activityTitle,
    answers: [],
    myAnswer: null,
    advancing: false,
    starting: false,
  });

  const channelRef = useRef<any>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const myParticipant = state.session.participants.find(p => p.id === participantId);

  // Pusher subscription
  useEffect(() => {
    let channel: any;
    const subscribe = async () => {
      const pusherClient = await (await import('@/lib/pusherClient')).getPusherClient();
      if (!pusherClient) return;
      channel = pusherClient.subscribe(`circle-${state.session.joinCode}`);
      channelRef.current = channel;

      channel.bind('host:page-changed', (data: { page: number }) => {
        dispatch({ type: 'PAGE_CHANGED', page: data.page });
      });
      channel.bind('host:session-started', () => {
        dispatch({ type: 'SESSION_STARTED', totalPages: pages.length });
      });
      channel.bind('host:session-ended', () => {
        dispatch({ type: 'SESSION_ENDED' });
        setTimeout(() => router.push('/'), 4000);
      });
      channel.bind('participant:joined', (data: CircleParticipant) => {
        dispatch({ type: 'PARTICIPANT_JOINED', participant: data });
      });
      channel.bind('participant:left', (data: { participantId: string }) => {
        dispatch({ type: 'PARTICIPANT_LEFT', participantId: data.participantId });
      });
      channel.bind('participant:emotion', (data: { participantId: string; emotion: string }) => {
        dispatch({ type: 'EMOTION_UPDATED', participantId: data.participantId, emotion: data.emotion });
      });
      channel.bind('participant:answered', (data: AnsweredPayload) => {
        dispatch({ type: 'ANSWER_RECEIVED', answer: data });
        if (data.isCorrect) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      });
      // PC-13: therapist pushed a new activity — switch all devices immediately
      channel.bind('host:push-activity', (data: { activityId: string; activityTitle: string; activityType: string; activityContent: string }) => {
        const newPages: StoryPage[] = JSON.parse(data.activityContent)?.pages ?? [];
        dispatch({ type: 'ACTIVITY_PUSHED', pages: newPages, activityTitle: data.activityTitle });
        if (!isHost) setPushedBanner(data.activityTitle);
      });
    };
    subscribe();

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.pusher?.unsubscribe(`circle-${state.session.joinCode}`);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Heartbeat
  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      fetch(`/api/circle/${state.session.id}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      }).catch(() => {});
    }, 20000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [state.session.id, participantId]);

  const handleStart = useCallback(async () => {
    dispatch({ type: 'STARTING', value: true });
    await fetch(`/api/circle/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', participantId }),
    });
  }, [state.session.id, participantId]);

  const handleAdvance = useCallback(async () => {
    dispatch({ type: 'ADVANCING', value: true });
    await fetch(`/api/circle/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance', participantId }),
    });
  }, [state.session.id, participantId]);

  const handleEnd = useCallback(async () => {
    await fetch(`/api/circle/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end', participantId }),
    });
  }, [state.session.id, participantId]);

  const handleAnswer = useCallback(async (answerIndex: number) => {
    if (state.myAnswer !== null) return;
    const page = pages[state.session.currentPage];
    const isCorrect = answerIndex === page?.correctAnswer;
    dispatch({ type: 'MY_ANSWER', answerIndex });
    await fetch(`/api/circle/${state.session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'answer',
        participantId,
        answerIndex,
        isCorrect,
        displayName: myParticipant?.displayName ?? 'Me',
        avatarColor: myParticipant?.avatarColor ?? '#818CF8',
      }),
    });
    if (isCorrect) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [state.myAnswer, state.session.currentPage, state.session.id, pages, participantId, myParticipant]);

  const currentPage = state.pages[state.session.currentPage];

  if (state.session.status === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-black text-purple-700 mb-2">Circle Time Complete!</h1>
          <p className="text-gray-500">Great work everyone! Going back home...</p>
        </div>
      </div>
    );
  }

  if (state.session.status === 'waiting') {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <WaitingLobby
          joinCode={state.session.joinCode}
          participants={state.session.participants}
          isHost={isHost}
          onStart={handleStart}
          starting={state.starting}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
      {/* PC-13: pushed activity banner for participants */}
      {pushedBanner && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm z-50 flex items-center justify-center gap-2">
          <span>⚡ Therapist switched to: {pushedBanner}</span>
          <button onClick={() => setPushedBanner(null)} className="ml-4 text-yellow-700 hover:text-yellow-900">✕</button>
        </div>
      )}
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-purple-700">{state.activityTitle}</h1>
        </div>

        <div className="mb-4">
          <ParticipantGrid participants={state.session.participants} />
        </div>

        {currentPage && (
          <StoryPageView
            page={currentPage}
            pageIndex={state.session.currentPage}
            totalPages={state.pages.length}
            myAnswer={state.myAnswer}
            onAnswer={handleAnswer}
            answers={state.answers}
            disabled={isHost}
          />
        )}
      </div>

      <LiveEmotionDetector
        sessionId={state.session.id}
        participantId={participantId}
      />

      {isHost && (
        <HostControls
          currentPage={state.session.currentPage}
          totalPages={state.pages.length}
          onAdvance={handleAdvance}
          onEnd={handleEnd}
          advancing={state.advancing}
          sessionId={state.session.id}
          participantId={participantId}
          activities={availableActivities}
        />
      )}
    </div>
  );
}

export type SessionStatus = 'waiting' | 'active' | 'ended';

export interface CircleParticipant {
  id: string;
  displayName: string;
  avatarColor: string;
  isHost: boolean;
  currentEmotion: string;
  childId: string | null;
}

export interface CircleSessionState {
  id: string;
  joinCode: string;
  activityId: string;
  status: SessionStatus;
  currentPage: number;
  participants: CircleParticipant[];
}

export interface AnsweredPayload {
  participantId: string;
  displayName: string;
  answerIndex: number;
  isCorrect: boolean;
  avatarColor: string;
}

export const AVATAR_COLORS = [
  '#818CF8', '#F472B6', '#34D399', '#FBBF24',
  '#60A5FA', '#A78BFA', '#F87171', '#4ADE80',
];

export const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', confused: '😕', frustrated: '😤',
  focused: '🧐', neutral: '😐', anxious: '😰',
  surprised: '😲', scared: '😨', excited: '🤩',
};

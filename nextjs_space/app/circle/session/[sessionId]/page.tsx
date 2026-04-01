import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CircleSessionClient } from '@/components/circle/CircleSessionClient';

interface Props {
  params: { sessionId: string };
  searchParams: { participantId?: string };
}

export default async function CircleSessionPage({ params, searchParams }: Props) {
  const { sessionId } = params;
  const participantId = searchParams.participantId ?? '';

  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: { participants: true, activity: true },
  });

  if (!session) notFound();

  const participant = session.participants.find(p => p.id === participantId);

  const initialSession = {
    id: session.id,
    joinCode: session.joinCode,
    activityId: session.activityId,
    status: session.status as any,
    currentPage: session.currentPage,
    participants: session.participants.map(p => ({
      id: p.id,
      displayName: p.displayName,
      avatarColor: p.avatarColor,
      isHost: p.isHost,
      currentEmotion: p.currentEmotion,
      childId: p.childId,
    })),
  };

  return (
    <CircleSessionClient
      initialSession={initialSession}
      activityContent={session.activity.content}
      activityTitle={session.activity.title}
      participantId={participantId}
      isHost={participant?.isHost ?? false}
    />
  );
}

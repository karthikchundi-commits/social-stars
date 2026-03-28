import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { geminiJSON, isGeminiConfigured } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// ── Content schema descriptions for the prompt ──────────────────────────────

const SCHEMA_DOCS: Record<string, string> = {
  emotion: `Return content as: { "emotion": "<emotion_name>" }
The emotion must be one of: happy, sad, angry, surprised, scared, disgusted, calm, excited, worried, proud.
The child will be shown 6 face images and must pick the one matching the emotion.
Example: { "emotion": "happy" }`,

  scenario: `Return content as: { "choices": [ { "text": "...", "isCorrect": true|false, "feedback": "..." }, ... ] }
Provide exactly 3-4 choices. Exactly one must have isCorrect: true.
feedback should be warm, encouraging (1-2 sentences), child-appropriate.
Example: { "choices": [
  { "text": "Wait patiently for your turn", "isCorrect": true, "feedback": "That's great! Waiting your turn is very kind." },
  { "text": "Grab the toy anyway", "isCorrect": false, "feedback": "It's better to wait so everyone gets a turn." },
  { "text": "Walk away and cry", "isCorrect": false, "feedback": "It's okay to feel sad, but try asking instead." }
]}`,

  story: `Return content as: { "pages": [ { "text": "...", "image": "", "question": "...", "options": ["...", "...", "..."], "correctAnswer": 0 }, ... ] }
- Provide 3-5 pages. At least 2 pages must have a question.
- question is optional on pure narrative pages (set to null/omit if so).
- options is an array of 3 short answer strings.
- correctAnswer is the 0-based index of the correct option.
- image can be empty string "".
- text should be 1-3 simple sentences, age-appropriate for 3-6 year olds.
Example page: { "text": "Mia sees her friend crying on the playground.", "image": "", "question": "What should Mia do?", "options": ["Walk away", "Ask if she is okay", "Laugh at her"], "correctAnswer": 1 }`,

  breathing: `Return content as: { "instruction": "...", "cycles": 3, "phases": [ { "label": "...", "duration": 4, "color": "#hex", "expand": true|false }, ... ] }
- instruction: short prompt shown to the child (e.g. "Let's breathe together to feel calm")
- cycles: number of breath cycles (2-4 recommended)
- phases: array of exactly 3 phases: inhale, hold, exhale
- duration: seconds (inhale 3-5, hold 1-3, exhale 3-6)
- color: hex colour matching the mood (calming blues/greens for anxiety, warm for energy)
- expand: true for inhale (circle grows), false for exhale (circle shrinks)
Example: { "instruction": "Let's take big, slow breaths together.", "cycles": 3, "phases": [
  { "label": "Breathe In", "duration": 4, "color": "#4ECDC4", "expand": true },
  { "label": "Hold", "duration": 2, "color": "#45B7D1", "expand": true },
  { "label": "Breathe Out", "duration": 5, "color": "#96CEB4", "expand": false }
]}`,

  communication: `Return content as: { "instruction": "...", "targetTaps": 3, "items": [ { "label": "...", "emoji": "...", "audio": "..." }, ... ] }
- instruction: what the child should do (e.g. "Tap 3 things you want!")
- targetTaps: how many taps to complete (2-5)
- items: 6-8 communication board items relevant to the child's context
- label: short word/phrase (1-3 words)
- emoji: single emoji character
- audio: the text that will be spoken aloud (can match label or be a full phrase)
Example: { "instruction": "Tell me how you feel today!", "targetTaps": 3, "items": [
  { "label": "Happy", "emoji": "😊", "audio": "I feel happy!" },
  { "label": "Sad", "emoji": "😢", "audio": "I feel sad." },
  { "label": "Help", "emoji": "🙋", "audio": "I need help please." }
]}`,

  social_coach: `Return content as: { "scenario": "...", "characterName": "...", "characterEmoji": "...", "turns": [ { "prompt": "...", "options": [ { "text": "...", "isCorrect": true|false, "feedback": "...", "resultEmoji": "..." } ] } ] }
- scenario: brief description of the real-world social situation (1-2 sentences)
- characterName: name of the child's conversation partner (e.g. "Lily", "Teacher Kim")
- characterEmoji: emoji representing the character (e.g. "👧", "👩‍🏫")
- turns: 2-4 conversation turns, each presenting a social choice
- prompt: what the other person says or does (simple, concrete language for ages 3-6)
- options: exactly 3 choices the child can pick, one isCorrect: true
- feedback: warm, 1-sentence response shown after selection
- resultEmoji: emoji showing the character's reaction (😊 for correct, 😕 for incorrect)
Example: { "scenario": "You see a new friend sitting alone at lunch.", "characterName": "Sam", "characterEmoji": "👦",
  "turns": [
    { "prompt": "Sam looks sad and is sitting alone.", "options": [
      { "text": "Ask Sam to eat with you", "isCorrect": true, "feedback": "That was so kind! Sam is happy now.", "resultEmoji": "😊" },
      { "text": "Ignore Sam and sit somewhere else", "isCorrect": false, "feedback": "Sam might feel lonely. Try saying hello next time!", "resultEmoji": "😕" },
      { "text": "Point and laugh", "isCorrect": false, "feedback": "That would hurt Sam's feelings. Being kind is better.", "resultEmoji": "😢" }
    ]}
  ]
}`,
};

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'therapist') {
    return NextResponse.json({ error: 'Therapist account required' }, { status: 403 });
  }

  const {
    childId,
    childName,
    childAge,
    goals,
    recentMoods,
    completedTypes,
    challenges,
    activityType,
    extraInstructions,
    preview = false, // if true, return suggestion without saving to DB
  } = await request.json();

  if (!childId || !activityType) {
    return NextResponse.json({ error: 'childId and activityType are required' }, { status: 400 });
  }

  // Verify therapist is linked to this child's parent
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

  const link = await prisma.therapistFamily.findUnique({
    where: { therapistId_parentId: { therapistId: userId, parentId: child.userId } },
  });
  if (!link) return NextResponse.json({ error: 'Not linked to this child\'s family' }, { status: 403 });

  const schemaDocs = SCHEMA_DOCS[activityType];
  if (!schemaDocs) {
    return NextResponse.json({ error: `Unsupported activity type: ${activityType}` }, { status: 400 });
  }

  // ── Build prompt ───────────────────────────────────────────────────────────
  const childContext = [
    `Child name: ${childName ?? child.name}`,
    `Age: ${childAge ?? child.age} years old`,
    goals ? `Therapist goals: ${goals}` : null,
    recentMoods?.length ? `Recent moods (last 7 days): ${recentMoods.join(', ')}` : null,
    completedTypes?.length ? `Activity types already completed: ${completedTypes.join(', ')}` : 'No activities completed yet',
    challenges ? `Current challenges / clinical notes: ${challenges}` : null,
    extraInstructions ? `Extra instructions from therapist: ${extraInstructions}` : null,
  ].filter(Boolean).join('\n');

  const userPrompt = `You are an expert paediatric occupational therapist creating a personalised activity for a child with autism.

## Child Context
${childContext}

## Activity to Generate
Type: ${activityType}

## Output Format
Return ONLY a valid JSON object with exactly these top-level keys:
- "title": short, engaging title (max 8 words)
- "description": one sentence describing the activity for the parent dashboard
- "content": the activity content object (schema below)

${schemaDocs}

## Guidelines
- Use simple, concrete language suitable for ages 3-6
- Tailor the theme and content to the child's goals and current emotional state
- If the child is anxious or angry, choose calming, reassuring themes
- If the child is happy/excited, use more energetic social themes
- Avoid scary, stressful, or abstract scenarios
- Keep all text very short and positive

Respond with ONLY the JSON object. No markdown, no explanation.`;

  try {
    let parsed: { title: string; description: string; content: unknown };
    try {
      parsed = await geminiJSON<{ title: string; description: string; content: unknown }>(userPrompt, 2048);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 });
    }

    // Preview mode — return suggestion without saving
    if (preview) {
      return NextResponse.json({ title: parsed.title, description: parsed.description, content: parsed.content });
    }

    // Save activity to DB
    const activity = await prisma.activity.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        type: activityType,
        content: JSON.stringify(parsed.content),
        difficulty: 2,
        starsReward: 3,
        createdBy: userId,
      },
    });

    // Assign to child automatically
    await prisma.activityAssignment.upsert({
      where: { childId_activityId: { childId, activityId: activity.id } },
      update: { assignedBy: userId },
      create: { childId, activityId: activity.id, assignedBy: userId },
    });

    return NextResponse.json({ activity, content: parsed.content }, { status: 201 });
  } catch (err: any) {
    console.error('AI generation error:', err);
    return NextResponse.json({ error: err.message ?? 'AI generation failed' }, { status: 500 });
  }
}

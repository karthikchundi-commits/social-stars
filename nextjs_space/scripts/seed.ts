import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'Test Parent',
    },
  });
  console.log('Created test user:', user.email);

  // ── EMOTION ACTIVITIES ───────────────────────────────────────────────────────
  const emotionActivities = [
    {
      title: 'Find Happy!',
      description: 'Can you find the happy face?',
      type: 'emotion',
      category: 'happy',
      imageUrl: 'https://cdn.abacus.ai/images/a787547d-75e2-491e-9a32-79f6a6f8b545.jpg',
      content: JSON.stringify({ emotion: 'happy' }),
      difficulty: 1,
      starsReward: 1,
    },
    {
      title: 'Find Sad!',
      description: 'Can you find the sad face?',
      type: 'emotion',
      category: 'sad',
      imageUrl: 'https://cdn.abacus.ai/images/449d23ac-d94d-4502-8095-e1d985ecb1bd.jpg',
      content: JSON.stringify({ emotion: 'sad' }),
      difficulty: 1,
      starsReward: 1,
    },
    {
      title: 'Find Surprised!',
      description: 'Can you find the surprised face?',
      type: 'emotion',
      category: 'surprised',
      imageUrl: 'https://cdn.abacus.ai/images/a2b11f46-14b4-4860-b8f7-fcd4f5f2d8ef.jpg',
      content: JSON.stringify({ emotion: 'surprised' }),
      difficulty: 1,
      starsReward: 1,
    },
    {
      title: 'Find Excited!',
      description: 'Can you find the excited face?',
      type: 'emotion',
      category: 'excited',
      imageUrl: 'https://cdn.abacus.ai/images/1a31838e-02cd-4676-b8d7-0fdec237e3db.jpg',
      content: JSON.stringify({ emotion: 'excited' }),
      difficulty: 2,
      starsReward: 1,
    },
    {
      title: 'Find Angry!',
      description: 'Can you find the angry face?',
      type: 'emotion',
      category: 'angry',
      imageUrl: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg',
      content: JSON.stringify({ emotion: 'angry' }),
      difficulty: 2,
      starsReward: 1,
    },
    {
      title: 'Find Scared!',
      description: 'Can you find the scared face?',
      type: 'emotion',
      category: 'scared',
      imageUrl: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
      content: JSON.stringify({ emotion: 'scared' }),
      difficulty: 2,
      starsReward: 1,
    },
  ];

  // ── SOCIAL SCENARIO ACTIVITIES ───────────────────────────────────────────────
  const scenarioActivities = [
    {
      title: 'Saying Hello',
      description: 'You see a friend at the playground. What should you do?',
      type: 'scenario',
      category: 'greeting',
      imageUrl: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
      content: JSON.stringify({
        scenario: 'greeting',
        choices: [
          { text: 'Wave and say "Hi!"', isCorrect: true, feedback: 'That\'s a friendly way to greet someone!' },
          { text: 'Turn away and ignore them', isCorrect: false, feedback: 'It\'s nice to say hello to friends.' },
          { text: 'Run away', isCorrect: false, feedback: 'Try waving and saying hi instead!' },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
    {
      title: 'Sharing Toys',
      description: 'Your friend wants to play with your toy. What should you do?',
      type: 'scenario',
      category: 'sharing',
      imageUrl: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg',
      content: JSON.stringify({
        scenario: 'sharing',
        choices: [
          { text: 'Share and take turns', isCorrect: true, feedback: 'Great! Sharing makes everyone happy!' },
          { text: 'Say "No! It\'s mine!"', isCorrect: false, feedback: 'Sharing helps us make friends.' },
          { text: 'Take all the toys away', isCorrect: false, feedback: 'Let\'s try sharing instead!' },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
    {
      title: 'Helping a Friend',
      description: 'Your friend dropped their crayons. What should you do?',
      type: 'scenario',
      category: 'helping',
      imageUrl: 'https://cdn.abacus.ai/images/cb0f72ba-d55f-4e82-b34b-2d99c229def4.jpg',
      content: JSON.stringify({
        scenario: 'helping',
        choices: [
          { text: 'Help them pick up the crayons', isCorrect: true, feedback: 'You\'re so helpful! That\'s very kind!' },
          { text: 'Walk away', isCorrect: false, feedback: 'It feels good to help others.' },
          { text: 'Laugh at them', isCorrect: false, feedback: 'Let\'s be kind and help instead!' },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
    {
      title: 'Taking Turns',
      description: 'Everyone wants to go on the slide. What should you do?',
      type: 'scenario',
      category: 'takingTurns',
      imageUrl: 'https://cdn.abacus.ai/images/97cca0a3-bcab-4e6c-b861-9585254062db.jpg',
      content: JSON.stringify({
        scenario: 'takingTurns',
        choices: [
          { text: 'Wait in line and take turns', isCorrect: true, feedback: 'Perfect! Taking turns makes playtime fun for everyone!' },
          { text: 'Push in front of everyone', isCorrect: false, feedback: 'We need to take turns so everyone can have fun.' },
          { text: 'Leave the playground', isCorrect: false, feedback: 'Just wait your turn — you\'ll get to play soon!' },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
    {
      title: 'Asking for Help',
      description: 'You can\'t open your lunchbox. What should you do?',
      type: 'scenario',
      category: 'askingHelp',
      imageUrl: 'https://cdn.abacus.ai/images/cb0f72ba-d55f-4e82-b34b-2d99c229def4.jpg',
      content: JSON.stringify({
        scenario: 'askingHelp',
        choices: [
          { text: 'Ask a teacher or friend for help', isCorrect: true, feedback: 'Asking for help is a brave and smart thing to do!' },
          { text: 'Cry and give up', isCorrect: false, feedback: 'It\'s OK to ask someone for help!' },
          { text: 'Throw the lunchbox', isCorrect: false, feedback: 'Let\'s try asking for help instead.' },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
    {
      title: 'When I Make a Mistake',
      description: 'You spilled paint on your friend\'s drawing by accident. What do you do?',
      type: 'scenario',
      category: 'mistakes',
      imageUrl: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
      content: JSON.stringify({
        scenario: 'mistakes',
        choices: [
          { text: 'Say "I\'m sorry" and help clean it up', isCorrect: true, feedback: 'Saying sorry and helping is the kind thing to do!' },
          { text: 'Run away and pretend it didn\'t happen', isCorrect: false, feedback: 'It\'s always better to say sorry.' },
          { text: 'Blame someone else', isCorrect: false, feedback: 'Telling the truth and saying sorry is brave!' },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
    {
      title: 'Feeling Angry',
      description: 'You feel very angry because someone took your toy. What is the best thing to do?',
      type: 'scenario',
      category: 'emotionRegulation',
      imageUrl: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg',
      content: JSON.stringify({
        scenario: 'emotionRegulation',
        choices: [
          { text: 'Take three deep breaths and use words to say how I feel', isCorrect: true, feedback: 'Taking deep breaths is a superpower when we feel angry!' },
          { text: 'Hit the person', isCorrect: false, feedback: 'We never hurt others. Try breathing and using words instead.' },
          { text: 'Scream and throw things', isCorrect: false, feedback: 'Let\'s try breathing slowly to calm our body.' },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
    {
      title: 'Joining a Group',
      description: 'Some kids are playing a game. You want to join them. What do you do?',
      type: 'scenario',
      category: 'joining',
      imageUrl: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
      content: JSON.stringify({
        scenario: 'joining',
        choices: [
          { text: 'Walk over and ask "Can I play too?"', isCorrect: true, feedback: 'Asking politely is the perfect way to join in!' },
          { text: 'Push into the game without asking', isCorrect: false, feedback: 'It\'s polite to ask first before joining.' },
          { text: 'Stand far away and watch quietly', isCorrect: false, feedback: 'You can do it — walk over and ask to join!' },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
  ];

  // ── STORY ACTIVITIES ─────────────────────────────────────────────────────────
  const storyActivities = [
    {
      title: 'The Playground Friends',
      description: 'A story about making new friends',
      type: 'story',
      category: 'playground',
      imageUrl: 'https://cdn.abacus.ai/images/83e2b54b-1e7d-40a7-a853-188cac3c99d8.jpg',
      content: JSON.stringify({
        pages: [
          { text: 'Lily went to the playground. She saw other children playing.', image: 'https://cdn.abacus.ai/images/83e2b54b-1e7d-40a7-a853-188cac3c99d8.jpg' },
          {
            text: 'Lily wanted to play too. She walked over and smiled at them.',
            image: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
            question: 'What did Lily do?',
            options: ['She smiled and said hi', 'She ran away', 'She cried'],
            correctAnswer: 0,
          },
          { text: '"Hi! Can I play with you?" Lily asked. The children said "Yes! Come play!"', image: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg' },
          { text: 'They all played together and had so much fun! Lily made new friends.', image: 'https://cdn.abacus.ai/images/97cca0a3-bcab-4e6c-b861-9585254062db.jpg' },
        ],
      }),
      difficulty: 2,
      starsReward: 3,
    },
    {
      title: 'Circle Time at School',
      description: 'Learning to listen, share feelings, and be kind in class',
      type: 'story',
      category: 'classroom',
      imageUrl: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
      content: JSON.stringify({
        pages: [
          // Page 1 — scene setter
          {
            text: 'It was Monday morning at Maple Leaf School. Sam walked into class and sat on the colourful rug. Circle time was about to begin!',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
          },
          // Page 2 — emotion: happy (camera detects happy face)
          {
            text: 'The teacher smiled at everyone. "Good morning, friends! How is everyone feeling today?" Sam loved school and had a big smile on his face.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'How does Sam feel this morning?',
            options: ['Sam feels happy and excited to be at school!', 'Sam feels sad and wants to go home.', 'Sam feels scared and worried.'],
            correctAnswer: 0,
          },
          // Page 3 — action: raise_hand
          {
            text: 'The teacher asked, "Who can tell me what day it is today?" Sam knew the answer — it was Monday! He really wanted to tell the class.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'Sam knows the answer! What should he do?',
            options: ['Raise your hand and wait for the teacher', 'Shout the answer across the room', 'Look at the floor and say nothing'],
            correctAnswer: 0,
          },
          // Page 4 — scene (no question)
          {
            text: '"Monday!" said Sam proudly when the teacher called his name. "Well done, Sam!" said the teacher. Sam felt so proud. The whole class clapped!',
            image: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
          },
          // Page 5 — scenario choice (kind behaviour)
          {
            text: 'Next, the teacher asked everyone to share one thing they did at the weekend. Sam\'s friend Maya looked nervous — it was nearly her turn to speak!',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'Maya looks nervous. What is the kind thing to do?',
            options: ['Give Maya a thumbs up and a smile to encourage her', 'Tell her she is doing it wrong', 'Talk loudly while she is speaking'],
            correctAnswer: 0,
          },
          // Page 6 — emotion: scared (camera detects scared face)
          {
            text: 'Then a brand new student walked in. She had never been to this school before. She stood at the door and looked all around the room.',
            image: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
            question: 'How is the new student feeling?',
            options: ['She feels scared and worried about being somewhere new.', 'She feels happy and excited to jump in.', 'She feels angry and frustrated.'],
            correctAnswer: 0,
          },
          // Page 7 — action: raise_hand (to offer to help)
          {
            text: 'The teacher said, "Who would like to be a buddy and help our new friend find a seat?" Sam really wanted to help her feel welcome.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'Sam wants to volunteer to help. What should he do?',
            options: ['Raise your hand to show the teacher you want to help', 'Push in front of everyone to get there first', 'Wait and do nothing'],
            correctAnswer: 0,
          },
          // Page 8 — emotion: happy (end of story)
          {
            text: 'Sam showed the new student to a seat and whispered, "Don\'t worry, circle time is really fun!" She smiled back. By the end of class they were already friends.',
            image: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg',
            question: 'How do Sam and his new friend feel at the end of circle time?',
            options: ['Happy and proud — making a friend feels wonderful!', 'Sad because the day is over.', 'Angry because class was too long.'],
            correctAnswer: 0,
          },
        ],
      }),
      difficulty: 2,
      starsReward: 5,
    },
    {
      title: 'The Dragon Who Felt Angry',
      description: 'A story about handling big feelings',
      type: 'story',
      category: 'angermanagement',
      imageUrl: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg',
      content: JSON.stringify({
        pages: [
          { text: 'Dex the dragon had big, fiery feelings inside. When things went wrong, he felt very angry.', image: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg' },
          { text: 'One day, another dragon accidentally knocked over Dex\'s blocks. Dex felt his anger growing!', image: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg' },
          {
            text: 'Dex remembered what he learned. He took a big, slow breath in... and let it out slowly.',
            image: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg',
            question: 'What did Dex do to calm down?',
            options: ['Took a deep breath', 'Roared fire at everyone', 'Ran away'],
            correctAnswer: 0,
          },
          { text: '"I feel angry that you knocked my blocks," Dex said calmly. "Let\'s build them together." The other dragon smiled. Problem solved!', image: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg' },
        ],
      }),
      difficulty: 3,
      starsReward: 3,
    },
    {
      title: 'When I Feel Worried',
      description: 'A story about dealing with worry',
      type: 'story',
      category: 'anxiety',
      imageUrl: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
      content: JSON.stringify({
        pages: [
          { text: 'Mia had butterflies in her tummy. She was starting a new school today and felt very worried.', image: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg' },
          {
            text: 'Mia\'s mum held her hand. "It\'s okay to feel worried," she said. "What helps when you feel this way?"',
            image: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
            question: 'What can help when you feel worried?',
            options: ['Take deep breaths and talk to someone', 'Hide under the bed', 'Eat lots of sweets'],
            correctAnswer: 0,
          },
          { text: 'Mia took three slow deep breaths. She thought of her favourite toy at home waiting for her.', image: 'https://cdn.abacus.ai/images/991e7112-f748-4224-95f5-287204544337.jpg' },
          { text: 'At school, the teacher was kind and Mia found a friend by lunchtime. Worry can shrink when we breathe and try!', image: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg' },
        ],
      }),
      difficulty: 2,
      starsReward: 3,
    },
  ];

  // ── BREATHING ACTIVITIES ─────────────────────────────────────────────────────
  const breathingActivities = [
    {
      title: 'Belly Breathing',
      description: 'Put your hands on your tummy and breathe slowly',
      type: 'breathing',
      category: 'calm',
      imageUrl: null,
      content: JSON.stringify({
        instruction: 'Put your hands on your tummy. Feel it go up and down as you breathe!',
        cycles: 3,
        phases: [
          { label: 'Breathe In', duration: 4, color: '#60B5FF', expand: true },
          { label: 'Breathe Out', duration: 4, color: '#80D8C3', expand: false },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
    {
      title: 'Box Breathing',
      description: 'Breathe in, hold, breathe out, hold — like drawing a box!',
      type: 'breathing',
      category: 'calm',
      imageUrl: null,
      content: JSON.stringify({
        instruction: 'Follow the circle to breathe like a box — 4 sides, 4 counts each.',
        cycles: 3,
        phases: [
          { label: 'Breathe In', duration: 4, color: '#60B5FF', expand: true },
          { label: 'Hold', duration: 4, color: '#BB8FCE', expand: true },
          { label: 'Breathe Out', duration: 4, color: '#80D8C3', expand: false },
          { label: 'Hold', duration: 4, color: '#FF9149', expand: false },
        ],
      }),
      difficulty: 2,
      starsReward: 2,
    },
    {
      title: 'Star Breathing',
      description: 'Breathe in and out 5 times — one for each star point!',
      type: 'breathing',
      category: 'calm',
      imageUrl: null,
      content: JSON.stringify({
        instruction: 'Imagine a star! Each breath takes you to a new point on the star.',
        cycles: 5,
        phases: [
          { label: 'Breathe In', duration: 3, color: '#FFD700', expand: true },
          { label: 'Breathe Out', duration: 3, color: '#FF9149', expand: false },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
  ];

  // ── COMMUNICATION BOARD ACTIVITIES ───────────────────────────────────────────
  const communicationActivities = [
    {
      title: 'How I Feel',
      description: 'Practice saying how you feel using pictures',
      type: 'communication',
      category: 'feelings',
      imageUrl: null,
      content: JSON.stringify({
        instruction: 'Tap a picture to say how you feel! Tap 5 feelings.',
        targetTaps: 5,
        items: [
          { label: 'Happy', emoji: '😊', audio: 'I feel happy!' },
          { label: 'Sad', emoji: '😢', audio: 'I feel sad.' },
          { label: 'Angry', emoji: '😠', audio: 'I feel angry.' },
          { label: 'Scared', emoji: '😨', audio: 'I feel scared.' },
          { label: 'Excited', emoji: '🤩', audio: 'I feel excited!' },
          { label: 'Calm', emoji: '😌', audio: 'I feel calm.' },
          { label: 'Tired', emoji: '😴', audio: 'I feel tired.' },
          { label: 'Silly', emoji: '😜', audio: 'I feel silly!' },
          { label: 'Worried', emoji: '😟', audio: 'I feel worried.' },
          { label: 'Loved', emoji: '🥰', audio: 'I feel loved!' },
          { label: 'Frustrated', emoji: '😤', audio: 'I feel frustrated.' },
          { label: 'Surprised', emoji: '😲', audio: 'I feel surprised!' },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
    {
      title: 'What I Need',
      description: 'Practice asking for what you need',
      type: 'communication',
      category: 'needs',
      imageUrl: null,
      content: JSON.stringify({
        instruction: 'Tap a picture to say what you need! Tap 5 things.',
        targetTaps: 5,
        items: [
          { label: 'Water', emoji: '💧', audio: 'I need water please.' },
          { label: 'Food', emoji: '🍎', audio: 'I am hungry.' },
          { label: 'Bathroom', emoji: '🚽', audio: 'I need the bathroom please.' },
          { label: 'A Hug', emoji: '🤗', audio: 'I need a hug please.' },
          { label: 'Quiet', emoji: '🤫', audio: 'It is too loud. I need quiet please.' },
          { label: 'Help', emoji: '🙋', audio: 'I need help please.' },
          { label: 'A Break', emoji: '⏸️', audio: 'I need a break please.' },
          { label: 'Music', emoji: '🎵', audio: 'I want to listen to music please.' },
          { label: 'My Toy', emoji: '🧸', audio: 'I want my comfort toy please.' },
          { label: 'Outside', emoji: '🌳', audio: 'I want to go outside please.' },
          { label: 'Sleep', emoji: '😴', audio: 'I am sleepy and need to rest.' },
          { label: 'A Story', emoji: '📖', audio: 'Can you read me a story please?' },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
    {
      title: 'Let\'s Say Hello!',
      description: 'Practice greetings and conversation starters',
      type: 'communication',
      category: 'greetings',
      imageUrl: null,
      content: JSON.stringify({
        instruction: 'Tap a picture to practise talking to others! Tap 4 greetings.',
        targetTaps: 4,
        items: [
          { label: 'Hello!', emoji: '👋', audio: 'Hello!' },
          { label: 'Good Morning', emoji: '🌅', audio: 'Good morning!' },
          { label: 'How are you?', emoji: '💬', audio: 'How are you?' },
          { label: 'My name is...', emoji: '🏷️', audio: 'My name is...' },
          { label: 'Can I play?', emoji: '🎮', audio: 'Can I play with you?' },
          { label: 'Thank You', emoji: '🙏', audio: 'Thank you!' },
          { label: 'Please', emoji: '😊', audio: 'Please.' },
          { label: 'Goodbye', emoji: '👋', audio: 'Goodbye! See you later!' },
          { label: 'I like you', emoji: '❤️', audio: 'I like you!' },
          { label: 'Let\'s play!', emoji: '🤝', audio: 'Let\'s play together!' },
          { label: 'Wait please', emoji: '✋', audio: 'Wait please.' },
          { label: 'Yes', emoji: '✅', audio: 'Yes!' },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
    },
  ];

  // ── SOCIAL COACH ACTIVITIES ───────────────────────────────────────────────────
  const socialCoachActivities = [
    {
      title: 'Making a New Friend',
      description: 'Practice meeting someone new at the playground',
      type: 'social_coach',
      category: 'friendship',
      imageUrl: null,
      difficulty: 1,
      starsReward: 3,
      content: JSON.stringify({
        scenario: 'You are at the playground and see a child sitting alone on the bench.',
        characterName: 'Jamie',
        characterEmoji: '👧',
        turns: [
          {
            prompt: 'Jamie is sitting alone and looks a little sad.',
            options: [
              { text: 'Walk over and say "Hi, I\'m here!"', isCorrect: true, feedback: 'Great start! Walking over is very brave and kind.', resultEmoji: '😊' },
              { text: 'Look away and keep playing alone', isCorrect: false, feedback: 'Jamie might feel happier if you say hello!', resultEmoji: '😕' },
              { text: 'Stare from far away', isCorrect: false, feedback: 'Try walking over — it\'s okay to say hi!', resultEmoji: '😐' },
            ],
          },
          {
            prompt: '"Hi!" says Jamie. "Do you want to play on the swings with me?"',
            options: [
              { text: 'Say "Yes, that sounds fun!"', isCorrect: true, feedback: 'Wonderful! Playing together makes both of you happy.', resultEmoji: '🤩' },
              { text: 'Say nothing and run away', isCorrect: false, feedback: 'It\'s okay to say yes — Jamie wants to be your friend!', resultEmoji: '😢' },
              { text: 'Shrug and walk away', isCorrect: false, feedback: 'Saying yes is a great way to make a friend.', resultEmoji: '😕' },
            ],
          },
          {
            prompt: 'You\'ve been playing for a while. Jamie asks, "What\'s your favourite animal?"',
            options: [
              { text: 'Tell Jamie your favourite animal and ask theirs', isCorrect: true, feedback: 'Amazing! Sharing and asking questions is how friendships grow.', resultEmoji: '😄' },
              { text: 'Say "I don\'t know" and stop talking', isCorrect: false, feedback: 'You can share something you like — it\'s fun to talk!', resultEmoji: '😕' },
              { text: 'Ignore the question', isCorrect: false, feedback: 'Answering questions helps us get to know each other.', resultEmoji: '😟' },
            ],
          },
        ],
      }),
    },
    {
      title: 'Lunchtime with a Friend',
      description: 'Practice sharing and being kind at lunch',
      type: 'social_coach',
      category: 'sharing',
      imageUrl: null,
      difficulty: 2,
      starsReward: 3,
      content: JSON.stringify({
        scenario: 'It\'s lunchtime at school. Your friend Sam sits next to you and opens their lunchbox.',
        characterName: 'Sam',
        characterEmoji: '👦',
        turns: [
          {
            prompt: 'Sam says "Oh no, I forgot my snack!"',
            options: [
              { text: 'Offer to share some of your snack', isCorrect: true, feedback: 'That\'s so kind! Sharing makes Sam feel much better.', resultEmoji: '😊' },
              { text: 'Say nothing and keep eating', isCorrect: false, feedback: 'Offering to share would make Sam feel really happy!', resultEmoji: '😕' },
              { text: 'Eat faster so Sam can\'t see', isCorrect: false, feedback: 'Sharing is caring — Sam would really appreciate it.', resultEmoji: '😢' },
            ],
          },
          {
            prompt: 'Sam says "Thank you! You\'re really nice. Can I sit with you tomorrow too?"',
            options: [
              { text: 'Say "Yes! I\'d like that!"', isCorrect: true, feedback: 'You\'ve made a lunchtime friend! That\'s wonderful.', resultEmoji: '🤩' },
              { text: 'Say "Maybe" and look away', isCorrect: false, feedback: 'Saying yes is a lovely way to show you care.', resultEmoji: '😕' },
              { text: 'Shrug your shoulders', isCorrect: false, feedback: 'A warm yes would make Sam feel so welcome!', resultEmoji: '😐' },
            ],
          },
        ],
      }),
    },
    {
      title: 'When Someone Is Upset',
      description: 'Learn how to comfort a friend who feels sad',
      type: 'social_coach',
      category: 'empathy',
      imageUrl: null,
      difficulty: 2,
      starsReward: 3,
      content: JSON.stringify({
        scenario: 'Your classmate Lily is sitting in the corner of the classroom. She looks like she is about to cry.',
        characterName: 'Lily',
        characterEmoji: '👧',
        turns: [
          {
            prompt: 'Lily has tears in her eyes and is hugging her bag.',
            options: [
              { text: 'Walk over and softly ask "Are you okay?"', isCorrect: true, feedback: 'That\'s so caring! Asking if someone is okay is the kindest thing.', resultEmoji: '😊' },
              { text: 'Laugh and point', isCorrect: false, feedback: 'That would hurt Lily\'s feelings. Try being kind instead.', resultEmoji: '😢' },
              { text: 'Walk past and ignore her', isCorrect: false, feedback: 'Lily might feel much better if you just check in on her.', resultEmoji: '😕' },
            ],
          },
          {
            prompt: 'Lily says "I miss my mum." She looks very sad.',
            options: [
              { text: 'Say "I understand. I miss my mum sometimes too."', isCorrect: true, feedback: 'Sharing your feelings helps Lily feel less alone.', resultEmoji: '🥰' },
              { text: 'Say "That\'s silly, stop crying"', isCorrect: false, feedback: 'All feelings are okay — being kind helps Lily feel better.', resultEmoji: '😢' },
              { text: 'Walk away without saying anything', isCorrect: false, feedback: 'Staying and being kind means so much to someone who is sad.', resultEmoji: '😕' },
            ],
          },
          {
            prompt: 'Lily wipes her tears. "Thank you for being so nice to me," she says.',
            options: [
              { text: 'Smile and say "That\'s what friends do!"', isCorrect: true, feedback: 'Perfect! You showed real empathy and made a good friend.', resultEmoji: '🌟' },
              { text: 'Say nothing and walk away', isCorrect: false, feedback: 'A warm smile would make this moment so special for Lily.', resultEmoji: '😕' },
              { text: 'Say "Whatever" and shrug', isCorrect: false, feedback: 'Accepting thanks kindly is part of being a good friend.', resultEmoji: '😐' },
            ],
          },
        ],
      }),
    },
  ];

  // ── SEED ALL ACTIVITIES ──────────────────────────────────────────────────────
  const allActivities = [
    ...breathingActivities,       // Calm Down first — shown first in dashboard
    ...emotionActivities,
    ...scenarioActivities,
    ...storyActivities,
    ...communicationActivities,
    ...socialCoachActivities,
  ];

  await prisma.activity.deleteMany({});

  for (const activity of allActivities) {
    await prisma.activity.create({ data: activity as any });
  }

  console.log('Seeded activities:', allActivities.length);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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

  // ── SEED THERAPIST USER ──────────────────────────────────────────────────────
  const therapistPassword = await bcrypt.hash('therapist123', 10);
  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@socialstars.app' },
    update: {},
    create: {
      email: 'therapist@socialstars.app',
      password: therapistPassword,
      name: 'Dr. Sarah Mitchell',
      role: 'therapist',
      inviteCode: 'THER-SEED01',
      city: 'Austin',
      state: 'Texas',
      country: 'United States',
      bio: 'Board-certified speech-language pathologist specializing in autism spectrum disorder, social skills development, and AAC for children ages 2–10.',
    },
  });
  console.log('Created therapist user:', therapist.email);

  // ── DEFAULT BILLING PLANS TEMPLATE ──────────────────────────────────────────
  const DEFAULT_PLANS = [
    {
      name: 'Basic Support',
      description: 'Ideal for families just getting started with structured therapy support.',
      pricePerMonth: 29,
      features: JSON.stringify([
        'Access to all 50+ activities',
        'Weekly activity assignments',
        'Monthly progress report',
        'Email support',
        'Mood & streak tracking',
      ]),
    },
    {
      name: 'Standard Care',
      description: 'Our most popular plan — full adaptive learning with regular therapist check-ins.',
      pricePerMonth: 59,
      features: JSON.stringify([
        'Everything in Basic Support',
        'Bi-weekly therapist notes',
        'Real-time adaptive difficulty',
        'AI-generated weekly plan',
        'Circle Time session access',
        'Therapist struggle alerts',
        'Priority response within 24h',
      ]),
    },
    {
      name: 'Intensive Program',
      description: 'Comprehensive support for families needing intensive, personalised therapy.',
      pricePerMonth: 99,
      features: JSON.stringify([
        'Everything in Standard Care',
        'Unlimited therapist notes',
        'Custom activity creation',
        'Weekly 1:1 video check-in',
        'PDF progress reports',
        'School/IEP coordination support',
        'Same-day priority response',
      ]),
    },
  ];

  // Seed plans for the seeded therapist
  for (const plan of DEFAULT_PLANS) {
    const existing = await prisma.therapistSubscriptionPlan.findFirst({
      where: { therapistId: therapist.id, name: plan.name },
    });
    if (!existing) {
      await prisma.therapistSubscriptionPlan.create({
        data: { therapistId: therapist.id, ...plan },
      });
    }
  }
  console.log('Seeded billing plans for:', therapist.name);

  // Seed default plans for any other existing therapists that have none
  const existingTherapists = await prisma.user.findMany({
    where: { role: 'therapist', id: { not: therapist.id } },
    select: { id: true, name: true },
  });

  for (const t of existingTherapists) {
    const planCount = await prisma.therapistSubscriptionPlan.count({ where: { therapistId: t.id } });
    if (planCount === 0) {
      for (const plan of DEFAULT_PLANS) {
        await prisma.therapistSubscriptionPlan.create({
          data: { therapistId: t.id, ...plan },
        });
      }
      console.log('Seeded default billing plans for existing therapist:', t.name);
    }
  }

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
      ageGroup: 'toddler',
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
      ageGroup: 'toddler',
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
      ageGroup: 'preschool',
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
      ageGroup: 'preschool',
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
      ageGroup: 'preschool',
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
      ageGroup: 'preschool',
    },
  ];

  // ── SOCIAL SCENARIO ACTIVITIES ───────────────────────────────────────────────
  const scenarioActivities = [
    {
      title: 'Saying Hello',
      description: 'You see a friend at the playground. What should you do?',
      type: 'scenario',
      category: 'greeting',
      ageGroup: 'toddler',
      imageUrl: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
      content: JSON.stringify({
        scenes: [
          {
            situation: 'You arrive at the playground and see your friend Mia by the swings. What do you do?',
            choices: [
              { text: 'Wave and say "Hi!"', isCorrect: true, feedback: 'That\'s a friendly way to greet someone!' },
              { text: 'Turn away and ignore her', isCorrect: false, feedback: 'It\'s nice to say hello to friends.' },
              { text: 'Run to the other side', isCorrect: false, feedback: 'Try waving and saying hi instead!' },
            ],
          },
          {
            situation: 'Mia waves back and smiles at you! She looks like she wants to talk. What do you say?',
            choices: [
              { text: '"Hi! Do you want to play together?"', isCorrect: true, feedback: 'Great job! Asking to play is a wonderful idea!' },
              { text: 'Stay quiet and look at the ground', isCorrect: false, feedback: 'You can do it — ask if she wants to play!' },
              { text: 'Walk to the slide without saying anything', isCorrect: false, feedback: 'Try saying something friendly to Mia!' },
            ],
          },
          {
            situation: 'Mia says "Yes! Let\'s play!" You both have so much fun. It\'s time to go home. What do you say?',
            choices: [
              { text: '"Bye Mia! See you next time!"', isCorrect: true, feedback: 'Saying goodbye is a lovely way to end playtime!' },
              { text: 'Just walk away without saying anything', isCorrect: false, feedback: 'It\'s kind to say goodbye to your friend.' },
              { text: 'Keep playing and ignore your parent calling you', isCorrect: false, feedback: 'Say bye to Mia and then go to your parent!' },
            ],
          },
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
      ageGroup: 'toddler',
      imageUrl: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg',
      content: JSON.stringify({
        scenes: [
          {
            situation: 'You are playing with your building blocks. Your friend Sam says "Those look fun! Can I have a turn?" What do you do?',
            choices: [
              { text: 'Say "Sure! Let\'s take turns!"', isCorrect: true, feedback: 'Great! Sharing makes everyone happy!' },
              { text: 'Say "No! They\'re mine!"', isCorrect: false, feedback: 'Sharing helps us make friends.' },
              { text: 'Take all the blocks away', isCorrect: false, feedback: 'Let\'s try sharing instead!' },
            ],
          },
          {
            situation: 'Sam is playing with the blocks and having a great time. You both build a big tower together! Sam asks "Can we keep playing?" What do you say?',
            choices: [
              { text: '"Yes! Building together is more fun!"', isCorrect: true, feedback: 'You\'re being such a kind friend!' },
              { text: 'Grab the blocks back and say "My turn now"', isCorrect: false, feedback: 'Taking turns means both people get to play.' },
              { text: 'Walk away and stop playing', isCorrect: false, feedback: 'Try staying and building together!' },
            ],
          },
          {
            situation: 'It\'s time to tidy up. Sam passes your toy car back and says "Thank you for sharing!" What do you say?',
            choices: [
              { text: '"You\'re welcome! That was fun playing together!"', isCorrect: true, feedback: 'What a wonderful thing to say!' },
              { text: 'Grab it and walk away without saying anything', isCorrect: false, feedback: 'Saying "you\'re welcome" is a kind response.' },
              { text: '"You took too long with it!"', isCorrect: false, feedback: 'Be kind — Sam enjoyed playing with you!' },
            ],
          },
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
        scenes: [
          {
            situation: 'Your friend dropped all their crayons on the floor. They look upset. What do you do?',
            choices: [
              { text: 'Help them pick up the crayons', isCorrect: true, feedback: 'You\'re so helpful! That\'s very kind!' },
              { text: 'Walk away', isCorrect: false, feedback: 'It feels good to help others.' },
              { text: 'Laugh at them', isCorrect: false, feedback: 'Let\'s be kind and help instead!' },
            ],
          },
          {
            situation: 'You helped pick up all the crayons! Your friend looks happy and says "Thank you so much!" What do you say?',
            choices: [
              { text: '"No problem! That\'s what friends are for!"', isCorrect: true, feedback: 'That\'s such a warm and friendly thing to say!' },
              { text: 'Walk away without saying anything', isCorrect: false, feedback: 'A kind reply makes your friend feel even better!' },
              { text: '"You should be more careful next time!"', isCorrect: false, feedback: 'Be kind — accidents happen to everyone.' },
            ],
          },
          {
            situation: 'Your friend wants to draw with you to say thank you. But there is only one piece of paper left. What do you do?',
            choices: [
              { text: 'Share the paper and draw together', isCorrect: true, feedback: 'Wonderful! Sharing and helping go hand in hand.' },
              { text: '"It\'s my paper, I found it first"', isCorrect: false, feedback: 'Sharing the paper means you can both enjoy drawing!' },
              { text: 'Take all the crayons and start drawing alone', isCorrect: false, feedback: 'Let\'s share so both of you can have fun!' },
            ],
          },
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
        scenes: [
          {
            situation: 'Lots of children want to go on the slide. There is a long line. What do you do?',
            choices: [
              { text: 'Join the line and wait your turn', isCorrect: true, feedback: 'Perfect! Taking turns makes playtime fun for everyone!' },
              { text: 'Push in front of everyone', isCorrect: false, feedback: 'We need to take turns so everyone can have fun.' },
              { text: 'Leave the playground', isCorrect: false, feedback: 'Just wait your turn — you\'ll get to play soon!' },
            ],
          },
          {
            situation: 'You waited and now you\'re next! But the child behind you has been waiting a really long time. What do you do?',
            choices: [
              { text: 'Go quickly down the slide so they can have their turn', isCorrect: true, feedback: 'That\'s so thoughtful! You thought about others too.' },
              { text: 'Climb back up and go again before they get a turn', isCorrect: false, feedback: 'Let others have their turn — then you can go again!' },
              { text: 'Tell the child behind you to go to the back of the line', isCorrect: false, feedback: 'They waited just like you — let\'s be fair.' },
            ],
          },
          {
            situation: 'Now everyone wants the see-saw but there are 4 children and only 2 spots. What do you suggest?',
            choices: [
              { text: '"Let\'s take turns — two go first, then swap!"', isCorrect: true, feedback: 'Amazing idea! You helped everyone play fairly.' },
              { text: 'Grab a spot and refuse to move', isCorrect: false, feedback: 'Suggesting turns means everyone gets a go.' },
              { text: 'Walk away because it\'s too complicated', isCorrect: false, feedback: 'You can help find a fair solution for everyone!' },
            ],
          },
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
        scenes: [
          {
            situation: 'You can\'t open your lunchbox and you\'re getting hungry. What do you do?',
            choices: [
              { text: 'Ask a teacher or friend for help', isCorrect: true, feedback: 'Asking for help is a brave and smart thing to do!' },
              { text: 'Cry and give up', isCorrect: false, feedback: 'It\'s OK to ask someone for help!' },
              { text: 'Throw the lunchbox on the floor', isCorrect: false, feedback: 'Let\'s try asking for help instead.' },
            ],
          },
          {
            situation: 'The teacher opened your lunchbox! But now your juice has spilled on the table. What do you do?',
            choices: [
              { text: 'Ask for some paper towels to help clean it up', isCorrect: true, feedback: 'Great thinking! Asking for help and cleaning up is the right thing.' },
              { text: 'Leave the mess for someone else to clean', isCorrect: false, feedback: 'It\'s good to take responsibility and help clean up.' },
              { text: 'Hide it under your lunchbox', isCorrect: false, feedback: 'It\'s better to ask for help cleaning it up honestly.' },
            ],
          },
          {
            situation: 'You cleaned up together. Now your friend can\'t find their eraser. What do you do?',
            choices: [
              { text: 'Ask "Would you like help looking for it?"', isCorrect: true, feedback: 'You\'re such a caring friend for offering to help!' },
              { text: 'Say nothing and keep eating your lunch', isCorrect: false, feedback: 'A little offer of help can mean a lot to a friend.' },
              { text: 'Say "That\'s your problem, not mine"', isCorrect: false, feedback: 'Being kind and offering help is always a good choice.' },
            ],
          },
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
      ageGroup: 'early-elementary',
      imageUrl: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
      content: JSON.stringify({
        scenes: [
          {
            situation: 'You accidentally knocked over the paint and it spilled on your friend\'s drawing. What do you do?',
            choices: [
              { text: 'Say "I\'m sorry!" and try to help clean it up', isCorrect: true, feedback: 'Saying sorry and helping is the kind thing to do!' },
              { text: 'Run away and pretend it didn\'t happen', isCorrect: false, feedback: 'It\'s always better to say sorry.' },
              { text: 'Blame someone else', isCorrect: false, feedback: 'Telling the truth and saying sorry is brave!' },
            ],
          },
          {
            situation: 'Your friend looks sad about the ruined painting. What do you say to help them feel better?',
            choices: [
              { text: '"I\'m really sorry. Let\'s make a new one together!"', isCorrect: true, feedback: 'Offering to help make it better shows you really care!' },
              { text: 'Say nothing and look away', isCorrect: false, feedback: 'A kind word can really help your friend feel better.' },
              { text: '"It wasn\'t that good anyway"', isCorrect: false, feedback: 'That would hurt your friend\'s feelings. Try saying sorry instead.' },
            ],
          },
          {
            situation: 'You helped your friend start a new painting and it looks great! The teacher says "accidents happen to everyone." How do you feel?',
            choices: [
              { text: 'Happy that you said sorry and helped fix things', isCorrect: true, feedback: 'Saying sorry and making things right always feels good!' },
              { text: 'Still embarrassed — you hide in the corner', isCorrect: false, feedback: 'You did the right thing. Be proud of yourself!' },
              { text: 'You blame the paint again', isCorrect: false, feedback: 'Taking responsibility helps everyone feel better, including you.' },
            ],
          },
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
        scenes: [
          {
            situation: 'Someone took your favourite toy without asking. You feel very angry inside. What do you do first?',
            choices: [
              { text: 'Take three deep breaths to calm down', isCorrect: true, feedback: 'Taking deep breaths is a superpower when we feel angry!' },
              { text: 'Hit the person who took it', isCorrect: false, feedback: 'We never hurt others. Try breathing first.' },
              { text: 'Scream and throw things', isCorrect: false, feedback: 'Let\'s try breathing slowly to calm our body.' },
            ],
          },
          {
            situation: 'You took three deep breaths and feel a little calmer. You still feel upset. What do you do next?',
            choices: [
              { text: 'Use your words to explain how you feel to an adult', isCorrect: true, feedback: 'Using words to express feelings is so mature and brave!' },
              { text: 'Go and grab the toy back without saying anything', isCorrect: false, feedback: 'Using words is always better than grabbing.' },
              { text: 'Cry loudly to get everyone\'s attention', isCorrect: false, feedback: 'Try talking to an adult — they can help sort it out.' },
            ],
          },
          {
            situation: 'The adult helped sort it out and you got your toy back. The other child says "Sorry, I should have asked." What do you do?',
            choices: [
              { text: 'Say "It\'s okay. Next time please ask first."', isCorrect: true, feedback: 'Perfect! You accepted the apology and taught them kindly.' },
              { text: 'Ignore them and walk away', isCorrect: false, feedback: 'Accepting an apology is a kind and grown-up thing to do.' },
              { text: 'Tell everyone about it for the rest of the day', isCorrect: false, feedback: 'When something is sorted out, it\'s best to move on happily.' },
            ],
          },
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
        scenes: [
          {
            situation: 'Some children are playing a fun game in the playground. You really want to play too. What do you do?',
            choices: [
              { text: 'Walk over and ask "Can I play too?"', isCorrect: true, feedback: 'Asking politely is the perfect way to join in!' },
              { text: 'Push into the game without asking', isCorrect: false, feedback: 'It\'s polite to ask first before joining.' },
              { text: 'Stand far away and just watch', isCorrect: false, feedback: 'You can do it — walk over and ask to join!' },
            ],
          },
          {
            situation: 'The children say "Yes! You can be on our team!" But you don\'t know the rules of the game. What do you do?',
            choices: [
              { text: 'Ask "Can you explain the rules to me?"', isCorrect: true, feedback: 'Asking questions is a great way to learn!' },
              { text: 'Pretend you know and guess what to do', isCorrect: false, feedback: 'It\'s always better to ask than to guess!' },
              { text: 'Walk away because you don\'t know how to play', isCorrect: false, feedback: 'Ask them to explain — they will be happy to help you!' },
            ],
          },
          {
            situation: 'You played the game together and it was SO fun! The group says "Come play with us again tomorrow!" What do you say?',
            choices: [
              { text: '"Yes please! I\'d love to play again!"', isCorrect: true, feedback: 'You made new friends by being brave and asking to join!' },
              { text: 'Say nothing and walk away', isCorrect: false, feedback: 'Tell them you\'d love to play again — it will make them happy!' },
              { text: '"Maybe..." and then not come back', isCorrect: false, feedback: 'If you want to play again, say yes! Friends love knowing you want to be there.' },
            ],
          },
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
      description: 'A full day of feelings, choices and friendship with Sam and his class',
      type: 'story',
      category: 'classroom',
      imageUrl: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
      content: JSON.stringify({
        pages: [
          // ── Part 1: Morning Arrival ───────────────────────────────────────────
          // Page 1 — scene
          {
            text: 'It was Monday morning at Maple Leaf School. Sam put on his backpack, kissed his mum goodbye, and walked through the big blue doors. Today was going to be a great day!',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
          },
          // Page 2 — emotion: excited/happy
          {
            text: 'Sam stepped into the classroom. The colourful rug was laid out in the middle of the room. His friends were already sitting down. He LOVED circle time!',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'How does Sam feel walking into circle time?',
            options: ['He feels happy and excited — circle time is his favourite!', 'He feels sad and tired and wants to sleep.', 'He feels angry because he did not want to come to school.'],
            correctAnswer: 0,
          },
          // Page 3 — action: raise_hand (good morning question)
          {
            text: '"Good morning everyone!" said the teacher, Miss Kim. "Who can tell me what the weather is like outside today?" Sam had looked out the window — it was sunny!',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'Sam wants to answer. What is the right thing to do?',
            options: ['Raise your hand and wait for Miss Kim to call your name', 'Shout "SUNNY!" as loudly as possible', 'Nudge the person next to you and whisper the answer'],
            correctAnswer: 0,
          },
          // Page 4 — scene (reward for raising hand)
          {
            text: 'Sam raised his hand and waited patiently. Miss Kim smiled and called on him. "It\'s sunny today!" said Sam. "Perfect answer, Sam — a gold star for you!" The class cheered.',
            image: 'https://cdn.abacus.ai/images/97cca0a3-bcab-4e6c-b861-9585254062db.jpg',
          },
          // ── Part 2: Show and Tell ─────────────────────────────────────────────
          // Page 5 — emotion: surprised
          {
            text: 'Miss Kim clapped her hands. "Class — today is a very special day! It\'s Show and Tell!" She held up a mystery box with a big question mark on it. Nobody knew what was inside!',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'How does Sam feel when he hears the big surprise?',
            options: ['Surprised and excited — he did not expect that at all!', 'Bored and sleepy — he has seen it all before.', 'Scared and upset — surprises are never good.'],
            correctAnswer: 0,
          },
          // Page 6 — scenario: Sam forgot his item
          {
            text: 'Sam\'s tummy did a little flip. He had completely forgotten to bring something for Show and Tell! His special toy was still sitting on his bed at home.',
            image: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
            question: 'Sam forgot his Show and Tell item. What is the best thing to do?',
            options: ['Tell Miss Kim honestly and ask if he can share a story instead', 'Pretend he never forgot and sit quietly hoping nobody notices', 'Cry loudly and refuse to take part'],
            correctAnswer: 0,
          },
          // Page 7 — action: raise_hand (to tell teacher)
          {
            text: 'Sam decided to be honest. He wanted to let Miss Kim know before it was his turn so she would not be confused. He knew exactly what he had to do.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'How does Sam get Miss Kim\'s attention politely?',
            options: ['Raise your hand and wait quietly until she looks over', 'Walk straight up to her desk while she is talking to someone else', 'Tug on her sleeve over and over again'],
            correctAnswer: 0,
          },
          // Page 8 — scene
          {
            text: '"Miss Kim, I forgot my toy at home," Sam whispered. "That\'s okay, Sam — you can tell us your favourite story about it!" Sam took a big breath and felt much better.',
            image: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
          },
          // ── Part 3: A New Friend Arrives ─────────────────────────────────────
          // Page 9 — scene
          {
            text: 'Just as Show and Tell was finishing, the classroom door opened slowly. A girl with a purple backpack peeked in. It was her very first day at Maple Leaf School.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
          },
          // Page 10 — emotion: scared
          {
            text: 'The girl\'s name was Lily. She stood in the doorway looking at all the new faces staring back at her. Her hands were shaking and she did not move.',
            image: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
            question: 'How is Lily feeling right now?',
            options: ['Scared and worried — everything is new and she does not know anyone', 'Happy and confident — she loves meeting strangers', 'Angry and frustrated — she did not want to come to school'],
            correctAnswer: 0,
          },
          // Page 11 — scenario: how to welcome Lily
          {
            text: 'Miss Kim said to the class, "Let\'s all make Lily feel welcome!" Sam looked over at Lily. He remembered how nervous HE felt on his first day last year.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'What is the kindest thing Sam\'s class can do for Lily?',
            options: ['Smile warmly and say "Welcome, Lily! You can sit with us!"', 'Stare at her in silence and wait for her to figure things out', 'Laugh and point because she looks nervous'],
            correctAnswer: 0,
          },
          // Page 12 — action: raise_hand (volunteer as buddy)
          {
            text: '"Who would like to be Lily\'s special buddy today and show her around?" asked Miss Kim. Sam\'s heart jumped. He really wanted to help Lily feel safe and happy.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'Sam wants to volunteer to be Lily\'s buddy. What should he do?',
            options: ['Raise your hand proudly to show Miss Kim you want to help', 'Run to the front of the room before anyone else can get there', 'Look away and hope someone else does it'],
            correctAnswer: 0,
          },
          // Page 13 — scene
          {
            text: '"Thank you, Sam!" said Miss Kim. Sam walked over to Lily and said, "Hi! I\'m Sam. Don\'t worry — circle time is really fun. You can sit next to me." Lily\'s shoulders relaxed.',
            image: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg',
          },
          // ── Part 4: Paint Activity ────────────────────────────────────────────
          // Page 14 — scenario: Maya spills paint
          {
            text: 'After circle time the class did a painting activity. Sam\'s friend Maya reached over for the blue paint and — whoops! — the whole pot tipped and splashed across the table.',
            image: 'https://cdn.abacus.ai/images/9924338c-9cb3-482e-bf9e-de1970eef82d.jpg',
            question: 'Maya spilled the paint by accident. What should Sam do?',
            options: ['Say "It\'s okay! Accidents happen — let\'s clean it up together!"', 'Point at Maya and shout "Maya made a mess!" to the whole class', 'Ignore it completely and keep painting'],
            correctAnswer: 0,
          },
          // Page 15 — emotion: sad (Maya embarrassed)
          {
            text: 'Maya\'s cheeks went bright red. She put her hands over her face. She felt terrible about making a mess in front of everyone, especially Lily on her first day.',
            image: 'https://cdn.abacus.ai/images/449d23ac-d94d-4502-8095-e1d985ecb1bd.jpg',
            question: 'How is Maya feeling right now?',
            options: ['Sad and embarrassed — she wishes the floor would swallow her up', 'Happy and proud — she thinks spilling paint is funny', 'Surprised and excited — she loves making messes'],
            correctAnswer: 0,
          },
          // Page 16 — scenario: what to say
          {
            text: 'Sam picked up the cloth from the sink and brought it over to Maya. He wanted to say something to make her feel better. He thought carefully about the right words.',
            image: 'https://cdn.abacus.ai/images/53dce2b0-a6e3-4893-bb9f-872909ee336c.jpg',
            question: 'What is the best thing Sam can say to Maya?',
            options: ['"Don\'t worry, Maya — everyone has accidents. You are still my best friend!"', '"You are so clumsy. You always do things like this."', '"I am not helping you — you should have been more careful."'],
            correctAnswer: 0,
          },
          // ── Part 5: End of Day ────────────────────────────────────────────────
          // Page 17 — emotion: happy (everyone feels better)
          {
            text: 'Maya dried her eyes and smiled at Sam. Lily helped wipe down the table too. Miss Kim told the class she was proud of everyone for working as a team.',
            image: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
            question: 'How does Sam feel seeing his friends smile again?',
            options: ['Happy and proud — helping others feels really good!', 'Bored — he just wanted to finish his painting', 'Angry — it took up too much of his time'],
            correctAnswer: 0,
          },
          // Page 18 — scene (finale)
          {
            text: 'At home time Sam, Maya, and Lily walked out together. "Same time tomorrow?" said Sam. "Same time tomorrow!" they both said. Sam smiled all the way home. What a wonderful day.',
            image: 'https://cdn.abacus.ai/images/97cca0a3-bcab-4e6c-b861-9585254062db.jpg',
          },
        ],
      }),
      difficulty: 3,
      starsReward: 8,
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

  // ── ABA+ ACTIVITIES (therapist-gated clinical exercises) ────────────────────
  // These require a therapist to assign them. They appear locked on the child
  // dashboard until a therapist adds them to the child's activity plan.
  const abaPlusActivities = [
    {
      title: 'Name That Feeling (DTT)',
      description: 'Structured practice naming emotions from photos — therapist guided.',
      type: 'emotion',
      category: 'aba_emotion',
      imageUrl: 'https://cdn.abacus.ai/images/a787547d-75e2-491e-9a32-79f6a6f8b545.jpg',
      content: JSON.stringify({ emotion: 'happy' }),
      difficulty: 1,
      starsReward: 2,
      ageGroup: 'all',
      isABAPlus: true,
    },
    {
      title: 'Greetings Practice (DTT)',
      description: 'Discrete trial training for saying hello, goodbye, and please.',
      type: 'scenario',
      category: 'aba_greeting',
      imageUrl: 'https://cdn.abacus.ai/images/a694cc55-9041-4e3a-b6f1-8b18cb56ef73.jpg',
      content: JSON.stringify({
        scenes: [
          {
            situation: 'You see your teacher in the morning. What do you say?',
            choices: [
              { text: '"Good morning!"', isCorrect: true, feedback: 'Perfect greeting!' },
              { text: 'Say nothing', isCorrect: false, feedback: 'Try saying "Good morning!"' },
              { text: 'Wave only', isCorrect: false, feedback: 'Add words to your wave!' },
            ],
          },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
      ageGroup: 'all',
      isABAPlus: true,
    },
    {
      title: 'Waiting My Turn (ABA)',
      description: 'Structured scenario practice for waiting and impulse control.',
      type: 'scenario',
      category: 'aba_waiting',
      imageUrl: 'https://cdn.abacus.ai/images/97cca0a3-bcab-4e6c-b861-9585254062db.jpg',
      content: JSON.stringify({
        scenes: [
          {
            situation: 'The teacher is talking to another child. You want to ask a question. What do you do?',
            choices: [
              { text: 'Raise your hand and wait quietly', isCorrect: true, feedback: 'Excellent waiting! That shows great self-control.' },
              { text: 'Call out loudly right away', isCorrect: false, feedback: 'Raise your hand and wait for your turn.' },
              { text: 'Tug on the teacher\'s sleeve', isCorrect: false, feedback: 'Raising your hand is the respectful way to wait.' },
            ],
          },
        ],
      }),
      difficulty: 2,
      starsReward: 3,
      ageGroup: 'all',
      isABAPlus: true,
    },
    {
      title: 'Calm Body Check (ABA)',
      description: 'Body awareness breathing exercise with structured prompts for regulation.',
      type: 'breathing',
      category: 'aba_regulation',
      imageUrl: 'https://cdn.abacus.ai/images/b0785242-a22c-4999-950c-4845cddfca02.jpg',
      content: JSON.stringify({
        instruction: 'Let\'s check in with our body and calm down together.',
        cycles: 3,
        phases: [
          { label: 'Breathe In', duration: 4, color: '#818CF8', expand: true },
          { label: 'Hold', duration: 2, color: '#A78BFA', expand: false },
          { label: 'Breathe Out', duration: 4, color: '#6EE7B7', expand: false },
        ],
      }),
      difficulty: 1,
      starsReward: 2,
      ageGroup: 'all',
      isABAPlus: true,
    },
    {
      title: 'Friendship Skills (Early Elementary)',
      description: 'Advanced social scenarios for older children learning complex peer interactions.',
      type: 'scenario',
      category: 'aba_friendship',
      imageUrl: 'https://cdn.abacus.ai/images/ce62a709-3173-4af2-bb1d-966a5b6cabb8.jpg',
      content: JSON.stringify({
        scenes: [
          {
            situation: 'Your friend is upset about a test result. You want to help. What is the best thing to say?',
            choices: [
              { text: '"That sounds tough. Do you want to talk about it?"', isCorrect: true, feedback: 'Offering to listen is a great way to support a friend.' },
              { text: '"You should have studied harder"', isCorrect: false, feedback: 'That might hurt their feelings. Try to be supportive instead.' },
              { text: '"I got a better score than you"', isCorrect: false, feedback: 'Focus on your friend\'s feelings, not the comparison.' },
            ],
          },
        ],
      }),
      difficulty: 3,
      starsReward: 3,
      ageGroup: 'early-elementary',
      isABAPlus: true,
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
    ...abaPlusActivities,          // ABA+ last — therapist-gated
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

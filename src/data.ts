import { RoleplayScenario, VocabWord, QuizQuestion } from './types';

export const DEFAULT_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'coffee-shop',
    title: 'Ordering at a Cafe',
    description: 'Practice ordering your favorite breakfast and drink. Keep it simple and polite!',
    characterName: 'Sam',
    role: 'Friendly Barista',
    initialPrompt: 'Welcome to Sunrise Coffee! What can I get started for you today?',
    systemPrompt: 'You are Sam, a friendly barista at Sunrise Coffee. Keep responses short (1-2 sentences) and helpful. Speak in simple, polite English suitable for a beginner.',
    iconName: 'Coffee',
    level: 'Beginner'
  },
  {
    id: 'hotel-checkin',
    title: 'Hotel Check-in',
    description: 'Check in for your reservation and ask for details about the Wi-Fi and amenities.',
    characterName: 'Robin',
    role: 'Hotel Receptionist',
    initialPrompt: 'Hello! Welcome to the Grand Plaza Hotel. How can I assist you with your booking today?',
    systemPrompt: 'You are Robin, a warm hotel front-desk receptionist. Be professional, direct, and slightly formal. Help the user check into their room, and verify booking details. Keep responses to 2-3 sentences max.',
    iconName: 'Hotel',
    level: 'Intermediate'
  },
  {
    id: 'job-interview',
    title: 'The Job Interview',
    description: 'An interview for a designer/engineer role. Showcase your experience and ask smart questions.',
    characterName: 'Sarah',
    role: 'Hiring Manager',
    initialPrompt: 'Thanks for coming in today. To start off, could you tell me a little bit about yourself and why you applied for this role?',
    systemPrompt: 'You are Sarah, a professional HR manager. Conduct a realistic job interview. Ask thoughtful questions, evaluate their answers professionally. Keep your answers concise but realistic. Challenge them with real follow-up questions.',
    iconName: 'Briefcase',
    level: 'Advanced'
  },
  {
    id: 'casual-chat',
    title: 'A Walk in the Park',
    description: 'A casual, spontaneous conversation with a classmate about hobbies, plans, and interests.',
    characterName: 'Liam',
    role: 'Friendly Classmate',
    initialPrompt: 'Hey! Fancy seeing you here. It\'s a beautiful afternoon, isn\'t it? What are you up to?',
    systemPrompt: 'You are Liam, a casual college classmate. Use modern casual peer-to-peer English, standard slang where natural, and keep the tone very approachable, breezy, and warm.',
    iconName: 'Sparkles',
    level: 'Intermediate'
  }
];

export const DEFAULT_VOCABULARY: VocabWord[] = [
  {
    id: 'word-1',
    word: 'Delicious',
    partOfSpeech: 'adjective',
    definition: 'Highly pleasant to the taste.',
    exampleSentence: 'The chocolate cake at that café is absolutely delicious.',
    level: 'Beginner',
    category: 'Food',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-2',
    word: 'Appreciate',
    partOfSpeech: 'verb',
    definition: 'To be grateful for something; to recognize the full worth of.',
    exampleSentence: 'I really appreciate your advice on how to improve my accent.',
    level: 'Beginner',
    category: 'Social',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-3',
    word: 'Convenient',
    partOfSpeech: 'adjective',
    definition: 'Fitting in well with a person\'s needs, activities, and plans; easy to use.',
    exampleSentence: 'Having a grocery store right next to my apartment is very convenient.',
    level: 'Beginner',
    category: 'Daily Life',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-4',
    word: 'Collaborate',
    partOfSpeech: 'verb',
    definition: 'Work jointly on an activity or project, especially to produce or create something.',
    exampleSentence: 'Both design and engineering teams need to collaborate to solve this user problem.',
    level: 'Intermediate',
    category: 'Work',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-5',
    word: 'Pragmatic',
    partOfSpeech: 'adjective',
    definition: 'Dealing with things sensibly and realistically in a way that is based on practical considerations.',
    exampleSentence: 'Instead of debating minor details, we should take a pragmatic approach.',
    level: 'Intermediate',
    category: 'Work',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-6',
    word: 'Aesthetic',
    partOfSpeech: 'noun / adjective',
    definition: 'Concerning or characterized by an appreciation of beauty or taste.',
    exampleSentence: 'The minimal design of this website has a very clean aesthetic.',
    level: 'Intermediate',
    category: 'Art',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-7',
    word: 'Meticulous',
    partOfSpeech: 'adjective',
    definition: 'Showing great attention to detail; very careful and precise.',
    exampleSentence: 'The surgeon was meticulous, checking every step of the procedure twice.',
    level: 'Advanced',
    category: 'Professional',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-8',
    word: 'Fastidious',
    partOfSpeech: 'adjective',
    definition: 'Very attentive to and concerned about accuracy, detail, or cleanliness.',
    exampleSentence: 'She was fastidious about her spelling, refusing to send emails with typos.',
    level: 'Advanced',
    category: 'Personality',
    isLearned: false,
    isFavorite: false
  },
  {
    id: 'word-9',
    word: 'Ephemeral',
    partOfSpeech: 'adjective',
    definition: 'Lasting for a very short time.',
    exampleSentence: 'The cherry blossom season is ephemeral, lasting only a couple of weeks.',
    level: 'Advanced',
    category: 'Nature',
    isLearned: false,
    isFavorite: false
  }
];

export const DEFAULT_QUIZZES: QuizQuestion[] = [
  {
    id: 'q-1',
    question: 'Choose the correct form: She has ________ English for three years.',
    options: ['study', 'studying', 'been studying', 'studies'],
    answerIndex: 2,
    explanation: 'We use the Present Perfect Continuous ("has been studying") to describe an action that started in the past and is still continuing.',
    category: 'grammar',
    difficulty: 'Beginner'
  },
  {
    id: 'q-2',
    question: 'What is the correct synonym for the word "Meticulous"?',
    options: ['Careful and precise', 'Extremely quick', 'Careless and noisy', 'Very intelligent'],
    answerIndex: 0,
    explanation: '"Meticulous" means showing great attention to detail; very careful and precise.',
    category: 'vocab',
    difficulty: 'Intermediate'
  },
  {
    id: 'q-3',
    question: 'Identify the sentence with the correct subjunctive mood usage:',
    options: [
      'If I was you, I will buy that ticket.',
      'I demand that he pays attention.',
      'It is crucial that she be present at the meeting.',
      'If she goes there yesterday, she met him.'
    ],
    answerIndex: 2,
    explanation: 'The subjunctive mood uses the base form of the verb ("be", "go", "pay" without "-s") on templates like "It is crucial/important that [someone] [base verb]".',
    category: 'grammar',
    difficulty: 'Advanced'
  },
  {
    id: 'q-4',
    question: 'How do you politely decline an invitation in a professional email?',
    options: [
      'No way, I am busy.',
      'Thank you for the invite, but unfortunately I am unable to attend.',
      'I ignore your email.',
      'Maybe next time, buy me dinner first.'
    ],
    answerIndex: 1,
    explanation: '"Thank you for the invite, but unfortunately I am unable to attend" is polite, formal, and widely accepted in professional communication.',
    category: 'phrases',
    difficulty: 'Intermediate'
  },
  {
    id: 'q-5',
    question: 'Which word describes a transient state that lasts for a very short duration?',
    options: ['Eternal', 'Ephemeral', 'Eradicated', 'Esthetic'],
    answerIndex: 1,
    explanation: '"Ephemeral" means lasting or existing for a very short time.',
    category: 'vocab',
    difficulty: 'Advanced'
  }
];

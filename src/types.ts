export interface VocabWord {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  isLearned: boolean;
  isFavorite: boolean;
  userSentence?: string;
  sentenceFeedback?: {
    isCorrect: boolean;
    score: number;
    corrected: string;
    explanation: string;
  };
}

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  characterName: string;
  role: string;
  initialPrompt: string;
  systemPrompt: string;
  iconName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  correction?: {
    hasErrors: boolean;
    corrected: string;
    explanation: string;
    suggestions: string[];
  };
}

export interface ScoreStats {
  dailyStreak: number;
  xp: number;
  lessonsDone: number;
  chatsStarted: number;
  quizAccuracy: number; // percentage
  quizAnswered: number;
  quizCorrect: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  category: 'grammar' | 'vocab' | 'phrases';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

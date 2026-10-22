export type Category =
  | 'General'
  | 'History'
  | 'Science'
  | 'Astronomy'
  | 'Inventions'
  | 'Philosophy'
  | 'Biology'
  | 'Sports'
  | 'Entertainment'
  | 'Geography'
  | 'Tech'
  | 'Culinary'
  | 'Team A vs Team B'
  | 'Careers & Jobs'
  | 'Custom';

export type QuestionThemeFilter =
  | 'all'
  | 'general'
  | 'history'
  | 'science'
  | 'astronomy'
  | 'inventions'
  | 'philosophy'
  | 'biology'
  | 'sports'
  | 'entertainment'
  | 'team_a_b'
  | 'careers'
  | 'custom';

export interface Question {
  id: string;
  category: Category;
  difficulty: 'easy' | 'medium' | 'hard' | 'final';
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  specialtyTag?: string; // Archetype or side that has high familiarity
  battleTheme?: QuestionThemeFilter;
}

export interface Contestant {
  id: string;
  name: string;
  job: string; // Used as display role/title/archetype (e.g. 'Gen Z Techie', 'High School Student', 'History Teacher', 'Trauma Surgeon', 'General Knowledge Pro')
  emoji: string;
  bio: string;
  quote: string;
  specialties: Category[];
  weaknesses: Category[];
  baseAccuracy: number; // 0.0 to 1.0
  color: string;
  isPlayer?: boolean;
  faction?: string; // e.g. 'Gen Z', 'Millennial', 'Student', 'Teacher', 'General'
}

export interface ContestantRoundState {
  contestantId: string;
  selectedOptionIndex: number | null;
  hasLockedIn: boolean;
  lockInTimeRemaining?: number;
  isCorrect?: boolean;
  score: number;
  isEliminated: boolean;
  eliminatedInRound?: number;
  lastReaction?: string;
}

export type GameMode = 'gauntlet' | 'duel' | 'pass_play' | 'survival';

export interface GameRoundConfig {
  roundNumber: number;
  name: string;
  subtitle: string;
  questionCount: number;
  eliminateCount: number;
  pointsPerQuestion: number;
  timeLimitSeconds: number;
}

export interface ShowdownTheme {
  id: string;
  title: string;
  badge: string;
  emoji: string;
  tagline: string;
  description: string;
  sideA: { name: string; emoji: string; color: string };
  sideB: { name: string; emoji: string; color: string };
  defaultQuestionFilter: QuestionThemeFilter;
  categoryType?: 'topic' | 'battle' | 'custom';
  isCustom?: boolean;
}

export interface CustomCategoryPayload {
  id: string;
  title: string;
  emoji: string;
  sideA: string;
  sideB: string;
  description: string;
  questions: Question[];
}

export interface UserProfile {
  name: string;
  titleOrArchetype: string;
  emoji: string;
  faction: string;
}

// ─── Multiplayer Room Types ───────────────────────────────────────────────────

export type RoomStatus = 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished';

export interface RoomPlayer {
  id: string;          // unique per player (uuid)
  name: string;
  emoji: string;
  score: number;
  lastAnswer: number | null;   // option index they selected
  hasAnswered: boolean;
  isHost: boolean;
  joinedAt: number;            // timestamp
}

export interface RoomQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  category: string;
  points: number;
}

export interface Room {
  id: string;                  // 6-char code e.g. "TRV-4F2"
  hostId: string;
  status: RoomStatus;
  category: string;
  maxPlayers: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionStartedAt: number | null;   // epoch ms
  timeLimitSeconds: number;
  players: Record<string, RoomPlayer>;
  questions: RoomQuestion[];          // serialized for Supabase
  createdAt: number;
}

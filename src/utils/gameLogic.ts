import { Contestant, Question, GameRoundConfig, ContestantRoundState } from '../types';
import { CONTESTANT_REACTIONS } from '../data/contestants';

export const ROUND_CONFIGS: GameRoundConfig[] = [
  {
    roundNumber: 1,
    name: 'The Qualifier',
    subtitle: '10 Players Enter • Bottom 2 Eliminated',
    questionCount: 4,
    eliminateCount: 2,
    pointsPerQuestion: 100,
    timeLimitSeconds: 12,
  },
  {
    roundNumber: 2,
    name: 'Category Gauntlet',
    subtitle: '8 Players Remain • Bottom 3 Eliminated',
    questionCount: 4,
    eliminateCount: 3,
    pointsPerQuestion: 200,
    timeLimitSeconds: 12,
  },
  {
    roundNumber: 3,
    name: 'The Danger Zone',
    subtitle: '5 Players Remain • Double Points • Final 2 Advance',
    questionCount: 4,
    eliminateCount: 3,
    pointsPerQuestion: 400,
    timeLimitSeconds: 10,
  },
  {
    roundNumber: 4,
    name: 'The $1,000 Final Showdown',
    subtitle: 'Head-to-Head • Sudden Death • Winner Takes All',
    questionCount: 3,
    eliminateCount: 1,
    pointsPerQuestion: 500,
    timeLimitSeconds: 10,
  },
];

/**
 * Simulates an AI contestant's answer and lock-in timing based on their profile
 */
export function simulateContestantAnswer(
  contestant: Contestant,
  question: Question
): { selectedOptionIndex: number; lockInDelayMs: number; reaction: string } {
  let accuracy = contestant.baseAccuracy;

  // Boost if it's their specialty, category, or exact tag
  if (question.specialtyTag === contestant.id) {
    accuracy = 0.96;
  } else if (contestant.specialties.includes(question.category)) {
    accuracy = Math.min(0.92, accuracy + 0.15);
  } else if (contestant.weaknesses.includes(question.category)) {
    accuracy = Math.max(0.35, accuracy - 0.25);
  }

  // Adjust for question difficulty
  if (question.difficulty === 'hard') accuracy *= 0.85;
  if (question.difficulty === 'final') accuracy *= 0.78;

  const isCorrect = Math.random() < accuracy;
  let selectedOptionIndex: number;

  if (isCorrect) {
    selectedOptionIndex = question.correctIndex;
  } else {
    // Pick an incorrect option
    const incorrectIndices = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
    selectedOptionIndex = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
  }

  // Lock-in timing simulation (between 2.0s and 8.5s)
  const isFastPlayer = contestant.faction === 'Gen Z' || contestant.id === 'general_jordan';
  const minDelay = isFastPlayer ? 1800 : 3200;
  const maxDelay = isFastPlayer ? 5000 : 8000;
  const lockInDelayMs = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;

  // Generate reaction
  const reactions = isCorrect ? CONTESTANT_REACTIONS.correct : CONTESTANT_REACTIONS.wrong;
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];

  return {
    selectedOptionIndex,
    lockInDelayMs,
    reaction,
  };
}

/**
 * Selects questions for a given round based on difficulty and availability
 */
export function selectQuestionsForRound(
  questions: Question[],
  roundNumber: number,
  count: number
): Question[] {
  let filtered = questions;
  if (roundNumber === 1) {
    filtered = questions.filter((q) => q.difficulty === 'easy' || q.difficulty === 'medium');
  } else if (roundNumber === 2) {
    filtered = questions.filter((q) => q.difficulty === 'medium');
  } else if (roundNumber === 3) {
    filtered = questions.filter((q) => q.difficulty === 'hard' || q.difficulty === 'medium');
  } else {
    filtered = questions.filter((q) => q.difficulty === 'final' || q.difficulty === 'hard');
  }

  // Fallback to the full pool if filtered difficulty doesn't have enough questions
  if (filtered.length < count) {
    filtered = questions;
  }

  // Shuffle and pick
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  if (shuffled.length >= count) {
    return shuffled.slice(0, count);
  }

  // If pool has fewer questions than count, duplicate or return available
  if (shuffled.length === 0) return [];
  const result: Question[] = [];
  while (result.length < count) {
    result.push(...shuffled);
  }
  return result.slice(0, count);
}

/**
 * Calculates eliminations at the end of a round
 */
export function determineEliminations(
  activeStates: ContestantRoundState[],
  eliminateCount: number
): { eliminatedIds: string[]; survivingStates: ContestantRoundState[] } {
  // Sort ascending by score (lowest score first)
  const sorted = [...activeStates].sort((a, b) => a.score - b.score);

  // The first `eliminateCount` lowest scoring players are marked for elimination
  const eliminated = sorted.slice(0, eliminateCount);
  const eliminatedIds = eliminated.map((s) => s.contestantId);

  const updatedStates = activeStates.map((state) => {
    if (eliminatedIds.includes(state.contestantId)) {
      return {
        ...state,
        isEliminated: true,
      };
    }
    return state;
  });

  return {
    eliminatedIds,
    survivingStates: updatedStates.filter((s) => !s.isEliminated),
  };
}

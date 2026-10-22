import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Contestant, Question, ContestantRoundState } from '../types';
import { ROUND_CONFIGS, selectQuestionsForRound, simulateContestantAnswer, determineEliminations } from '../utils/gameLogic';
import { QUESTIONS } from '../data/questions';
import { soundManager } from '../utils/audio';
import { Header } from '../components/Header';
import { TimerBar } from '../components/TimerBar';
import { ContestantRosterGrid } from '../components/ContestantRosterGrid';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOptions } from '../components/AnswerOptions';
import { EliminationModal } from '../components/EliminationModal';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { theme } from '../theme';

interface GauntletGameScreenProps {
  playerContestant: Contestant;
  opponentContestants: Contestant[];
  questionPool?: Question[];
  onFinishGame: (winner: Contestant, finalLeaderboard: { contestant: Contestant; score: number }[]) => void;
  onExit: () => void;
}

export const GauntletGameScreen: React.FC<GauntletGameScreenProps> = ({
  playerContestant,
  opponentContestants,
  questionPool = QUESTIONS,
  onFinishGame,
  onExit,
}) => {
  // All 10 contestants
  const allContestants: Contestant[] = [playerContestant, ...opponentContestants];

  // Tournament state
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);

  // Real-time states for each contestant
  const [roundStates, setRoundStates] = useState<Record<string, ContestantRoundState>>(() => {
    const initial: Record<string, ContestantRoundState> = {};
    allContestants.forEach((c) => {
      initial[c.id] = {
        contestantId: c.id,
        selectedOptionIndex: null,
        hasLockedIn: false,
        score: 0,
        isEliminated: false,
      };
    });
    return initial;
  });

  // UI flow states
  const [timeRemaining, setTimeRemaining] = useState(12);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedContestantDetail, setSelectedContestantDetail] = useState<Contestant | null>(null);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [eliminationModalData, setEliminationModalData] = useState<{
    visible: boolean;
    eliminatedContestants: Contestant[];
    playerEliminated: boolean;
    playerRank: number;
  }>({
    visible: false,
    eliminatedContestants: [],
    playerEliminated: false,
    playerRank: 1,
  });

  const timerRef = useRef<any>(null);
  const simulatedTimeoutsRef = useRef<any[]>([]);
  const autoAdvanceTimeoutRef = useRef<any>(null);
  const autoAdvanceIntervalRef = useRef<any>(null);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  const currentRoundConfig = ROUND_CONFIGS[currentRoundIndex];
  const activeQuestion = roundQuestions[currentQuestionIndex];

  // Initialize questions for current round
  useEffect(() => {
    const questions = selectQuestionsForRound(
      questionPool,
      currentRoundConfig.roundNumber,
      currentRoundConfig.questionCount
    );
    setRoundQuestions(questions);
    setCurrentQuestionIndex(0);
  }, [currentRoundIndex, questionPool]);

  // Start a new question
  useEffect(() => {
    if (!activeQuestion) return;

    // Reset lock-in states for active contestants
    setRoundStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (!next[id].isEliminated) {
          next[id] = {
            ...next[id],
            selectedOptionIndex: null,
            hasLockedIn: false,
            lastReaction: undefined,
          };
        }
      });
      return next;
    });

    setIsRevealed(false);
    setTimeRemaining(currentRoundConfig.timeLimitSeconds);
    setIsTimerRunning(true);

    // Clear any previous AI lock-in timeouts
    simulatedTimeoutsRef.current.forEach((t) => clearTimeout(t));
    simulatedTimeoutsRef.current = [];
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    if (autoAdvanceIntervalRef.current) clearInterval(autoAdvanceIntervalRef.current);
    setAutoAdvanceCountdown(null);

    // Schedule AI contestant lock-ins
    opponentContestants.forEach((opp) => {
      if (roundStates[opp.id]?.isEliminated) return;

      const sim = simulateContestantAnswer(opp, activeQuestion);
      const timeout = setTimeout(() => {
        setRoundStates((prev) => {
          if (!prev[opp.id] || prev[opp.id].isEliminated) return prev;
          return {
            ...prev,
            [opp.id]: {
              ...prev[opp.id],
              selectedOptionIndex: sim.selectedOptionIndex,
              hasLockedIn: true,
              lastReaction: sim.reaction,
            },
          };
        });
      }, sim.lockInDelayMs);

      simulatedTimeoutsRef.current.push(timeout);
    });

    return () => {
      simulatedTimeoutsRef.current.forEach((t) => clearTimeout(t));
      simulatedTimeoutsRef.current = [];
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
      if (autoAdvanceIntervalRef.current) clearInterval(autoAdvanceIntervalRef.current);
    };
  }, [activeQuestion]);

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerRunning || isRevealed) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleRevealAnswers();
          return 0;
        }
        if (prev <= 4) {
          soundManager.playTick(true);
        } else {
          soundManager.playTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, isRevealed]);

  // Player locks in an option
  const handleSelectOption = (index: number) => {
    if (isRevealed || roundStates[playerContestant.id]?.hasLockedIn) return;

    soundManager.playLockIn();

    setRoundStates((prev) => ({
      ...prev,
      [playerContestant.id]: {
        ...prev[playerContestant.id],
        selectedOptionIndex: index,
        hasLockedIn: true,
      },
    }));
  };

  // Trigger dramatic simultaneous reveal
  const handleRevealAnswers = () => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    simulatedTimeoutsRef.current.forEach((t) => clearTimeout(t));

    // Force lock-in for anyone who hasn't locked in yet
    setRoundStates((prev) => {
      const next = { ...prev };
      allContestants.forEach((c) => {
        if (next[c.id] && !next[c.id].isEliminated) {
          if (!next[c.id].hasLockedIn) {
            // Auto random pick if out of time
            const sim = simulateContestantAnswer(c, activeQuestion);
            next[c.id] = {
              ...next[c.id],
              selectedOptionIndex: sim.selectedOptionIndex,
              hasLockedIn: true,
              lastReaction: sim.reaction,
            };
          }

          // Calculate score
          const isCorrect = next[c.id].selectedOptionIndex === activeQuestion.correctIndex;
          if (isCorrect) {
            next[c.id].score += currentRoundConfig.pointsPerQuestion;
          }
        }
      });
      return next;
    });

    setIsRevealed(true);

    // Audio cue
    const playerPick = roundStates[playerContestant.id]?.selectedOptionIndex;
    const isPlayerCorrect = playerPick === activeQuestion.correctIndex;

    setTimeout(() => {
      if (isPlayerCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playWrong();
      }
    }, 200);

    // Automatically advance to the next question so user does not need to tap button
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    if (autoAdvanceIntervalRef.current) clearInterval(autoAdvanceIntervalRef.current);

    let secs = 2;
    setAutoAdvanceCountdown(secs);
    autoAdvanceIntervalRef.current = setInterval(() => {
      secs -= 1;
      if (secs > 0) {
        setAutoAdvanceCountdown(secs);
      } else {
        clearInterval(autoAdvanceIntervalRef.current);
      }
    }, 1000);

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      handleNext();
    }, 2200);
  };

  // Next question or round finish
  const handleNext = () => {
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    if (autoAdvanceIntervalRef.current) clearInterval(autoAdvanceIntervalRef.current);
    setAutoAdvanceCountdown(null);

    soundManager.playClick();

    if (currentQuestionIndex + 1 < currentRoundConfig.questionCount) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Round Complete! Perform eliminations
      handleRoundCompletion();
    }
  };

  // Elimination cut logic
  const handleRoundCompletion = () => {
    const activeContestants = allContestants.filter(
      (c) => !roundStates[c.id]?.isEliminated
    );

    // If it was the final round (Showdown)
    if (currentRoundIndex >= ROUND_CONFIGS.length - 1) {
      // Determine overall winner
      const sorted = [...allContestants].sort(
        (a, b) => (roundStates[b.id]?.score || 0) - (roundStates[a.id]?.score || 0)
      );
      const winner = sorted[0];
      const finalLeaderboard = sorted.map((c) => ({
        contestant: c,
        score: roundStates[c.id]?.score || 0,
      }));
      onFinishGame(winner, finalLeaderboard);
      return;
    }

    // Active states for elimination calculation
    const activeStates = activeContestants.map((c) => roundStates[c.id]);
    const { eliminatedIds, survivingStates } = determineEliminations(
      activeStates,
      currentRoundConfig.eliminateCount
    );

    // Update global state with eliminated status
    setRoundStates((prev) => {
      const next = { ...prev };
      eliminatedIds.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], isEliminated: true, eliminatedInRound: currentRoundConfig.roundNumber };
        }
      });
      return next;
    });

    // Sound effect
    soundManager.playEliminated();

    const eliminatedObjects = allContestants.filter((c) => eliminatedIds.includes(c.id));
    const isPlayerEliminated = eliminatedIds.includes(playerContestant.id);

    // Calculate player rank among active
    const sortedRanks = [...activeContestants].sort(
      (a, b) => (roundStates[b.id]?.score || 0) - (roundStates[a.id]?.score || 0)
    );
    const playerRank = sortedRanks.findIndex((c) => c.id === playerContestant.id) + 1;

    setEliminationModalData({
      visible: true,
      eliminatedContestants: eliminatedObjects,
      playerEliminated: isPlayerEliminated,
      playerRank: Math.max(1, playerRank),
    });
  };

  const handleContinueAfterElimination = () => {
    setEliminationModalData((prev) => ({ ...prev, visible: false }));

    if (eliminationModalData.playerEliminated) {
      // If player is eliminated, take to final standings
      const sorted = [...allContestants].sort(
        (a, b) => (roundStates[b.id]?.score || 0) - (roundStates[a.id]?.score || 0)
      );
      onFinishGame(sorted[0], sorted.map((c) => ({ contestant: c, score: roundStates[c.id]?.score || 0 })));
    } else {
      // Advance to next round
      setCurrentRoundIndex((prev) => prev + 1);
    }
  };

  const playerScore = roundStates[playerContestant.id]?.score || 0;
  const playerSelectedOption = roundStates[playerContestant.id]?.selectedOptionIndex ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        roundName={currentRoundConfig.name}
        roundNumber={currentRoundConfig.roundNumber}
        questionIndex={currentQuestionIndex}
        totalQuestions={currentRoundConfig.questionCount}
        score={playerScore}
        onExit={() => {
          Alert.alert('Leave Show?', 'Are you sure you want to forfeit your run?', [
            { text: 'Stay', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: onExit },
          ]);
        }}
        onLeaderboard={() => setShowLeaderboard(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Countdown Timer */}
        <TimerBar
          timeRemaining={timeRemaining}
          totalTime={currentRoundConfig.timeLimitSeconds}
        />

        {/* Contestant Roster Lineup (Extra Medium pods) */}
        {activeQuestion ? (
          <ContestantRosterGrid
            contestants={allContestants}
            roundStates={roundStates}
            isRevealed={isRevealed}
            activeQuestion={activeQuestion}
            onSelectContestant={(c) => setSelectedContestantDetail(c)}
            selectedContestantId={selectedContestantDetail?.id}
          />
        ) : null}

        {/* Question Card */}
        {activeQuestion ? (
          <QuestionCard
            question={activeQuestion}
            points={currentRoundConfig.pointsPerQuestion}
          />
        ) : null}

        {/* Options Picker */}
        {activeQuestion ? (
          <AnswerOptions
            question={activeQuestion}
            selectedIndex={playerSelectedOption}
            onSelectOption={handleSelectOption}
            isRevealed={isRevealed}
          />
        ) : null}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {!isRevealed ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              playerSelectedOption === null && styles.disabledButton,
            ]}
            disabled={playerSelectedOption === null}
            activeOpacity={0.8}
            onPress={handleRevealAnswers}
          >
            <Text
              style={[
                styles.actionButtonText,
                playerSelectedOption === null && styles.disabledButtonText,
              ]}
            >
              {playerSelectedOption !== null ? 'LOCK IN & REVEAL ANSWERS →' : 'SELECT AN ANSWER FIRST'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.nextButton]}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={styles.actionButtonText}>
              {currentQuestionIndex + 1 < currentRoundConfig.questionCount
                ? `NEXT QUESTION →${autoAdvanceCountdown !== null ? ` (Auto in ${autoAdvanceCountdown}s)` : ''}`
                : `COMMENCE ROUND CUT →${autoAdvanceCountdown !== null ? ` (Auto in ${autoAdvanceCountdown}s)` : ''}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <EliminationModal
        visible={eliminationModalData.visible}
        roundNumber={currentRoundConfig.roundNumber}
        eliminatedContestants={eliminationModalData.eliminatedContestants}
        playerEliminated={eliminationModalData.playerEliminated}
        playerRank={eliminationModalData.playerRank}
        onContinue={handleContinueAfterElimination}
      />

      <LeaderboardModal
        visible={showLeaderboard}
        contestants={allContestants}
        roundStates={roundStates}
        onClose={() => setShowLeaderboard(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  disabledButtonText: {
    color: theme.colors.textMuted,
  },
});

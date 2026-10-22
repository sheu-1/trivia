import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Contestant, Question } from '../types';
import { CONTESTANTS } from '../data/contestants';
import { QUESTIONS } from '../data/questions';
import { simulateContestantAnswer } from '../utils/gameLogic';
import { soundManager } from '../utils/audio';
import { theme } from '../theme';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOptions } from '../components/AnswerOptions';

interface DuelGameScreenProps {
  onBack: () => void;
}

export const DuelGameScreen: React.FC<DuelGameScreenProps> = ({ onBack }) => {
  const [selectedPlayerJob, setSelectedPlayerJob] = useState<Contestant>(CONTESTANTS[1]); // Software Engineer
  const [selectedOpponentJob, setSelectedOpponentJob] = useState<Contestant>(CONTESTANTS[0]); // Doctor
  const [isMatchStarted, setIsMatchStarted] = useState(false);

  // Match state
  const [duelQuestions, setDuelQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [playerSelected, setPlayerSelected] = useState<number | null>(null);
  const [opponentSelected, setOpponentSelected] = useState<number | null>(null);
  const [opponentReaction, setOpponentReaction] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [matchOver, setMatchOver] = useState(false);

  const activeQuestion = duelQuestions[currentIndex];

  const startMatch = () => {
    soundManager.playLockIn();
    const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setDuelQuestions(shuffled);
    setCurrentIndex(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerSelected(null);
    setOpponentSelected(null);
    setIsRevealed(false);
    setMatchOver(false);
    setIsMatchStarted(true);
  };

  useEffect(() => {
    if (!isMatchStarted || !activeQuestion) return;

    setPlayerSelected(null);
    setOpponentSelected(null);
    setIsRevealed(false);

    // Simulate opponent pick
    const sim = simulateContestantAnswer(selectedOpponentJob, activeQuestion);
    setOpponentSelected(sim.selectedOptionIndex);
    setOpponentReaction(sim.reaction);
  }, [currentIndex, isMatchStarted]);

  const handleSelectOption = (index: number) => {
    if (isRevealed) return;
    soundManager.playLockIn();
    setPlayerSelected(index);
  };

  const handleReveal = () => {
    if (playerSelected === null) return;
    setIsRevealed(true);

    const isPlayerCorrect = playerSelected === activeQuestion.correctIndex;
    const isOpponentCorrect = opponentSelected === activeQuestion.correctIndex;

    if (isPlayerCorrect) {
      setPlayerScore((prev) => prev + 100);
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    if (isOpponentCorrect) {
      setOpponentScore((prev) => prev + 100);
    }
  };

  const handleNext = () => {
    soundManager.playClick();
    if (currentIndex + 1 < duelQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setMatchOver(true);
      if (playerScore >= opponentScore) {
        soundManager.playVictory();
      }
    }
  };

  if (!isMatchStarted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>1V1 CAREER RIVALRY</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.selectionContent}>
          <Text style={styles.selectionTitle}>SELECT YOUR MATCHUP</Text>
          <Text style={styles.selectionDesc}>
            Test two careers head-to-head in a fast 5-question general knowledge showdown.
          </Text>

          {/* Versus Header Cards */}
          <View style={styles.versusContainer}>
            <View style={styles.sideCard}>
              <Text style={styles.sideLabel}>YOU</Text>
              <Text style={styles.sideEmoji}>{selectedPlayerJob.emoji}</Text>
              <Text style={styles.sideJob}>{selectedPlayerJob.job}</Text>
            </View>

            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideLabel}>RIVAL</Text>
              <Text style={styles.sideEmoji}>{selectedOpponentJob.emoji}</Text>
              <Text style={styles.sideJob}>{selectedOpponentJob.job}</Text>
            </View>
          </View>

          {/* Pick Player Job */}
          <Text style={styles.rowLabel}>CHOOSE YOUR JOB</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {CONTESTANTS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedPlayerJob.id === c.id && styles.selectedChip]}
                onPress={() => setSelectedPlayerJob(c)}
              >
                <Text style={styles.chipEmoji}>{c.emoji}</Text>
                <Text style={styles.chipText}>{c.job}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pick Opponent Job */}
          <Text style={[styles.rowLabel, { marginTop: 18 }]}>CHOOSE YOUR RIVAL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {CONTESTANTS.filter((c) => c.id !== selectedPlayerJob.id).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedOpponentJob.id === c.id && styles.selectedRivalChip]}
                onPress={() => setSelectedOpponentJob(c)}
              >
                <Text style={styles.chipEmoji}>{c.emoji}</Text>
                <Text style={styles.chipText}>{c.job}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startDuelBtn} activeOpacity={0.85} onPress={startMatch}>
            <Text style={styles.startDuelText}>START 1V1 DUEL (5 QUESTIONS) →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active Duel Match Screen
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.duelHeader}>
        <TouchableOpacity onPress={() => setIsMatchStarted(false)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ EXIT</Text>
        </TouchableOpacity>

        {/* Live Head-to-Head Scoreboard */}
        <View style={styles.scoreboard}>
          <View style={styles.scoreSide}>
            <Text style={styles.scoreEmoji}>{selectedPlayerJob.emoji}</Text>
            <Text style={styles.scoreJobName}>{selectedPlayerJob.job} (YOU)</Text>
            <Text style={styles.scoreNumber}>{playerScore}</Text>
          </View>

          <View style={styles.scoreVsBox}>
            <Text style={styles.scoreVsText}>Q{currentIndex + 1}/5</Text>
          </View>

          <View style={styles.scoreSide}>
            <Text style={styles.scoreEmoji}>{selectedOpponentJob.emoji}</Text>
            <Text style={styles.scoreJobName}>{selectedOpponentJob.job}</Text>
            <Text style={styles.scoreNumber}>{opponentScore}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.matchContent}>
        {/* Opponent Reveal Board */}
        {isRevealed ? (
          <View style={styles.opponentRevealBox}>
            <Text style={styles.opponentRevealTitle}>
              {selectedOpponentJob.emoji} {selectedOpponentJob.name}'s Whiteboard:
            </Text>
            <Text style={styles.opponentPickText}>
              Chose: Option {['A', 'B', 'C', 'D'][opponentSelected ?? 0]} ({opponentSelected === activeQuestion.correctIndex ? 'CORRECT ✓' : 'WRONG ✕'})
            </Text>
            <Text style={styles.opponentReactionQuote}>"{opponentReaction}"</Text>
          </View>
        ) : null}

        {activeQuestion ? (
          <QuestionCard question={activeQuestion} points={100} />
        ) : null}

        {activeQuestion ? (
          <AnswerOptions
            question={activeQuestion}
            selectedIndex={playerSelected}
            onSelectOption={handleSelectOption}
            isRevealed={isRevealed}
          />
        ) : null}
      </ScrollView>

      {/* Match Over Modal / Overlay */}
      {matchOver ? (
        <View style={styles.matchOverOverlay}>
          <View style={styles.matchOverCard}>
            <Text style={styles.matchOverTrophy}>
              {playerScore > opponentScore ? '🏆' : playerScore === opponentScore ? '🤝' : '💀'}
            </Text>
            <Text style={styles.matchOverTitle}>
              {playerScore > opponentScore
                ? `${selectedPlayerJob.job.toUpperCase()} WINS!`
                : playerScore === opponentScore
                ? 'HONORABLE DRAW!'
                : `${selectedOpponentJob.job.toUpperCase()} WINS!`}
            </Text>
            <Text style={styles.matchOverScore}>
              {playerScore} PTS vs {opponentScore} PTS
            </Text>

            <TouchableOpacity style={styles.rematchBtn} onPress={startMatch}>
              <Text style={styles.rematchBtnText}>REMATCH</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exitDuelBtn} onPress={() => setIsMatchStarted(false)}>
              <Text style={styles.exitDuelText}>CHOOSE NEW RIVALS</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!matchOver ? (
        <View style={styles.footer}>
          {!isRevealed ? (
            <TouchableOpacity
              style={[styles.startDuelBtn, playerSelected === null && styles.disabledBtn]}
              disabled={playerSelected === null}
              onPress={handleReveal}
            >
              <Text style={styles.startDuelText}>LOCK IN & REVEAL →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.startDuelBtn, { backgroundColor: theme.colors.gold }]} onPress={handleNext}>
              <Text style={styles.startDuelText}>NEXT QUESTION →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 0.8,
  },
  selectionContent: {
    padding: 18,
    paddingBottom: 100,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  selectionDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  versusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 24,
  },
  sideCard: {
    flex: 1,
    alignItems: 'center',
  },
  sideLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  sideEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  sideJob: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  vsBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.error,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  horizontalChips: {
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  selectedChip: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSubtle,
  },
  selectedRivalChip: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorBg,
  },
  chipEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    padding: 16,
  },
  startDuelBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    opacity: 0.6,
  },
  startDuelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  duelHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 14,
    padding: 12,
  },
  scoreSide: {
    flex: 1,
    alignItems: 'center',
  },
  scoreEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  scoreJobName: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  scoreVsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreVsText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  matchContent: {
    paddingBottom: 90,
  },
  opponentRevealBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  opponentRevealTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  opponentPickText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  opponentReactionQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: theme.colors.accent,
  },
  matchOverOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  matchOverCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchOverTrophy: {
    fontSize: 48,
    marginBottom: 12,
  },
  matchOverTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  matchOverScore: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  rematchBtn: {
    width: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  rematchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  exitDuelBtn: {
    width: '100%',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitDuelText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

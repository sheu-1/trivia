import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Question } from '../types';
import { QUESTIONS } from '../data/questions';
import { soundManager } from '../utils/audio';
import { theme } from '../theme';

interface PassPlayer {
  id: string;
  name: string;
  job: string;
  score: number;
  currentPick: number | null;
}

interface PassAndPlayScreenProps {
  onBack: () => void;
}

export const PassAndPlayScreen: React.FC<PassAndPlayScreenProps> = ({ onBack }) => {
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  // Players
  const defaultJobs = ['Software Engineer', 'Trauma Surgeon', 'Craft Barista', 'Corporate Lawyer'];
  const [players, setPlayers] = useState<PassPlayer[]>([
    { id: 'p1', name: 'Player 1', job: defaultJobs[0], score: 0, currentPick: null },
    { id: 'p2', name: 'Player 2', job: defaultJobs[1], score: 0, currentPick: null },
    { id: 'p3', name: 'Player 3', job: defaultJobs[2], score: 0, currentPick: null },
    { id: 'p4', name: 'Player 4', job: defaultJobs[3], score: 0, currentPick: null },
  ]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Sub-turn: which player is currently holding the phone to secretly lock in
  const [activePlayerTurnIndex, setActivePlayerTurnIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [passIntermission, setPassIntermission] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const activePlayers = players.slice(0, playerCount);
  const activeQuestion = questions[questionIndex];
  const currentPlayer = activePlayers[activePlayerTurnIndex];

  const startGame = () => {
    soundManager.playLockIn();
    const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
    setQuestionIndex(0);
    setActivePlayerTurnIndex(0);
    setIsRevealed(false);
    setPassIntermission(false);
    setGameOver(false);

    setPlayers((prev) =>
      prev.map((p) => ({ ...p, score: 0, currentPick: null }))
    );

    setIsGameStarted(true);
  };

  const handlePickOption = (optionIndex: number) => {
    soundManager.playLockIn();

    // Save pick for current player
    setPlayers((prev) => {
      const updated = [...prev];
      updated[activePlayerTurnIndex] = {
        ...updated[activePlayerTurnIndex],
        currentPick: optionIndex,
      };
      return updated;
    });

    // Check if more players need to take their turn
    if (activePlayerTurnIndex + 1 < playerCount) {
      setPassIntermission(true);
    } else {
      // All players locked in! Trigger simultaneous reveal
      revealAllAnswers();
    }
  };

  const handlePassConfirm = () => {
    soundManager.playClick();
    setActivePlayerTurnIndex((prev) => prev + 1);
    setPassIntermission(false);
  };

  const revealAllAnswers = () => {
    setIsRevealed(true);

    // Update scores
    setPlayers((prev) => {
      return prev.map((p, idx) => {
        if (idx < playerCount && p.currentPick === activeQuestion.correctIndex) {
          return { ...p, score: p.score + 100 };
        }
        return p;
      });
    });

    soundManager.playCorrect();
  };

  const handleNextQuestion = () => {
    soundManager.playClick();

    if (questionIndex + 1 < questions.length) {
      // Reset picks for next question
      setPlayers((prev) =>
        prev.map((p) => ({ ...p, currentPick: null }))
      );
      setQuestionIndex((prev) => prev + 1);
      setActivePlayerTurnIndex(0);
      setIsRevealed(false);
      setPassIntermission(false);
    } else {
      setGameOver(true);
      soundManager.playVictory();
    }
  };

  // Setup Screen
  if (!isGameStarted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>PASS & PLAY STUDIO</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>LOCAL PARTY ARENA</Text>
          <Text style={styles.subheading}>
            Pass the device between players to secretly lock in answers on your whiteboard, followed by a dramatic simultaneous studio reveal!
          </Text>

          <Text style={styles.sectionTitle}>NUMBER OF CONTESTANTS</Text>
          <View style={styles.countRow}>
            {[2, 3, 4].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.countBtn, playerCount === count && styles.activeCountBtn]}
                onPress={() => {
                  soundManager.playClick();
                  setPlayerCount(count);
                }}
              >
                <Text style={[styles.countText, playerCount === count && styles.activeCountText]}>
                  {count} PLAYERS
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>CONTESTANT ROSTER</Text>
          <View style={styles.rosterCard}>
            {players.slice(0, playerCount).map((p, i) => (
              <View key={p.id} style={styles.playerSetupRow}>
                <View style={styles.pBadge}>
                  <Text style={styles.pBadgeText}>P{i + 1}</Text>
                </View>
                <View>
                  <Text style={styles.pName}>{p.name}</Text>
                  <Text style={styles.pJob}>Career: {p.job}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={startGame}>
            <Text style={styles.startBtnText}>START STUDIO SHOW (5 QUESTIONS) →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pass Intermission Screen
  if (passIntermission) {
    const nextPlayer = activePlayers[activePlayerTurnIndex + 1];
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.intermissionContainer}>
          <View style={styles.lockedPill}>
            <Text style={styles.lockedPillText}>✓ ANSWER LOCKED IN</Text>
          </View>
          <Text style={styles.passTitle}>PASS THE PHONE TO</Text>
          <Text style={styles.passPlayerName}>{nextPlayer?.name}</Text>
          <Text style={styles.passPlayerJob}>{nextPlayer?.job}</Text>

          <Text style={styles.secretNotice}>
            No peeking! Keep your whiteboards secret until the studio reveal.
          </Text>

          <TouchableOpacity style={styles.passReadyBtn} activeOpacity={0.85} onPress={handlePassConfirm}>
            <Text style={styles.passReadyBtnText}>I AM {nextPlayer?.name.toUpperCase()} (READY) →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Post-Game Winner Standings
  if (gameOver) {
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.intermissionContainer}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.winnerHeadline}>{winner.name} WINS THE SHOW!</Text>
          <Text style={styles.winnerJobText}>Career: {winner.job} • {winner.score} PTS</Text>

          <View style={styles.standingsBox}>
            <Text style={styles.standingsHeader}>FINAL STANDINGS</Text>
            {sorted.map((p, idx) => (
              <View key={p.id} style={styles.standingsRow}>
                <Text style={styles.standingsRank}>#{idx + 1}</Text>
                <Text style={styles.standingsName}>{p.name} ({p.job})</Text>
                <Text style={styles.standingsScore}>{p.score} PTS</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.passReadyBtn} onPress={startGame}>
            <Text style={styles.passReadyBtnText}>PLAY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.passReadyBtn, { backgroundColor: 'transparent', marginTop: 10 }]}
            onPress={() => setIsGameStarted(false)}
          >
            <Text style={[styles.passReadyBtnText, { color: theme.colors.textSecondary }]}>
              EXIT TO MAIN MENU
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active Question Screen (Single Player Lock-in or Simultaneous Reveal)
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => setIsGameStarted(false)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ EXIT</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          Q{questionIndex + 1}/5 • {isRevealed ? 'SIMULTANEOUS REVEAL' : `${currentPlayer?.name}'s TURN`}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* If revealed: Show All Players Whiteboards side-by-side */}
        {isRevealed ? (
          <View style={styles.revealGrid}>
            <Text style={styles.revealHeading}>ALL WHITEBOARDS REVEALED</Text>
            <View style={styles.whiteboardCardsRow}>
              {activePlayers.map((p) => {
                const isCorrect = p.currentPick === activeQuestion.correctIndex;
                const letter = p.currentPick !== null ? ['A', 'B', 'C', 'D'][p.currentPick] : '-';
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.playerWhiteboard,
                      isCorrect ? styles.wbCorrect : styles.wbWrong,
                    ]}
                  >
                    <Text style={styles.wbPlayerName}>{p.name}</Text>
                    <Text style={styles.wbJobName}>{p.job}</Text>
                    <Text style={styles.wbLetter}>{letter}</Text>
                    <Text style={styles.wbResult}>{isCorrect ? '✓ +100' : '✕ WRONG'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.activeTurnPill}>
            <Text style={styles.activeTurnPillText}>
              PASS TO: {currentPlayer?.name.toUpperCase()} ({currentPlayer?.job})
            </Text>
          </View>
        )}

        {activeQuestion ? (
          <View style={styles.questionBox}>
            <Text style={styles.categoryBadge}>{activeQuestion.category.toUpperCase()}</Text>
            <Text style={styles.questionText}>{activeQuestion.question}</Text>
          </View>
        ) : null}

        {/* Options */}
        {!isRevealed && activeQuestion ? (
          <View style={styles.optionsContainer}>
            {activeQuestion.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.optionBtn}
                activeOpacity={0.8}
                onPress={() => handlePickOption(idx)}
              >
                <View style={styles.letterBox}>
                  <Text style={styles.letterTxt}>{['A', 'B', 'C', 'D'][idx]}</Text>
                </View>
                <Text style={styles.optionTxt}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Revealed Explanation */}
        {isRevealed && activeQuestion ? (
          <View style={styles.explanationBox}>
            <Text style={styles.correctAnswerLabel}>
              CORRECT ANSWER: {['A', 'B', 'C', 'D'][activeQuestion.correctIndex]} -{' '}
              {activeQuestion.options[activeQuestion.correctIndex]}
            </Text>
            <Text style={styles.explanationBody}>{activeQuestion.explanation}</Text>
          </View>
        ) : null}
      </ScrollView>

      {isRevealed ? (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} activeOpacity={0.85} onPress={handleNextQuestion}>
            <Text style={styles.startBtnText}>
              {questionIndex + 1 < questions.length ? 'NEXT QUESTION →' : 'VIEW FINAL RESULTS →'}
            </Text>
          </TouchableOpacity>
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
  topNav: {
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
  navTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  countRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  countBtn: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeCountBtn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  activeCountText: {
    color: '#FFFFFF',
  },
  rosterCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 12,
  },
  playerSetupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pJob: {
    fontSize: 11,
    color: theme.colors.textMuted,
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
  startBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  intermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 20,
  },
  lockedPillText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  passPlayerName: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  passPlayerJob: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.accent,
    marginBottom: 20,
  },
  secretNotice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 260,
  },
  passReadyBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  passReadyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  trophyEmoji: {
    fontSize: 54,
    marginBottom: 16,
  },
  winnerHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  winnerJobText: {
    fontSize: 14,
    color: theme.colors.gold,
    fontWeight: '700',
    marginBottom: 24,
  },
  standingsBox: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 24,
    gap: 8,
  },
  standingsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  standingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  standingsRank: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.gold,
    width: 24,
  },
  standingsName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  standingsScore: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  activeTurnPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  activeTurnPillText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  questionBox: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 12,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.gold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  letterBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  letterTxt: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  optionTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  revealGrid: {
    marginBottom: 14,
  },
  revealHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  whiteboardCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playerWhiteboard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  wbCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: theme.colors.success,
  },
  wbWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: theme.colors.error,
  },
  wbPlayerName: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  wbJobName: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  wbLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  wbResult: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  explanationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 8,
  },
  correctAnswerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.success,
    marginBottom: 4,
  },
  explanationBody: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

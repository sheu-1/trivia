import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';
import { Room, RoomQuestion } from '../types';
import { subscribeToRoom, submitAnswer, advanceQuestion } from '../services/roomService';

interface MultiplayerGameScreenProps {
  initialRoom: Room;
  playerId: string;
  onFinish: (room: Room) => void;
  onExit: () => void;
}

export const MultiplayerGameScreen: React.FC<MultiplayerGameScreenProps> = ({
  initialRoom,
  playerId,
  onFinish,
  onExit,
}) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialRoom.timeLimitSeconds);
  const [countdownVal, setCountdownVal] = useState(3);

  const timerRef = useRef<any>(null);
  const advanceLockRef = useRef(false);
  const isHost = room.players[playerId]?.isHost ?? false;
  const me = room.players[playerId];
  const currentQ: RoomQuestion | undefined = room.questions[room.currentQuestionIndex];
  const playersSorted = Object.values(room.players).sort((a, b) => b.score - a.score);

  // React 19 safe animation values
  const [timerAnim] = useState(() => new Animated.Value(1));
  const [countdownAnim] = useState(() => new Animated.Value(1));
  const [questionFade] = useState(() => new Animated.Value(0));

  const animateQuestionIn = useCallback(() => {
    questionFade.setValue(0);
    Animated.timing(questionFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [questionFade]);

  const handleTimeUp = useCallback(async () => {
    if (!isHost || advanceLockRef.current) return;
    advanceLockRef.current = true;
    setTimeout(async () => {
      await advanceQuestion(room.id);
    }, 2500);
  }, [isHost, room.id]);

  const startTimer = useCallback(
    (seconds: number) => {
      clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerAnim.setValue(1);

      Animated.timing(timerAnim, {
        toValue: 0,
        duration: seconds * 1000,
        useNativeDriver: false,
      }).start();

      let t = seconds;
      timerRef.current = setInterval(() => {
        t--;
        setTimeLeft(t);
        if (t <= 0) {
          clearInterval(timerRef.current);
          handleTimeUp();
        }
      }, 1000);
    },
    [timerAnim, handleTimeUp],
  );

  const runCountdown = useCallback(() => {
    let c = 3;
    setCountdownVal(c);
    const interval = setInterval(() => {
      c--;
      setCountdownVal(c);
      Animated.sequence([
        Animated.spring(countdownAnim, { toValue: 1.3, useNativeDriver: true, speed: 40 }),
        Animated.spring(countdownAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
      if (c <= 0) clearInterval(interval);
    }, 1000);
  }, [countdownAnim]);

  // ── Subscribe to room changes ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToRoom(room.id, (updated) => {
      setRoom(updated);
      if (updated.status === 'finished') {
        onFinish(updated);
        return;
      }
      if (updated.status === 'question') {
        setSelectedIndex(null);
        advanceLockRef.current = false;
        startTimer(updated.timeLimitSeconds);
        animateQuestionIn();
      }
    });
    return unsub;
  }, [room.id, onFinish, startTimer, animateQuestionIn]);

  // ── Initial mount: handle status ──────────────────────────────────────────
  useEffect(() => {
    if (room.status === 'countdown') {
      runCountdown();
    } else if (room.status === 'question') {
      startTimer(room.timeLimitSeconds);
      animateQuestionIn();
    }
    return () => clearInterval(timerRef.current);
  }, [room.status, room.timeLimitSeconds, runCountdown, startTimer, animateQuestionIn]);

  const handleSelectAnswer = async (index: number) => {
    if (selectedIndex !== null) return;
    if (me?.hasAnswered) return;
    setSelectedIndex(index);
    soundManager.playClick();

    Animated.sequence([
      Animated.spring(countdownAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }),
      Animated.spring(countdownAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    await submitAnswer(room.id, playerId, index);
  };

  const answeredCount = Object.values(room.players).filter((p) => p.hasAnswered).length;
  const totalActive = Object.values(room.players).length;
  const isUrgent = timeLeft <= 3;
  const timerColor = isUrgent
    ? theme.colors.error
    : timeLeft <= Math.floor(room.timeLimitSeconds / 2)
      ? '#F59E0B'
      : theme.colors.primary;

  // ── Countdown screen ──────────────────────────────────────────────────────
  if (room.status === 'countdown') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.countdownCenter}>
          <Text style={styles.countdownLabel}>GET READY</Text>
          <Animated.Text
            style={[styles.countdownNum, { transform: [{ scale: countdownAnim }] }]}
          >
            {countdownVal > 0 ? countdownVal : '🚀'}
          </Animated.Text>
          <Text style={styles.countdownSub}>{room.category}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQ) return null;

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roundLabel}>
            Q {room.currentQuestionIndex + 1} / {room.totalQuestions}
          </Text>
          <Text style={styles.categoryLabel}>{room.category.toUpperCase()}</Text>
        </View>
        <View style={styles.timerBox}>
          <Animated.Text style={[styles.timerNum, { color: timerColor }]}>
            {timeLeft}
          </Animated.Text>
          <Text style={styles.timerSec}>sec</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.myScoreLabel}>YOUR SCORE</Text>
          <Text style={styles.myScoreNum}>{me?.score ?? 0}</Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[styles.timerFill, { flex: timerAnim, backgroundColor: timerColor }]}
        />
        <Animated.View style={{ flex: Animated.subtract(1, timerAnim) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Animated.View style={{ opacity: questionFade }}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </Animated.View>

        {/* Answer options */}
        <View style={styles.optionsGrid}>
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedIndex === i;
            const isRevealed = Boolean(me?.hasAnswered || timeLeft === 0);
            const isCorrect = isRevealed && i === currentQ.correctIndex;
            const isWrong = isRevealed && isSelected && i !== currentQ.correctIndex;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionBtn,
                  isSelected && !isRevealed && styles.optionSelected,
                  isCorrect && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                ]}
                activeOpacity={0.82}
                onPress={() => handleSelectAnswer(i)}
                disabled={isRevealed}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    isCorrect && styles.optionLetterCorrect,
                    isWrong && styles.optionLetterWrong,
                  ]}
                >
                  {letters[i]}
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    isCorrect && styles.optionTextCorrect,
                    isWrong && styles.optionTextWrong,
                  ]}
                >
                  {opt}
                </Text>
                {isCorrect && <Text style={styles.checkMark}>✓</Text>}
                {isWrong && <Text style={styles.crossMark}>✕</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live status */}
        <View style={styles.liveStatus}>
          <Text style={styles.liveStatusText}>
            {timeLeft === 0
              ? 'Time is up! Moving to next question…'
              : `${answeredCount}/${totalActive} answered`}
          </Text>
        </View>

        {/* Mini leaderboard */}
        <View style={styles.miniBoard}>
          <Text style={styles.miniBoardTitle}>LIVE SCORES</Text>
          {playersSorted.slice(0, 5).map((p, i) => (
            <View
              key={p.id}
              style={[styles.miniBoardRow, p.id === playerId && styles.miniBoardRowMe]}
            >
              <Text style={styles.miniBoardRank}>#{i + 1}</Text>
              <Text style={styles.miniBoardEmoji}>{p.emoji}</Text>
              <Text style={styles.miniBoardName} numberOfLines={1}>
                {p.name}
              </Text>
              {p.hasAnswered && <Text style={styles.miniBoardAnswered}>✓</Text>}
              <Text style={styles.miniBoardScore}>{p.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },

  // Countdown
  countdownCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 2,
  },
  countdownNum: { fontSize: 96, fontWeight: '800', color: theme.colors.primary },
  countdownSub: { fontSize: 16, color: theme.colors.textSecondary },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  roundLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
  categoryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1.5,
  },
  timerBox: { alignItems: 'center' },
  timerNum: { fontSize: 28, fontWeight: '800' },
  timerSec: { fontSize: 9, color: theme.colors.textMuted, fontWeight: '600', marginTop: -4 },
  myScoreLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
  myScoreNum: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },

  timerTrack: { flexDirection: 'row', height: 4, backgroundColor: theme.colors.borderLight },
  timerFill: { height: 4, borderRadius: 2 },

  scroll: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 40, gap: 18 },

  questionText: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.3,
  },

  optionsGrid: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceHover,
  },
  optionCorrect: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  optionWrong: { borderColor: theme.colors.error, backgroundColor: '#FEF2F2' },
  optionLetter: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, width: 22 },
  optionLetterCorrect: { color: '#22C55E' },
  optionLetterWrong: { color: theme.colors.error },
  optionText: { flex: 1, fontSize: 14, color: theme.colors.textSecondary },
  optionTextCorrect: { color: '#15803D', fontWeight: '500' },
  optionTextWrong: { color: theme.colors.error },
  checkMark: { color: '#22C55E', fontSize: 16, fontWeight: '700' },
  crossMark: { color: theme.colors.error, fontSize: 14, fontWeight: '700' },

  liveStatus: { alignItems: 'center' },
  liveStatusText: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600' },

  miniBoard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  miniBoardTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  miniBoardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniBoardRowMe: {
    backgroundColor: theme.colors.primarySubtle,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniBoardRank: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, width: 22 },
  miniBoardEmoji: { fontSize: 16 },
  miniBoardName: { flex: 1, fontSize: 13, color: theme.colors.textSecondary },
  miniBoardAnswered: { fontSize: 12, color: '#22C55E', fontWeight: '700' },
  miniBoardScore: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary },
});

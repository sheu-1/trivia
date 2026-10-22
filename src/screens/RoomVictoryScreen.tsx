import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';
import { Room } from '../types';

interface RoomVictoryScreenProps {
  room: Room;
  playerId: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const RoomVictoryScreen: React.FC<RoomVictoryScreenProps> = ({
  room,
  playerId,
  onPlayAgain,
  onHome,
}) => {
  const sorted = Object.values(room.players).sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isWinner = winner?.id === playerId;
  const [pulse] = useState(() => new Animated.Value(1));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.025, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fadeAnim, pulse]);

  const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <Text style={styles.trophyEmoji}>{isWinner ? '🏆' : winner?.emoji ?? '🎖️'}</Text>
          <Text style={styles.overLabel}>GAME OVER</Text>
          <Text style={styles.winnerTitle}>
            {isWinner ? 'You Won!' : `${winner?.name} Wins!`}
          </Text>
          <Text style={styles.metaSub}>
            {room.category} · {room.totalQuestions} Questions
          </Text>
        </Animated.View>

        <Text style={styles.standingsLabel}>FINAL STANDINGS</Text>

        {sorted.map((p, i) => {
          const isMe = p.id === playerId;
          return (
            <View
              key={p.id}
              style={[
                styles.playerCard,
                isMe && styles.playerCardMe,
                i === 0 && styles.playerCardFirst,
              ]}
            >
              <Text style={styles.rankText}>{medals[i] ?? `#${i + 1}`}</Text>
              <Text style={styles.playerEmoji}>{p.emoji}</Text>
              <View style={styles.nameContainer}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {p.name}
                  {isMe ? ' (You)' : ''}
                </Text>
                {p.isHost && <Text style={styles.hostBadge}>HOST</Text>}
              </View>
              <Text style={[styles.scoreText, i === 0 && styles.firstScoreText]}>
                {p.score} pts
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={onPlayAgain}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Play Again →</Text>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity style={styles.homeBtn} onPress={onHome} activeOpacity={0.7}>
          <Text style={styles.homeBtnText}>Main Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: 22, paddingTop: 40, paddingBottom: 140 },
  headerSection: { alignItems: 'center', marginBottom: 32, gap: 6 },
  trophyEmoji: { fontSize: 56, marginBottom: 4 },
  overLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 2.5,
  },
  winnerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
  },
  metaSub: { fontSize: 13, color: theme.colors.textMuted },
  standingsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playerCardMe: {
    backgroundColor: theme.colors.primarySubtle,
    borderColor: theme.colors.primary,
  },
  playerCardFirst: {
    borderColor: '#F59E0B',
  },
  rankText: { fontSize: 18, width: 28, textAlign: 'center' },
  playerEmoji: { fontSize: 22 },
  nameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  hostBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  firstScoreText: {
    color: '#D97706',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 22,
    paddingVertical: 16,
    gap: 10,
  },
  primaryActionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryActionText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  homeBtn: { paddingVertical: 8, alignItems: 'center' },
  homeBtnText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
});

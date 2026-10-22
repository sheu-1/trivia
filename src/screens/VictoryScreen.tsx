import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Contestant } from '../types';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';

interface VictoryScreenProps {
  winner: Contestant;
  playerContestant: Contestant;
  finalLeaderboard: { contestant: Contestant; score: number }[];
  onPlayAgain: () => void;
  onHome: () => void;
}

// Individual animated leaderboard row
const LeaderRow: React.FC<{
  contestant: Contestant;
  score: number;
  rank: number;
  isPlayer: boolean;
  isWinner: boolean;
  delay: number;
}> = ({ contestant, score, rank, isPlayer, isWinner, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(isWinner ? 0.88 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, useNativeDriver: true, tension: 80, friction: 10 }),
      ...(isWinner
        ? [Animated.spring(scaleAnim, { toValue: 1, delay: delay + 80, useNativeDriver: true, tension: 60, friction: 8 })]
        : []),
    ]).start();
  }, []);

  const medalMap: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const medal = medalMap[rank] ?? null;

  return (
    <Animated.View
      style={[
        styles.row,
        isPlayer && styles.playerRow,
        isWinner && styles.winnerRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.rankNum}>{medal ?? `#${rank}`}</Text>
      <Text style={styles.rowEmoji}>{contestant.emoji}</Text>
      <Text style={[styles.rowName, isPlayer && styles.playerName]} numberOfLines={1}>
        {isPlayer ? `${contestant.job} (You)` : contestant.job}
      </Text>
      <Text style={[styles.scoreText, isWinner && styles.winnerScore]}>{score} pts</Text>
    </Animated.View>
  );
};

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winner,
  playerContestant,
  finalLeaderboard,
  onPlayAgain,
  onHome,
}) => {
  const isPlayerWinner = winner.id === playerContestant.id || winner.isPlayer;
  const playerRank = finalLeaderboard.findIndex((e) => e.contestant.id === playerContestant.id) + 1;

  // Hero entrance
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;

  // Button pulse
  const btnPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hero pop
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();

    // Button pulse loop
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.025, duration: 850, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero block */}
        <Animated.View style={[styles.heroBlock, { opacity: heroFade, transform: [{ scale: heroScale }] }]}>
          <Text style={styles.heroEmoji}>{isPlayerWinner ? '🏆' : winner.emoji}</Text>
          <Text style={styles.eyebrow}>TOURNAMENT COMPLETE</Text>
          <Text style={styles.headline}>
            {isPlayerWinner ? 'You Won!' : `${winner.emoji} Wins`}
          </Text>
          <Text style={styles.subtext}>
            {isPlayerWinner
              ? 'Gauntlet conquered. Grand prize secured.'
              : `${winner.name} outlasted all 10 contestants.`}
          </Text>
          {!isPlayerWinner && playerRank > 0 && (
            <View style={styles.yourRankPill}>
              <Text style={styles.yourRankText}>Your rank: #{playerRank}</Text>
            </View>
          )}
        </Animated.View>

        {/* Leaderboard */}
        <View style={styles.standingsSection}>
          <Text style={styles.sectionLabel}>FINAL STANDINGS</Text>
          <View style={styles.list}>
            {finalLeaderboard.map((item, index) => (
              <LeaderRow
                key={item.contestant.id}
                contestant={item.contestant}
                score={item.score}
                rank={index + 1}
                isPlayer={item.contestant.id === playerContestant.id}
                isWinner={index === 0}
                delay={index * 55}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => { soundManager.playClick(); onPlayAgain(); }}
          >
            <Text style={styles.primaryBtnText}>Play Again →</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.7}
          onPress={() => { soundManager.playClick(); onHome(); }}
        >
          <Text style={styles.secondaryBtnText}>Main Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 22, paddingTop: 40, paddingBottom: 150 },

  // Hero
  heroBlock: { alignItems: 'center', marginBottom: 40, gap: 6 },
  heroEmoji: { fontSize: 52, marginBottom: 8 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: theme.colors.primary, letterSpacing: 2.5 },
  headline: { fontSize: 42, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -1.2, textAlign: 'center' },
  subtext: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  yourRankPill: {
    marginTop: 6, backgroundColor: theme.colors.primarySubtle,
    borderRadius: theme.borderRadius.full, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: theme.colors.borderActive,
  },
  yourRankText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },

  // Standings
  standingsSection: {},
  sectionLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  list: { gap: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
    paddingHorizontal: 12, borderRadius: theme.borderRadius.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  playerRow: { backgroundColor: theme.colors.primarySubtle },
  winnerRow: {
    backgroundColor: '#FFFBEB', borderWidth: 1.5,
    borderColor: '#F59E0B', borderBottomWidth: 1.5,
  },
  rankNum: { width: 32, fontSize: 16, textAlign: 'center' },
  rowEmoji: { fontSize: 18, marginRight: 10 },
  rowName: { flex: 1, fontSize: 13, color: theme.colors.textSecondary },
  playerName: { color: theme.colors.textPrimary, fontWeight: '600' },
  scoreText: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, fontVariant: ['tabular-nums'] },
  winnerScore: { color: '#D97706' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border,
    paddingHorizontal: 22, paddingVertical: 16, gap: 10,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  secondaryBtn: { paddingVertical: 8, alignItems: 'center' },
  secondaryBtnText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
});

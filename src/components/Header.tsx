import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface HeaderProps {
  roundName: string;
  roundNumber: number;
  questionIndex: number;
  totalQuestions: number;
  prizePool?: string;
  score?: number;
  onExit?: () => void;
  onLeaderboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roundNumber,
  questionIndex,
  totalQuestions,
  score = 0,
  onExit,
  onLeaderboard,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Minimal back/exit */}
      <TouchableOpacity onPress={onExit} style={styles.exitBtn} activeOpacity={0.7}>
        <Text style={styles.exitText}>✕</Text>
      </TouchableOpacity>

      {/* Center: Clean round & question tracker */}
      <View style={styles.centerMeta}>
        <Text style={styles.roundMeta}>
          ROUND {roundNumber} <Text style={styles.dot}>•</Text> {questionIndex + 1} OF {totalQuestions}
        </Text>
      </View>

      {/* Right: Score / Leaderboard button */}
      <TouchableOpacity onPress={onLeaderboard} style={styles.scoreTrigger} activeOpacity={0.7}>
        <Text style={styles.scoreVal}>{score}</Text>
        <Text style={styles.ptsLabel}>PTS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  exitBtn: {
    padding: 6,
    width: 36,
  },
  exitText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '300',
  },
  centerMeta: {
    alignItems: 'center',
  },
  roundMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  dot: {
    color: theme.colors.textMuted,
  },
  scoreTrigger: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    width: 50,
    justifyContent: 'flex-end',
  },
  scoreVal: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  ptsLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
});

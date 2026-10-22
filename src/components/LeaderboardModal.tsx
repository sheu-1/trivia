import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Contestant, ContestantRoundState } from '../types';
import { theme } from '../theme';

interface LeaderboardModalProps {
  visible: boolean;
  contestants: Contestant[];
  roundStates: Record<string, ContestantRoundState>;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  visible,
  contestants,
  roundStates,
  onClose,
}) => {
  const sortedContestants = [...contestants].sort((a, b) => {
    const scoreA = roundStates[a.id]?.score || 0;
    const scoreB = roundStates[b.id]?.score || 0;
    return scoreB - scoreA;
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Standings</Text>
              <Text style={styles.sheetSubtitle}>Current tournament scores</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {sortedContestants.map((c, index) => {
              const state = roundStates[c.id];
              const score = state?.score || 0;
              const isEliminated = state?.isEliminated;
              const isPlayer = c.isPlayer;

              return (
                <View
                  key={c.id}
                  style={[
                    styles.rankRow,
                    isPlayer && styles.playerRankRow,
                    isEliminated && styles.eliminatedRankRow,
                  ]}
                >
                  <Text style={styles.rankNum}>#{index + 1}</Text>
                  <Text style={styles.emoji}>{c.emoji}</Text>

                  <View style={styles.nameBlock}>
                    <Text style={[styles.jobText, isPlayer && styles.playerJobText]}>
                      {isPlayer ? `${c.job} (You)` : c.job}
                    </Text>
                  </View>

                  {isEliminated ? (
                    <Text style={styles.cutText}>OUT</Text>
                  ) : (
                    <Text style={styles.scoreText}>{score} PTS</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.doneBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    marginBottom: 20,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  playerRankRow: {},
  eliminatedRankRow: {
    opacity: 0.3,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    width: 32,
  },
  emoji: {
    fontSize: 16,
    marginRight: 12,
  },
  nameBlock: {
    flex: 1,
  },
  jobText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  playerJobText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cutText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.error,
    letterSpacing: 1,
  },
  doneBtn: {
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Contestant } from '../types';
import { theme } from '../theme';

interface EliminationModalProps {
  visible: boolean;
  roundNumber: number;
  eliminatedContestants: Contestant[];
  playerEliminated: boolean;
  playerRank: number;
  onContinue: () => void;
}

export const EliminationModal: React.FC<EliminationModalProps> = ({
  visible,
  roundNumber,
  eliminatedContestants,
  playerEliminated,
  playerRank,
  onContinue,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.metaLabel}>ROUND {roundNumber} CUT</Text>

          <Text style={styles.title}>
            {playerEliminated ? 'Eliminated' : 'Round Survived'}
          </Text>

          <Text style={styles.subtitle}>
            {playerEliminated
              ? `You fell into the bottom tier and have been cut from the studio.`
              : `Advancing to the next round. Currently ranked #${playerRank}.`}
          </Text>

          {/* List of eliminated professions */}
          <View style={styles.cutList}>
            <Text style={styles.listHeader}>DEPARTING CONTESTANTS</Text>
            {eliminatedContestants.map((c) => (
              <View key={c.id} style={styles.cutRow}>
                <Text style={styles.cutEmoji}>{c.emoji}</Text>
                <Text style={styles.cutJob}>{c.job}</Text>
                <Text style={styles.cutStatus}>OUT</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>
              {playerEliminated ? 'VIEW FINAL STANDINGS →' : 'CONTINUE →'}
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 24,
  },
  cutList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    marginBottom: 28,
    gap: 8,
  },
  listHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  cutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cutEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  cutJob: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  cutStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.error,
    letterSpacing: 1,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Contestant, ContestantRoundState, Question } from '../types';
import { theme } from '../theme';

interface ContestantRosterGridProps {
  contestants: Contestant[];
  roundStates: Record<string, ContestantRoundState>;
  isRevealed: boolean;
  activeQuestion: Question;
  onSelectContestant?: (contestant: Contestant) => void;
  selectedContestantId?: string | null;
}

export const ContestantRosterGrid: React.FC<ContestantRosterGridProps> = ({
  contestants,
  roundStates,
  isRevealed,
  activeQuestion,
  onSelectContestant,
}) => {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {contestants.map((contestant) => {
          const state = roundStates[contestant.id] || {
            contestantId: contestant.id,
            selectedOptionIndex: null,
            hasLockedIn: false,
            score: 0,
            isEliminated: false,
          };

          const isEliminated = state.isEliminated;
          const isPlayer = contestant.isPlayer;
          const hasLockedIn = state.hasLockedIn;

          const isCorrect =
            isRevealed &&
            state.selectedOptionIndex !== null &&
            state.selectedOptionIndex === activeQuestion.correctIndex;

          const chosenLetter =
            state.selectedOptionIndex !== null
              ? letters[state.selectedOptionIndex]
              : null;

          return (
            <TouchableOpacity
              key={contestant.id}
              activeOpacity={0.7}
              onPress={() => onSelectContestant && onSelectContestant(contestant)}
              style={[
                styles.item,
                isEliminated && styles.itemEliminated,
                isPlayer && styles.playerItem,
              ]}
            >
              {/* Main Avatar / Reveal Token */}
              <View
                style={[
                  styles.token,
                  hasLockedIn && !isRevealed && styles.tokenLocked,
                  isRevealed && isCorrect && styles.tokenCorrect,
                  isRevealed && !isCorrect && chosenLetter !== null && styles.tokenWrong,
                ]}
              >
                {isEliminated ? (
                  <Text style={styles.eliminatedSlash}>✕</Text>
                ) : isRevealed && chosenLetter ? (
                  <Text style={styles.revealedLetter}>{chosenLetter}</Text>
                ) : (
                  <Text style={styles.emoji}>{contestant.emoji}</Text>
                )}

                {/* Subtle Lock-in indicator dot */}
                {hasLockedIn && !isRevealed && !isEliminated && (
                  <View style={styles.lockedDot} />
                )}
              </View>

              {/* Minimal Career Label */}
              <Text
                style={[
                  styles.label,
                  isPlayer && styles.playerLabel,
                  isEliminated && styles.eliminatedLabel,
                ]}
                numberOfLines={1}
              >
                {isPlayer ? 'You' : contestant.job.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollList: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    width: 44,
  },
  itemEliminated: {
    opacity: 0.25,
  },
  playerItem: {},
  token: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    position: 'relative',
  },
  tokenLocked: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceHover,
  },
  tokenCorrect: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successBg,
  },
  tokenWrong: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorBg,
  },
  emoji: {
    fontSize: 16,
  },
  revealedLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  eliminatedSlash: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  lockedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 44,
  },
  playerLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  eliminatedLabel: {
    color: theme.colors.textFaint,
  },
});

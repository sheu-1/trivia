import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Question } from '../types';
import { theme } from '../theme';

interface AnswerOptionsProps {
  question: Question;
  selectedIndex: number | null;
  onSelectOption: (index: number) => void;
  isRevealed: boolean;
  disabled?: boolean;
}

const letters = ['A', 'B', 'C', 'D'];

// Each answer option animates in with a staggered slide + press-scale
const AnswerOption: React.FC<{
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isRevealed: boolean;
  disabled: boolean;
  onSelect: () => void;
  questionKey: string;
}> = ({ option, index, isSelected, isCorrect, isWrong, isRevealed, disabled, onSelect, questionKey }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Re-animate whenever the question changes
  useEffect(() => {
    slideAnim.setValue(20);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 60, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }, [questionKey]);

  // Pop when selected
  useEffect(() => {
    if (isSelected && !isRevealed) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true, speed: 50 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    }
  }, [isSelected]);

  const onPressIn = () => {
    if (!disabled && !isRevealed) {
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
    }
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled || isRevealed}
        onPress={onSelect}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.optionRow,
          isSelected && !isRevealed && styles.selectedRow,
          isCorrect && styles.correctRow,
          isWrong && styles.wrongRow,
        ]}
      >
        <Text
          style={[
            styles.letter,
            isSelected && !isRevealed && styles.selectedLetter,
            isCorrect && styles.correctLetter,
            isWrong && styles.wrongLetter,
          ]}
        >
          {letters[index]}
        </Text>

        <Text
          style={[
            styles.optionText,
            isSelected && !isRevealed && styles.selectedText,
            isCorrect && styles.correctText,
            isWrong && styles.wrongText,
          ]}
        >
          {option}
        </Text>

        {isSelected && !isRevealed && (
          <View style={styles.lockedPill}>
            <Text style={styles.lockedText}>LOCKED</Text>
          </View>
        )}
        {isCorrect && <Text style={styles.resultCheck}>✓</Text>}
        {isWrong && <Text style={styles.resultCross}>✕</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  selectedIndex,
  onSelectOption,
  isRevealed,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {question.options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = isRevealed && index === question.correctIndex;
        const isWrong = isRevealed && isSelected && index !== question.correctIndex;
        return (
          <AnswerOption
            key={index}
            option={option}
            index={index}
            isSelected={isSelected}
            isCorrect={isCorrect}
            isWrong={isWrong}
            isRevealed={isRevealed}
            disabled={disabled}
            onSelect={() => onSelectOption(index)}
            questionKey={question.id}
          />
        );
      })}

      {isRevealed && question.explanation ? (
        <Animated.View style={styles.explanationWrapper}>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, gap: 10, marginTop: 4 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    paddingVertical: 18, paddingHorizontal: 20, borderWidth: 1, borderColor: theme.colors.border,
  },
  selectedRow: { borderColor: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceHover },
  correctRow: { borderColor: theme.colors.success, backgroundColor: theme.colors.successBg },
  wrongRow: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
  letter: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, width: 28 },
  selectedLetter: { color: theme.colors.textPrimary },
  correctLetter: { color: theme.colors.success },
  wrongLetter: { color: theme.colors.error },
  optionText: { flex: 1, fontSize: 15, fontWeight: '400', color: theme.colors.textSecondary, lineHeight: 21 },
  selectedText: { color: theme.colors.textPrimary, fontWeight: '500' },
  correctText: { color: theme.colors.success, fontWeight: '500' },
  wrongText: { color: theme.colors.error },
  lockedPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: theme.colors.primary },
  lockedText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
  resultCheck: { color: theme.colors.success, fontSize: 15, fontWeight: '700' },
  resultCross: { color: theme.colors.error, fontSize: 13, fontWeight: '700' },
  explanationWrapper: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border },
  explanationText: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 20 },
});

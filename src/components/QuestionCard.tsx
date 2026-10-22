import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Question } from '../types';
import { theme } from '../theme';

interface QuestionCardProps {
  question: Question;
  points: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, points }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Slide in fresh on each new question
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(-10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 10 }),
    ]).start();
  }, [question.id]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.metaRow}>
        <Text style={styles.categoryText}>{question.category.toUpperCase()}</Text>
        <Text style={styles.metaDivider}>·</Text>
        <Text style={styles.pointsText}>{points} PTS</Text>
        {question.specialtyTag && (
          <>
            <Text style={styles.metaDivider}>·</Text>
            <Text style={styles.specialtyText}>FAVORS {question.specialtyTag.toUpperCase()}</Text>
          </>
        )}
      </View>
      <Text style={styles.questionText}>{question.question}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  categoryText: { fontSize: 10, fontWeight: '700', color: theme.colors.accent, letterSpacing: 1.5 },
  metaDivider: { fontSize: 10, color: theme.colors.textMuted },
  pointsText: { fontSize: 10, fontWeight: '600', color: theme.colors.textMuted, letterSpacing: 1 },
  specialtyText: { fontSize: 10, fontWeight: '600', color: theme.colors.textMuted, letterSpacing: 0.8 },
  questionText: { fontSize: 23, fontWeight: '400', lineHeight: 33, color: theme.colors.textPrimary, letterSpacing: -0.4 },
});

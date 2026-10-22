import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Question, ShowdownTheme } from '../types';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';

interface CategoryCreatorScreenProps {
  onSaveCategory: (newTheme: ShowdownTheme, customQuestions: Question[]) => void;
  onBack: () => void;
}

export const CategoryCreatorScreen: React.FC<CategoryCreatorScreenProps> = ({
  onSaveCategory,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [sideAName, setSideAName] = useState('');
  const [sideAEmoji, setSideAEmoji] = useState('🔴');
  const [sideBName, setSideBName] = useState('');
  const [sideBEmoji, setSideBEmoji] = useState('🔵');

  // Custom question builder
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQText, setCurrentQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');

  const emojiOptions = ['🔥', '⚡', '🎓', '👾', '🎬', '🏆', '🍕', '🚀', '💡', '🌟', '🎧', '⚽'];

  const handleAddQuestion = () => {
    if (!currentQText.trim()) {
      Alert.alert('Missing Field', 'Please enter a question prompt.');
      return;
    }
    if (!opt0.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim()) {
      Alert.alert('Missing Options', 'Please fill in all 4 answer choices.');
      return;
    }

    soundManager.playLockIn();
    const newQ: Question = {
      id: `custom_q_${Date.now()}_${questions.length}`,
      category: 'Custom',
      difficulty: questions.length >= 3 ? 'hard' : 'medium',
      question: currentQText.trim(),
      options: [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()],
      correctIndex: correctIdx,
      explanation: explanation.trim() || 'Custom user question verified.',
      battleTheme: 'custom',
    };

    setQuestions((prev) => [...prev, newQ]);
    // Clear question form
    setCurrentQText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setCorrectIdx(0);
    setExplanation('');
  };

  const handleQuickFillShowdown = (presetName: string) => {
    soundManager.playClick();
    if (presetName === 'millennials_genz') {
      setTitle('Millennials vs Gen Z');
      setEmoji('⚡');
      setDescription('90s/2000s tech & culture vs short-form video & modern internet trends.');
      setSideAName('Millennials');
      setSideAEmoji('📼');
      setSideBName('Gen Z');
      setSideBEmoji('📱');
    } else if (presetName === 'students_teachers') {
      setTitle('Students vs Teachers');
      setEmoji('🎓');
      setDescription('Academic curriculum, historical milestones, literature, and school trivia.');
      setSideAName('Students');
      setSideAEmoji('🎒');
      setSideBName('Teachers');
      setSideBEmoji('👩‍🏫');
    } else if (presetName === 'coffee_tea') {
      setTitle('Coffee vs Tea Lovers');
      setEmoji('☕');
      setDescription('Global bean varieties, artisanal tea traditions, cafe culture & caffeine lore.');
      setSideAName('Baristas');
      setSideAEmoji('☕');
      setSideBName('Tea Masters');
      setSideBEmoji('🍵');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your custom category.');
      return;
    }

    soundManager.playLockIn();
    const themeId = `custom_${Date.now()}`;
    const newTheme: ShowdownTheme = {
      id: themeId,
      title: title.trim(),
      badge: 'CUSTOM CATEGORY',
      emoji: emoji || '🌟',
      tagline: `${sideAName || 'Side A'} vs ${sideBName || 'Side B'}`,
      description: description.trim() || 'Custom general knowledge battle created by the community.',
      sideA: { name: sideAName.trim() || 'Team A', emoji: sideAEmoji, color: '#3B82F6' },
      sideB: { name: sideBName.trim() || 'Team B', emoji: sideBEmoji, color: '#8B5CF6' },
      defaultQuestionFilter: 'custom',
      isCustom: true,
    };

    onSaveCategory(newTheme, questions);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← CANCEL</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>CREATE CATEGORY</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveNavBtn} activeOpacity={0.7}>
          <Text style={styles.saveNavText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>Custom Trivia Category</Text>
          <Text style={styles.subtitle}>
            Create your own custom theme or battle showdown — like Millennials vs Gen Z, Students vs Teachers, or anything you imagine!
          </Text>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          <Text style={styles.presetLabel}>QUICK TEMPLATES:</Text>
          <View style={styles.templatePills}>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => handleQuickFillShowdown('millennials_genz')}
            >
              <Text style={styles.pillText}>⚡ Millennial vs Gen Z</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => handleQuickFillShowdown('students_teachers')}
            >
              <Text style={styles.pillText}>🎓 Student vs Teacher</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pill}
              onPress={() => handleQuickFillShowdown('coffee_tea')}
            >
              <Text style={styles.pillText}>☕ Coffee vs Tea</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Details Form */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>CATEGORY INFORMATION</Text>

          <Text style={styles.label}>CATEGORY TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Millennials vs Gen Z, Gamers vs Cinephiles"
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>CHOOSE EMOJI ICON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiList}>
            {emojiOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.emojiBtn, emoji === item && styles.selectedEmojiBtn]}
                onPress={() => setEmoji(item)}
              >
                <Text style={styles.emojiIcon}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 14 }]}>SHORT DESCRIPTION</Text>
          <TextInput
            style={[styles.input, { height: 64 }]}
            placeholder="Describe the showdown or topic..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Rival Sides */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>THE TWO RIVAL FACTIONS (OPTIONAL)</Text>
          <View style={styles.twoSidesRow}>
            <View style={styles.sideCol}>
              <Text style={styles.label}>SIDE A NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Millennials"
                placeholderTextColor={theme.colors.textMuted}
                value={sideAName}
                onChangeText={setSideAName}
              />
            </View>
            <View style={styles.sideCol}>
              <Text style={styles.label}>SIDE B NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Gen Z"
                placeholderTextColor={theme.colors.textMuted}
                value={sideBName}
                onChangeText={setSideBName}
              />
            </View>
          </View>
        </View>

        {/* Add Questions Section */}
        <View style={styles.card}>
          <View style={styles.qHeaderRow}>
            <Text style={styles.sectionHeading}>ADD CUSTOM QUESTIONS</Text>
            <View style={styles.qCountBadge}>
              <Text style={styles.qCountText}>{questions.length} ADDED</Text>
            </View>
          </View>

          <Text style={styles.label}>QUESTION PROMPT</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your trivia question here..."
            placeholderTextColor={theme.colors.textMuted}
            value={currentQText}
            onChangeText={setCurrentQText}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>OPTIONS (TAP RADIO TO MARK CORRECT)</Text>
          {[
            { val: opt0, setVal: setOpt0, idx: 0, letter: 'A' },
            { val: opt1, setVal: setOpt1, idx: 1, letter: 'B' },
            { val: opt2, setVal: setOpt2, idx: 2, letter: 'C' },
            { val: opt3, setVal: setOpt3, idx: 3, letter: 'D' },
          ].map((item) => (
            <View key={item.idx} style={styles.optionInputRow}>
              <TouchableOpacity
                style={[styles.correctIndicator, correctIdx === item.idx && styles.correctIndicatorActive]}
                onPress={() => setCorrectIdx(item.idx)}
              >
                <Text
                  style={[
                    styles.correctIndicatorText,
                    correctIdx === item.idx && styles.correctIndicatorTextActive,
                  ]}
                >
                  {item.letter}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.optionInput]}
                placeholder={`Option ${item.letter}`}
                placeholderTextColor={theme.colors.textMuted}
                value={item.val}
                onChangeText={item.setVal}
              />
            </View>
          ))}

          <Text style={[styles.label, { marginTop: 14 }]}>EXPLANATION / TRIVIA FACT</Text>
          <TextInput
            style={styles.input}
            placeholder="Why is this answer correct?"
            placeholderTextColor={theme.colors.textMuted}
            value={explanation}
            onChangeText={setExplanation}
          />

          <TouchableOpacity style={styles.addQuestionBtn} activeOpacity={0.8} onPress={handleAddQuestion}>
            <Text style={styles.addQuestionBtnText}>+ ADD THIS QUESTION TO POOL</Text>
          </TouchableOpacity>
        </View>

        {/* List of Added Questions */}
        {questions.length > 0 && (
          <View style={styles.questionsList}>
            <Text style={styles.sectionHeading}>CURRENT QUESTION QUEUE ({questions.length})</Text>
            {questions.map((q, idx) => (
              <View key={q.id} style={styles.questionItem}>
                <Text style={styles.qItemNum}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qItemTitle}>{q.question}</Text>
                  <Text style={styles.qItemCorrect}>
                    Correct: {q.options[q.correctIndex]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Save Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE & PLAY CATEGORY →</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  screenTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  saveNavBtn: {
    paddingVertical: 4,
  },
  saveNavText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
    gap: 16,
  },
  headerBlock: {
    marginBottom: 4,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  presetsRow: {
    marginBottom: 6,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 1,
    marginBottom: 8,
  },
  templatePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  emojiList: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedEmojiBtn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  emojiIcon: {
    fontSize: 20,
  },
  twoSidesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sideCol: {
    flex: 1,
  },
  qHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  qCountBadge: {
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  correctIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctIndicatorActive: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success,
  },
  correctIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  correctIndicatorTextActive: {
    color: '#FFFFFF',
  },
  optionInput: {
    flex: 1,
  },
  addQuestionBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderActive,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addQuestionBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  questionsList: {
    gap: 10,
  },
  questionItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    gap: 10,
  },
  qItemNum: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  qItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  qItemCorrect: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

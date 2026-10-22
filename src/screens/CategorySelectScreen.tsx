import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
} from 'react-native';
import { CONTESTANTS } from '../data/contestants';
import { SHOWDOWN_THEMES } from '../data/questions';
import { Contestant, ShowdownTheme, Question } from '../types';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';

interface CategorySelectScreenProps {
  onConfirmSetup: (
    playerContestant: Contestant,
    opponentContestants: Contestant[],
    selectedTheme: ShowdownTheme,
    questions: Question[]
  ) => void;
  availableThemes?: ShowdownTheme[];
  customQuestionsMap?: Record<string, Question[]>;
  onOpenCategoryCreator: () => void;
  onBack: () => void;
}

// Animated theme card with press-scale + selection pop
const ThemeCard: React.FC<{
  t: ShowdownTheme;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}> = ({ t, isSelected, onSelect, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 45, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 45, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }, []);

  // Pop animation on selection
  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true, speed: 40 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    }
  }, [isSelected]);

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.themeCard, isSelected && styles.themeCardActive]}
        activeOpacity={1}
        onPress={() => { soundManager.playClick(); onSelect(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.themeCardTop}>
          <View style={styles.themeBadgeContainer}>
            <Text style={styles.themeBadgeText}>{t.badge}</Text>
          </View>
          <View style={[styles.radioDot, isSelected && styles.radioDotActive]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>

        <View style={styles.themeTitleRow}>
          <Text style={styles.themeEmoji}>{t.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.themeTitle, isSelected && styles.themeTitleActive]}>{t.title}</Text>
            <Text style={styles.themeTagline}>{t.tagline}</Text>
          </View>
        </View>

        {t.sideA && t.sideB && (
          <View style={styles.sidesRow}>
            <View style={styles.sidePill}>
              <Text style={styles.sideEmoji}>{t.sideA.emoji}</Text>
              <Text style={styles.sideName}>{t.sideA.name}</Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.sidePill}>
              <Text style={styles.sideEmoji}>{t.sideB.emoji}</Text>
              <Text style={styles.sideName}>{t.sideB.name}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CategorySelectScreen: React.FC<CategorySelectScreenProps> = ({
  onConfirmSetup,
  availableThemes = SHOWDOWN_THEMES,
  customQuestionsMap = {},
  onOpenCategoryCreator,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'topics' | 'battles'>('all');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(availableThemes[0]?.id || 'general_all');
  const [playerName, setPlayerName] = useState('Alex');
  const [playerRole, setPlayerRole] = useState('Trivia Explorer');
  const [playerEmoji, setPlayerEmoji] = useState('🌟');
  const [selectedFaction, setSelectedFaction] = useState('General');

  const currentTheme = availableThemes.find((t) => t.id === selectedThemeId) || availableThemes[0];
  const emojiList = ['🌟', '🎲', '📜', '🧪', '🔭', '💡', '🏛️', '🧬', '🏆', '🎬', '⚡', '🎓', '🚀', '☕'];

  const displayedThemes = availableThemes.filter((t) => {
    if (activeTab === 'topics') return t.categoryType === 'topic' || !t.categoryType;
    if (activeTab === 'battles') return t.categoryType === 'battle';
    return true;
  });

  const handleStart = () => {
    soundManager.playLockIn();
    const playerContestant: Contestant = {
      id: 'player_main',
      name: playerName.trim() ? `${playerName.trim()} (You)` : 'You',
      job: playerRole.trim() || 'General Player',
      emoji: playerEmoji,
      bio: `Competing in ${currentTheme.title}.`,
      quote: 'Knowledge belongs to everyone.',
      specialties: ['General', 'Science'],
      weaknesses: [],
      baseAccuracy: 0.85,
      color: theme.colors.primary,
      isPlayer: true,
      faction: selectedFaction,
    };
    const opponents = CONTESTANTS.slice(0, 9);
    const themeQuestions = customQuestionsMap[currentTheme.id] || [];
    onConfirmSetup(playerContestant, opponents, currentTheme, themeQuestions);
  };

  // Tab switch scale
  const tabScales = { all: useRef(new Animated.Value(1)).current, topics: useRef(new Animated.Value(1)).current, battles: useRef(new Animated.Value(1)).current };
  const switchTab = (tab: 'all' | 'topics' | 'battles') => {
    soundManager.playClick();
    Animated.sequence([
      Animated.spring(tabScales[tab], { toValue: 0.9, useNativeDriver: true, speed: 50 }),
      Animated.spring(tabScales[tab], { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    setActiveTab(tab);
  };

  // Button pulse
  const btnPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.02, duration: 800, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>PICK A CATEGORY</Text>
        <TouchableOpacity onPress={onOpenCategoryCreator} activeOpacity={0.7}>
          <Text style={styles.createText}>+ Custom</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Filter tabs */}
        <View style={styles.tabsContainer}>
          {(['all', 'topics', 'battles'] as const).map((tab) => (
            <Animated.View key={tab} style={{ transform: [{ scale: tabScales[tab] }], flex: 1 }}>
              <TouchableOpacity
                style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                onPress={() => switchTab(tab)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'all' ? 'All' : tab === 'topics' ? 'Subjects' : 'Battles'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Theme cards */}
        <View style={styles.themesList}>
          {displayedThemes.map((t, i) => (
            <ThemeCard
              key={t.id}
              t={t}
              index={i}
              isSelected={t.id === selectedThemeId}
              onSelect={() => {
                setSelectedThemeId(t.id);
                if (t.sideA) setSelectedFaction(t.sideA.name);
              }}
            />
          ))}
        </View>

        {/* Player Profile */}
        <View style={styles.profileCard}>
          <Text style={styles.sectionLabel}>YOUR PROFILE</Text>

          <Text style={styles.inputLabel}>NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Alex, Jordan, Sam…"
            placeholderTextColor={theme.colors.textMuted}
            value={playerName}
            onChangeText={setPlayerName}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>TITLE (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="History Buff, Science Nerd…"
            placeholderTextColor={theme.colors.textMuted}
            value={playerRole}
            onChangeText={setPlayerRole}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>AVATAR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
            {emojiList.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.avatarBubble, playerEmoji === e && styles.avatarBubbleActive]}
                onPress={() => { soundManager.playClick(); setPlayerEmoji(e); }}
              >
                <Text style={styles.avatarEmoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Launch bar */}
      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
          <TouchableOpacity style={styles.enterButton} activeOpacity={0.85} onPress={handleStart}>
            <Text style={styles.enterButtonText}>
              {currentTheme.emoji}  PLAY {currentTheme.title.toUpperCase()} →
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },

  topNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  screenTitle: { fontSize: 11, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: 1.5 },
  createText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 110, gap: 16 },

  // Tabs
  tabsContainer: { flexDirection: 'row', gap: 8 },
  tabPill: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full, paddingVertical: 9, alignItems: 'center',
  },
  tabPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // Cards
  themesList: { gap: 10 },
  themeCard: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  themeCardActive: { borderColor: theme.colors.primary, borderWidth: 2 },
  themeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  themeBadgeContainer: { backgroundColor: theme.colors.surfaceSubtle, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  themeBadgeText: { fontSize: 9, fontWeight: '700', color: theme.colors.accent, letterSpacing: 0.8 },
  radioDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  radioDotActive: { borderColor: theme.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  themeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeEmoji: { fontSize: 24 },
  themeTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: -0.2 },
  themeTitleActive: { color: theme.colors.primary },
  themeTagline: { fontSize: 11, color: theme.colors.textMuted, marginTop: 1 },
  sidesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  sidePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceSubtle, borderRadius: theme.borderRadius.full, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  sideEmoji: { fontSize: 13 },
  sideName: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },
  vsText: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted },

  // Profile
  profileCard: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 12 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginBottom: 5 },
  textInput: {
    backgroundColor: theme.colors.surfaceSubtle, borderRadius: theme.borderRadius.sm,
    borderWidth: 1, borderColor: theme.colors.border,
    color: theme.colors.textPrimary, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14,
  },
  avatarScroll: { flexDirection: 'row', marginTop: 2 },
  avatarBubble: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  avatarBubbleActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySubtle },
  avatarEmoji: { fontSize: 20 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  enterButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm, paddingVertical: 15, alignItems: 'center' },
  enterButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});

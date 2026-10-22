import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';
import { SHOWDOWN_THEMES } from '../data/questions';

interface HomeScreenProps {
  onStartGauntlet: () => void;
  onStartDuel: () => void;
  onStartPassPlay: () => void;
  onOpenCategoryCreator: () => void;
  onStartRoom: () => void;
  userName?: string;
  userEmoji?: string;
  userRole?: string;
}

// Animated category card with press-scale feedback
const CategoryChip: React.FC<{
  item: (typeof SHOWDOWN_THEMES)[0];
  onPress: () => void;
  delay: number;
}> = ({ item, onPress, delay }) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(18));
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 340,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}
    >
      <TouchableOpacity
        style={styles.chipCard}
        activeOpacity={1}
        onPress={() => {
          soundManager.playClick();
          onPress();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text style={styles.chipEmoji}>{item.emoji}</Text>
        <Text style={styles.chipTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.categoryType === 'battle' && (
          <View style={styles.chipBattlePill}>
            <Text style={styles.chipBattlePillText}>BATTLE</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Pulsing primary CTA button
const PulseButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: Animated.multiply(pulseAnim, scaleAnim) }] }}>
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={1}
        onPress={() => {
          soundManager.playClick();
          onPress();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.primaryTopRow}>
          <Text style={styles.primaryTag}>10-PLAYER GAUNTLET</Text>
          <Text style={styles.primaryPrize}>$1,000</Text>
        </View>
        <Text style={styles.primaryTitle}>Enter the Arena</Text>
        <Text style={styles.primaryMeta}>4 Rounds · Lock-In & Reveal · Elimination</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartGauntlet,
  onStartDuel,
  onStartPassPlay,
  onOpenCategoryCreator,
  onStartRoom,
  userName = 'Alex',
  userEmoji = '🌟',
  userRole = 'Trivia Explorer',
}) => {
  const [heroFade] = useState(() => new Animated.Value(0));
  const [heroSlide] = useState(() => new Animated.Value(-12));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
    ]).start();
  }, [heroFade, heroSlide]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}
        >
          <View style={styles.profileRow}>
            <View style={styles.userBadge}>
              <Text style={styles.userEmoji}>{userEmoji}</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.customPill}
              onPress={() => {
                soundManager.playClick();
                onOpenCategoryCreator();
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.customPillText}>+ Custom</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.eyebrow}>TRIVIA SHOWDOWN</Text>
          <Text style={styles.heroTitle}>Battle of{'\n'}Knowledge</Text>
          <Text style={styles.heroSub}>Anyone. Any topic. Compete live with friends.</Text>
        </Animated.View>

        {/* Category chips */}
        <View>
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {SHOWDOWN_THEMES.map((t, i) => (
              <CategoryChip
                key={t.id}
                item={t}
                delay={i * 45}
                onPress={onStartGauntlet}
              />
            ))}
          </ScrollView>
        </View>

        {/* Main CTA: 10-Player Solo Gauntlet */}
        <PulseButton onPress={onStartGauntlet} />

        {/* Game Modes (2x2 Grid with Live Room featured) */}
        <View>
          <Text style={styles.sectionLabel}>MORE GAME MODES</Text>
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <ModeCard
                emoji="🏟️"
                title="Live Room"
                sub="Generate ID or join"
                badge="MULTIPLAYER"
                onPress={onStartRoom}
                delay={60}
              />
              <ModeCard
                emoji="⚔️"
                title="1v1 Duel"
                sub="5-question face-off"
                onPress={onStartDuel}
                delay={110}
              />
            </View>
            <View style={styles.gridRow}>
              <ModeCard
                emoji="🎭"
                title="Pass & Play"
                sub="Up to 4 on 1 phone"
                onPress={onStartPassPlay}
                delay={160}
              />
              <ModeCard
                emoji="✨"
                title="Custom"
                sub="Build a category"
                onPress={onOpenCategoryCreator}
                delay={210}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Compact animated mode card
const ModeCard: React.FC<{
  emoji: string;
  title: string;
  sub: string;
  badge?: string;
  onPress: () => void;
  delay: number;
}> = ({ emoji, title, sub, badge, onPress, delay }) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(16));
  const [scaleAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View
      style={[
        styles.modeCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.modeCardInner}
        activeOpacity={1}
        onPress={() => {
          soundManager.playClick();
          onPress();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {badge && (
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{badge}</Text>
          </View>
        )}
        <Text style={styles.modeEmoji}>{emoji}</Text>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeSub}>{sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 50, gap: 26 },

  // Hero
  hero: { gap: 6 },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  userEmoji: { fontSize: 16 },
  userName: { fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary },
  customPill: {
    backgroundColor: theme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderActive,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  customPillText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  eyebrow: { fontSize: 10, fontWeight: '800', color: theme.colors.primary, letterSpacing: 2.5 },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  heroSub: { fontSize: 14, color: theme.colors.textMuted, marginTop: 2 },

  // Category chips
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  chipRow: { gap: 10, paddingBottom: 4, paddingRight: 20 },
  chipCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    width: 110,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  chipEmoji: { fontSize: 26 },
  chipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  chipBattlePill: {
    backgroundColor: theme.colors.primarySubtle,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  chipBattlePillText: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },

  // Primary CTA
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 22,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryTag: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
  },
  primaryPrize: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  primaryTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  primaryMeta: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Grid
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1 },
  modeCardInner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  modeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeBadgeText: { fontSize: 7, fontWeight: '800', color: theme.colors.primary, letterSpacing: 0.6 },
  modeEmoji: { fontSize: 24, marginBottom: 2 },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  modeSub: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 14 },
});

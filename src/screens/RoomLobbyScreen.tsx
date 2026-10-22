import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';
import { SHOWDOWN_THEMES } from '../data/questions';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  generateRoomCode,
  generatePlayerId,
  buildRoom,
  createRoom,
  joinRoom,
  cleanRoomCode,
} from '../services/roomService';
import { Room, RoomPlayer } from '../types';

interface RoomLobbyScreenProps {
  onRoomReady: (room: Room, playerId: string) => void;
  onBack: () => void;
}

const EMOJIS = ['🌟', '🎲', '📜', '🧪', '🔭', '💡', '🏆', '🎬', '⚡', '🚀', '🦊', '🐉'];

export const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = ({ onRoomReady, onBack }) => {
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick');
  const [loading, setLoading] = useState(false);

  // Room ID state (auto-generated)
  const [generatedRoomId, setGeneratedRoomId] = useState(() => generateRoomCode());
  const [copiedId, setCopiedId] = useState(false);

  // Create form
  const [playerName, setPlayerName] = useState('Alex');
  const [playerEmoji, setPlayerEmoji] = useState('🌟');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    SHOWDOWN_THEMES[0]?.id ?? 'general_all',
  );

  // Join form
  const [joinName, setJoinName] = useState('');
  const [joinEmoji, setJoinEmoji] = useState('🎲');
  const [rawRoomInput, setRawRoomInput] = useState('');

  // Animations (React 19 safe useState initializers)
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(18));
  const [idScale] = useState(() => new Animated.Value(1));

  const hasLiveBackend = isSupabaseConfigured();

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(18);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  }, [mode, fadeAnim, slideAnim]);

  // Generate a brand new Room ID with animation & sound
  const handleRegenerateId = () => {
    soundManager.playClick();
    const newId = generateRoomCode();
    setGeneratedRoomId(newId);
    setCopiedId(false);

    Animated.sequence([
      Animated.timing(idScale, { toValue: 1.08, duration: 100, useNativeDriver: true }),
      Animated.spring(idScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
    ]).start();
  };

  const handleCopyId = async (idToCopy: string) => {
    try {
      await Clipboard.setStringAsync(idToCopy);
      soundManager.playClick();
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        const cleaned = cleanRoomCode(text);
        setRawRoomInput(cleaned || text);
        soundManager.playClick();
      }
    } catch {
      // Ignore clipboard error
    }
  };

  // Quick 1-tap instant room with auto-generated ID
  const handleInstantQuickRoom = async () => {
    setLoading(true);
    try {
      const playerId = generatePlayerId();
      const roomId = generateRoomCode();
      const host: RoomPlayer = {
        id: playerId,
        name: playerName.trim() || 'Alex',
        emoji: playerEmoji,
        score: 0,
        lastAnswer: null,
        hasAnswered: false,
        isHost: true,
        joinedAt: Date.now(),
      };
      const cat = SHOWDOWN_THEMES[0]?.title ?? 'General Knowledge';
      const room = buildRoom(roomId, playerId, host, cat, 6);
      await createRoom(room);
      soundManager.playLockIn();
      onRoomReady(room, playerId);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!playerName.trim()) {
      Alert.alert('Name required', 'Enter your name to create a room.');
      return;
    }
    setLoading(true);
    try {
      const playerId = generatePlayerId();
      const roomId = cleanRoomCode(generatedRoomId) || generateRoomCode();
      const host: RoomPlayer = {
        id: playerId,
        name: playerName.trim(),
        emoji: playerEmoji,
        score: 0,
        lastAnswer: null,
        hasAnswered: false,
        isHost: true,
        joinedAt: Date.now(),
      };
      const cat = SHOWDOWN_THEMES.find((t) => t.id === selectedCategoryId)?.title ?? 'General';
      const room = buildRoom(roomId, playerId, host, cat, maxPlayers);
      await createRoom(room);
      soundManager.playLockIn();
      onRoomReady(room, playerId);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinName.trim()) {
      Alert.alert('Name required', 'Enter your name to join.');
      return;
    }
    const code = cleanRoomCode(rawRoomInput);
    if (!code) {
      Alert.alert('Room ID required', 'Please enter a valid room ID or paste an invite link.');
      return;
    }
    setLoading(true);
    try {
      const playerId = generatePlayerId();
      const player: RoomPlayer = {
        id: playerId,
        name: joinName.trim(),
        emoji: joinEmoji,
        score: 0,
        lastAnswer: null,
        hasAnswered: false,
        isHost: false,
        joinedAt: Date.now(),
      };
      const room = await joinRoom(code, player);
      soundManager.playLockIn();
      onRoomReady(room, playerId);
    } catch (e: any) {
      Alert.alert('Could not join', e.message ?? 'Check the code/link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={mode === 'pick' ? onBack : () => setMode('pick')}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>LIVE ROOM</Text>
        <View style={styles.backendBadge}>
          <Text style={styles.backendBadgeText}>
            {hasLiveBackend ? '🌐 Supabase' : '⚡ Instant Mode'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Pick mode */}
          {mode === 'pick' && (
            <View style={styles.section}>
              <Text style={styles.heroEmoji}>🏟️</Text>
              <Text style={styles.heroTitle}>Multiplayer Arena</Text>
              <Text style={styles.heroSub}>
                Generate a unique Room ID or join friends with a code or link.
              </Text>

              {/* Main Actions */}
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  soundManager.playClick();
                  setGeneratedRoomId(generateRoomCode());
                  setMode('create');
                }}
              >
                <Text style={styles.primaryBtnText}>🎲 Generate Room & Setup →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() => {
                  soundManager.playClick();
                  setMode('join');
                }}
              >
                <Text style={styles.secondaryBtnText}>🔑 Join with ID or Link</Text>
              </TouchableOpacity>

              {/* Quick 1-tap instant match */}
              <TouchableOpacity
                style={styles.quickStartBtn}
                activeOpacity={0.85}
                onPress={handleInstantQuickRoom}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <View style={styles.quickStartRow}>
                    <Text style={styles.quickStartEmoji}>⚡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quickStartTitle}>Instant Room (Auto-Generate ID)</Text>
                      <Text style={styles.quickStartSub}>Generates an ID & opens lobby in 1 tap</Text>
                    </View>
                    <Text style={styles.quickStartArrow}>→</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.featureList}>
                {[
                  'Auto-generated 6-character room codes (e.g. TRV-9K2)',
                  'One-tap copy and shareable room invite links',
                  'Simultaneous synchronized questions with countdown',
                  'Live real-time leaderboard as answers lock in',
                ].map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={styles.featureDot}>✦</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Create mode */}
          {mode === 'create' && (
            <View style={styles.section}>
              <Text style={styles.formTitle}>Create Room</Text>

              {/* Room ID Generator Box */}
              <View style={styles.idCard}>
                <View style={styles.idCardHeader}>
                  <Text style={styles.idCardLabel}>ASSIGNED ROOM ID</Text>
                  <TouchableOpacity
                    style={styles.regenerateBtn}
                    onPress={handleRegenerateId}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.regenerateBtnText}>🎲 Generate New ID</Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={[styles.idDisplayRow, { transform: [{ scale: idScale }] }]}>
                  <Text style={styles.idDisplayText}>{generatedRoomId}</Text>
                  <TouchableOpacity
                    style={styles.idCopyPill}
                    onPress={() => handleCopyId(generatedRoomId)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.idCopyPillText}>
                      {copiedId ? '✓ Copied!' : '📋 Copy ID'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                <Text style={styles.idCardHint}>
                  This ID was generated for your room. Share it with opponents to connect.
                </Text>
              </View>

              <Text style={[styles.label, { marginTop: 18 }]}>HOST NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex"
                placeholderTextColor={theme.colors.textMuted}
                value={playerName}
                onChangeText={setPlayerName}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>CHOOSE AVATAR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                {EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBubble, playerEmoji === e && styles.emojiBubbleActive]}
                    onPress={() => setPlayerEmoji(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { marginTop: 16 }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                {SHOWDOWN_THEMES.slice(0, 9).map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.catChip, selectedCategoryId === t.id && styles.catChipActive]}
                    onPress={() => setSelectedCategoryId(t.id)}
                  >
                    <Text style={styles.catChipEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.catChipLabel,
                        selectedCategoryId === t.id && styles.catChipLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { marginTop: 16 }]}>MAX PLAYERS: {maxPlayers}</Text>
              <View style={styles.stepperRow}>
                {[2, 4, 6, 8, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.stepBtn, maxPlayers === n && styles.stepBtnActive]}
                    onPress={() => setMaxPlayers(n)}
                  >
                    <Text
                      style={[
                        styles.stepBtnText,
                        maxPlayers === n && styles.stepBtnTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 28 }]}
                activeOpacity={0.85}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Launch Room ({generatedRoomId}) →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Join mode */}
          {mode === 'join' && (
            <View style={styles.section}>
              <Text style={styles.formTitle}>Join Room</Text>

              <Text style={styles.label}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jordan"
                placeholderTextColor={theme.colors.textMuted}
                value={joinName}
                onChangeText={setJoinName}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>CHOOSE AVATAR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                {EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBubble, joinEmoji === e && styles.emojiBubbleActive]}
                    onPress={() => setJoinEmoji(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.codeHeaderRow}>
                <Text style={styles.label}>ROOM ID OR INVITE LINK</Text>
                <TouchableOpacity onPress={handlePasteCode} activeOpacity={0.7}>
                  <Text style={styles.pasteLink}>📋 Paste</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="e.g. TRV-4F2 or link"
                placeholderTextColor={theme.colors.textMuted}
                value={rawRoomInput}
                onChangeText={setRawRoomInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Paste an invite URL or enter the 6-character room ID
              </Text>

              {/* Quick sample ID button */}
              <TouchableOpacity
                style={styles.sampleIdBtn}
                onPress={() => {
                  soundManager.playClick();
                  setRawRoomInput(generateRoomCode());
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.sampleIdText}>🎲 Generate Random ID to Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 24 }]}
                activeOpacity={0.85}
                onPress={handleJoin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Enter Room →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  navTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 1.5,
  },
  backendBadge: {
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  backendBadgeText: { fontSize: 9, fontWeight: '800', color: theme.colors.primary },
  scroll: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 60 },
  section: { gap: 4 },

  heroEmoji: { fontSize: 52, textAlign: 'center', marginBottom: 10 },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  heroSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
    lineHeight: 20,
  },

  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },

  quickStartBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderActive,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickStartRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickStartEmoji: { fontSize: 24 },
  quickStartTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  quickStartSub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  quickStartArrow: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },

  featureList: { marginTop: 28, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { fontSize: 10, color: theme.colors.primary },
  featureText: { fontSize: 13, color: theme.colors.textSecondary },

  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 16,
  },

  // Room ID Card
  idCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderActive,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
  },
  regenerateBtn: {
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  regenerateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  idDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  idDisplayText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  idCopyPill: {
    backgroundColor: theme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderActive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  idCopyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  idCardHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
  },

  label: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  pasteLink: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  sampleIdBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  sampleIdText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  emojiRow: { flexDirection: 'row', marginBottom: 4 },
  emojiBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiBubbleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  emojiText: { fontSize: 20 },

  catChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginRight: 8,
    minWidth: 80,
  },
  catChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  catChipEmoji: { fontSize: 22, marginBottom: 4 },
  catChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  catChipLabelActive: { color: theme.colors.primary },

  stepperRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stepBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  stepBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  stepBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },
  stepBtnTextActive: { color: '#FFF' },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../theme';
import { soundManager } from '../utils/audio';
import { Room, RoomPlayer } from '../types';
import {
  subscribeToRoom,
  startGame,
  getRoomShareUrl,
  getRoomShareText,
  addSimulatedPlayer,
} from '../services/roomService';
import { isSupabaseConfigured } from '../lib/supabase';

interface WaitingRoomScreenProps {
  initialRoom: Room;
  playerId: string;
  onGameStart: (room: Room) => void;
  onLeave: () => void;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  initialRoom,
  playerId,
  onGameStart,
  onLeave,
}) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [starting, setStarting] = useState(false);
  const [addingBot, setAddingBot] = useState(false);

  const isHost = room.players[playerId]?.isHost ?? false;
  const playerList = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);

  // React 19 safe animation hooks
  const [listFade] = useState(() => new Animated.Value(1));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Subscribe to room changes
  useEffect(() => {
    const unsubscribe = subscribeToRoom(room.id, (updated) => {
      setRoom(updated);
      // Bounce list on player change
      Animated.sequence([
        Animated.timing(listFade, { toValue: 0.7, duration: 80, useNativeDriver: true }),
        Animated.timing(listFade, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      if (updated.status === 'countdown' || updated.status === 'question') {
        onGameStart(updated);
      }
    });
    return unsubscribe;
  }, [room.id, listFade, onGameStart]);

  // Pulsing dot for waiting status
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleCopyCode = async () => {
    soundManager.playClick();
    await Clipboard.setStringAsync(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async () => {
    soundManager.playClick();
    const link = getRoomShareUrl(room.id);
    await Clipboard.setStringAsync(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    soundManager.playClick();
    try {
      await Share.share({
        title: 'Join my Trivia Showdown room!',
        message: getRoomShareText(room.id),
        url: getRoomShareUrl(room.id),
      });
    } catch {
      handleCopyLink();
    }
  };

  const handleAddBot = async () => {
    if (playerList.length >= room.maxPlayers) {
      Alert.alert('Room full', 'This room has reached max player capacity.');
      return;
    }
    setAddingBot(true);
    try {
      await addSimulatedPlayer(room.id);
      soundManager.playClick();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingBot(false);
    }
  };

  const handleStart = async () => {
    if (playerList.length < 2) {
      Alert.alert('Need players', 'At least 2 players must join before starting.');
      return;
    }
    setStarting(true);
    try {
      soundManager.playLockIn();
      await startGame(room.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={onLeave} activeOpacity={0.7}>
          <Text style={styles.backText}>← Leave Room</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>WAITING LOBBY</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Room Code & Link Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM ID</Text>
          <Text style={styles.codeText}>{room.id}</Text>
          <Text style={styles.codeHint}>Share this code or link with opponents to join</Text>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity style={styles.actionPill} onPress={handleCopyCode} activeOpacity={0.8}>
              <Text style={styles.actionPillText}>{copiedCode ? '✓ Copied ID' : '📋 Copy ID'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPill} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.actionPillText}>🔗 Share Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPill} onPress={handleCopyLink} activeOpacity={0.8}>
              <Text style={styles.actionPillText}>{copiedLink ? '✓ Link Copied' : '📄 Copy Link'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Room Metadata */}
        <View style={styles.infoPillRow}>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillLabel}>CATEGORY</Text>
            <Text style={styles.infoPillValue} numberOfLines={1}>
              {room.category}
            </Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillLabel}>QUESTIONS</Text>
            <Text style={styles.infoPillValue}>{room.totalQuestions}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillLabel}>TIMER</Text>
            <Text style={styles.infoPillValue}>{room.timeLimitSeconds}s</Text>
          </View>
        </View>

        {/* Player Roster */}
        <View style={styles.slotsSection}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotTitle}>PLAYERS IN ROOM</Text>
            <View style={styles.waitingRow}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.waitingText}>
                {playerList.length}/{room.maxPlayers} joined
              </Text>
            </View>
          </View>

          <Animated.View style={{ opacity: listFade, gap: 8 }}>
            {Array.from({ length: room.maxPlayers }).map((_, i) => {
              const player = playerList[i];
              return (
                <PlayerSlot
                  key={i}
                  player={player ?? null}
                  index={i}
                  isMe={player?.id === playerId}
                />
              );
            })}
          </Animated.View>

          {/* Quick Bot/Test Player Add Button (especially useful when testing) */}
          {isHost && playerList.length < room.maxPlayers && (
            <TouchableOpacity
              style={styles.addBotBtn}
              onPress={handleAddBot}
              disabled={addingBot}
              activeOpacity={0.8}
            >
              {addingBot ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.addBotText}>+ Add Demo Bot / Friend Slot</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {isHost ? (
          <TouchableOpacity
            style={[styles.startBtn, playerList.length < 2 && styles.startBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleStart}
            disabled={starting || playerList.length < 2}
          >
            {starting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.startBtnText}>
                {playerList.length < 2 ? 'Need 2+ Players to Start' : 'Start Match Now →'}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingForHost}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text style={styles.waitingForHostText}>Waiting for host to start the game…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const PlayerSlot: React.FC<{
  player: RoomPlayer | null;
  index: number;
  isMe: boolean;
}> = ({ player, index, isMe }) => {
  return (
    <View style={[styles.slot, player && styles.slotFilled, isMe && styles.slotMe]}>
      {player ? (
        <>
          <Text style={styles.slotEmoji}>{player.emoji}</Text>
          <View style={styles.slotInfo}>
            <Text style={styles.slotName} numberOfLines={1}>
              {player.name}
              {isMe ? ' (You)' : ''}
            </Text>
            {player.isHost && <Text style={styles.hostBadge}>HOST</Text>}
          </View>
          <View style={styles.slotReadyDot} />
        </>
      ) : (
        <>
          <Text style={styles.slotEmpty}>{index + 1}</Text>
          <Text style={styles.slotEmptyText}>Waiting for player…</Text>
        </>
      )}
    </View>
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 18 },

  codeCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  codeText: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: 5 },
  codeHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  actionBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  actionPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionPillText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  infoPillRow: { flexDirection: 'row', gap: 10 },
  infoPill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  infoPillValue: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },

  slotsSection: { gap: 10 },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
  },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme.colors.primary },
  waitingText: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },

  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  slotFilled: { borderColor: theme.colors.borderActive },
  slotMe: { backgroundColor: theme.colors.primarySubtle, borderColor: theme.colors.primary },
  slotEmoji: { fontSize: 22 },
  slotInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  hostBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  slotReadyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  slotEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.borderLight,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  slotEmptyText: { fontSize: 13, color: theme.colors.textMuted, flex: 1 },

  addBotBtn: {
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  addBotText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },

  footer: {
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
  startBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  startBtnDisabled: { backgroundColor: theme.colors.textMuted, shadowOpacity: 0 },
  startBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  waitingForHost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  waitingForHostText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
});

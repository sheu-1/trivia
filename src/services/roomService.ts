// ─── Room Service ─────────────────────────────────────────────────────────────
// Supabase real-time room CRUD + instant offline/demo fallback simulator.

import { supabase, ROOMS_TABLE, isSupabaseConfigured } from '../lib/supabase';
import { Room, RoomPlayer, RoomQuestion } from '../types';
import { QUESTIONS } from '../data/questions';

// ── In-Memory Store for Demo/Local Testing (fallback when Supabase is not configured)
const localRooms: Record<string, Room> = {};
type RoomListener = (room: Room) => void;
const localListeners: Record<string, Set<RoomListener>> = {};

function notifyLocalListeners(roomId: string, room: Room) {
  localRooms[roomId] = room;
  const set = localListeners[roomId];
  if (set) {
    set.forEach((listener) => {
      try {
        listener(room);
      } catch (err) {
        console.warn('Listener error', err);
      }
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clean / parse a room code from raw input (supports direct code or pasted link) */
export function cleanRoomCode(rawInput: string): string {
  if (!rawInput) return '';
  let str = rawInput.trim();

  // If a URL was pasted, extract room code from query or pathname
  if (str.includes('http://') || str.includes('https://') || str.includes('://')) {
    try {
      // Check query param e.g. ?room=TRV-4F2
      const queryMatch = str.match(/[?&]room=([A-Za-z0-9-]+)/i);
      if (queryMatch && queryMatch[1]) {
        str = queryMatch[1];
      } else {
        // Check path e.g. /room/TRV-4F2
        const pathMatch = str.match(/room\/([A-Za-z0-9-]+)/i);
        if (pathMatch && pathMatch[1]) {
          str = pathMatch[1];
        }
      }
    } catch {
      // Fallback
    }
  }

  // Remove spaces and make uppercase
  str = str.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();

  // Format as XXX-XXX if 6 letters were typed without dash
  if (str.length === 6 && !str.includes('-')) {
    str = `${str.slice(0, 3)}-${str.slice(3)}`;
  }

  return str;
}

/** Generate a 7-char room code like "TRV-4F2" */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${rand(3)}-${rand(3)}`;
}

/** Generate a stable player UUID */
export function generatePlayerId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Get shareable room link */
export function getRoomShareUrl(roomId: string): string {
  return `https://trivia.app/room/${roomId}`;
}

/** Get shareable room text */
export function getRoomShareText(roomId: string): string {
  return `Join my Trivia Showdown room! 🏆\nCode: ${roomId}\nLink: ${getRoomShareUrl(roomId)}`;
}

/** Build a fresh Room snapshot */
export function buildRoom(
  roomId: string,
  hostId: string,
  hostPlayer: RoomPlayer,
  category: string,
  maxPlayers: number,
  timeLimitSeconds = 15,
  questionCount = 10,
): Room {
  // Sample questions for the room (shuffle then pick)
  const pool = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, questionCount);
  const questions: RoomQuestion[] = pool.map((q, i) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    category: q.category,
    points: [100, 200, 300, 500][Math.min(i, 3)] ?? 100,
  }));

  return {
    id: roomId,
    hostId,
    status: 'lobby',
    category,
    maxPlayers,
    currentQuestionIndex: 0,
    totalQuestions: questions.length,
    questionStartedAt: null,
    timeLimitSeconds,
    players: { [hostId]: hostPlayer },
    questions,
    createdAt: Date.now(),
  };
}

// ── Room CRUD ─────────────────────────────────────────────────────────────────

export async function createRoom(room: Room): Promise<void> {
  localRooms[room.id] = room;

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from(ROOMS_TABLE)
      .insert({ id: room.id, data: room });
    if (error) throw new Error(error.message);
  }
}

export async function fetchRoom(rawRoomId: string): Promise<Room | null> {
  const roomId = cleanRoomCode(rawRoomId);
  if (!roomId) return null;

  if (localRooms[roomId]) {
    return localRooms[roomId];
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from(ROOMS_TABLE)
      .select('data')
      .eq('id', roomId)
      .single();
    if (error || !data) return null;
    return data.data as Room;
  }

  return null;
}

export async function updateRoom(rawRoomId: string, patch: Partial<Room>): Promise<void> {
  const roomId = cleanRoomCode(rawRoomId);
  const current = await fetchRoom(roomId);
  if (!current) throw new Error('Room not found');

  const updated: Room = { ...current, ...patch };
  notifyLocalListeners(roomId, updated);

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from(ROOMS_TABLE)
      .update({ data: updated })
      .eq('id', roomId);
    if (error) throw new Error(error.message);
  }
}

export async function joinRoom(rawRoomId: string, player: RoomPlayer): Promise<Room> {
  const roomId = cleanRoomCode(rawRoomId);
  const current = await fetchRoom(roomId);
  if (!current) throw new Error('Room not found. Check the code or link and try again.');
  if (current.status !== 'lobby') throw new Error('This game has already started.');
  if (Object.keys(current.players).length >= current.maxPlayers) throw new Error('Room is full.');

  const updated: Room = {
    ...current,
    players: { ...current.players, [player.id]: player },
  };

  notifyLocalListeners(roomId, updated);

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from(ROOMS_TABLE)
      .update({ data: updated })
      .eq('id', roomId);
    if (error) throw new Error(error.message);
  }

  return updated;
}

/** Simulate a bot / friendly player joining (especially helpful for instant testing in demo mode) */
export async function addSimulatedPlayer(rawRoomId: string): Promise<RoomPlayer> {
  const roomId = cleanRoomCode(rawRoomId);
  const current = await fetchRoom(roomId);
  if (!current) throw new Error('Room not found');

  const names = ['Kai', 'Maya', 'Rowan', 'Liam', 'Zoe', 'Elena', 'Noah'];
  const emojis = ['🦊', '⚡', '🦉', '🚀', '🎯', '💡', '🔥'];
  const existingNames = new Set(Object.values(current.players).map((p) => p.name));
  const available = names.filter((n) => !existingNames.has(n));
  const chosenName = available[0] ?? `Player ${Object.keys(current.players).length + 1}`;
  const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  const botPlayer: RoomPlayer = {
    id: `bot_${generatePlayerId()}`,
    name: chosenName,
    emoji: chosenEmoji,
    score: 0,
    lastAnswer: null,
    hasAnswered: false,
    isHost: false,
    joinedAt: Date.now(),
  };

  await joinRoom(roomId, botPlayer);
  return botPlayer;
}

export async function submitAnswer(
  rawRoomId: string,
  playerId: string,
  answerIndex: number,
): Promise<void> {
  const roomId = cleanRoomCode(rawRoomId);
  const current = await fetchRoom(roomId);
  if (!current) return;
  const q = current.questions[current.currentQuestionIndex];
  if (!q) return;

  const isCorrect = answerIndex === q.correctIndex;
  const existing = current.players[playerId];
  if (!existing || existing.hasAnswered) return;

  const updated: Room = {
    ...current,
    players: {
      ...current.players,
      [playerId]: {
        ...existing,
        lastAnswer: answerIndex,
        hasAnswered: true,
        score: existing.score + (isCorrect ? q.points : 0),
      },
    },
  };

  notifyLocalListeners(roomId, updated);

  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from(ROOMS_TABLE)
      .update({ data: updated })
      .eq('id', roomId);
    if (error) throw new Error(error.message);
  }
}

export async function advanceQuestion(rawRoomId: string): Promise<void> {
  const roomId = cleanRoomCode(rawRoomId);
  const current = await fetchRoom(roomId);
  if (!current) return;

  const nextIndex = current.currentQuestionIndex + 1;
  const isLastQuestion = nextIndex >= current.totalQuestions;

  // Reset player answers for next question
  const resetPlayers = Object.fromEntries(
    Object.entries(current.players).map(([id, p]) => [
      id,
      { ...p, lastAnswer: null, hasAnswered: false },
    ]),
  );

  const patch: Partial<Room> = isLastQuestion
    ? { status: 'finished', players: resetPlayers }
    : {
        status: 'question',
        currentQuestionIndex: nextIndex,
        questionStartedAt: Date.now(),
        players: resetPlayers,
      };

  await updateRoom(roomId, patch);

  // If in demo mode with bot players, schedule simulated answers for bots
  if (!isSupabaseConfigured() && !isLastQuestion) {
    scheduleBotAnswers(roomId);
  }
}

export async function startGame(rawRoomId: string): Promise<void> {
  const roomId = cleanRoomCode(rawRoomId);
  await updateRoom(roomId, {
    status: 'countdown',
  });

  setTimeout(async () => {
    await updateRoom(roomId, {
      status: 'question',
      currentQuestionIndex: 0,
      questionStartedAt: Date.now(),
    });

    if (!isSupabaseConfigured()) {
      scheduleBotAnswers(roomId);
    }
  }, 3500);
}

/** In demo/local mode, bots answer with realistic randomized delays and skill */
function scheduleBotAnswers(roomId: string) {
  setTimeout(async () => {
    const current = await fetchRoom(roomId);
    if (!current || current.status !== 'question') return;
    const q = current.questions[current.currentQuestionIndex];
    if (!q) return;

    Object.values(current.players).forEach((p) => {
      if (p.id.startsWith('bot_') && !p.hasAnswered) {
        const delay = 1500 + Math.random() * 4000;
        setTimeout(async () => {
          // 75% accuracy for bot
          const willBeCorrect = Math.random() < 0.75;
          const chosenAnswer = willBeCorrect
            ? q.correctIndex
            : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
          await submitAnswer(roomId, p.id, chosenAnswer);
        }, delay);
      }
    });
  }, 500);
}

// ── Realtime Subscription ─────────────────────────────────────────────────────

export function subscribeToRoom(
  rawRoomId: string,
  onUpdate: (room: Room) => void,
): () => void {
  const roomId = cleanRoomCode(rawRoomId);

  // Register in local listeners (works immediately for local/offline testing)
  if (!localListeners[roomId]) {
    localListeners[roomId] = new Set();
  }
  localListeners[roomId].add(onUpdate);

  // If Supabase is configured, also connect to Realtime channel
  let removeSupabaseChannel: (() => void) | null = null;
  if (isSupabaseConfigured()) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: ROOMS_TABLE, filter: `id=eq.${roomId}` },
        (payload) => {
          const room = (payload.new as any).data as Room;
          onUpdate(room);
        },
      )
      .subscribe();

    removeSupabaseChannel = () => {
      supabase.removeChannel(channel);
    };
  }

  return () => {
    localListeners[roomId]?.delete(onUpdate);
    if (removeSupabaseChannel) {
      removeSupabaseChannel();
    }
  };
}
